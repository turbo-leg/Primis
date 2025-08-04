'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AcademicCapIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorName: string
  duration: number
  durationUnit: string
  price: number
  level: string
  capacity: number
  enrolledCount: number
  startDate: string
  schedule: {
    days: string[]
    startTime: string
    endTime: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null)

  // Check for success message
  const created = searchParams.get('created')

  // Redirect if not authenticated or not admin
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCourses()
    }
  }, [status])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      const coursesData = await response.json()
      setCourses(coursesData)
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    setDeletingCourse(courseId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 400 && result.canForceDelete) {
          // Course has enrollments, ask for force delete
          const forceConfirm = confirm(
            `This course has ${result.details.enrolledStudents} enrolled students, ` +
            `${result.details.assignments} assignments, and ${result.details.totalSubmissions} submissions.\n\n` +
            'Are you sure you want to force delete this course and ALL related data? This cannot be undone.'
          )
          
          if (forceConfirm) {
            const forceResponse = await fetch(`/api/admin/courses/${courseId}?force=true`, {
              method: 'DELETE'
            })
            
            const forceResult = await forceResponse.json()
            
            if (!forceResponse.ok) {
              throw new Error(forceResult.error || 'Failed to force delete course')
            }
            
            // Success - remove course from local state
            setCourses(prev => prev.filter(course => course.id !== courseId))
            alert(`Course deleted successfully. Removed ${forceResult.deletedEnrollments} enrollments.`)
          }
        } else {
          throw new Error(result.error || 'Failed to delete course')
        }
      } else {
        // Success - remove course from local state
        setCourses(prev => prev.filter(course => course.id !== courseId))
        alert('Course deleted successfully.')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Failed to delete course: ${errorMessage}`)
    } finally {
      setDeletingCourse(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSchedule = (schedule: Course['schedule']) => {
    if (!schedule || !schedule.days || schedule.days.length === 0) {
      return 'No schedule set'
    }
    
    const days = schedule.days.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1, 3)
    ).join(', ')
    
    return `${days} ${schedule.startTime}-${schedule.endTime}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading courses...</p>
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
                <AcademicCapIcon className="h-8 w-8 text-purple-400" />
                Course Management
              </h1>
              <p className="text-gray-300 mt-2">Manage all courses in the system</p>
            </div>
            <Link
              href="/admin/courses/create"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Course
            </Link>
          </div>

          {/* Success Message */}
          {created && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300">Course created successfully!</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Enrollments</p>
                <p className="text-2xl font-bold text-white">
                  {courses.reduce((sum, course) => sum + course.enrolledCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Avg Course Price</p>
                <p className="text-2xl font-bold text-white">
                  ${courses.length > 0 ? (courses.reduce((sum, course) => sum + course.price, 0) / courses.length).toFixed(0) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Active Courses</p>
                <p className="text-2xl font-bold text-white">
                  {courses.filter(course => new Date(course.startDate) <= new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Courses Found</h3>
              <p className="text-gray-300 mb-6">Get started by creating your first course.</p>
              <Link
                href="/admin/courses/create"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create First Course
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {courses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {course.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>Instructor: {course.instructorName || course.instructor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span>Starts: {formatDate(course.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{course.duration} {course.durationUnit}</span>
                            </div>
                          </div>

                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                            {course.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                              {course.level}
                            </span>
                            <span className="text-green-400">
                              ${course.price}
                            </span>
                            <span className="text-gray-400">
                              {course.enrolledCount}/{course.capacity} enrolled
                            </span>
                            <span className="text-gray-400">
                              {formatSchedule(course.schedule)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-white mb-1">
                            {course.enrolledCount}/{course.capacity}
                          </div>
                          <div className="text-sm text-gray-400">
                            {((course.enrolledCount / course.capacity) * 100).toFixed(0)}% full
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      Created: {formatDate(course.createdAt)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/courses/${course.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        disabled={deletingCourse === course.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        {deletingCourse === course.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
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