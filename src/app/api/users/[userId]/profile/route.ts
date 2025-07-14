import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            chatMessages: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Format response (hide sensitive information based on role and relationship)
    const publicProfile = {
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
      memberSince: user.createdAt,
      stats: {
        enrollments: user._count.enrollments,
        messages: user._count.chatMessages
      }
    }

    // Show email and phone only to admins or the user themselves
    if (session.user.role === 'ADMIN' || session.user.id === userId) {
      return NextResponse.json({
        ...publicProfile,
        email: user.email,
        phone: user.phone
      })
    }

    return NextResponse.json(publicProfile)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
