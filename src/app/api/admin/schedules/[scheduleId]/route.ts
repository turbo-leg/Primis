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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId } = await params

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
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
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Get enrollment count for the course
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: schedule.courseId }
    })

    const transformedSchedule = {
      id: schedule.id,
      courseId: schedule.courseId,
      dayOfWeek: typeof schedule.dayOfWeek === 'number' ? dayNumberToName(schedule.dayOfWeek) : schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: 'TBD', // Default room value since field doesn't exist in schema
      instructor: 'TBD',
      maxCapacity: 30,
      currentEnrollments: enrollmentCount,
      createdAt: schedule.createdAt,
      updatedAt: schedule.createdAt,
      course: schedule.course
    }

    return NextResponse.json(transformedSchedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId } = await params
    const body = await request.json()
    const { courseId, dayOfWeek, startTime, endTime, instructor, maxCapacity } = body

    // Validate required fields
    if (!courseId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Course, day, and time are required' },
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

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
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

    // Convert day name to number for storage
    const dayNumber = dayNameToNumber(dayOfWeek)

    // Check for scheduling conflicts (same day, overlapping time, excluding current schedule)
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        id: { not: scheduleId },
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
        { error: 'Schedule conflict: Room is already booked for this time slot' },
        { status: 400 }
      )
    }

    // Update the schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        courseId,
        dayOfWeek: dayNumber,
        startTime,
        endTime
      }
    })

    // Get enrollment count for the course
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId }
    })

    // Transform response
    const transformedSchedule = {
      id: updatedSchedule.id,
      courseId: updatedSchedule.courseId,
      dayOfWeek: dayOfWeek,
      startTime: updatedSchedule.startTime,
      endTime: updatedSchedule.endTime,
      room: 'TBD', // Default room value since field doesn't exist in schema
      instructor: instructor || 'TBD',
      maxCapacity: maxCapacity || 30,
      currentEnrollments: enrollmentCount,
      createdAt: updatedSchedule.createdAt,
      updatedAt: updatedSchedule.createdAt,
      course: course
    }

    return NextResponse.json(transformedSchedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId } = await params

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Delete the schedule
    await prisma.schedule.delete({
      where: { id: scheduleId }
    })

    return NextResponse.json({
      message: 'Schedule deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}