import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            course: {
              enrollments: {
                some: {
                  userId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      },
      include: {
        course: {
          select: {
            title: true
          }
        },
        uploader: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      filename: doc.filename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      courseId: doc.courseId,
      courseName: doc.course?.title,
      uploadedBy: doc.uploader?.name || 'Unknown User',
      uploadedAt: doc.createdAt.toISOString(),
      isPublic: doc.isPublic
    }))

    return NextResponse.json(formattedDocuments)

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}