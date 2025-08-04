import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a student from the course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId, studentId } = await params

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Student enrollment not found' }, { status: 404 })
    }

    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      }
    })

    return NextResponse.json({ 
      message: 'Student removed successfully',
      studentName: enrollment.user.name,
      studentEmail: enrollment.user.email
    })
  } catch (error) {
    console.error('Error removing student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update student enrollment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId, studentId } = await params
    const { status } = await request.json()

    if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Student enrollment not found' }, { status: 404 })
    }

    // Update enrollment status
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedEnrollment.user.id,
      name: updatedEnrollment.user.name,
      email: updatedEnrollment.user.email,
      phone: updatedEnrollment.user.phone,
      enrolledAt: updatedEnrollment.createdAt.toISOString(),
      status: updatedEnrollment.status
    })
  } catch (error) {
    console.error('Error updating student status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
