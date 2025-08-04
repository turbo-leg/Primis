'use client'

import { useState, useEffect, JSX } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  grade: number | null
  feedback: string | null
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE'
  submittedAt: string
  student: {
    id: string
    name: string
    email: string
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  maxPoints: number
  dueDate: string
}

interface SubmissionsPageProps {
  params: Promise<{
    assignmentId: string
  }>
}

export default function AssignmentSubmissionsPage({ params }: SubmissionsPageProps) {
  const { data: session } = useSession()
  const [assignmentId, setAssignmentId] = useState<string>('')
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  // Resolve params
  useEffect(() => {
    params.then(({ assignmentId: paramAssignmentId }) => {
      setAssignmentId(paramAssignmentId)
    })
  }, [params])
  const [grading, setGrading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (session?.user?.id && assignmentId) {
      fetchData()
    }
  }, [session, assignmentId])

  const fetchData = async () => {
    try {
      // Fetch assignment details and submissions
      const [assignmentRes, submissionsRes] = await Promise.all([
        fetch(`/api/assignments/${assignmentId}`),
        fetch(`/api/submissions?assignmentId=${assignmentId}`)
      ])

      if (assignmentRes.ok) {
        setAssignment(await assignmentRes.json())
      }
      
      if (submissionsRes.ok) {
        setSubmissions(await submissionsRes.json())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async (submissionId: string, grade: number, feedback: string) => {
    setGrading(prev => ({ ...prev, [submissionId]: true }))
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, feedback }),
      })

      if (response.ok) {
        // Refresh submissions
        await fetchData()
      } else {
        alert('Error grading submission')
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('Error grading submission')
    } finally {
      setGrading(prev => ({ ...prev, [submissionId]: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'SUBMITTED':
        return <ClockIcon className="h-5 w-5 text-yellow-400" />
      case 'LATE':
        return <XCircleIcon className="h-5 w-5 text-red-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED':
        return 'bg-green-600/20 text-green-300 border-green-500/30'
      case 'SUBMITTED':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'
      case 'LATE':
        return 'bg-red-600/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30'
    }
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
        <div className="animate-pulse text-emerald-100 text-xl">Loading submissions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-green-700/50 backdrop-blur-sm border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link
              href="/instructor/courses"
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-emerald-100">
                {assignment ? `Grade: ${assignment.title}` : 'Grade Assignment'}
              </h1>
              <p className="text-emerald-200 mt-2">
                {assignment && (
                  <>
                    Max Points: {assignment.maxPoints} • 
                    Due: {new Date(assignment.dueDate).toLocaleDateString()} •
                    {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-emerald-100 mb-2">No submissions yet</h3>
            <p className="text-emerald-300">Students haven't submitted their work for this assignment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                assignment={assignment}
                onGrade={handleGrade}
                isGrading={grading[submission.id] || false}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SubmissionCardProps {
  submission: Submission
  assignment: Assignment | null
  onGrade: (submissionId: string, grade: number, feedback: string) => void
  isGrading: boolean
  getStatusIcon: (status: string) => JSX.Element
  getStatusColor: (status: string) => string
}

function SubmissionCard({ submission, assignment, onGrade, isGrading, getStatusIcon, getStatusColor }: SubmissionCardProps) {
  const [showGradingForm, setShowGradingForm] = useState(false)
  const [grade, setGrade] = useState(submission.grade || 0)
  const [feedback, setFeedback] = useState(submission.feedback || '')

  const handleSubmitGrade = () => {
    onGrade(submission.id, grade, feedback)
    setShowGradingForm(false)
  }

  return (
    <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserIcon className="h-8 w-8 text-emerald-300" />
          <div>
            <h3 className="text-lg font-semibold text-emerald-100">{submission.student.name}</h3>
            <p className="text-emerald-300 text-sm">{submission.student.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(submission.status)}`}>
            <div className="flex items-center gap-1">
              {getStatusIcon(submission.status)}
              {submission.status}
            </div>
          </span>
          {submission.grade !== null && (
            <span className="text-emerald-100 font-semibold">
              {submission.grade}/{assignment?.maxPoints}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-emerald-300">
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4" />
            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
          </div>
        </div>

        {submission.content && (
          <div>
            <h4 className="text-emerald-100 font-medium mb-2">Written Response:</h4>
            <div className="bg-emerald-900/30 rounded-lg p-4 text-emerald-200">
              {submission.content}
            </div>
          </div>
        )}

        {submission.fileUrl && (
          <div>
            <h4 className="text-emerald-100 font-medium mb-2">Attached File:</h4>
            <Link
              href={submission.fileUrl}
              target="_blank"
              className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              {submission.fileName || 'Download File'}
            </Link>
          </div>
        )}

        {submission.feedback && (
          <div>
            <h4 className="text-emerald-100 font-medium mb-2">Instructor Feedback:</h4>
            <div className="bg-emerald-900/30 rounded-lg p-4 text-emerald-200">
              {submission.feedback}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          {!showGradingForm ? (
            <button
              onClick={() => setShowGradingForm(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <AcademicCapIcon className="h-4 w-4" />
              {submission.grade !== null ? 'Update Grade' : 'Grade Submission'}
            </button>
          ) : (
            <div className="bg-emerald-900/30 rounded-lg p-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-emerald-100 text-sm font-medium mb-2">
                    Grade (out of {assignment?.maxPoints})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment?.maxPoints}
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-emerald-100 text-sm font-medium mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Provide feedback to the student..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowGradingForm(false)}
                  className="px-4 py-2 border border-emerald-500/30 text-emerald-200 rounded-lg hover:bg-emerald-800/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGrade}
                  disabled={isGrading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {isGrading ? 'Grading...' : 'Submit Grade'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
