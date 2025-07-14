import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, messageId } = await params

    // Check if the user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete messages' }, { status: 403 })
    }

    // Verify the message exists and belongs to the specified room
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        chatRoom: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: 'Message does not belong to this chat room' }, { status: 400 })
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully',
      deletedBy: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role
      }
    })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
