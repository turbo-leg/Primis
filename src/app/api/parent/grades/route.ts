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

    // Verify user is a parent
    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })
    }

    // Verify the child belongs to this parent (using raw query until schema is migrated)
    const child = await prisma.$queryRaw`
      SELECT * FROM users WHERE id = ${childId} AND "parentId" = ${session.user.id} AND role = 'STUDENT'
    ` as any[]

    if (!child || child.length === 0) {
      return NextResponse.json({ error: 'Child not found or not authorized' }, { status: 404 })
    }

    // Get child's enrollments and submissions with grades
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: childId,
        status: 'ACTIVE'
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            assignments: {
              select: {
                id: true,
                title: true,
                maxPoints: true,
                dueDate: true,
                submissions: {
                  where: {
                    studentId: childId
                  },
                  select: {
                    id: true,
                    grade: true,
                    submittedAt: true,
                    feedback: true
                  }
                }
              },
              orderBy: {
                dueDate: 'desc'
              }
            }
          }
        }
      }
    })

    // Calculate overall grade statistics
    let totalPoints = 0
    let earnedPoints = 0
    let completedAssignments = 0
    let totalAssignments = 0

    const formattedCourses = enrollments.map(enrollment => {
      const course = enrollment.course
      let courseEarnedPoints = 0
      let courseTotalPoints = 0
      let courseCompletedAssignments = 0
      
      const assignments = course.assignments.map(assignment => {
        totalAssignments++
        const submission = assignment.submissions[0] // Should only be one per student
        
        if (submission && submission.grade !== null) {
          completedAssignments++
          courseCompletedAssignments++
          earnedPoints += submission.grade
          courseEarnedPoints += submission.grade
        }
        
        totalPoints += assignment.maxPoints || 0
        courseTotalPoints += assignment.maxPoints || 0

        return {
          id: assignment.id,
          title: assignment.title,
          maxPoints: assignment.maxPoints,
          dueDate: assignment.dueDate?.toISOString().split('T')[0],
          submission: submission ? {
            grade: submission.grade,
            submittedAt: submission.submittedAt?.toISOString(),
            feedback: submission.feedback
          } : null
        }
      })

      const courseGradePercentage = courseTotalPoints > 0 
        ? (courseEarnedPoints / courseTotalPoints) * 100 
        : 0

      return {
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        assignments,
        statistics: {
          totalAssignments: course.assignments.length,
          completedAssignments: courseCompletedAssignments,
          totalPoints: courseTotalPoints,
          earnedPoints: courseEarnedPoints,
          gradePercentage: Math.round(courseGradePercentage * 100) / 100
        }
      }
    })

    const overallGradePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    const response = {
      child: {
        id: child[0].id,
        name: child[0].name,
        email: child[0].email
      },
      grades: {
        courses: formattedCourses,
        overallStatistics: {
          totalAssignments,
          completedAssignments,
          totalPoints,
          earnedPoints,
          overallGradePercentage: Math.round(overallGradePercentage * 100) / 100
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching child grades:', error)
    return NextResponse.json({ error: 'Failed to fetch grades data' }, { status: 500 })
  }
}
