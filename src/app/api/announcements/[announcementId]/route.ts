import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Update announcement (publish draft, update content, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { announcementId } = await params
    const body = await request.json()
    const { title, content, priority, isImportant, isDraft } = body

    // Find the announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { course: true }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Check permissions
    const canEdit = 
      session.user.role === 'ADMIN' ||
      announcement.authorId === session.user.id ||
      announcement.course.instructorId === session.user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (priority !== undefined) updateData.priority = priority.toUpperCase()
    if (isImportant !== undefined) updateData.isImportant = isImportant
    if (isDraft !== undefined) {
      updateData.isDraft = isDraft
      if (!isDraft && !announcement.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    // Update announcement
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: updateData,
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

    return NextResponse.json(updatedAnnouncement)

  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { announcementId } = await params

    // Find the announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { course: true }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Check permissions
    const canDelete = 
      session.user.role === 'ADMIN' ||
      announcement.authorId === session.user.id ||
      announcement.course.instructorId === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete announcement
    await prisma.announcement.delete({
      where: { id: announcementId }
    })

    return NextResponse.json({ message: 'Announcement deleted successfully' })

  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}