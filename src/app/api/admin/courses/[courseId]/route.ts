import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Update course (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId } = await params
    const body = await request.json()
    const {
      title,
      description,
      instructor,
      duration,
      durationUnit,
      price,
      level,
      capacity,
      startDate,
      schedule
    } = body

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Course description is required' }, { status: 400 })
    }

    if (!instructor?.trim()) {
      return NextResponse.json({ error: 'Instructor name is required' }, { status: 400 })
    }

    if (!duration || duration < 1) {
      return NextResponse.json({ error: 'Duration must be at least 1' }, { status: 400 })
    }

    if (!durationUnit || !['weeks', 'months'].includes(durationUnit)) {
      return NextResponse.json({ error: 'Duration unit must be weeks or months' }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    if (!schedule || !schedule.days || schedule.days.length === 0) {
      return NextResponse.json({ error: 'Schedule with days is required' }, { status: 400 })
    }

    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
      return NextResponse.json({ error: 'Invalid course level' }, { status: 400 })
    }

    if (price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 })
    }

    if (capacity < 1) {
      return NextResponse.json({ error: 'Capacity must be at least 1' }, { status: 400 })
    }

    // Check if reducing capacity below current enrollment
    const currentEnrollments = await prisma.enrollment.count({
      where: { courseId }
    })

    if (capacity < currentEnrollments) {
      return NextResponse.json({ 
        error: `Cannot reduce capacity below current enrollment count (${currentEnrollments})` 
      }, { status: 400 })
    }

    // Convert day names to numbers for database storage
    const dayNameToNumber: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }

    const scheduleDays = schedule.days.map((day: string) => {
      const dayNumber = dayNameToNumber[day.toLowerCase()]
      if (dayNumber === undefined) {
        throw new Error(`Invalid day: ${day}`)
      }
      return dayNumber
    })

    // Update course in a transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Delete existing schedules
      await tx.schedule.deleteMany({
        where: { courseId }
      })

      // Update course and create new schedules
      const course = await tx.course.update({
        where: { id: courseId },
        data: {
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          duration: parseInt(duration),
          durationUnit: durationUnit,
          price: parseFloat(price),
          level,
          capacity: parseInt(capacity),
          startDate: new Date(startDate),
          schedules: {
            create: scheduleDays.map((dayOfWeek: number) => ({
              dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isActive: true
            }))
          }
        },
        include: {
          schedules: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              isActive: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      })

      return course
    })

    // Update the chat room name if the course title changed
    await prisma.chatRoom.updateMany({
      where: { courseId: courseId },
      data: {
        name: `${updatedCourse.title} - Discussion`
      }
    })

    // Helper function to convert day number to name
    const dayNumberToName = (dayNumber: number): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[dayNumber] || 'Unknown'
    }

    const formattedCourse = {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      instructor: updatedCourse.instructor,
      duration: updatedCourse.duration,
      durationUnit: updatedCourse.durationUnit,
      price: updatedCourse.price,
      level: updatedCourse.level,
      capacity: updatedCourse.capacity,
      enrolledCount: updatedCourse._count.enrollments,
      startDate: updatedCourse.startDate,
      schedules: updatedCourse.schedules.map((schedule: any) => ({
        id: schedule.id,
        dayOfWeek: dayNumberToName(schedule.dayOfWeek),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      })),
      createdAt: updatedCourse.createdAt.toISOString(),
      updatedAt: updatedCourse.updatedAt.toISOString()
    }

    return NextResponse.json(formattedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE - Delete course (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId } = await params
    const url = new URL(request.url)
    const forceDelete = url.searchParams.get('force') === 'true'

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignments: {
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                submissions: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            documents: true,
            chatRooms: true,
            assignments: true
          }
        }
      }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // If force delete is not enabled and there are enrollments, return detailed info
    if (!forceDelete && existingCourse._count.enrollments > 0) {
      const totalSubmissions = existingCourse.assignments.reduce((sum, assignment) => 
        sum + assignment._count.submissions, 0
      )

      return NextResponse.json({ 
        error: 'Cannot delete course with active enrollments',
        details: {
          enrolledStudents: existingCourse._count.enrollments,
          documents: existingCourse._count.documents,
          chatRooms: existingCourse._count.chatRooms,
          assignments: existingCourse._count.assignments,
          totalSubmissions,
          students: existingCourse.enrollments.map((enrollment: any) => ({
            id: enrollment.user.id,
            name: enrollment.user.name,
            email: enrollment.user.email,
            enrolledAt: enrollment.createdAt
          }))
        },
        canForceDelete: true
      }, { status: 400 })
    }

    // Begin transaction to delete course and all related data
    await prisma.$transaction(async (tx: any) => {
      // First, delete submissions related to assignments in this course
      await tx.submission.deleteMany({
        where: {
          assignment: {
            courseId: courseId
          }
        }
      })

      // Delete assignment files
      await tx.assignmentFile.deleteMany({
        where: {
          assignment: {
            courseId: courseId
          }
        }
      })

      // Delete assignments (this should cascade, but let's be explicit)
      await tx.assignment.deleteMany({
        where: { courseId }
      })

      // Delete chat messages in course chat rooms
      await tx.chatMessage.deleteMany({
        where: {
          chatRoom: {
            courseId: courseId
          }
        }
      })

      // Delete related chat rooms
      await tx.chatRoom.deleteMany({
        where: { courseId }
      })

      // Set documents courseId to null (they can exist without a course)
      await tx.document.updateMany({
        where: { courseId },
        data: { courseId: null }
      })

      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: { courseId }
      })

      // Finally delete the course
      await tx.course.delete({
        where: { id: courseId }
      })
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    })

    console.log(`✅ Course deleted successfully: ${courseId}`)
    
    return NextResponse.json({ 
      message: 'Course deleted successfully',
      courseId,
      deletedEnrollments: existingCourse._count.enrollments,
      updatedDocuments: existingCourse._count.documents
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}