'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string | null
  maxPoints: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  submissionCount: number
  gradedCount: number
}

interface Course {
  id: string
  title: string
}

export default function ManageAssignmentsPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'OVERDUE'>('ALL')
  const [deletingAssignment, setDeletingAssignment] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (courseId) {
      fetchCourseAndAssignments()
    }
  }, [courseId])

  const fetchCourseAndAssignments = async () => {
    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/admin/courses/list`)
      const courses = await courseResponse.json()
      const foundCourse = courses.find((c: Course) => c.id === courseId)
      setCourse(foundCourse || null)

      // Fetch assignments
      const assignmentsResponse = await fetch(`/api/assignments?courseId=${courseId}`)
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
      } else {
        // Mock data for development
        setAssignments([
          {
            id: 'assignment1',
            title: 'Introduction to Calculus',
            description: 'Complete problems 1-20 from Chapter 3. Show all work and explain your reasoning.',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxPoints: 100,
            isPublished: true,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            submissionCount: 8,
            gradedCount: 5
          },
          {
            id: 'assignment2',
            title: 'Linear Algebra Project',
            description: 'Create a presentation on eigenvalues and eigenvectors with real-world applications.',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            maxPoints: 150,
            isPublished: true,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            submissionCount: 3,
            gradedCount: 0
          },
          {
            id: 'assignment3',
            title: 'Differential Equations Worksheet',
            description: 'Practice problems for differential equations. This is a draft assignment.',
            dueDate: null,
            maxPoints: 50,
            isPublished: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            submissionCount: 0,
            gradedCount: 0
          },
          {
            id: 'assignment4',
            title: 'Overdue Assignment',
            description: 'This assignment is overdue for demonstration.',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            maxPoints: 75,
            isPublished: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            submissionCount: 12,
            gradedCount: 12
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching course and assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone and will delete all submissions.`)) {
      return
    }

    setDeletingAssignment(assignmentId)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId))
        alert(`"${title}" has been deleted successfully.`)
      } else {
        throw new Error('Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment. Please try again.')
    } finally {
      setDeletingAssignment(null)
    }
  }

  const togglePublishStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        })
      })

      if (response.ok) {
        setAssignments(prev => prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, isPublished: !currentStatus }
            : assignment
        ))
      } else {
        throw new Error('Failed to update assignment status')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment status. Please try again.')
    }
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    if (!assignment.isPublished) return 'DRAFT'
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) return 'OVERDUE'
    return 'PUBLISHED'
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'PUBLISHED') matchesStatus = assignment.isPublished && (!assignment.dueDate || new Date(assignment.dueDate) >= new Date())
    if (statusFilter === 'DRAFT') matchesStatus = !assignment.isPublished
    if (statusFilter === 'OVERDUE') matchesStatus = assignment.isPublished && !!assignment.dueDate && new Date(assignment.dueDate) < new Date()
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'DRAFT':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'OVERDUE':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Course
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Assignments</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
          </div>
          
          <Link
            href={`/admin/courses/${courseId}/assignments/create`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create Assignment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => a.isPublished).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => !a.isPublished).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => a.isPublished && a.dueDate && new Date(a.dueDate) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Assignments ({filteredAssignments.length})
            </h3>
          </div>
          
          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first assignment.'
                }
              </p>
              <Link
                href={`/admin/courses/${courseId}/assignments/create`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => {
                const status = getAssignmentStatus(assignment)
                return (
                  <div key={assignment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            {status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>{formatDate(assignment.dueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <ClockIcon className="h-4 w-4" />
                            <span>{assignment.maxPoints || 'No'} points</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>{assignment.submissionCount} submissions</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>{assignment.gradedCount} graded</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => router.push(`/admin/courses/${courseId}/assignments/${assignment.id}`)}
                          className="text-blue-600 hover:text-blue-700 p-2"
                          title="View Assignment"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/courses/${courseId}/assignments/${assignment.id}/edit`)}
                          className="text-gray-600 hover:text-gray-700 p-2"
                          title="Edit Assignment"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => togglePublishStatus(assignment.id, assignment.isPublished)}
                          className={`p-2 ${assignment.isPublished ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                          title={assignment.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {assignment.isPublished ? (
                            <ExclamationTriangleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          disabled={deletingAssignment === assignment.id}
                          className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50"
                          title="Delete Assignment"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
