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

    // Get chat rooms user has access to based on their enrollments
    const chatRooms = await prisma.chatRoom.findMany({
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
            id: true,
            title: true,
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: 'ACTIVE'
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format rooms with proper data
    const roomsWithStats = chatRooms.map(room => ({
      id: room.id,
      name: room.name,
      courseId: room.courseId,
      isPublic: room.isPublic,
      course: room.course ? {
        id: room.course.id,
        title: room.course.title
      } : null,
      memberCount: room.course?._count?.enrollments || 0,
      messageCount: room._count.messages
    }))

    return NextResponse.json(roomsWithStats)

  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
