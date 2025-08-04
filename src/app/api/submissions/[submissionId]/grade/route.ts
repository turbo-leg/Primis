import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
              title: true
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
      console.log('Database error in grading:', dbError)
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
    if (submission.assignment.maxPoints !== null && grade > submission.assignment.maxPoints) {
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
        }
      })
    } catch (dbError) {
      console.log('Database error updating grade:', dbError)
      return NextResponse.json(
        { error: 'Failed to update grade. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully graded ${submission.student.name}'s submission for "${submission.assignment.title}"`,
      grade: updatedSubmission.grade,
      feedback: updatedSubmission.feedback,
      gradedAt: updatedSubmission.gradedAt?.toISOString()
    })

  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
