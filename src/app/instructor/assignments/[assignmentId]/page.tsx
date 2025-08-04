'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

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
  submissions?: Submission[]
}

interface Submission {
  id: string
  studentId: string
  student: {
    id: string
    name: string
    email: string
  }
  content: string | null
  fileUrl: string | null
  fileName: string | null
  grade: number | null
  feedback: string | null
  status: string
  submittedAt: string
  gradedAt: string | null
}

interface AssignmentViewPageProps {
  params: Promise<{
    assignmentId: string
  }>
}

export default function AssignmentViewPage({ params }: AssignmentViewPageProps) {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  
  const [assignmentId, setAssignmentId] = useState<string>('')
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(({ assignmentId: paramAssignmentId }) => {
      setAssignmentId(paramAssignmentId)
    })
  }, [params])

  useEffect(() => {
    if (session?.user?.role !== 'INSTRUCTOR') {
      router.push('/dashboard')
      return
    }
    
    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId, session])

  const fetchAssignment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assignments/${assignmentId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Assignment not found')
        } else if (response.status === 403) {
          setError('You do not have permission to view this assignment')
        } else {
          setError('Failed to load assignment')
        }
        return
      }

      const data = await response.json()
      setAssignment(data)
    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/instructor/assignments?deleted=true')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      setError('Failed to delete assignment')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubmissionStats = () => {
    if (!assignment?.submissions) return { total: 0, graded: 0, pending: 0 }
    
    const total = assignment.submissions.length
    const graded = assignment.submissions.filter(s => s.grade !== null).length
    const pending = total - graded
    
    return { total, graded, pending }
  }

  if (session?.user?.role !== 'INSTRUCTOR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center">
        <div className="text-emerald-100 text-xl">Access denied. Instructors only.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center">
        <div className="text-emerald-100 text-xl">Loading assignment...</div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            href="/instructor/assignments"
            className="mt-4 inline-flex items-center text-emerald-300 hover:text-emerald-100"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Assignments
          </Link>
        </div>
      </div>
    )
  }

  if (!assignment) return null

  const stats = getSubmissionStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-green-700/50 backdrop-blur-sm border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/instructor/assignments"
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-emerald-100">{assignment.title}</h1>
              <p className="text-emerald-200 mt-2">Course: {assignment.courseName}</p>
            </div>
            <div className="flex items-center gap-3">
              {assignment.isPublished ? (
                <div className="flex items-center text-emerald-300 bg-emerald-700/30 px-3 py-1 rounded-full">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Published</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-300 bg-yellow-700/30 px-3 py-1 rounded-full">
                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Draft</span>
                </div>
              )}
              
              <Link
                href={`/instructor/assignments/${assignment.id}/edit`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </Link>
              
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Details */}
          <div className="lg:col-span-2">
            <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20 mb-6">
              <h2 className="text-xl font-semibold text-emerald-100 mb-4 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Assignment Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-300 mb-1">Description</label>
                  <div className="bg-emerald-700/20 rounded-lg p-4 text-emerald-100 whitespace-pre-wrap">
                    {assignment.description}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-1">Due Date</label>
                    <div className="bg-emerald-700/20 rounded-lg p-3 text-emerald-100 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      {formatDate(assignment.dueDate)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-1">Maximum Points</label>
                    <div className="bg-emerald-700/20 rounded-lg p-3 text-emerald-100">
                      {assignment.maxPoints || 'No points assigned'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
              <h2 className="text-xl font-semibold text-emerald-100 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Student Submissions
              </h2>
              
              {assignment.submissions && assignment.submissions.length > 0 ? (
                <div className="space-y-3">
                  {assignment.submissions.map((submission) => (
                    <div key={submission.id} className="bg-emerald-700/20 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-emerald-100">{submission.student.name}</h3>
                        <p className="text-sm text-emerald-300">{submission.student.email}</p>
                        <p className="text-xs text-emerald-400">
                          Submitted: {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {submission.grade !== null ? (
                          <div className="text-green-400 font-medium">
                            {submission.grade}/{assignment.maxPoints}
                          </div>
                        ) : (
                          <div className="text-yellow-400 text-sm">
                            Pending Review
                          </div>
                        )}
                        <div className="text-xs text-emerald-400">
                          {submission.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-emerald-300">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No submissions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-100 mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Statistics
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-emerald-300">Total Submissions:</span>
                  <span className="text-emerald-100 font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Graded:</span>
                  <span className="text-green-400 font-medium">{stats.graded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Pending:</span>
                  <span className="text-yellow-400 font-medium">{stats.pending}</span>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-100 mb-4">Assignment Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-emerald-300">Created:</span>
                  <div className="text-emerald-100">{formatDate(assignment.createdAt)}</div>
                </div>
                <div>
                  <span className="text-emerald-300">Last Updated:</span>
                  <div className="text-emerald-100">{formatDate(assignment.updatedAt)}</div>
                </div>
                <div>
                  <span className="text-emerald-300">Status:</span>
                  <div className={assignment.isPublished ? 'text-green-400' : 'text-yellow-400'}>
                    {assignment.isPublished ? 'Published' : 'Draft'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-100 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/instructor/submissions?assignmentId=${assignment.id}`}
                  className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                >
                  View All Submissions
                </Link>
                
                <Link
                  href={`/instructor/courses/${assignment.courseId}`}
                  className="block w-full bg-emerald-700/50 hover:bg-emerald-700/70 text-emerald-100 px-4 py-2 rounded-lg transition-colors text-center border border-emerald-500/30"
                >
                  View Course
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
