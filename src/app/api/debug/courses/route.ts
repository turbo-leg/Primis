import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all courses with assignment counts
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            assignments: true
          }
        },
        assignments: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('All courses in database:')
    courses.forEach(course => {
      console.log(`- ${course.title} (ID: ${course.id})`)
      console.log(`  Total assignments: ${course._count.assignments}`)
      console.log(`  Assignment details:`)
      course.assignments.forEach(assignment => {
        console.log(`    - ${assignment.title} (Published: ${assignment.isPublished})`)
      })
      console.log('---')
    })

    return NextResponse.json({
      total: courses.length,
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        assignmentCount: c._count.assignments,
        assignments: c.assignments
      }))
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
