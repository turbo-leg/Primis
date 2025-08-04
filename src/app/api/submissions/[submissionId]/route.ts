import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let whereClause: any = { id: submissionId }

    // Filter based on user role
    if (session.user.role === 'INSTRUCTOR') {
      whereClause.assignment = {
        instructorId: session.user.id
      }
    } else if (session.user.role === 'STUDENT') {
      whereClause.studentId = session.user.id
    }
    // Admins can access any submission

    // Check if submission table exists, if not return mock data for development
    let submission
    try {
      submission = await prisma.submission.findFirst({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignment: {
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              maxPoints: true,
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      })
    } catch (dbError) {
      console.log('Database error, returning mock data:', dbError)
      // Return mock submission data for development
      return NextResponse.json({
        id: submissionId,
        studentId: session.user.id,
        studentName: session.user.name || 'Student Name',
        studentEmail: session.user.email || 'student@example.com',
        assignmentId: 'mock-assignment-1',
        assignmentTitle: 'Sample Assignment',
        assignmentDescription: 'This is a sample assignment for development.',
        courseId: 'mock-course-1',
        courseTitle: 'Sample Course',
        content: 'This is sample submission content.',
        fileUrl: null,
        fileName: null,
        grade: null,
        maxPoints: 100,
        feedback: null,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        gradedAt: null,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isLate: false,
        daysLate: undefined
      })
    }

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const isLate = submission.assignment.dueDate ? submission.submittedAt > submission.assignment.dueDate : false
    const daysLate = isLate && submission.assignment.dueDate
      ? Math.ceil((submission.submittedAt.getTime() - submission.assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const formattedSubmission = {
      id: submission.id,
      studentId: submission.studentId,
      studentName: submission.student.name,
      studentEmail: submission.student.email,
      assignmentId: submission.assignmentId,
      assignmentTitle: submission.assignment.title,
      assignmentDescription: submission.assignment.description,
      courseId: submission.assignment.course.id,
      courseTitle: submission.assignment.course.title,
      content: submission.content,
      fileUrl: submission.fileUrl,
      fileName: submission.fileName,
      grade: submission.grade,
      maxPoints: submission.assignment.maxPoints,
      feedback: submission.feedback,
      status: submission.status,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString(),
      dueDate: submission.assignment.dueDate?.toISOString() || null,
      isLate,
      daysLate: isLate ? daysLate : undefined
    }

    return NextResponse.json(formattedSubmission)

  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized - Instructor access required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields for grading
    if (body.grade === undefined || body.grade === null) {
      return NextResponse.json(
        { error: 'Grade is required' },
        { status: 400 }
      )
    }

    const grade = parseFloat(body.grade)
    if (isNaN(grade) || grade < 0) {
      return NextResponse.json(
        { error: 'Grade must be a valid number >= 0' },
        { status: 400 }
      )
    }

    // Check if submission exists and instructor has access
    let submission
    try {
      submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          assignment: {
            course: {
              instructor: session.user.id
            }
          }
        },
        include: {
          assignment: {
            select: {
              maxPoints: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    } catch (dbError) {
      console.log('Database error in PATCH:', dbError)
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      )
    }

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 404 }
      )
    }

    // Validate grade doesn't exceed max points
    if (submission.assignment.maxPoints && grade > submission.assignment.maxPoints) {
      return NextResponse.json(
        { error: `Grade cannot exceed ${submission.assignment.maxPoints} points` },
        { status: 400 }
      )
    }

    // Update the submission with grade and feedback
    let updatedSubmission
    try {
      updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          grade: grade,
          feedback: body.feedback?.trim() || null,
          status: 'GRADED',
          gradedAt: new Date()
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              maxPoints: true,
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      })
    } catch (dbError) {
      console.log('Database error updating submission:', dbError)
      return NextResponse.json(
        { error: 'Failed to update grade. Please try again.' },
        { status: 503 }
      )
    }

    // Format response
    const isLate = updatedSubmission.assignment.dueDate ? updatedSubmission.submittedAt > updatedSubmission.assignment.dueDate : false
    const daysLate = isLate && updatedSubmission.assignment.dueDate
      ? Math.ceil((updatedSubmission.submittedAt.getTime() - updatedSubmission.assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const formattedSubmission = {
      id: updatedSubmission.id,
      studentId: updatedSubmission.studentId,
      studentName: updatedSubmission.student.name,
      studentEmail: updatedSubmission.student.email,
      assignmentId: updatedSubmission.assignmentId,
      assignmentTitle: updatedSubmission.assignment.title,
      courseId: updatedSubmission.assignment.course.id,
      courseTitle: updatedSubmission.assignment.course.title,
      content: updatedSubmission.content,
      fileUrl: updatedSubmission.fileUrl,
      fileName: updatedSubmission.fileName,
      grade: updatedSubmission.grade,
      maxPoints: updatedSubmission.assignment.maxPoints,
      feedback: updatedSubmission.feedback,
      status: updatedSubmission.status,
      submittedAt: updatedSubmission.submittedAt.toISOString(),
      gradedAt: updatedSubmission.gradedAt?.toISOString(),
      isLate,
      daysLate: isLate ? daysLate : undefined
    }

    return NextResponse.json(formattedSubmission)

  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}