import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createNotificationForUsers, NotificationTemplates } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Check if user has access to this chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                userId: session.user.id,
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    })

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      chatRoom.isPublic || 
      session.user.role === 'ADMIN' || 
      session.user.role === 'INSTRUCTOR' ||
      (chatRoom.course && chatRoom.course.enrollments.length > 0)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 50 // Limit to last 50 messages
    })

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      userId: message.userId,
      user: {
        id: message.user.id,
        name: message.user.name || 'Unknown User',
        role: message.user.role,
        image: message.user.image
      },
      chatRoomId: message.chatRoomId,
      createdAt: message.createdAt.toISOString()
    }))

    return NextResponse.json(formattedMessages)

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params
    const body = await request.json()

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content: body.content,
        userId: session.user.id,
        chatRoomId: roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true
          }
        },
        chatRoom: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: {
                    status: 'ACTIVE'
                  },
                  select: {
                    userId: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Get participants who should receive notifications (exclude sender)
    let participantIds: string[] = []
    
    if (message.chatRoom && message.chatRoom.course) {
      // For course-based chat rooms, notify all enrolled students and instructor
      participantIds = message.chatRoom.course.enrollments
        .map(enrollment => enrollment.userId)
        .filter(userId => userId !== session.user.id)
      
      // Also add the instructor if not already included
      if (message.chatRoom.course.instructor && message.chatRoom.course.instructor !== session.user.id) {
        participantIds.push(message.chatRoom.course.instructor)
      }
    } else if (message.chatRoom && message.chatRoom.isPublic) {
      // For public rooms, we could get recent participants or all users
      // For now, let's get users who have recently sent messages in this room
      const recentParticipants = await prisma.chatMessage.findMany({
        where: {
          chatRoomId: roomId,
          userId: { not: session.user.id },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId'],
        take: 20 // Limit to 20 recent participants
      })
      
      participantIds = recentParticipants.map(p => p.userId)
    }

    // Send notifications to participants
    if (participantIds.length > 0) {
      const messagePreview = body.content.length > 50 
        ? body.content.substring(0, 50) + '...'
        : body.content

      await createNotificationForUsers(
        participantIds,
        NotificationTemplates.newMessage(
          message.user.name || 'Unknown User',
          message.user.role,
          messagePreview
        )
      ).catch(error => {
        console.error('Error sending chat notifications:', error)
        // Don't fail the message if notifications fail
      })
    }

    const formattedMessage = {
      id: message.id,
      content: message.content,
      userId: message.userId,
      user: {
        id: message.user.id,
        name: message.user.name || 'Unknown User',
        role: message.user.role,
        image: message.user.image
      },
      chatRoomId: message.chatRoomId,
      createdAt: message.createdAt.toISOString()
    }

    return NextResponse.json(formattedMessage, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
