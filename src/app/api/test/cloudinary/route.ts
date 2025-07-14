import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export async function GET() {
  try {
    console.log('🔍 Testing Cloudinary configuration...')
    
    // Check environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('Environment variables:')
    console.log('CLOUDINARY_CLOUD_NAME:', cloudName)
    console.log('CLOUDINARY_API_KEY:', apiKey)
    console.log('CLOUDINARY_API_SECRET:', apiSecret ? `${apiSecret.substring(0, 4)}...` : 'undefined')

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Missing Cloudinary environment variables',
        config: {
          cloudName: !!cloudName,
          apiKey: !!apiKey,
          apiSecret: !!apiSecret
        }
      })
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Test Cloudinary connection
    const result = await cloudinary.api.ping()
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary connection successful',
      ping: result,
      config: {
        cloudName: cloudName,
        apiKey: apiKey,
        apiSecret: `${apiSecret.substring(0, 4)}...`
      }
    })

  } catch (error) {
    console.error('❌ Cloudinary test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Cloudinary connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing'
      }
    }, { status: 500 })
  }
}
