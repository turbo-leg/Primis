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

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
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
        role: message.user.role
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
            role: true
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
        role: message.user.role
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
