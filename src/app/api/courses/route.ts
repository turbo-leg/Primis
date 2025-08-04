import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let whereClause = {}
    
    // Filter courses based on user role
    if (session.user.role === 'INSTRUCTOR') {
      whereClause = {
        instructorId: session.user.id
      }
    }
    // STUDENTS and ADMIN see all courses (no filter for browsing purposes)

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        },
        instructorUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        enrollments: session.user.role === 'INSTRUCTOR' || session.user.role === 'ADMIN' ? {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        } : undefined,
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Helper function to convert day number to name
    const dayNumberToName = (dayNumber: number): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayNumber] || 'Unknown'
    }

    // Transform the data
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      price: course.price,
      instructor: course.instructor,
      instructorId: course.instructorId,
      startDate: course.startDate.toISOString(),
      schedules: course.schedules.map(schedule => ({
        id: schedule.id,
        dayOfWeek: dayNumberToName(schedule.dayOfWeek),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      })),
      enrollments: course.enrollments || [],
      _count: course._count
    }))

    return NextResponse.json(transformedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'instructor', 'duration', 'price', 'capacity', 'startDate', 'schedules']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate schedules format
    if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
      return NextResponse.json(
        { error: 'Schedules must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate each schedule entry
    for (const schedule of body.schedules) {
      if (!schedule.dayOfWeek || !schedule.startTime || !schedule.endTime) {
        return NextResponse.json(
          { error: 'Each schedule entry must have dayOfWeek, startTime, and endTime' },
          { status: 400 }
        )
      }
      
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        )
      }
    }

    // Validate numeric fields
    const price = parseFloat(body.price)
    const capacity = parseInt(body.capacity)
    
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a valid number' },
        { status: 400 }
      )
    }

    if (isNaN(capacity) || capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be a valid number greater than 0' },
        { status: 400 }
      )
    }

    // Validate date
    const startDate = new Date(body.startDate)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Start date must be a valid date' },
        { status: 400 }
      )
    }

    // Validate level
    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
    if (!validLevels.includes(body.level)) {
      return NextResponse.json(
        { error: 'Level must be BEGINNER, INTERMEDIATE, or ADVANCED' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        instructor: body.instructor.trim(),
        duration: parseInt(body.duration),
        durationUnit: body.durationUnit || 'weeks',
        price: price,
        level: body.level,
        capacity: capacity,
        startDate: startDate,
        timezone: body.timezone || 'Asia/Ulaanbaatar',
        schedules: {
          create: body.schedules.map((schedule: any) => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: schedule.isActive !== false
          }))
        }
      },
      include: {
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        },
        enrollments: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    // Add enrollment counts to match the expected format
    const courseWithStats = {
      ...course,
      startDate: course.startDate.toISOString(),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      enrolledCount: course.enrollments.filter((e: any) => e.status === 'ACTIVE').length,
      totalEnrollments: course.enrollments.length
    }

    return NextResponse.json(courseWithStats, { status: 201 })

  } catch (error) {
    console.error('Error creating course:', error)
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A course with this title already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}