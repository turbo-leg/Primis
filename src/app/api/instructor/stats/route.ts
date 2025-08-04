import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get instructor's courses (using instructor name match since Course model doesn't have instructorId)
    const courses = await prisma.course.findMany({
      where: { 
        instructor: session.user.name || session.user.email || 'Unknown'
      },
      include: {
        schedules: {
          where: { isActive: true }
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            user: true
          }
        }
      }
    })

    // Get assignments for this instructor
    const assignments = await prisma.assignment.findMany({
      where: { instructorId: session.user.id },
      include: {
        submissions: {
          include: {
            student: true
          }
        },
        course: true
      }
    })

    // Calculate stats
    const totalCourses = courses.length
    const totalStudents = new Set(
      courses.flatMap(course => course.enrollments.map(enrollment => enrollment.userId))
    ).size

    // Calculate pending submissions from assignments
    const pendingSubmissions = assignments.reduce((acc, assignment) => {
      return acc + assignment.submissions.filter(sub => sub.grade === null).length
    }, 0)

    // Get count of classes today (check if any schedule matches today's day of week)
    const today = new Date()
    const todayDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    const todayClasses = courses.filter(course => {
      return course.schedules.some(schedule => schedule.dayOfWeek === todayDayOfWeek)
    }).length

    // Get recent activity - submissions only since we have that data
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        assignment: {
          instructorId: session.user.id
        }
      },
      include: {
        assignment: {
          include: {
            course: true
          }
        },
        student: true
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    })

    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructor: session.user.name || session.user.email || 'Unknown'
        }
      },
      include: {
        course: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    const stats = {
      totalCourses,
      totalStudents,
      pendingSubmissions,
      todayClasses
    }

    const recentActivity = [
      ...recentSubmissions.map(submission => ({
        id: submission.id,
        type: 'submission' as const,
        message: `${submission.student.name} submitted "${submission.assignment.title}"`,
        time: formatTimeAgo(submission.submittedAt),
        course: submission.assignment.course.title,
        createdAt: submission.submittedAt
      })),
      ...recentEnrollments.map(enrollment => ({
        id: enrollment.id,
        type: 'enrollment' as const,
        message: `${enrollment.user.name} enrolled in your course`,
        time: formatTimeAgo(enrollment.createdAt),
        course: enrollment.course.title,
        createdAt: enrollment.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 5)

    // Helper function to convert day number to name
    const dayNumberToName = (dayNumber: number): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayNumber] || 'Unknown'
    }

    // For today's schedule, get courses that have classes today
    const todaySchedule = courses
      .filter(course => course.schedules.some(schedule => schedule.dayOfWeek === todayDayOfWeek))
      .map(course => {
        const todaySchedules = course.schedules.filter(schedule => schedule.dayOfWeek === todayDayOfWeek)
        return {
          id: course.id,
          title: course.title,
          schedules: todaySchedules.map(schedule => ({
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayOfWeek: dayNumberToName(schedule.dayOfWeek)
          })),
          enrollmentCount: course.enrollments.length
        }
      })

    return NextResponse.json({
      stats,
      recentActivity,
      todaySchedule
    })
  } catch (error) {
    console.error('Error fetching instructor stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else {
    return `${diffInDays} days ago`
  }
}
