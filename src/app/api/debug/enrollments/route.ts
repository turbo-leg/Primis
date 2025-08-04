import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all enrollments with user and course info
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('All enrollments in database:')
    enrollments.forEach(enrollment => {
      console.log(`- User: ${enrollment.user.name} (${enrollment.user.email})`)
      console.log(`  Course: ${enrollment.course.title} (ID: ${enrollment.courseId})`)
      console.log(`  Status: ${enrollment.status}`)
      console.log(`  Created: ${enrollment.createdAt}`)
      console.log('---')
    })

    return NextResponse.json({
      total: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'ACTIVE').length,
      enrollments: enrollments.map(e => ({
        id: e.id,
        userId: e.userId,
        userName: e.user.name,
        userEmail: e.user.email,
        courseId: e.courseId,
        courseName: e.course.title,
        status: e.status,
        createdAt: e.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
