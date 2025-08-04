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

    // Get user's enrolled course IDs
    const enrolledCourses = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      select: {
        courseId: true
      }
    })

    const enrolledCourseIds = enrolledCourses.map(enrollment => enrollment.courseId)

    // Get available courses (not enrolled by the user)
    const availableCourses = await prisma.course.findMany({
      where: {
        id: {
          notIn: enrolledCourseIds
        }
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 6 // Limit to 6 courses for dashboard
    })

    return NextResponse.json(availableCourses)
  } catch (error) {
    console.error('Error fetching available courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
