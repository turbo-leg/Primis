'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface Course {
  id: string
  title: string
  description: string
  level: string
  price: number
  instructor: string
  startDate: string
  schedules: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    room: string
  }>
  _count: {
    enrollments: number
  }
  isEnrolled?: boolean
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  course: Course
}

export default function StudentCourseBrowser() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    } else if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedLevel, enrollments])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [coursesResponse, enrollmentsResponse] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/enrollments')
      ])

      if (!coursesResponse.ok || !enrollmentsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [coursesData, enrollmentsData] = await Promise.all([
        coursesResponse.json(),
        enrollmentsResponse.json()
      ])

      // Mark courses as enrolled
      const enrolledCourseIds = new Set(enrollmentsData.map((e: Enrollment) => e.course.id))
      const coursesWithEnrollment = coursesData.map((course: Course) => ({
        ...course,
        isEnrolled: enrolledCourseIds.has(course.id)
      }))

      setCourses(coursesWithEnrollment)
      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel

      return matchesSearch && matchesLevel
    })

    setFilteredCourses(filtered)
  }

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId)
      setMessage(null)

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll')
      }

      setMessage({ type: 'success', text: 'Successfully enrolled in course!' })
      
      // Refresh data to update enrollment status
      await fetchData()
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error enrolling:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to enroll in course' 
      })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t('courses.title')}</h1>
          <p className="text-gray-300 mt-2">{t('courses.subtitle')}</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('courses.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all" className="bg-gray-800">{t('courses.allLevels')}</option>
            <option value="Beginner" className="bg-gray-800">{t('courses.beginner')}</option>
            <option value="Intermediate" className="bg-gray-800">{t('courses.intermediate')}</option>
            <option value="Advanced" className="bg-gray-800">{t('courses.advanced')}</option>
          </select>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all">
              {/* Course Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{course.title}</h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded border ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{course.description}</p>
              </div>

              {/* Course Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-300">
                  <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{course.instructor}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-300">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Starts {formatDate(course.startDate)}</span>
                </div>

                <div className="flex items-center text-sm text-gray-300">
                  <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{course._count.enrollments} students enrolled</span>
                </div>

                {/* Schedule */}
                {course.schedules && course.schedules.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-2">Schedule:</div>
                    {course.schedules.map((schedule, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-300 mb-1">
                        <ClockIcon className="h-3 w-3 mr-2 text-gray-400" />
                        <span>{schedule.dayOfWeek}: {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                        {schedule.room && (
                          <>
                            <MapPinIcon className="h-3 w-3 ml-2 mr-1 text-gray-400" />
                            <span>{schedule.room}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price and Enrollment */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-1 text-yellow-400" />
                    <span className="text-white font-bold text-lg">{formatCurrency(course.price)}</span>
                  </div>
                </div>

                {course.isEnrolled ? (
                  <div className="flex items-center justify-center py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>Enrolled</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingCourseId === course.id}
                    className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {enrollingCourseId === course.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No courses found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {searchTerm || selectedLevel !== 'all' ? 'Try adjusting your search or filters.' : 'No courses are available at this time.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
