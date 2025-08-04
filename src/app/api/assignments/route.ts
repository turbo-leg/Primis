import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyStudentsOfNewAssignment } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // 'active', 'completed', 'all'

    let whereClause: any = {}

    // Filter based on user role
    if (session.user.role === 'INSTRUCTOR') {
      whereClause = {
        course: {
          instructorId: session.user.id
        }
      }
      
      // Add course filter if provided
      if (courseId) {
        whereClause.courseId = courseId
      }
    } else if (session.user.role === 'STUDENT') {
      // Students can only see published assignments from courses they're enrolled in
      whereClause = {
        isPublished: true,
        course: {
          enrollments: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE'
            }
          }
        }
      }
      
      if (courseId) {
        whereClause.courseId = courseId
      }
    } else if (session.user.role === 'ADMIN') {
      // Admins can see all assignments
      if (courseId) {
        whereClause.courseId = courseId
      }
    }

    // Add status filter
    if (status === 'active') {
      whereClause.isPublished = true
      whereClause.dueDate = {
        gte: new Date()
      }
    } else if (status === 'completed') {
      whereClause.dueDate = {
        lt: new Date()
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            instructorId: true
          }
        },
        submissions: session.user.role === 'STUDENT' ? {
          where: {
            studentId: session.user.id
          },
          select: {
            id: true,
            content: true,
            fileUrl: true,
            fileName: true,
            grade: true,
            feedback: true,
            status: true,
            submittedAt: true,
            gradedAt: true
          }
        } : {
          select: {
            id: true,
            studentId: true,
            grade: true,
            status: true,
            submittedAt: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      instructor: assignment.course.instructor,
      instructorId: assignment.course.instructorId,
      dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
      maxPoints: assignment.maxPoints,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      submissions: assignment.submissions,
      submissionCount: assignment._count.submissions,
      isOverdue: assignment.dueDate ? assignment.dueDate < new Date() : false,
      userSubmission: session.user.role === 'STUDENT' ? assignment.submissions[0] || null : null
    }))

    return NextResponse.json(formattedAssignments)

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized - Instructor or Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields (made instructions optional)
    const requiredFields = ['title', 'description', 'courseId']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate numeric fields (make maxPoints optional)
    let maxPoints = null
    if (body.maxPoints) {
      maxPoints = parseInt(body.maxPoints)
      if (isNaN(maxPoints) || maxPoints <= 0 || maxPoints > 1000) {
        return NextResponse.json(
          { error: 'Max points must be between 1 and 1000' },
          { status: 400 }
        )
      }
    }

    // Validate due date (make optional)
    let dueDate = null
    if (body.dueDate) {
      dueDate = new Date(body.dueDate)
      if (isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: 'Due date must be a valid date' },
          { status: 400 }
        )
      }
    }

    // Verify user has access to the course
    let course
    if (session.user.role === 'ADMIN') {
      // Admins can create assignments for any course
      course = await prisma.course.findUnique({
        where: { id: body.courseId }
      })
    } else {
      // Instructors can only create assignments for their courses
      course = await prisma.course.findFirst({
        where: {
          id: body.courseId,
          instructorId: session.user.id
        }
      })
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or access denied' },
        { status: 404 }
      )
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        courseId: body.courseId,
        instructorId: course.instructorId || session.user.id,
        dueDate: dueDate,
        maxPoints: maxPoints,
        isPublished: body.isPublished !== undefined ? body.isPublished : true // Default to published
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

    // Create notifications for enrolled students (only if published)
    if (assignment.isPublished && assignment.dueDate) {
      try {
        await notifyStudentsOfNewAssignment(
          assignment.courseId,
          assignment.title,
          assignment.dueDate
        )
        console.log(`✅ Sent notifications for new assignment: ${assignment.title}`)
      } catch (notificationError) {
        console.error('Error sending notifications for assignment:', notificationError)
        // Don't fail the assignment creation if notifications fail
      }
    }

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      instructor: assignment.course.instructor,
      instructorId: assignment.course.instructorId,
      dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
      maxPoints: assignment.maxPoints,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      submissionCount: 0,
      isOverdue: false
    }

    return NextResponse.json(formattedAssignment, { status: 201 })

  } catch (error) {
    console.error('Error creating assignment:', error)
    
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
