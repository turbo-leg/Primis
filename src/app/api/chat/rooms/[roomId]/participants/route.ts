import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Participant {
  id: string
  name: string
  role: string
  image?: string
  isOnline: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Check if the user has access to this chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: true
      }
    })

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // Check access permissions
    const isAdmin = session.user.role === 'ADMIN'
    let hasAccess = isAdmin

    if (chatRoom.courseId && !hasAccess) {
      // Check if user is enrolled in the course or is the instructor
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: chatRoom.courseId
        }
      })

      const isInstructor = session.user.role === 'INSTRUCTOR' && 
                          chatRoom.course?.instructor === session.user.id

      hasAccess = !!enrollment || isInstructor
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get participants
    const participants: Participant[] = []

    if (chatRoom.courseId) {
      // Get course instructor
      const instructorId = chatRoom.course?.instructor
      if (instructorId) {
        const instructor = await prisma.user.findUnique({
          where: { id: instructorId },
          select: {
            id: true,
            name: true,
            role: true,
            image: true
          }
        })

        if (instructor) {
          participants.push({
            id: instructor.id,
            name: instructor.name || 'Unknown',
            role: instructor.role,
            image: instructor.image || undefined,
            isOnline: false
          })
        }
      }

      // Get enrolled students
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: chatRoom.courseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              image: true
            }
          }
        }
      })

      for (const enrollment of enrollments) {
        participants.push({
          id: enrollment.user.id,
          name: enrollment.user.name || 'Unknown',
          role: enrollment.user.role,
          image: enrollment.user.image || undefined,
          isOnline: false
        })
      }
    }

    // Add admins if they have access
    if (isAdmin) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          role: true,
          image: true
        }
      })

      for (const admin of admins) {
        if (!participants.find(p => p.id === admin.id)) {
          participants.push({
            id: admin.id,
            name: admin.name || 'Unknown',
            role: admin.role,
            image: admin.image || undefined,
            isOnline: false
          })
        }
      }
    }

    // Remove duplicates and sort by role and name
    const uniqueParticipants = participants.filter((participant, index, self) => 
      index === self.findIndex(p => p.id === participant.id)
    ).sort((a, b) => {
      // Sort order: ADMIN, INSTRUCTOR, STUDENT
      const roleOrder: { [key: string]: number } = { ADMIN: 0, INSTRUCTOR: 1, STUDENT: 2 }
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role]
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(uniqueParticipants)
  } catch (error) {
    console.error('Error fetching chat room participants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}
