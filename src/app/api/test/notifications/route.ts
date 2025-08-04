import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification, NotificationTemplates } from '@/lib/notifications'

// ================================
// POST /api/test/notifications
// Create sample notifications for testing
// ================================
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create comprehensive sample notifications for testing
    const sampleNotifications = [
      // Academic notifications
      {
        userId: session.user.id,
        ...NotificationTemplates.assignmentCreated(
          'React Fundamentals', 
          'Component State Management', 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
        )
      },
      {
        userId: session.user.id,
        ...NotificationTemplates.assignmentGraded('JavaScript Basics Quiz', 95, 100, 'Excellent work on the fundamentals!')
      },
      {
        userId: session.user.id,
        ...NotificationTemplates.assignmentDueSoon('Final Project Submission', 24)
      },
      
      // Course notifications
      {
        userId: session.user.id,
        ...NotificationTemplates.courseEnrollment(
          'Advanced Web Development', 
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Starts in 3 days
        )
      },
      {
        userId: session.user.id,
        ...NotificationTemplates.courseUpdate('Database Design', 'Schedule Change', 'Class moved to Wednesday 2:00 PM')
      },
      
      // Communication notifications
      {
        userId: session.user.id,
        ...NotificationTemplates.newMessage('Dr. Sarah Johnson', 'Instructor', 'Please review the updated syllabus for next week')
      },
      
      // System notifications
      {
        userId: session.user.id,
        ...NotificationTemplates.systemMaintenance(
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
          '2 hours'
        )
      },
      {
        userId: session.user.id,
        ...NotificationTemplates.achievementUnlocked('Perfect Attendance', 'Attended all classes this month')
      }
    ]

    const createdNotifications = []
    let successCount = 0
    let failureCount = 0
    
    for (const notificationData of sampleNotifications) {
      try {
        const notification = await createNotification(notificationData)
        createdNotifications.push(notification)
        successCount++
      } catch (error) {
        console.error('Error creating individual notification:', error)
        failureCount++
      }
    }

    return NextResponse.json({
      message: `Sample notifications created successfully`,
      summary: {
        total: sampleNotifications.length,
        successful: successCount,
        failed: failureCount
      },
      notifications: createdNotifications.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        createdAt: n.createdAt
      }))
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating sample notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to create sample notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// ================================
// GET /api/test/notifications
// Get test notification info
// ================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Test notifications endpoint',
      info: 'Use POST to create sample notifications for testing',
      available_templates: Object.keys(NotificationTemplates),
      user_id: session.user.id
    })
  } catch (error) {
    console.error('Error in test notifications GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
