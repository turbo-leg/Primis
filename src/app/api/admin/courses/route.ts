import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all courses (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const courses = await prisma.course.findMany({
      include: {
        instructorUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Helper function to convert day number to name
    const dayNumberToName = (dayNumber: number): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayNumber] || 'Unknown'
    }

    const formattedCourses = courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor, // Display name
      instructorId: course.instructorId, // User ID for relationships
      instructorName: course.instructorUser?.name || course.instructor, // Fallback to instructor string
      instructorEmail: course.instructorUser?.email,
      duration: course.duration,
      durationUnit: course.durationUnit,
      price: course.price,
      level: course.level,
      capacity: course.capacity,
      enrolledCount: course._count.enrollments,
      startDate: course.startDate,
      schedules: course.schedules.map((schedule: any) => ({
        id: schedule.id,
        dayOfWeek: dayNumberToName(schedule.dayOfWeek),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      })),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST - Create new course (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      instructorId,
      duration,
      durationUnit,
      price,
      level,
      capacity,
      startDate,
      schedule
    } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Course description is required' }, { status: 400 })
    }

    if (!instructorId?.trim()) {
      return NextResponse.json({ error: 'Instructor is required' }, { status: 400 })
    }

    // Verify the instructor exists and has INSTRUCTOR role
    const instructor = await prisma.user.findFirst({
      where: {
        id: instructorId.trim(),
        role: 'INSTRUCTOR'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Invalid instructor selected. User must exist and have instructor role.' }, { status: 400 })
    }

    if (!duration || duration < 1) {
      return NextResponse.json({ error: 'Duration must be at least 1' }, { status: 400 })
    }

    if (!durationUnit || !['weeks', 'months'].includes(durationUnit)) {
      return NextResponse.json({ error: 'Duration unit must be weeks or months' }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    if (!schedule || !schedule.days || schedule.days.length === 0) {
      return NextResponse.json({ error: 'Schedule with days is required' }, { status: 400 })
    }

    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
      return NextResponse.json({ error: 'Invalid course level' }, { status: 400 })
    }

    if (price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 })
    }

    if (capacity < 1) {
      return NextResponse.json({ error: 'Capacity must be at least 1' }, { status: 400 })
    }

    // Validate schedule format
    if (!schedule || !Array.isArray(schedule.days) || !schedule.startTime || !schedule.endTime) {
      return NextResponse.json({ error: 'Schedule must have days array, startTime, and endTime' }, { status: 400 })
    }

    // Convert day names to numbers for database storage
    const dayNameToNumber: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }

    const scheduleDays = schedule.days.map((day: string) => {
      const dayNumber = dayNameToNumber[day.toLowerCase()]
      if (dayNumber === undefined) {
        throw new Error(`Invalid day: ${day}`)
      }
      return dayNumber
    })

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        instructor: instructor.name || instructor.email, // Store the instructor name for display
        instructorId: instructor.id, // Store the instructor ID for relationships
        duration: parseInt(duration),
        durationUnit: durationUnit,
        price: parseFloat(price),
        level,
        capacity: parseInt(capacity),
        startDate: new Date(startDate),
        schedules: {
          create: scheduleDays.map((dayOfWeek: number) => ({
            dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: true
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
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    // Create a chat room for this course
    try {
      await prisma.chatRoom.create({
        data: {
          name: `${course.title} - Discussion`,
          courseId: course.id,
          isPublic: false
        }
      })
      console.log(`✅ Chat room created for course: ${course.title}`)
    } catch (chatRoomError) {
      console.error('Error creating chat room:', chatRoomError)
      // Don't fail the course creation if chat room creation fails
    }

    // Helper function to convert day number to name
    const dayNumberToName = (dayNumber: number): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayNumber] || 'Unknown'
    }

    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      instructorId: course.instructorId,
      instructorName: instructor.name,
      duration: course.duration,
      durationUnit: course.durationUnit,
      price: course.price,
      level: course.level,
      capacity: course.capacity,
      enrolledCount: course._count.enrollments,
      startDate: course.startDate,
      schedules: course.schedules.map((schedule: any) => ({
        id: schedule.id,
        dayOfWeek: dayNumberToName(schedule.dayOfWeek),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      })),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString()
    }

    return NextResponse.json(formattedCourse, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}