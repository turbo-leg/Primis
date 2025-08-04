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

    // Get all children for this parent (using raw query until schema is migrated)
    const children = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        "createdAt", 
        "updatedAt"
      FROM users 
      WHERE "parentId" = ${session.user.id} AND role = 'STUDENT'
      ORDER BY name ASC
    ` as any[]

    // Get enrollment count for each child
    const childrenWithEnrollments = await Promise.all(
      children.map(async (child) => {
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            userId: child.id,
            status: 'ACTIVE'
          }
        })

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          phone: child.phone,
          createdAt: child.createdAt,
          enrollmentCount
        }
      })
    )

    return NextResponse.json({ children: childrenWithEnrollments })
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json({ error: 'Failed to fetch children data' }, { status: 500 })
  }
}

// Add a child to parent account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user is a parent
    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    const body = await request.json()
    const { studentEmail } = body

    if (!studentEmail) {
      return NextResponse.json({ error: 'Student email is required' }, { status: 400 })
    }

    // Find the student
    const student = await prisma.user.findUnique({
      where: {
        email: studentEmail,
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 400 })
    }

    // Check if student already has a parent
    const existingParent = await prisma.$queryRaw`
      SELECT "parentId" FROM users WHERE id = ${student.id}
    ` as any[]

    if (existingParent[0]?.parentId) {
      return NextResponse.json({ error: 'Student already has a parent assigned' }, { status: 400 })
    }

    // Assign parent to student (using raw query until schema is migrated)
    await prisma.$executeRaw`
      UPDATE users SET "parentId" = ${session.user.id} WHERE id = ${student.id}
    `

    return NextResponse.json({ 
      message: 'Child added successfully',
      child: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    })
  } catch (error) {
    console.error('Error adding child:', error)
    return NextResponse.json({ error: 'Failed to add child' }, { status: 500 })
  }
}
