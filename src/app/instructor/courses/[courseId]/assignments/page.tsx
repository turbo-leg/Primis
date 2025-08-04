'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  isActive: boolean
  createdAt: string
  submissionCount: number
}

interface AssignmentsPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function CourseAssignmentsPage({ params }: AssignmentsPageProps) {
  const { data: session } = useSession()
  const [courseId, setCourseId] = useState<string>('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Resolve params
  useEffect(() => {
    params.then(({ courseId: paramCourseId }) => {
      setCourseId(paramCourseId)
    })
  }, [params])

  useEffect(() => {
    if (session?.user?.id && courseId) {
      fetchAssignments()
    }
  }, [session, courseId])

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?courseId=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
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
        <div className="animate-pulse text-emerald-100 text-xl">Loading assignments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-green-700/50 backdrop-blur-sm border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/instructor/courses"
                className="text-emerald-300 hover:text-emerald-100 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-emerald-100">Course Assignments</h1>
                <p className="text-emerald-200 mt-2">Manage assignments and view submissions</p>
              </div>
            </div>
            <Link
              href={courseId ? `/instructor/courses/${courseId}/assignments/new` : '#'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Assignment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-emerald-100 mb-2">No assignments yet</h3>
            <p className="text-emerald-300 mb-6">Get started by creating your first assignment</p>
            <Link
              href={courseId ? `/instructor/courses/${courseId}/assignments/new` : '#'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-emerald-100">{assignment.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        assignment.isActive 
                          ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                          : 'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isOverdue(assignment.dueDate) && assignment.isActive && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-600/20 text-red-300 border border-red-500/30">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-200 text-sm mb-3">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-emerald-300">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Due: {formatDate(assignment.dueDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <AcademicCapIcon className="h-4 w-4" />
                        {assignment.maxPoints} points
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        {assignment.submissionCount} submissions
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/instructor/assignments/${assignment.id}/submissions`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                      Grade ({assignment.submissionCount})
                    </Link>
                    <Link
                      href={`/instructor/assignments/${assignment.id}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      href={`/instructor/assignments/${assignment.id}/edit`}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
