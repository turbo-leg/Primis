'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  StarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Submission {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  assignmentId: string
  assignmentTitle: string
  courseId: string
  courseTitle: string
  content: string
  fileUrl?: string
  fileName?: string
  grade?: number
  maxPoints: number
  feedback?: string
  status: 'SUBMITTED' | 'GRADED' | 'LATE'
  submittedAt: string
  gradedAt?: string
  isLate: boolean
  daysLate?: number
}

interface Assignment {
  id: string
  title: string
  courseTitle: string
  dueDate: string
  maxPoints: number
  submissionCount: number
}

interface Course {
  id: string
  title: string
}

interface GradingModalData {
  submission: Submission
  isOpen: boolean
}

function InstructorSubmissionsContent() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gradingModal, setGradingModal] = useState<GradingModalData>({ submission: null as any, isOpen: false })
  const [gradingSubmission, setGradingSubmission] = useState(false)

  // Redirect if not authenticated or not instructor
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  if (status === 'authenticated' && session?.user?.role !== 'INSTRUCTOR') {
    redirect('/dashboard')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, selectedCourse, selectedAssignment, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Build submission URL with filters
      const submissionsUrl = new URL('/api/submissions', window.location.origin)
      if (selectedCourse !== 'all') {
        submissionsUrl.searchParams.append('courseId', selectedCourse)
      }
      if (selectedAssignment !== 'all') {
        submissionsUrl.searchParams.append('assignmentId', selectedAssignment)
      }
      if (statusFilter !== 'all') {
        submissionsUrl.searchParams.append('status', statusFilter)
      }

      const [submissionsResponse, assignmentsResponse, coursesResponse] = await Promise.all([
        fetch(submissionsUrl.toString()),
        fetch('/api/assignments'),
        fetch('/api/courses')
      ])

      if (!submissionsResponse.ok || !assignmentsResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [submissionsData, assignmentsData, coursesData] = await Promise.all([
        submissionsResponse.json(),
        assignmentsResponse.json(),
        coursesResponse.json()
      ])
      
      // Filter for instructor's courses and assignments
      const instructorCourses = coursesData.filter((course: any) => 
        course.instructorId === session?.user?.id
      ).map((course: any) => ({
        id: course.id,
        title: course.title
      }))
      
      const instructorAssignments = assignmentsData.filter((assignment: any) =>
        assignment.instructorId === session?.user?.id
      ).map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        courseTitle: assignment.courseTitle,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        submissionCount: assignment.submissionCount
      }))
      
      setSubmissions(submissionsData)
      setAssignments(instructorAssignments)
      setCourses(instructorCourses)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setSubmissions([])
      setAssignments([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const openGradingModal = (submission: Submission) => {
    setGradingModal({ submission, isOpen: true })
  }

  const closeGradingModal = () => {
    setGradingModal({ submission: null as any, isOpen: false })
  }

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      setGradingSubmission(true)
      
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, feedback })
      })

      if (!response.ok) {
        throw new Error('Failed to grade submission')
      }

      // Refresh data
      await fetchData()
      closeGradingModal()
      
    } catch (error) {
      console.error('Error grading submission:', error)
    } finally {
      setGradingSubmission(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (submission: Submission) => {
    if (submission.status === 'GRADED') return 'text-green-400'
    if (submission.isLate) return 'text-red-400'
    return 'text-yellow-400'
  }

  const getStatusText = (submission: Submission) => {
    if (submission.status === 'GRADED') return 'Graded'
    if (submission.isLate) return `Late (${submission.daysLate} days)`
    return 'Pending Review'
  }

  const calculateStats = () => {
    const total = submissions.length
    const graded = submissions.filter(s => s.status === 'GRADED').length
    const pending = submissions.filter(s => s.status === 'SUBMITTED').length
    const late = submissions.filter(s => s.isLate).length
    const avgGrade = submissions.filter(s => s.grade !== undefined)
      .reduce((sum, s) => sum + (s.grade || 0), 0) / Math.max(1, graded)

    return { total, graded, pending, late, avgGrade }
  }

  const stats = calculateStats()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-purple-400" />
                Student Submissions
              </h1>
              <p className="text-gray-300 mt-2">Review and grade student assignment submissions</p>
            </div>
            <Link
              href="/instructor/assignments"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <DocumentTextIcon className="h-5 w-5" />
              View Assignments
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value)
                setSelectedAssignment('all') // Reset assignment filter when course changes
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignments</option>
              {assignments
                .filter(assignment => selectedCourse === 'all' || assignment.courseTitle.includes(selectedCourse))
                .map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.courseTitle})
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="graded">Graded</option>
              <option value="late">Late Submissions</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Graded</p>
                <p className="text-2xl font-bold text-white">{stats.graded}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-gray-400 text-sm">Late</p>
                <p className="text-2xl font-bold text-white">{stats.late}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Avg Grade</p>
                <p className="text-2xl font-bold text-white">
                  {stats.graded > 0 ? `${stats.avgGrade.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Submissions Found</h3>
              <p className="text-gray-300 mb-6">
                {selectedCourse !== 'all' || selectedAssignment !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more submissions.'
                  : 'Students haven\'t submitted any assignments yet.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {submission.assignmentTitle}
                            </h3>
                            <span className={`text-sm font-medium ${getStatusColor(submission)}`}>
                              {getStatusText(submission)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>{submission.studentName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AcademicCapIcon className="h-4 w-4" />
                              <span>{submission.courseTitle}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span>Submitted: {formatDate(submission.submittedAt)}</span>
                            </div>
                          </div>

                          {submission.content && (
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                              {submission.content}
                            </p>
                          )}

                          {submission.fileName && (
                            <div className="flex items-center gap-2 text-sm text-blue-400 mb-3">
                              <DocumentTextIcon className="h-4 w-4" />
                              <span>{submission.fileName}</span>
                              {submission.fileUrl && (
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          )}

                          {submission.status === 'GRADED' && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <StarIcon className="h-4 w-4 text-green-400" />
                                <span className="text-green-300 font-medium">
                                  Grade: {submission.grade}/{submission.maxPoints} ({((submission.grade || 0) / submission.maxPoints * 100).toFixed(1)}%)
                                </span>
                              </div>
                              {submission.feedback && (
                                <p className="text-green-200 text-sm">
                                  <strong>Feedback:</strong> {submission.feedback}
                                </p>
                              )}
                              {submission.gradedAt && (
                                <p className="text-green-400 text-xs mt-1">
                                  Graded: {formatDate(submission.gradedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-white mb-1">
                            {submission.grade !== undefined ? `${submission.grade}/${submission.maxPoints}` : `--/${submission.maxPoints}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {submission.grade !== undefined 
                              ? `${((submission.grade / submission.maxPoints) * 100).toFixed(1)}%`
                              : 'Not Graded'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      Student: {submission.studentEmail}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openGradingModal(submission)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          submission.status === 'GRADED'
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                        {submission.status === 'GRADED' ? 'Update Grade' : 'Grade'}
                      </button>
                      
                      <button
                        onClick={() => router.push(`/instructor/submissions/${submission.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingModal.isOpen && gradingModal.submission && (
        <GradingModal
          submission={gradingModal.submission}
          onClose={closeGradingModal}
          onSubmit={handleGradeSubmission}
          loading={gradingSubmission}
        />
      )}
    </div>
  )
}

// Grading Modal Component
interface GradingModalProps {
  submission: Submission
  onClose: () => void
  onSubmit: (submissionId: string, grade: number, feedback: string) => void
  loading: boolean
}

function GradingModal({ submission, onClose, onSubmit, loading }: GradingModalProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {}
    const gradeNum = parseFloat(grade)

    if (!grade.trim()) {
      newErrors.grade = 'Grade is required'
    } else if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > submission.maxPoints) {
      newErrors.grade = `Grade must be between 0 and ${submission.maxPoints}`
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit(submission.id, gradeNum, feedback.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {submission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{submission.assignmentTitle}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div>Student: {submission.studentName}</div>
              <div>Course: {submission.courseTitle}</div>
              <div>Max Points: {submission.maxPoints}</div>
              <div>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Grade Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grade (0 - {submission.maxPoints}) *
            </label>
            <input
              type="number"
              min="0"
              max={submission.maxPoints}
              step="0.5"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value)
                if (errors.grade) setErrors(prev => ({ ...prev, grade: '' }))
              }}
              className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.grade ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Enter grade"
            />
            {errors.grade && (
              <p className="text-red-400 text-sm mt-1">{errors.grade}</p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide feedback to the student..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndSubmit}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  {submission.grade !== undefined ? 'Update Grade' : 'Submit Grade'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function SubmissionsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        <p className="text-white mt-4">Loading submissions...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function InstructorSubmissionsPage() {
  return (
    <Suspense fallback={<SubmissionsLoading />}>
      <InstructorSubmissionsContent />
    </Suspense>
  )
}