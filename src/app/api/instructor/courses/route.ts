import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized - Instructor access required' }, { status: 401 })
    }

    const instructorId = session.user.id

    // Fetch courses where the current user is the instructor
    const courses = await prisma.course.findMany({
      where: {
        instructorId: instructorId
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
        },
        assignments: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            isPublished: true
          }
        },
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
      duration: course.duration,
      durationUnit: course.durationUnit,
      capacity: course.capacity,
      startDate: course.startDate.toISOString(),
      timezone: course.timezone,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      schedules: course.schedules.map(schedule => ({
        id: schedule.id,
        dayOfWeek: dayNumberToName(schedule.dayOfWeek as number),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      })),
      enrollments: course.enrollments,
      assignments: course.assignments,
      _count: course._count
    }))

    return NextResponse.json(transformedCourses)

  } catch (error) {
    console.error('Error fetching instructor courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
