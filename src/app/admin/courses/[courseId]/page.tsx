'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  DocumentTextIcon
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

export default function AdminCourseDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/list`)
      const courses = await response.json()
      const foundCourse = courses.find((c: Course) => c.id === courseId)
      setCourse(foundCourse || null)
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!course) return
    
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
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
            
            alert(`Course deleted successfully. Removed ${forceResult.deletedEnrollments} enrollments.`)
            router.push('/admin/courses')
          }
        } else {
          throw new Error(result.error || 'Failed to delete course')
        }
      } else {
        alert('Course deleted successfully.')
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Failed to delete course: ${errorMessage}`)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSchedule = (schedule: any) => {
    try {
      const scheduleData = typeof schedule === 'string' ? JSON.parse(schedule) : schedule
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const days = scheduleData.days?.map((day: any) => dayNames[day] || day).join(', ') || 'Not specified'
      return `${days} at ${scheduleData.startTime || 'TBD'} - ${scheduleData.endTime || 'TBD'}`
    } catch {
      return 'Schedule not available'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
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
              href="/admin/courses"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Courses
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">Course Details</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/courses/${courseId}/edit`}
              className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Course
            </Link>
            <button
              onClick={handleDeleteCourse}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </div>

        {/* Course Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                <p className="text-gray-900">{course.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{course.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Instructor</label>
                  <p className="text-gray-900">{course.instructor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Level</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    course.level === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                    course.level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Duration</p>
                  <p className="text-gray-600">{course.duration} {course.durationUnit}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Price</p>
                  <p className="text-gray-600">${course.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-gray-600">{course.enrolledCount} / {course.capacity} students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Start Date</p>
                  <p className="text-gray-600">{formatDate(course.startDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Class Schedule</p>
                <p className="text-gray-600">{formatSchedule(course.schedule)}</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">Course ID</p>
                <p className="text-gray-600 font-mono text-sm">{course.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Created</p>
                <p className="text-gray-600">{formatDate(course.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Last Updated</p>
                <p className="text-gray-600">{formatDate(course.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">View as Student</p>
                <p className="text-sm text-gray-600">See the course from student perspective</p>
              </div>
            </Link>
            <Link
              href={`/admin/courses/${courseId}/students`}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Students</p>
                <p className="text-sm text-gray-600">View and manage enrollments</p>
              </div>
            </Link>
            <Link
              href={`/admin/courses/${courseId}/assignments`}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Assignments</p>
                <p className="text-sm text-gray-600">Create and manage assignments</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
