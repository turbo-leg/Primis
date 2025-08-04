import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session,
      user: session?.user,
      role: session?.user?.role,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json({ error: 'Session check failed', details: error }, { status: 500 })
  }
}
