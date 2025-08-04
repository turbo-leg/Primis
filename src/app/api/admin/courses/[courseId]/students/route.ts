import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get students enrolled in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId } = await params

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const students = enrollments.map(enrollment => ({
      id: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      phone: enrollment.user.phone,
      enrolledAt: enrollment.createdAt.toISOString(),
      status: enrollment.status,
      progress: Math.floor(Math.random() * 100), // Mock progress data
      lastActivity: enrollment.updatedAt.toISOString()
    }))

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a student to the course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId } = await params
    const { studentId, studentEmail } = await request.json()

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    let student
    if (studentId) {
      // Find student by ID
      student = await prisma.user.findUnique({
        where: { id: studentId, role: 'STUDENT' }
      })
    } else if (studentEmail) {
      // Find student by email
      student = await prisma.user.findUnique({
        where: { email: studentEmail, role: 'STUDENT' }
      })
    } else {
      return NextResponse.json({ error: 'Student ID or email required' }, { status: 400 })
    }

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Student is already enrolled in this course' }, { status: 400 })
    }

    // Check course capacity
    const currentEnrollments = await prisma.enrollment.count({
      where: { courseId, status: 'ACTIVE' }
    })

    if (currentEnrollments >= course.capacity) {
      return NextResponse.json({ error: 'Course is at full capacity' }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: courseId,
        status: 'ACTIVE'
      },
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
      id: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      phone: enrollment.user.phone,
      enrolledAt: enrollment.createdAt.toISOString(),
      status: enrollment.status
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
