import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    let whereClause: any = {}

    // Filter based on user role and access
    if (session.user.role === 'STUDENT') {
      // Students can only see sessions for courses they're enrolled in
      whereClause = {
        course: {
          enrollments: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE'
            }
          }
        }
      }
    } else if (session.user.role === 'INSTRUCTOR') {
      // Instructors can see sessions for courses they teach
      whereClause = {
        course: {
          instructor: session.user.id
        }
      }
    }
    // Admins can see all sessions (no additional filter)

    // Add courseId filter if provided
    if (courseId) {
      whereClause.courseId = courseId
    }

    const courses = await prisma.course.findMany({
      where: {
        ...whereClause
      },
      include: {
        schedules: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        },
        enrollments: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Transform courses into classroom sessions
    const classSessions = courses.flatMap(course => {
      // Use the schedules from the Schedule table
      if (!course.schedules || course.schedules.length === 0) {
        return [] // No schedules for this course
      }

      const now = new Date()
      const today = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Helper function to convert day number to name
      const dayNumberToName = (dayNumber: number): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[dayNumber] || 'Unknown'
      }
      
      // Create sessions for each scheduled day
      const sessions = course.schedules.map((schedule: any) => {
        const dayOfWeek = schedule.dayOfWeek
        const dayName = dayNumberToName(dayOfWeek)
        
        // Calculate if this session is currently active
        const isToday = dayOfWeek === today
        const startTime = schedule.startTime
        const endTime = schedule.endTime
        
        const startTimeParts = startTime.split(':')
        const endTimeParts = endTime.split(':')
        const startHour = parseInt(startTimeParts[0])
        const startMinute = parseInt(startTimeParts[1] || '0')
        const endHour = parseInt(endTimeParts[0])
        const endMinute = parseInt(endTimeParts[1] || '0')
        
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentTimeInMinutes = currentHour * 60 + currentMinute
        const startTimeInMinutes = startHour * 60 + startMinute
        const endTimeInMinutes = endHour * 60 + endMinute
        
        const isActive = isToday && 
                        currentTimeInMinutes >= startTimeInMinutes && 
                        currentTimeInMinutes <= endTimeInMinutes

        // Get instructor name
        const instructor = course.enrollments.find((e: any) => e.user.id === course.instructor)
        const instructorName = instructor?.user.name || course.instructor || 'Unknown Instructor'

        return {
          id: `${course.id}-${schedule.id}`,
          name: `${course.title} - ${dayName} Session`,
          courseId: course.id,
          courseTitle: course.title,
          instructor: course.instructor,
          instructorName,
          room: 'TBA', // Could be added to the schedule table
          isActive,
          dayOfWeek,
          startTime,
          endTime,
          description: course.description,
          enrolledStudents: course._count.enrollments,
          maxCapacity: course.capacity,
          resources: [], // This would be populated from a documents/resources table
          announcements: [] // This would be populated from an announcements table
        }
      })

      return sessions
    })

    return NextResponse.json(classSessions)

  } catch (error) {
    console.error('Error fetching classroom sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId, data } = body

    if (action === 'upload_resource') {
      // Handle resource upload - this would integrate with file storage
      return NextResponse.json({
        success: true,
        message: 'Resource uploaded successfully',
        resourceId: 'temp-id'
      })
    }

    if (action === 'create_announcement') {
      // Handle announcement creation
      return NextResponse.json({
        success: true,
        message: 'Announcement created successfully',
        announcementId: 'temp-id'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error handling classroom action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}