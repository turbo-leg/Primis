import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all assignments with course info
    const assignments = await prisma.assignment.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('All assignments in database:')
    assignments.forEach(assignment => {
      console.log(`- ${assignment.title} (ID: ${assignment.id})`)
      console.log(`  Course: ${assignment.course.title} (ID: ${assignment.courseId})`)
      console.log(`  Published: ${assignment.isPublished}`)
      console.log(`  Created: ${assignment.createdAt}`)
      console.log('---')
    })

    return NextResponse.json({
      total: assignments.length,
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        courseId: a.courseId,
        courseName: a.course.title,
        isPublished: a.isPublished,
        createdAt: a.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
