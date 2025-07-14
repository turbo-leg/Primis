import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST - Upload profile image (local storage fallback)
export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Profile image upload started (local storage)')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.id)

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    console.log('✅ File received:', file.name, file.type, file.size, 'bytes')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    console.log('✅ File validation passed')

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile-images')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `profile-${session.user.id}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    console.log('💾 Saving to:', filePath)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log('✅ File saved successfully')

    // Create URL for the image
    const imageUrl = `/uploads/profile-images/${fileName}`

    // Update user's profile image in database
    console.log('💾 Updating database...')
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    })

    console.log('✅ Database updated successfully')

    return NextResponse.json({
      message: 'Profile image updated successfully',
      user: updatedUser,
      imageUrl: imageUrl
    })

  } catch (error) {
    console.error('❌ Profile image upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload profile image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove profile image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user's profile image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'Profile image removed successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error removing profile image:', error)
    return NextResponse.json({ 
      error: 'Failed to remove profile image' 
    }, { status: 500 })
  }
}
