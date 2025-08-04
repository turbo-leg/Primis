import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function validateCourseAccess(userId: string, courseId: string, userRole: string): Promise<boolean> {
  try {
    // Admins have access to all courses
    if (userRole === 'ADMIN') {
      return true
    }

    // For instructors, check if they are the instructor of the course
    if (userRole === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          // You might want to add instructor field to course model or check by instructor name
        }
      })
      return !!course
    }

    // For students, check if they are enrolled in the course
    if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: 'ACTIVE'
        }
      })
      return !!enrollment
    }

    return false
  } catch (error) {
    console.error('Error validating course access:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Document upload started')
    
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
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''
    const isPublic = formData.get('isPublic') === 'true'
    const courseId = formData.get('courseId') as string || null

    // Validate inputs
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No file selected' }, { status: 400 })
    }

    if (!title?.trim()) {
      console.log('❌ No title provided')
      return NextResponse.json({ error: 'Document title is required' }, { status: 400 })
    }

    // Validate course access if courseId is provided
    if (courseId) {
      const hasAccess = await validateCourseAccess(session.user.id, courseId, session.user.role)
      if (!hasAccess) {
        console.log('❌ User does not have access to course:', courseId)
        return NextResponse.json({ error: 'You do not have access to this course' }, { status: 403 })
      }
    }

    // Handle long file names
    const maxFilenameLength = 100 // Shorter limit for better UX
    const maxTitleLength = 80 // Reasonable title limit
    
    let sanitizedFilename = file.name
    let sanitizedTitle = title.trim()

    // Clean and shorten filename
    sanitizedFilename = sanitizedFilename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores

    // Truncate filename if too long while preserving extension
    if (sanitizedFilename.length > maxFilenameLength) {
      const lastDotIndex = sanitizedFilename.lastIndexOf('.')
      const extension = lastDotIndex > -1 ? sanitizedFilename.substring(lastDotIndex) : ''
      const nameWithoutExt = lastDotIndex > -1 ? sanitizedFilename.substring(0, lastDotIndex) : sanitizedFilename
      const maxNameLength = maxFilenameLength - extension.length
      sanitizedFilename = nameWithoutExt.substring(0, maxNameLength) + extension
      console.log('📝 Shortened filename:', file.name, '->', sanitizedFilename)
    }

    // Clean and truncate title if too long
    if (sanitizedTitle.length > maxTitleLength) {
      sanitizedTitle = sanitizedTitle.substring(0, maxTitleLength - 3) + '...'
      console.log('📝 Truncated long title:', title, '->', sanitizedTitle)
    }

    // Validate file size (5MB limit for stability)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File must be smaller than 5MB' }, { status: 400 })
    }

    console.log('📁 File details:', {
      originalName: file.name,
      sanitizedName: sanitizedFilename,
      originalTitle: title,
      sanitizedTitle: sanitizedTitle,
      type: file.type,
      size: file.size
    })

    // For development, create a simple mock URL
    const timestamp = Date.now()
    const fileId = `${timestamp}_${Math.random().toString(36).substring(7)}`
    const mockUrl = `/api/documents/${fileId}/download`

    console.log('💾 Saving to database...')

    // Save to database
    const document = await prisma.document.create({
      data: {
        title: sanitizedTitle,
        description: description.trim() || null,
        filename: sanitizedFilename,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl: mockUrl,
        uploadedBy: session.user.id,
        courseId: courseId || null,
        isPublic: isPublic,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    console.log('✅ Document saved successfully:', document.id)

    // Return success response
    const response = {
      id: document.id,
      title: document.title,
      description: document.description,
      filename: document.filename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      uploadedAt: document.createdAt.toISOString(),
      uploadedBy: {
        id: document.uploader?.id || session.user.id,
        name: document.uploader?.name || 'Unknown User',
        role: document.uploader?.role || 'STUDENT',
      },
      courseId: document.courseId,
      courseName: document.course?.title || null,
      isPublic: document.isPublic,
    }

    console.log('🎉 Upload completed successfully')
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Upload error:', error)
    
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
    const courseId = searchParams.get('courseId')

    const where = courseId ? { courseId } : {}

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        course: {
          select: {
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      filename: doc.filename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedAt: doc.createdAt.toISOString(),
      uploadedBy: {
        id: doc.uploader?.id || 'unknown',
        name: doc.uploader?.name || 'Unknown User',
        role: doc.uploader?.role || 'STUDENT',
      },
      courseId: doc.courseId,
      courseName: doc.course?.title || null,
      isPublic: doc.isPublic,
    }))

    return NextResponse.json(formattedDocuments)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
