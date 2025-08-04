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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await params

    // Get the file to check permissions and get file info
    const file = await prisma.assignmentFile.findUnique({
      where: { id: fileId },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructor: true,
                instructorId: true
              }
            }
          }
        },
        uploader: true
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check permissions: user can only delete their own files, or admin/instructor can delete any
    const canDelete = 
      file.uploadedBy === session.user.id || 
      session.user.role === 'ADMIN' || 
      (session.user.role === 'INSTRUCTOR' && file.assignment.course.instructorId === session.user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this file' }, { status: 403 })
    }

    // Delete from Cloudinary if it's hosted there
    if (file.fileUrl.includes('cloudinary.com')) {
      try {
        // Extract public_id from URL
        const urlParts = file.fileUrl.split('/')
        const publicIdWithExtension = urlParts.slice(-1)[0]
        const publicId = publicIdWithExtension.split('.')[0]
        const folder = file.fileType === 'image' ? 'assignment-images' : 'assignment-documents'
        const fullPublicId = `${folder}/${publicId}`
        
        await cloudinary.uploader.destroy(fullPublicId)
        console.log('✅ File deleted from Cloudinary:', fullPublicId)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await prisma.assignmentFile.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ message: 'File deleted successfully' })

  } catch (error) {
    console.error('Error deleting assignment file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await params

    // Get the file with full details
    const file = await prisma.assignmentFile.findUnique({
      where: { id: fileId },
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
                instructor: true,
                instructorId: true
              }
            }
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      file.assignment.course.instructorId === session.user.id ||
      file.uploadedBy === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this file' }, { status: 403 })
    }

    // Format response
    const response = {
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
      courseId: file.assignment?.course?.id || null,
      courseName: file.assignment?.course?.title || null,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching assignment file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}