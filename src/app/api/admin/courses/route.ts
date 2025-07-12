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

    const formattedCourses = courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      duration: course.duration,
      durationUnit: course.durationUnit,
      price: course.price,
      level: course.level,
      capacity: course.capacity,
      enrolledCount: course._count.enrollments,
      startDate: course.startDate,
      schedule: typeof course.schedule === 'string' ? JSON.parse(course.schedule) : course.schedule,
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
      instructor,
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

    if (!instructor?.trim()) {
      return NextResponse.json({ error: 'Instructor name is required' }, { status: 400 })
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

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        instructor: instructor.trim(),
        duration: parseInt(duration),
        durationUnit: durationUnit,
        price: parseFloat(price),
        level,
        capacity: parseInt(capacity),
        startDate: new Date(startDate),
        schedule: JSON.stringify(schedule)
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    // Create a chat room for this course
    await prisma.chatRoom.create({
      data: {
        name: `${course.title} - Discussion`,
        courseId: course.id,
        isPublic: false
      }
    })

    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      duration: course.duration,
      durationUnit: course.durationUnit,
      price: course.price,
      level: course.level,
      capacity: course.capacity,
      enrolledCount: course._count.enrollments,
      startDate: course.startDate,
      schedule: JSON.parse(course.schedule),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString()
    }

    return NextResponse.json(formattedCourse, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}