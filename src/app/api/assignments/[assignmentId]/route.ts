import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyStudentsOfNewAssignment } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    // Get the assignment with course details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            instructorId: true,
            enrollments: {
              where: {
                userId: session.user.id,
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check access permissions
    const isAdmin = session.user.role === 'ADMIN'
    const isInstructor = session.user.role === 'INSTRUCTOR' && assignment.course.instructorId === session.user.id
    const isEnrolledStudent = assignment.course.enrollments.length > 0

    if (!isAdmin && !isInstructor && !isEnrolledStudent) {
      return NextResponse.json({ error: 'You do not have access to this assignment' }, { status: 403 })
    }

    // Format response
    const response = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      courseName: assignment.course.title,
      dueDate: assignment.dueDate?.toISOString() || null,
      maxPoints: assignment.maxPoints || 100,
      isPublished: true, // Default to published for existing assignments
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized - Instructor or Admin access required' }, { status: 401 })
    }

    const { assignmentId } = await params
    const body = await request.json()

    // Get the assignment to check permissions
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        }
      }
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions
    const canEdit = session.user.role === 'ADMIN' || 
                   (session.user.role === 'INSTRUCTOR' && existingAssignment.course.instructorId === session.user.id)

    if (!canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this assignment' }, { status: 403 })
    }

    // Validate required fields
    const requiredFields = ['title', 'description']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate numeric fields
    let maxPoints = existingAssignment.maxPoints
    if (body.maxPoints !== undefined) {
      if (body.maxPoints === null || body.maxPoints === '') {
        maxPoints = null
      } else {
        maxPoints = parseInt(body.maxPoints)
        if (isNaN(maxPoints) || maxPoints <= 0 || maxPoints > 1000) {
          return NextResponse.json(
            { error: 'Max points must be between 1 and 1000' },
            { status: 400 }
          )
        }
      }
    }

    // Validate due date
    let dueDate = existingAssignment.dueDate
    if (body.dueDate !== undefined) {
      if (body.dueDate === null || body.dueDate === '') {
        dueDate = null
      } else {
        dueDate = new Date(body.dueDate)
        if (isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: 'Due date must be a valid date' },
            { status: 400 }
          )
        }
      }
    }

    // Check if assignment is being published for the first time
    const wasUnpublished = !existingAssignment.isPublished
    const willBePublished = body.isPublished !== undefined ? body.isPublished : existingAssignment.isPublished

    // Update the assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        dueDate: dueDate,
        maxPoints: maxPoints,
        isPublished: willBePublished
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            instructorId: true
          }
        }
      }
    })

    // Create notifications for enrolled students if assignment was just published
    if (wasUnpublished && willBePublished && updatedAssignment.dueDate) {
      try {
        await notifyStudentsOfNewAssignment(
          updatedAssignment.courseId,
          updatedAssignment.title,
          updatedAssignment.dueDate
        )
        console.log(`✅ Sent notifications for published assignment: ${updatedAssignment.title}`)
      } catch (notificationError) {
        console.error('Error sending notifications for published assignment:', notificationError)
        // Don't fail the assignment update if notifications fail
      }
    }

    // Format response
    const formattedAssignment = {
      id: updatedAssignment.id,
      title: updatedAssignment.title,
      description: updatedAssignment.description,
      courseId: updatedAssignment.courseId,
      courseTitle: updatedAssignment.course.title,
      instructor: updatedAssignment.course.instructor,
      instructorId: updatedAssignment.course.instructorId,
      dueDate: updatedAssignment.dueDate ? updatedAssignment.dueDate.toISOString() : null,
      maxPoints: updatedAssignment.maxPoints,
      isPublished: updatedAssignment.isPublished,
      createdAt: updatedAssignment.createdAt.toISOString(),
      updatedAt: updatedAssignment.updatedAt.toISOString()
    }

    return NextResponse.json(formattedAssignment)

  } catch (error) {
    console.error('Error updating assignment:', error)
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An assignment with this title already exists in this course' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    // Get the assignment to check permissions
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions: only admin or course instructor can delete
    const canDelete = 
      session.user.role === 'ADMIN' || 
      (session.user.role === 'INSTRUCTOR' && assignment.course.instructorId === session.user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this assignment' }, { status: 403 })
    }

    // Delete assignment (this will cascade delete all files)
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })

  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized - Instructor or Admin access required' }, { status: 401 })
    }

    const { assignmentId } = await params
    const body = await request.json()

    // Get the assignment to check permissions
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            instructorId: true
          }
        }
      }
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user has permission to modify this assignment
    if (session.user.role === 'INSTRUCTOR' && existingAssignment.course.instructorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only modify your own assignments' }, { status: 403 })
    }

    // Update the assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        isPublished: body.isPublished
      }
    })

    return NextResponse.json({
      id: updatedAssignment.id,
      title: updatedAssignment.title,
      isPublished: updatedAssignment.isPublished,
      message: `Assignment ${body.isPublished ? 'published' : 'unpublished'} successfully`
    })

  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
