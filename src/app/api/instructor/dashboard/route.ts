import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instructorId = session.user.id

    // Fetch instructor's courses
    const courses = await prisma.course.findMany({
      where: { 
        instructor: session.user.name || session.user.email || 'Unknown'
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Fetch assignments for instructor
    const assignments = await prisma.assignment.findMany({
      where: { instructorId },
      include: {
        course: {
          select: { title: true }
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    // Calculate statistics
    const totalStudents = courses.reduce((sum, course) => sum + course.enrollments.length, 0)
    const totalAssignments = assignments.length
    
    // Calculate pending submissions
    const pendingSubmissions = assignments.reduce((sum, assignment) => {
      const submissionCount = assignment.submissions.length
      const courseStudents = courses.find(c => c.id === assignment.courseId)?.enrollments.length || 0
      return sum + Math.max(0, courseStudents - submissionCount)
    }, 0)

    // Calculate graded submissions
    const gradedSubmissions = assignments.reduce((sum, assignment) => {
      return sum + assignment.submissions.filter(sub => sub.grade !== null).length
    }, 0)

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        assignment: {
          instructorId
        },
        submittedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        student: {
          select: { id: true, name: true }
        },
        assignment: {
          select: { id: true, title: true, courseId: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 10
    })

    // Get courses with upcoming assignments (due in next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        instructorId,
        dueDate: {
          gte: new Date(),
          lte: nextWeek
        }
      },
      include: {
        course: {
          select: { title: true }
        },
        submissions: true
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    return NextResponse.json({
      overview: {
        totalCourses: courses.length,
        totalStudents,
        totalAssignments,
        pendingSubmissions,
        gradedSubmissions
      },
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        studentCount: course.enrollments.length,
        assignmentCount: assignments.filter(a => a.courseId === course.id).length,
        students: course.enrollments.map(enrollment => enrollment.user)
      })),
      recentActivity: recentSubmissions.map(submission => ({
        id: submission.id,
        studentName: submission.student.name,
        assignmentTitle: submission.assignment.title,
        submittedAt: submission.submittedAt,
        status: submission.status,
        grade: submission.grade
      })),
      upcomingAssignments: upcomingAssignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        courseName: assignment.course.title,
        dueDate: assignment.dueDate,
        submissionCount: assignment.submissions.length
      }))
    })
  } catch (error) {
    console.error('Error fetching instructor dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}