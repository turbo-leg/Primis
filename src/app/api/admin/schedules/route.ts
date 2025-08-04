import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to convert day name to number
const dayNameToNumber = (dayName: string): number => {
  const days = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  return days[dayName as keyof typeof days] || 1
}

// Helper function to convert day number to name
const dayNumberToName = (dayNumber: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNumber] || 'Monday'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schedules = await prisma.schedule.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            price: true,
            startDate: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Get enrollment counts for each schedule (since schedules don't have direct enrollments)
    const schedulesWithCounts = await Promise.all(
      schedules.map(async (schedule) => {
        const enrollmentCount = await prisma.enrollment.count({
          where: { courseId: schedule.courseId }
        })

        return {
          id: schedule.id,
          courseId: schedule.courseId,
          dayOfWeek: typeof schedule.dayOfWeek === 'number' ? dayNumberToName(schedule.dayOfWeek) : schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          instructor: 'TBD', // Will be added in migration
          maxCapacity: 30, // Will be added in migration
          currentEnrollments: enrollmentCount,
          createdAt: schedule.createdAt,
          updatedAt: schedule.createdAt, // Will be added in migration
          course: schedule.course
        }
      })
    )

    return NextResponse.json(schedulesWithCounts)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, days, startTime, endTime, room, instructor, maxCapacity } = body

    // Validate required fields
    if (!courseId || !days || !Array.isArray(days) || days.length === 0 || !startTime || !endTime || !room) {
      return NextResponse.json(
        { error: 'Course, days (array), start time, end time, and room are required' },
        { status: 400 }
      )
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        level: true,
        price: true,
        startDate: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Create schedules for each day
    const createdSchedules = []
    
    for (const day of days) {
      const dayNumber = dayNameToNumber(day.charAt(0).toUpperCase() + day.slice(1).toLowerCase())
      
      // Check for scheduling conflicts for this specific day
      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          dayOfWeek: dayNumber,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      })

      if (conflictingSchedule) {
        return NextResponse.json(
          { error: `Schedule conflict: Room is already booked for ${day} at this time slot` },
          { status: 400 }
        )
      }

      // Create the schedule for this day
      const schedule = await prisma.schedule.create({
        data: {
          courseId,
          dayOfWeek: dayNumber,
          startTime,
          endTime,
        }
      })

      createdSchedules.push(schedule)
    }

    // Get enrollment count for the course
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId }
    })

    // Transform response - return the first schedule with combined days info
    const transformedSchedule = {
      id: createdSchedules[0].id,
      courseId: courseId,
      days: days,
      dayOfWeek: days.join(', '), // For backward compatibility
      startTime: startTime,
      endTime: endTime,
      room: room,
      instructor: instructor || 'TBD',
      maxCapacity: maxCapacity || 30,
      currentEnrollments: enrollmentCount,
      createdAt: createdSchedules[0].createdAt,
      updatedAt: createdSchedules[0].createdAt,
      course: course,
      scheduleIds: createdSchedules.map(s => s.id) // Track all created schedule IDs
    }

    return NextResponse.json(transformedSchedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}