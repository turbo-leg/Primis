import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function validateAssignmentAccess(userId: string, assignmentId: string, userRole: string): Promise<boolean> {
  try {
    // Admins have access to all assignments
    if (userRole === 'ADMIN') {
      return true
    }

    // For instructors, check if they are the instructor of the course
    if (userRole === 'INSTRUCTOR') {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          course: {
            instructor: userId
          }
        }
      })
      return !!assignment
    }

    // For students, check if they are enrolled in the course
    if (userRole === 'STUDENT') {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          course: {
            enrollments: {
              some: {
                userId: userId,
                status: 'ACTIVE'
              }
            }
          }
        }
      })
      return !!assignment
    }

    return false
  } catch (error) {
    console.error('Error validating assignment access:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Assignment file upload started')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ No valid session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', session.user.id)

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.log('❌ Failed to parse form data:', error)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File
    const assignmentId = formData.get('assignmentId') as string
    const title = formData.get('title') as string || file?.name || 'Untitled File'
    const description = formData.get('description') as string || ''
    const fileType = formData.get('fileType') as string || 'document' // 'document' or 'image'

    // Validate inputs
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No file selected' }, { status: 400 })
    }

    if (!assignmentId) {
      console.log('❌ No assignment ID provided')
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Validate assignment access
    const hasAccess = await validateAssignmentAccess(session.user.id, assignmentId, session.user.role)
    if (!hasAccess) {
      console.log('❌ User does not have access to assignment:', assignmentId)
      return NextResponse.json({ error: 'You do not have access to this assignment' }, { status: 403 })
    }

    // Validate file type based on fileType parameter
    const isImage = fileType === 'image'
    const allowedTypes = isImage 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'image/jpeg', 
          'image/jpg', 
          'image/png', 
          'image/gif', 
          'image/webp'
        ]

    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      const typeDescription = isImage ? 'image' : 'document or image'
      return NextResponse.json({ 
        error: `Invalid file type. Please upload a valid ${typeDescription} file.` 
      }, { status: 400 })
    }

    // Validate file size (10MB limit for documents, 5MB for images)
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size)
      const sizeLimit = isImage ? '5MB' : '10MB'
      return NextResponse.json({ 
        error: `File must be smaller than ${sizeLimit}` 
      }, { status: 400 })
    }

    // Handle long file names
    const maxFilenameLength = 100
    const maxTitleLength = 80
    
    let sanitizedFilename = file.name
    let sanitizedTitle = title.trim()

    // Clean and shorten filename
    sanitizedFilename = sanitizedFilename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')

    // Truncate filename if too long while preserving extension
    if (sanitizedFilename.length > maxFilenameLength) {
      const lastDotIndex = sanitizedFilename.lastIndexOf('.')
      const extension = lastDotIndex > -1 ? sanitizedFilename.substring(lastDotIndex) : ''
      const nameWithoutExt = lastDotIndex > -1 ? sanitizedFilename.substring(0, lastDotIndex) : sanitizedFilename
      const maxNameLength = maxFilenameLength - extension.length
      sanitizedFilename = nameWithoutExt.substring(0, maxNameLength) + extension
    }

    // Clean and truncate title if too long
    if (sanitizedTitle.length > maxTitleLength) {
      sanitizedTitle = sanitizedTitle.substring(0, maxTitleLength - 3) + '...'
    }

    console.log('📁 File details:', {
      originalName: file.name,
      sanitizedName: sanitizedFilename,
      originalTitle: title,
      sanitizedTitle: sanitizedTitle,
      type: file.type,
      size: file.size,
      fileType: fileType
    })

    let fileUrl: string

    // Check if Cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      console.log('☁️ Uploading to Cloudinary...')
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Cloudinary
      const uploadResponse = await new Promise((resolve, reject) => {
        const resourceType = isImage ? 'image' : 'auto'
        const folder = isImage ? 'assignment-images' : 'assignment-documents'
        
        cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: folder,
            public_id: `${assignmentId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) {
              console.log('❌ Cloudinary upload error:', error)
              reject(error)
            } else {
              console.log('✅ Cloudinary upload success:', result?.secure_url)
              resolve(result)
            }
          }
        ).end(buffer)
      }) as any

      fileUrl = uploadResponse.secure_url
    } else {
      console.log('📝 Cloudinary not configured, using mock URL')
      // For development, create a mock URL
      const timestamp = Date.now()
      const fileId = `${timestamp}_${Math.random().toString(36).substring(7)}`
      fileUrl = `/api/assignments/${assignmentId}/files/${fileId}/download`
    }

    console.log('💾 Saving to database...')

    // Save to database
    const assignmentFile = await prisma.assignmentFile.create({
      data: {
        assignmentId: assignmentId,
        title: sanitizedTitle,
        description: description.trim() || null,
        filename: sanitizedFilename,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        fileType: fileType,
        uploadedBy: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    })

    console.log('✅ Assignment file saved successfully:', assignmentFile.id)

    // Return success response
    const response = {
      id: assignmentFile.id,
      title: assignmentFile.title,
      description: assignmentFile.description,
      filename: assignmentFile.filename,
      mimeType: assignmentFile.mimeType,
      fileSize: assignmentFile.fileSize,
      fileType: assignmentFile.fileType,
      fileUrl: assignmentFile.fileUrl,
      uploadedAt: assignmentFile.createdAt.toISOString(),
      uploadedBy: {
        id: assignmentFile.uploader?.id || session.user.id,
        name: assignmentFile.uploader?.name || 'Unknown User',
        role: assignmentFile.uploader?.role || 'STUDENT',
      },
      assignmentId: assignmentFile.assignmentId,
      assignmentTitle: assignmentFile.assignment?.title || null,
      courseId: assignmentFile.assignment?.course?.id || null,
      courseName: assignmentFile.assignment?.course?.title || null,
    }

    console.log('🎉 Assignment file upload completed successfully')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Assignment file upload error:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const fileType = searchParams.get('fileType') // 'document', 'image', or null for all

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Validate assignment access
    const hasAccess = await validateAssignmentAccess(session.user.id, assignmentId, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this assignment' }, { status: 403 })
    }

    const where: any = { assignmentId }
    if (fileType) {
      where.fileType = fileType
    }

    const files = await prisma.assignmentFile.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        assignment: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      title: file.title,
      description: file.description,
      filename: file.filename,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      fileType: file.fileType,
      fileUrl: file.fileUrl,
      uploadedAt: file.createdAt.toISOString(),
      uploadedBy: {
        id: file.uploader?.id || 'unknown',
        name: file.uploader?.name || 'Unknown User',
        role: file.uploader?.role || 'STUDENT',
      },
      assignmentId: file.assignmentId,
      assignmentTitle: file.assignment?.title || null,
      courseName: file.assignment?.course?.title || null,
    }))

    return NextResponse.json(formattedFiles)
  } catch (error) {
    console.error('Error fetching assignment files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}