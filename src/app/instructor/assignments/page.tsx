'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  DocumentTextIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  courseTitle: string
  instructor: string
  instructorId: string
  dueDate: string
  maxPoints: number
  isActive: boolean
  createdAt: string
  submissionCount: number
  isOverdue: boolean
}

interface Course {
  id: string
  title: string
}

function InstructorAssignmentsContent() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Check for success message from URL params
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccessMessage(true)
      // Clear the URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [searchParams])

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
  }, [status, selectedCourse, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch assignments
      const assignmentsUrl = new URL('/api/assignments', window.location.origin)
      if (selectedCourse !== 'all') {
        assignmentsUrl.searchParams.append('courseId', selectedCourse)
      }
      if (statusFilter !== 'all') {
        assignmentsUrl.searchParams.append('status', statusFilter)
      }

      const [assignmentsResponse, coursesResponse] = await Promise.all([
        fetch(assignmentsUrl.toString()),
        fetch('/api/courses')
      ])

      if (!assignmentsResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const assignmentsData = await assignmentsResponse.json()
      const coursesData = await coursesResponse.json()
      
      // Filter courses where current user is instructor
      const instructorCourses = coursesData.filter((course: any) => 
        course.instructorId === session?.user?.id
      ).map((course: any) => ({
        id: course.id,
        title: course.title
      }))
      
      setAssignments(assignmentsData)
      setCourses(instructorCourses)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setAssignments([])
      setCourses([])
    } finally {
      setLoading(false)
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

  const getStatusColor = (assignment: Assignment) => {
    if (assignment.isOverdue) return 'text-red-400'
    if (new Date(assignment.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return 'text-yellow-400' // Due within a week
    }
    return 'text-green-400'
  }

  const getStatusText = (assignment: Assignment) => {
    if (assignment.isOverdue) return 'Overdue'
    if (new Date(assignment.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return 'Due Soon'
    }
    return 'Active'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading assignments...</p>
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
                <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                My Assignments
              </h1>
              <p className="text-gray-300 mt-2">Manage and track your course assignments</p>
            </div>
            <Link
              href="/instructor/assignments/new"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Create Assignment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-300 font-medium">Assignment created successfully!</p>
              <p className="text-green-400 text-sm">Your new assignment is now available to students.</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-400 hover:text-green-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Assignments</p>
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-white">
                  {assignments.filter(a => !a.isOverdue).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Due Soon</p>
                <p className="text-2xl font-bold text-white">
                  {assignments.filter(a => 
                    !a.isOverdue && 
                    new Date(a.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">
                  {assignments.reduce((sum, a) => sum + a.submissionCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Assignments Found</h3>
              <p className="text-gray-300 mb-6">
                {selectedCourse !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or create your first assignment.'
                  : 'Create your first assignment to get started.'
                }
              </p>
              <Link
                href="/instructor/assignments/new"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="h-4 w-4" />
                              {assignment.courseTitle}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4" />
                              {assignment.submissionCount} submissions
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getStatusColor(assignment)}`}>
                            {getStatusText(assignment)}
                          </div>
                          <div className="text-lg font-bold text-white">
                            {assignment.maxPoints} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      Created: {formatDate(assignment.createdAt)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/instructor/assignments/${assignment.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/assignments/${assignment.id}/edit`)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this assignment?')) {
                            // Handle delete
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function AssignmentsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        <p className="text-white mt-4">Loading assignments...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function InstructorAssignmentsPage() {
  return (
    <Suspense fallback={<AssignmentsLoading />}>
      <InstructorAssignmentsContent />
    </Suspense>
  )
}