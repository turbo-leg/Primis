import { prisma } from '@/lib/prisma'

// ================================
// NOTIFICATION TYPES & INTERFACES
// ================================

// Use Prisma's NotificationType enum
import { NotificationType } from '@prisma/client'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type?: NotificationType
  data?: Record<string, any>
  actionUrl?: string
  expiresAt?: Date
}

export interface NotificationFilter {
  userId: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
  types?: NotificationType[]
  startDate?: Date
  endDate?: Date
}

// ================================
// CORE NOTIFICATION FUNCTIONS
// ================================

/**
 * Create a single notification for a user
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'GENERAL',
        data: data.data ? JSON.stringify(data.data) : undefined
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create notifications for multiple users efficiently
 */
export async function createNotificationForUsers(
  userIds: string[], 
  data: Omit<CreateNotificationData, 'userId'>,
  options?: { batchSize?: number }
) {
  try {
    const batchSize = options?.batchSize || 100
    const notifications = userIds.map(userId => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'GENERAL' as NotificationType,
      data: data.data ? JSON.stringify(data.data) : undefined
    }))

    // Process in batches for better performance
    const results = []
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const result = await prisma.notification.createMany({
        data: batch
      })
      results.push(result)
    }

    return results
  } catch (error) {
    console.error('Error creating notifications for users:', error)
    throw error
  }
}

/**
 * Get user notifications with advanced filtering
 */
export async function getUserNotifications(filter: NotificationFilter) {
  try {
    const { userId, limit = 20, offset = 0, unreadOnly = false, types, startDate, endDate } = filter
    
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
        ...(types && { type: { in: types } }),
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      orderBy: [
        { isRead: 'asc' },  // Unread notifications first
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })
  } catch (error) {
    console.error('Error getting user notifications:', error)
    return []
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}

// ================================
// SMART NOTIFICATION TEMPLATES
// ================================

export const NotificationTemplates = {
  // Academic Notifications
  assignmentCreated: (courseName: string, assignmentTitle: string, dueDate: Date) => ({
    title: '📚 New Assignment Available',
    message: `"${assignmentTitle}" has been posted for ${courseName}. Due ${dueDate.toLocaleDateString()}.`,
    type: 'ASSIGNMENT' as NotificationType,
    data: { courseName, assignmentTitle, dueDate: dueDate.toISOString() }
  }),
  
  assignmentGraded: (assignmentTitle: string, grade: number, maxPoints: number, feedback?: string) => ({
    title: '✅ Assignment Graded',
    message: `Your assignment "${assignmentTitle}" has been graded. Score: ${grade}/${maxPoints}${feedback ? ' - Check feedback!' : ''}`,
    type: 'GRADE' as NotificationType,
    data: { assignmentTitle, grade, maxPoints, feedback }
  }),
  
  assignmentDueSoon: (assignmentTitle: string, hoursRemaining: number) => ({
    title: '⏰ Assignment Due Soon',
    message: `"${assignmentTitle}" is due in ${hoursRemaining} hours. Submit soon!`,
    type: 'REMINDER' as NotificationType,
    data: { assignmentTitle, hoursRemaining }
  }),

  // Course Notifications
  courseEnrollment: (courseName: string, startDate: Date) => ({
    title: '🎓 Successfully Enrolled',
    message: `Welcome to ${courseName}! Classes start ${startDate.toLocaleDateString()}.`,
    type: 'ENROLLMENT' as NotificationType,
    data: { courseName, startDate: startDate.toISOString() }
  }),

  courseUpdate: (courseName: string, updateType: string, details?: string) => ({
    title: '📢 Course Update',
    message: `${courseName}: ${updateType}${details ? ` - ${details}` : ''}`,
    type: 'GENERAL' as NotificationType,
    data: { courseName, updateType, details }
  }),

  // Communication Notifications  
  newMessage: (senderName: string, senderRole: string, preview?: string) => ({
    title: '💬 New Message',
    message: `Message from ${senderName} (${senderRole})${preview ? `: "${preview.substring(0, 50)}..."` : ''}`,
    type: 'MESSAGE' as NotificationType,
    data: { senderName, senderRole, preview }
  }),

  // System Notifications
  systemMaintenance: (startTime: Date, duration: string) => ({
    title: '🔧 Scheduled Maintenance',
    message: `System maintenance scheduled for ${startTime.toLocaleString()}. Duration: ${duration}`,
    type: 'WARNING' as NotificationType,
    data: { startTime: startTime.toISOString(), duration }
  }),

  achievementUnlocked: (achievementName: string, description: string) => ({
    title: '🏆 Achievement Unlocked!',
    message: `Congratulations! You've earned "${achievementName}": ${description}`,
    type: 'SUCCESS' as NotificationType,
    data: { achievementName, description }
  })
}

// ================================
// BULK NOTIFICATION HELPERS
// ================================

/**
 * Send assignment notifications to all enrolled students
 */
export async function notifyStudentsOfNewAssignment(
  courseId: string, 
  assignmentTitle: string, 
  dueDate: Date
) {
  try {
    // Get all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        status: 'ACTIVE'
      },
      include: {
        user: true,
        course: true
      }
    })

    const userIds = enrollments.map(e => e.userId)
    const courseName = enrollments[0]?.course?.title || 'Unknown Course'

    if (userIds.length > 0) {
      await createNotificationForUsers(
        userIds,
        NotificationTemplates.assignmentCreated(courseName, assignmentTitle, dueDate)
      )
    }

    return { notified: userIds.length }
  } catch (error) {
    console.error('Error notifying students of new assignment:', error)
    throw error
  }
}

/**
 * Send grade notifications to students
 */
export async function notifyStudentOfGrade(
  studentId: string,
  assignmentTitle: string,
  grade: number,
  maxPoints: number,
  feedback?: string
) {
  try {
    await createNotification({
      userId: studentId,
      ...NotificationTemplates.assignmentGraded(assignmentTitle, grade, maxPoints, feedback)
    })
  } catch (error) {
    console.error('Error notifying student of grade:', error)
    throw error
  }
}

/**
 * Send enrollment confirmation
 */
export async function notifyStudentOfEnrollment(
  studentId: string,
  courseName: string,
  startDate: Date
) {
  try {
    await createNotification({
      userId: studentId,
      ...NotificationTemplates.courseEnrollment(courseName, startDate)
    })
  } catch (error) {
    console.error('Error notifying student of enrollment:', error)
    throw error
  }
}

// ================================
// NOTIFICATION CLEANUP
// ================================

/**
 * Clean up old notifications (optional maintenance function)
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    throw error
  }
}
