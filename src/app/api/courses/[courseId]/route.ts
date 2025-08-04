import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params
    const session = await getServerSession(authOptions)
    
    // Get course from database with assignments
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        assignments: {
          where: session?.user?.role === 'INSTRUCTOR' || session?.user?.role === 'ADMIN' 
            ? {} // Instructors and admins see all assignments
            : { isPublished: true }, // Students only see published assignments
          include: {
            submissions: session?.user?.id ? {
              where: { studentId: session.user.id }
            } : false
          },
          orderBy: { createdAt: 'desc' }
        },
        instructorUser: {
          select: { name: true, email: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Debug logging
    console.log('Course found:', course.id, course.title)
    console.log('Session user:', session?.user?.id, session?.user?.role)
    console.log('Raw assignments from DB:', course.assignments?.length || 0)
    console.log('Assignment details:', course.assignments?.map(a => ({ 
      id: a.id, 
      title: a.title, 
      courseId: a.courseId, 
      isPublished: a.isPublished 
    })))

    // Check enrollment status for students
    let isEnrolled = false
    if (session?.user?.role === 'STUDENT' && session?.user?.id) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
          status: 'ACTIVE'
        }
      })
      isEnrolled = !!enrollment
    }

    // Transform assignments to match the expected format
    const assignments = course.assignments.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.toISOString() || '',
      maxPoints: assignment.maxPoints || 0,
      isActive: assignment.isPublished,
      createdAt: assignment.createdAt.toISOString(),
      submission: assignment.submissions && assignment.submissions.length > 0 ? {
        id: assignment.submissions[0].id,
        content: assignment.submissions[0].content || '',
        fileUrl: assignment.submissions[0].fileUrl || '',
        fileName: assignment.submissions[0].fileName || '',
        grade: assignment.submissions[0].grade,
        feedback: assignment.submissions[0].feedback || '',
        status: assignment.submissions[0].status,
        submittedAt: assignment.submissions[0].submittedAt.toISOString(),
        gradedAt: assignment.submissions[0].gradedAt?.toISOString() || null
      } : null
    }))

    // Mock schedules for now (can be replaced with real schedule data when available)
    const schedules = [
      {
        id: "1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        room: "Room 101"
      },
      {
        id: "2",
        dayOfWeek: 3,
        startTime: "09:00", 
        endTime: "10:30",
        room: "Room 101"
      }
    ]

    const courseWithExtras = {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructorUser?.name || course.instructor || 'Unknown',
      level: course.level,
      startDate: course.startDate.toISOString(),
      isEnrolled,
      assignments,
      schedules
    }

    return NextResponse.json(courseWithExtras)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
