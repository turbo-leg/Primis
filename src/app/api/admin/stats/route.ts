import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all stats in parallel for better performance
    const [
      totalStudents,
      activeCourses,
      totalEnrollments,
      pendingApplications,
      upcomingClasses,
      recentEnrollments
    ] = await Promise.all([
      // Total students count
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),

      // Active courses count (all courses for now)
      prisma.course.count(),

      // Total enrollments count
      prisma.enrollment.count(),

      // Active enrollments count
      prisma.enrollment.count(),

      // Upcoming classes count (courses starting in the future)
      prisma.course.count({
        where: {
          startDate: {
            gte: new Date()
          }
        }
      }),

      // Recent enrollments (last 10)
      prisma.enrollment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          course: {
            select: { title: true }
          }
        }
      })
    ])

    // Calculate weekly growth
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [studentsThisWeek, coursesThisWeek, enrollmentsThisWeek] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: oneWeekAgo }
        }
      }),
      prisma.course.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      }),
      prisma.enrollment.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      })
    ])

    // Calculate total revenue (assuming $500 per enrollment for now)
    const totalRevenue = totalEnrollments * 500

    const stats = {
      totalStudents,
      activeCourses,
      totalEnrollments,
      pendingApplications,
      upcomingClasses,
      totalRevenue,
      growth: {
        students: studentsThisWeek,
        courses: coursesThisWeek,
        enrollments: enrollmentsThisWeek
      },
      recentActivity: [
        ...recentEnrollments.slice(0, 10).map(enrollment => ({
          id: `enroll-${enrollment.id}`,
          type: 'enrollment',
          message: `${enrollment.user.name} enrolled in ${enrollment.course.title}`,
          timestamp: enrollment.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}