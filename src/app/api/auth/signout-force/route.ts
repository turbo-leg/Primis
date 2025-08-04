import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    // This will help clear the session
    return NextResponse.json({ message: 'Signed out' }, {
      headers: {
        'Set-Cookie': [
          'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
          '__Secure-next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax'
        ].join(', ')
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}
