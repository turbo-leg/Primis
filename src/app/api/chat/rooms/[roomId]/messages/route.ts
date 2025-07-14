import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
        }
      }
    })

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
