import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        course: {
          include: {
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    const formattedEnrollments = enrollments.map((enrollment: any) => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.createdAt.toISOString(),
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        instructor: enrollment.course.instructor,
        duration: enrollment.course.duration,
        price: enrollment.course.price,
        level: enrollment.course.level,
        capacity: enrollment.course.capacity,
        enrolledCount: enrollment.course._count.enrollments,
        startDate: enrollment.course.startDate.toISOString(),
        schedule: enrollment.course.schedule
      }
    }))

    return NextResponse.json(formattedEnrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}