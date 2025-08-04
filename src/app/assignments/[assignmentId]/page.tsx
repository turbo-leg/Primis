'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import AssignmentSubmission from '@/components/assignments/AssignmentSubmission'

interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  courseName: string
  dueDate: string | null
  maxPoints: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function AssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentId, setAssignmentId] = useState<string | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(({ assignmentId }) => {
      setAssignmentId(assignmentId)
    })
  }, [params])

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  useEffect(() => {
    if (status === 'authenticated' && assignmentId) {
      fetchAssignment()
    }
  }, [status, assignmentId])

  const fetchAssignment = async () => {
    if (!assignmentId) return
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assignment')
      }
      const assignmentData = await response.json()
      setAssignment(assignmentData)
    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isInstructor = session?.user?.role === 'INSTRUCTOR'
  const isAdmin = session?.user?.role === 'ADMIN'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Assignment Not Found</h3>
          <p className="text-gray-300 mb-6">{error || 'The assignment you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                {assignment.title}
              </h1>
              <p className="text-gray-300 mt-2">
                Course: {assignment.courseName}
              </p>
            </div>
            
            {(isInstructor || isAdmin) && (
              <Link
                href={`/assignments/${assignment.id}/edit`}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Assignment
              </Link>
            )}
          </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignment.dueDate && (
              <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-gray-400 text-sm">Due Date</p>
                  <p className="text-white font-medium">{formatDate(assignment.dueDate)}</p>
                </div>
              </div>
            )}
            
            {assignment.maxPoints && (
              <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Max Points</p>
                  <p className="text-white font-medium">{assignment.maxPoints}</p>
                </div>
              </div>
            )}
            
            <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
              <UserGroupIcon className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-white font-medium">
                  {assignment.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Assignment Description */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            Assignment Description
          </h2>
          <div className="text-gray-300 whitespace-pre-wrap">
            {assignment.description}
          </div>
        </div>

        {/* Assignment Submission Section */}
        {assignmentId && (
          <AssignmentSubmission
            assignmentId={assignmentId}
            assignmentTitle={assignment.title}
            dueDate={assignment.dueDate || undefined}
            maxPoints={assignment.maxPoints || undefined}
            onSubmissionSuccess={() => {
              // Optionally refresh assignment data or show success message
              console.log('Assignment submitted successfully')
            }}
          />
        )}

        {/* Assignment Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Assignment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="text-white ml-2">{formatDate(assignment.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-white ml-2">{formatDate(assignment.updatedAt)}</span>
            </div>
            <div>
              <span className="text-gray-400">Course ID:</span>
              <span className="text-white ml-2">{assignment.courseId}</span>
            </div>
            <div>
              <span className="text-gray-400">Assignment ID:</span>
              <span className="text-white ml-2">{assignment.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}