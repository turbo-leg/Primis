import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentMongoliaTime, MONGOLIA_TIMEZONE } from '@/lib/timezone'

// Helper function to format date for Mongolia timezone without UTC conversion
const formatDateMongolia = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get user's enrolled courses with their structured schedules
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            schedules: {
              where: {
                isActive: true
              }
            },
            assignments: {
              where: {
                dueDate: {
                  gte: startDate ? new Date(startDate) : getCurrentMongoliaTime(),
                  lte: endDate ? new Date(endDate + 'T23:59:59') : new Date(getCurrentMongoliaTime().getTime() + 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      }
    })

    // Generate schedule events for the requested date range
    const events = []
    const start = startDate ? new Date(startDate) : getCurrentMongoliaTime()
    const end = endDate ? new Date(endDate) : new Date(getCurrentMongoliaTime().getTime() + 30 * 24 * 60 * 60 * 1000)

    // Helper function to calculate course end date
    const calculateCourseEndDate = (course: any) => {
      if (!course.startDate || !course.duration || !course.durationUnit) {
        const currentTime = getCurrentMongoliaTime()
        return new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000) // Default to 1 year from now
      }
      
      const courseStart = new Date(course.startDate)
      const courseEnd = new Date(courseStart)
      
      switch (course.durationUnit.toLowerCase()) {
        case 'days':
          courseEnd.setDate(courseEnd.getDate() + course.duration)
          break
        case 'weeks':
          courseEnd.setDate(courseEnd.getDate() + (course.duration * 7))
          break
        case 'months':
          courseEnd.setMonth(courseEnd.getMonth() + course.duration)
          break
        case 'years':
          courseEnd.setFullYear(courseEnd.getFullYear() + course.duration)
          break
        default:
          courseEnd.setDate(courseEnd.getDate() + (course.duration * 7)) // Default to weeks
      }
      
      return courseEnd
    }

    // Add class schedule events for each enrolled course
    for (const enrollment of enrollments) {
      const course = enrollment.course
      
      // Skip if course doesn't have required scheduling info
      if (!course.startDate || !course.schedules || course.schedules.length === 0) {
        continue
      }
      
      const courseStartDate = new Date(course.startDate)
      const courseEndDate = calculateCourseEndDate(course)
      
      // Generate events for each schedule
      for (const schedule of course.schedules) {
        // Find the first occurrence of this day of week on or after course start
        let current = new Date(courseStartDate)
        
        // Move to the first occurrence of the scheduled day
        while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
          current.setDate(current.getDate() + 1)
        }
        
        // Generate weekly recurring events
        while (current <= courseEndDate && current <= end) {
          if (current >= start) {
            const eventDate = formatDateMongolia(current)
            events.push({
              id: `course-${course.id}-${schedule.dayOfWeek}-${eventDate}`,
              title: course.title,
              courseTitle: course.title,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              date: eventDate,
              instructor: course.instructor || 'TBD',
              type: 'CLASS',
              isEnrolled: true,
              courseId: course.id,
              description: course.description || '',
              color: 'blue'
            })
          }
          
          // Move to next week
          current.setDate(current.getDate() + 7)
        }
      }
    }

    // Add assignment due dates
    for (const enrollment of enrollments) {
      for (const assignment of enrollment.course.assignments) {
        if (assignment.dueDate) {
          const dueDate = new Date(assignment.dueDate)
          if (dueDate >= start && dueDate <= end) {
            const eventDate = formatDateMongolia(dueDate)
            events.push({
              id: `assignment-${assignment.id}`,
              title: `Due: ${assignment.title}`,
              courseTitle: enrollment.course.title,
              startTime: '23:59',
              endTime: '23:59',
              date: eventDate,
              instructor: enrollment.course.instructor || 'TBD',
              type: 'ASSIGNMENT',
              isEnrolled: true,
              courseId: enrollment.course.id,
              description: assignment.description || '',
              assignmentId: assignment.id,
              maxPoints: assignment.maxPoints,
              color: 'red'
            })
          }
        }
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
