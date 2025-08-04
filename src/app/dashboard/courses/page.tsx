'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string
  price: number
  level: string
  capacity: number
  enrolledCount: number
  startDate: string
  schedule: string
  isEnrolled?: boolean
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'available'>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all courses
      const coursesResponse = await fetch('/api/courses')
      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses')
      }
      const coursesData = await coursesResponse.json()
      
      // Fetch user enrollments if logged in
      let enrollments: string[] = []
      if (session?.user?.id) {
        try {
          const enrollmentsResponse = await fetch('/api/enrollments/my')
          if (enrollmentsResponse.ok) {
            const enrollmentsData = await enrollmentsResponse.json()
            enrollments = enrollmentsData.map((e: any) => e.courseId)
          }
        } catch (err) {
          console.log('Could not fetch enrollments:', err)
        }
      }

      // Mark courses as enrolled
      const coursesWithEnrollment = coursesData.map((course: Course) => ({
        ...course,
        isEnrolled: enrollments.includes(course.id)
      }))

      setCourses(coursesWithEnrollment)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    switch (activeTab) {
      case 'enrolled':
        return course.isEnrolled
      case 'available':
        return !course.isEnrolled
      default:
        return true
    }
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600 mt-2">Manage your enrolled courses and explore new ones</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Course Filter Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Courses', count: courses.length },
              { key: 'enrolled', label: 'Enrolled', count: courses.filter(c => c.isEnrolled).length },
              { key: 'available', label: 'Available', count: courses.filter(c => !c.isEnrolled).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {activeTab === 'enrolled' ? 'No enrolled courses' : 
             activeTab === 'available' ? 'No available courses' : 
             'No courses found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'enrolled' 
              ? 'You are not enrolled in any courses yet.' 
              : activeTab === 'available'
              ? 'All available courses are already enrolled.'
              : 'No courses are currently available.'}
          </p>
          {activeTab !== 'enrolled' && (
            <div className="mt-6">
              <Link
                href="/admin/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <BookOpenIcon className="-ml-1 mr-2 h-5 w-5" />
                {session?.user?.role === 'ADMIN' ? 'Create Courses' : 'Contact Admin'}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {course.level}
                  </span>
                  {course.isEnrolled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Enrolled
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>{course.instructor}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{course.schedule}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{formatDate(course.startDate)} - {course.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      <span>${course.price}</span>
                    </div>
                    <span className="text-gray-500">
                      {course.enrolledCount}/{course.capacity} enrolled
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {course.isEnrolled ? (
                    <>
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continue
                      </Link>
                      <Link
                        href={`/dashboard/courses/${course.id}/materials`}
                        className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Materials
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          // TODO: Implement enrollment functionality
                          alert('Enrollment functionality coming soon!')
                        }}
                        disabled={course.enrolledCount >= course.capacity}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          course.enrolledCount >= course.capacity
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {course.enrolledCount >= course.capacity ? 'Full' : 'Enroll Now'}
                      </button>
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Learn More
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
