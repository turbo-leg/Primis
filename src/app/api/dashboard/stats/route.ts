import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Admin stats
    if (session.user.role === 'ADMIN') {
      // Get total courses
      const totalCourses = await prisma.course.count()

      // Get total students (users with STUDENT role)
      const totalStudents = await prisma.user.count({
        where: { role: 'STUDENT' }
      })

      // Get total revenue from all courses
      const courses = await prisma.course.findMany({
        select: { price: true }
      })
      const totalRevenue = courses.reduce((sum, course) => sum + course.price, 0)

      // Get active courses
      const activeCourses = totalCourses

      return NextResponse.json({
        totalCourses,
        totalStudents,
        totalRevenue,
        activeCourses
      })
    }

    // Student/regular user stats
    // Get user's active courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            schedules: true
          }
        }
      }
    })

    // Get today's classes
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    const todaySchedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek: dayOfWeek,
        isActive: true,
        course: {
          enrollments: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        course: true
      }
    })

    // Get unread messages count (mock for now since we don't have real chat yet)
    const unreadMessages = 5 // TODO: Implement real chat message counting

    // Get attendance rate
    const totalAttendances = await prisma.attendance.count({
      where: {
        userId: session.user.id
      }
    })

    const presentAttendances = await prisma.attendance.count({
      where: {
        userId: session.user.id,
        status: 'PRESENT'
      }
    })

    const attendanceRate = totalAttendances > 0 
      ? Math.round((presentAttendances / totalAttendances) * 100)
      : 0

    return NextResponse.json({
      activeCourses: enrollments.length,
      todayClasses: todaySchedules.length,
      unreadMessages,
      attendanceRate,
      enrollments,
      todaySchedules
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}