import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test that all models are accessible
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const assignmentCount = await prisma.assignment.count()
    const submissionCount = await prisma.submission.count()
    const documentCount = await prisma.document.count()
    
    return NextResponse.json({
      message: 'All models are working!',
      counts: {
        users: userCount,
        courses: courseCount,
        assignments: assignmentCount,
        submissions: submissionCount,
        documents: documentCount
      }
    })
  } catch (error) {
    console.error('Error testing models:', error)
    return NextResponse.json({ error: 'Model test failed', details: error }, { status: 500 })
  }
}
