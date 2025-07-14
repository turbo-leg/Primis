import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST - Upload profile image
export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Profile image upload started')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.id)

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary configuration missing')
      return NextResponse.json({ 
        error: 'Server configuration error - Cloudinary not configured properly' 
      }, { status: 500 })
    }

    console.log('✅ Cloudinary config found')

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('✅ File converted to buffer, size:', buffer.length)

    // Upload to Cloudinary
    console.log('🚀 Starting Cloudinary upload...')
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'profile-images',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
          public_id: `profile-${session.user.id}`,
          overwrite: true
        },
        (error, result) => {
          if (error) {
            console.log('❌ Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('✅ Cloudinary upload success:', result?.secure_url)
            resolve(result)
          }
        }
      ).end(buffer)
    }) as any

    console.log('✅ Image uploaded to Cloudinary')

    // Update user's profile image in database
    console.log('💾 Updating database...')
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResponse.secure_url },
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
      imageUrl: uploadResponse.secure_url
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

    // Get current user to check if they have an image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })

    // Remove image from Cloudinary if it exists
    if (user?.image) {
      try {
        // Extract public_id from URL
        const publicId = `profile-images/profile-${session.user.id}`
        await cloudinary.uploader.destroy(publicId)
      } catch (cloudinaryError) {
        console.error('Error removing image from Cloudinary:', cloudinaryError)
        // Continue with database update even if Cloudinary deletion fails
      }
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
