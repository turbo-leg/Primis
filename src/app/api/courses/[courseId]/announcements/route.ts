import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch announcements for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params

    // Check if user has access to this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: {
            userId: session.user.id,
            status: 'ACTIVE'
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      course.instructorId === session.user.id ||
      course.enrollments.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch announcements from database
    try {
      const announcements = await prisma.announcement.findMany({
        where: { 
          courseId,
          isDraft: false,
          publishedAt: { not: null }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: [
          { isImportant: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // Transform the data to match frontend expectations
      const transformedAnnouncements = announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority.toLowerCase(),
        createdAt: announcement.createdAt.toISOString(),
        author: {
          id: announcement.author.id,
          name: announcement.author.name || 'Unknown',
          role: announcement.author.role
        },
        isImportant: announcement.isImportant
      }))

      return NextResponse.json(transformedAnnouncements)
    } catch (dbError) {
      console.error('Database error fetching announcements:', dbError)
      // Return empty array if database table doesn't exist or other DB issues
      return NextResponse.json([])
    }

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new announcement (instructors only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params
    const body = await request.json()
    const { title, content, priority = 'normal', isImportant = false, isDraft = false } = body

    // Validate input
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check if user is instructor of this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const canCreate = 
      session.user.role === 'ADMIN' ||
      course.instructorId === session.user.id

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Only instructors can create announcements' },
        { status: 403 }
      )
    }

    // Convert priority to uppercase for database enum
    const priorityEnum = priority.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH'

    // Create announcement in database
    try {
      const announcement = await prisma.announcement.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          priority: priorityEnum,
          isImportant,
          isDraft,
          publishedAt: isDraft ? null : new Date(),
          courseId,
          authorId: session.user.id
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      })

      // Transform response to match frontend expectations
      const transformedAnnouncement = {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority.toLowerCase(),
        isImportant: announcement.isImportant,
        createdAt: announcement.createdAt.toISOString(),
        author: {
          id: announcement.author.id,
          name: announcement.author.name || 'Unknown',
          role: announcement.author.role
        }
      }

      return NextResponse.json(transformedAnnouncement, { status: 201 })
    } catch (dbError) {
      console.error('Database error creating announcement:', dbError)
      return NextResponse.json(
        { error: 'Failed to create announcement. Please ensure the database is properly set up.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}