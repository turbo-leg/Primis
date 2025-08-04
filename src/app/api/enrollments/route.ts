import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        schedules: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      )
    }

    // Check course capacity (assuming 30 max per course for now)
    const maxCapacity = 30
    if (course._count.enrollments >= maxCapacity) {
      return NextResponse.json(
        { error: 'Course is full' },
        { status: 400 }
      )
    }

    // Create enrollment with ACTIVE status
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        status: 'ACTIVE'
      }
    })

    // Fetch the created enrollment with related data
    const enrollmentWithDetails = await prisma.enrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            price: true,
            instructor: true,
            startDate: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Successfully enrolled in course',
      enrollment: {
        id: enrollmentWithDetails!.id,
        status: enrollmentWithDetails!.status,
        enrolledAt: enrollmentWithDetails!.createdAt,
        course: enrollmentWithDetails!.course,
        user: enrollmentWithDetails!.user
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            price: true,
            instructor: true,
            startDate: true,
            description: true,
            schedules: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                isActive: true
              }
            }
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

    // Transform the data
    const transformedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      course: {
        ...enrollment.course,
        schedules: enrollment.course.schedules.map(schedule => ({
          ...schedule,
          dayOfWeek: dayNumberToName(schedule.dayOfWeek as number)
        }))
      }
    }))

    return NextResponse.json(transformedEnrollments)

  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}