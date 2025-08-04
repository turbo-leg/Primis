'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  BookOpenIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  StarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  activeCourses: number
  todayClasses: number
  unreadMessages: number
  attendanceRate: number
  enrollments: any[]
  todaySchedules: any[]
}

interface Course {
  id: string
  title: string
  description: string
  level: string
  price: number
  instructor: string
  startDate: string
  _count: {
    enrollments: number
  }
  isEnrolled?: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats()
      fetchAvailableCourses()
    }
  }, [status])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCourses = async () => {
    setCoursesLoading(true)
    try {
      const response = await fetch('/api/courses/available')
      if (response.ok) {
        const data = await response.json()
        setAvailableCourses(data)
      } else {
        console.error('Failed to fetch available courses')
      }
    } catch (error) {
      console.error('Error fetching available courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId)
      setMessage(null)
      
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Successfully enrolled in course!' })
        // Refresh available courses after enrollment
        await fetchAvailableCourses()
        await fetchDashboardStats()
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to enroll in course' 
        })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      setMessage({ 
        type: 'error', 
        text: 'An error occurred while enrolling' 
      })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Show loading if session is loading or stats are loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">
            {t('dashboard.welcome')}, {session?.user?.name}!
          </h1>
          <p className="text-gray-300 mt-2">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <p className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              {message.text}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{t('dashboard.activeCourses')}</p>
                <p className="text-3xl font-bold text-white">{stats?.activeCourses || 0}</p>
              </div>
              <BookOpenIcon className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{t('dashboard.todayClasses')}</p>
                <p className="text-3xl font-bold text-white">{stats?.todayClasses || 0}</p>
              </div>
              <CalendarIcon className="h-12 w-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{t('dashboard.unreadMessages')}</p>
                <p className="text-3xl font-bold text-white">{stats?.unreadMessages || 0}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{t('dashboard.attendance')}</p>
                <p className="text-3xl font-bold text-white">{stats?.attendanceRate || 0}%</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-red-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-red-500" />
              {t('dashboard.todaySchedule')}
            </h2>
            
            <div className="space-y-4">
              {stats?.todaySchedules && stats.todaySchedules.length > 0 ? (
                stats.todaySchedules.map((schedule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">{schedule.title}</h3>
                      <p className="text-gray-300 text-sm">{schedule.instructor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{schedule.startTime} - {schedule.endTime}</p>
                      <p className="text-gray-300 text-sm">{schedule.room}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No classes scheduled for today</p>
                </div>
              )}
            </div>

            <Link 
              href="/schedule"
              className="block mt-4 text-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {t('dashboard.viewFullSchedule')}
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">
              {t('dashboard.quickActions')}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/dashboard/chat"
                className="flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm mt-2 text-center">{t('nav.chat')}</span>
              </Link>

              <Link 
                href="/documents"
                className="flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <DocumentTextIcon className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm mt-2 text-center">{t('nav.documents')}</span>
              </Link>

              <Link 
                href="/courses"
                className="flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <BookOpenIcon className="h-8 w-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm mt-2 text-center">{t('nav.courses')}</span>
              </Link>

              <Link 
                href="/contact"
                className="flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <UserGroupIcon className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm mt-2 text-center">{t('dashboard.support')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Browse Courses */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-6 w-6 text-green-500" />
            {t('dashboard.browseCourses')}
          </h2>
          
          {coursesLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-white/10 rounded-lg"></div>
              <div className="h-24 bg-white/10 rounded-lg"></div>
              <div className="h-24 bg-white/10 rounded-lg"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {availableCourses.length > 0 ? (
                availableCourses.map((course) => (
                  <div key={course.id} className="p-4 bg-white/10 rounded-lg flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{course.title}</h3>
                      <p className="text-gray-300 text-sm">{course.description}</p>
                    </div>
                    <div className="flex-none">
                      <p className="text-white font-semibold">{course.price > 0 ? `${course.price} USD` : t('common.free')}</p>
                      <Link 
                        href={`/courses/${course.id}`}
                        className="block mt-2 text-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        {t('dashboard.viewDetails')}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">{t('dashboard.noCoursesAvailable')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">
            {t('dashboard.recentActivity')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-white">{t('dashboard.attendedClass')}: IELTS Speaking Practice</p>
                <p className="text-gray-400 text-sm">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-white">{t('dashboard.downloadedDocument')}: SAT Practice Test 1</p>
                <p className="text-gray-400 text-sm">1 day ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-white">{t('dashboard.joinedChat')}: SAT Prep Discussion</p>
                <p className="text-gray-400 text-sm">2 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Browse Available Courses Section */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MagnifyingGlassIcon className="h-6 w-6 text-blue-400" />
              Browse Available Courses
            </h2>
            <Link 
              href="/courses"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              View All
              <PlusIcon className="h-4 w-4" />
            </Link>
          </div>

          {coursesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading courses...</p>
            </div>
          ) : availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg leading-tight">{course.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Instructor:</span>
                      <span className="text-white">{course.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(course.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Students:</span>
                      <span className="text-white">{course._count.enrollments}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnrollCourse(course.id)}
                      disabled={enrollingCourseId === course.id}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {enrollingCourseId === course.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          Enroll Now
                        </>
                      )}
                    </button>
                    <Link 
                      href={`/courses/${course.id}`}
                      className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">No new courses available</p>
              <p className="text-gray-400 text-sm">You're enrolled in all available courses!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
