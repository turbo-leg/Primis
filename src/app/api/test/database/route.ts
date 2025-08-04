import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test if the Assignment and Submission models exist
    const assignmentCount = await prisma.assignment.count()
    const submissionCount = await prisma.submission.count()
    
    return NextResponse.json({
      message: 'Database models are working',
      assignments: assignmentCount,
      submissions: submissionCount,
      models: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
