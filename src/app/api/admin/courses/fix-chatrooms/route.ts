import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create chat rooms for courses that don't have them (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find courses without chat rooms
    const coursesWithoutChatRooms = await prisma.course.findMany({
      where: {
        chatRooms: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true
      }
    })

    let created = 0
    const results = []

    for (const course of coursesWithoutChatRooms) {
      try {
        const chatRoom = await prisma.chatRoom.create({
          data: {
            name: `${course.title} - Discussion`,
            courseId: course.id,
            isPublic: false
          }
        })
        
        results.push({
          courseId: course.id,
          courseTitle: course.title,
          chatRoomId: chatRoom.id,
          status: 'created'
        })
        created++
      } catch (error) {
        results.push({
          courseId: course.id,
          courseTitle: course.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Created ${created} chat rooms out of ${coursesWithoutChatRooms.length} courses`,
      created,
      total: coursesWithoutChatRooms.length,
      results
    })

  } catch (error) {
    console.error('Error creating chat rooms:', error)
    return NextResponse.json({ error: 'Failed to create chat rooms' }, { status: 500 })
  }
}

// GET - Check which courses don't have chat rooms (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const coursesWithoutChatRooms = await prisma.course.findMany({
      where: {
        chatRooms: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    const totalCourses = await prisma.course.count()
    const coursesWithChatRooms = await prisma.course.count({
      where: {
        chatRooms: {
          some: {}
        }
      }
    })

    return NextResponse.json({
      totalCourses,
      coursesWithChatRooms,
      coursesWithoutChatRooms: coursesWithoutChatRooms.length,
      missingChatRooms: coursesWithoutChatRooms
    })

  } catch (error) {
    console.error('Error checking chat rooms:', error)
    return NextResponse.json({ error: 'Failed to check chat rooms' }, { status: 500 })
  }
}
