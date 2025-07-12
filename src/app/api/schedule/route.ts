import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        course: true
      }
    })

    // Get all schedules for enrolled courses
    const schedules = await prisma.schedule.findMany({
      where: {
        courseId: {
          in: enrollments.map(e => e.course.id)
        },
        isActive: true
      },
      include: {
        course: true
      }
    })

    // Generate schedule events for the requested date range
    const events = []
    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    for (const schedule of schedules) {
      // Generate events for each day in the range that matches the schedule
      const current = new Date(start)
      while (current <= end) {
        if (current.getDay() === schedule.dayOfWeek) {
          events.push({
            id: `${schedule.id}-${current.toISOString().split('T')[0]}`,
            title: schedule.course.title,
            courseTitle: schedule.course.title,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            date: current.toISOString().split('T')[0],
            location: schedule.room || 'Virtual Room',
            instructor: schedule.course.instructor,
            type: 'CLASS',
            isEnrolled: true,
            courseId: schedule.course.id
          })
        }
        current.setDate(current.getDate() + 1)
      }
    }

    // Sort events by date and time
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
