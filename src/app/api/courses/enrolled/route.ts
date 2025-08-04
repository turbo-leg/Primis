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

    let whereClause: any = {}

    // Filter based on user role
    if (session.user.role === 'STUDENT') {
      // Students can only see courses they're enrolled in
      whereClause = {
        enrollments: {
          some: {
            userId: session.user.id,
            status: 'ACTIVE'
          }
        }
      }
    } else if (session.user.role === 'INSTRUCTOR') {
      // Instructors can see courses they teach
      whereClause = {
        instructor: session.user.id
      }
    } else {
      // Admins can see all courses
      whereClause = {}
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
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
        title: 'asc'
      }
    })

    const formattedCourses = courses.map(course => {
      // Get instructor name
      const instructor = course.enrollments.find(e => e.user.id === course.instructor)
      const instructorName = instructor?.user.name || course.instructor || 'Unknown Instructor'

      return {
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        instructorName,
        description: course.description,
        enrolledStudents: course._count.enrollments,
        isActive: true,
        nextSessionTime: null // This could be calculated from schedules if needed
      }
    })

    return NextResponse.json(formattedCourses)

  } catch (error) {
    console.error('Error fetching enrolled courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}