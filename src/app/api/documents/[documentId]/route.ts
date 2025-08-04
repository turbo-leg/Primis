import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    console.log('🗑️ Document delete started for ID:', documentId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ No valid session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.id)

    if (!documentId) {
      console.log('❌ No document ID provided')
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    console.log('✅ User authenticated:', session.user.id)

    // Get the document to check ownership and existence
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: {
            id: true,
            role: true,
          }
        }
      }
    })

    if (!document) {
      console.log('❌ Document not found:', documentId)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    console.log('📄 Document found:', document.title)

    // Check if user owns the document or has permission to delete
    const canDelete = (
      document.uploader?.id === session.user.id || 
      session.user.role === 'INSTRUCTOR' || 
      session.user.role === 'ADMIN'
    )

    if (!canDelete) {
      console.log('❌ User does not have permission to delete document')
      return NextResponse.json({ error: 'You do not have permission to delete this document' }, { status: 403 })
    }

    console.log('✅ User has permission to delete')

    // For development, we just log what would be deleted
    // In production, you would delete the actual file from storage
    console.log('🗂️ Would delete file from storage:', document.fileUrl)

    console.log('💾 Deleting from database...')

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    console.log('✅ Document deleted successfully')

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      documentId: documentId 
    })

  } catch (error) {
    console.error('❌ Delete error:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      // Handle specific Prisma errors
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete document. Please try again.' }, 
      { status: 500 }
    )
  }
}
