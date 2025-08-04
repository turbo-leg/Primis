import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  createNotification,
  markAllNotificationsAsRead,
  NotificationFilter
} from '@/lib/notifications'

// ================================
// GET /api/notifications
// Fetch user notifications with filtering
// ================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const types = searchParams.get('types')?.split(',')

    const filter: NotificationFilter = {
      userId: session.user.id,
      limit,
      offset,
      unreadOnly,
      ...(types && { types: types as any[] })
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(filter),
      getUnreadNotificationCount(session.user.id)
    ])

    const hasMore = notifications.length === limit

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore,
      total: notifications.length + offset
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ================================
// POST /api/notifications
// Create a new notification
// ================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type = 'INFO', data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const notification = await createNotification({
      userId: session.user.id,
      title,
      message,
      type,
      data
    })

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ================================
// PATCH /api/notifications
// Bulk operations (mark all as read, etc.)
// ================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'markAllAsRead') {
      await markAllNotificationsAsRead(session.user.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
