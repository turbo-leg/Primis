'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import { useSchedule } from '@/contexts/ScheduleContext'
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
  AcademicCapIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  UsersIcon,
  PlayIcon,
  ArrowRightIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface Course {
  id: string
  title: string
  description: string
  level: string
  price: number
  instructor: string
  startDate: string
  duration?: number
  durationUnit?: string
  capacity?: number
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
  rating?: number
  totalReviews?: number
  tags?: string[]
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  course: Course
}

export default function CoursesPage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const { refreshSchedule } = useSchedule()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedPrice, setSelectedPrice] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    } else if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, selectedLevel, selectedPrice, sortBy, enrollments])

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

  const filterAndSortCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel
      
      const matchesPrice = selectedPrice === 'all' || 
        (selectedPrice === 'free' && course.price === 0) ||
        (selectedPrice === 'paid' && course.price > 0) ||
        (selectedPrice === 'low' && course.price > 0 && course.price <= 100) ||
        (selectedPrice === 'medium' && course.price > 100 && course.price <= 500) ||
        (selectedPrice === 'high' && course.price > 500)

      return matchesSearch && matchesLevel && matchesPrice
    })

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'popularity':
          return b._count.enrollments - a._count.enrollments
        case 'level':
          const levelOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 }
          return (levelOrder[a.level as keyof typeof levelOrder] || 0) - (levelOrder[b.level as keyof typeof levelOrder] || 0)
        case 'newest':
        default:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      }
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
      
      // Refresh schedule to show new course immediately
      await refreshSchedule()
      
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto"></div>
          <p className="text-white mt-4 text-lg">Discovering amazing courses...</p>
        </div>
      </div>
    )
  }

  const statsData = {
    totalCourses: courses.length,
    enrolledCourses: enrollments.length,
    availableCourses: filteredCourses.filter(c => !c.isEnrolled).length,
    completionRate: enrollments.length > 0 ? Math.round((enrollments.filter(e => e.status === 'COMPLETED').length / enrollments.length) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Discover Your Next
              <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent"> Adventure</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Unlock your potential with our comprehensive course catalog. From beginner-friendly introductions to advanced masterclasses.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{statsData.totalCourses}</div>
                <div className="text-sm text-gray-300">Total Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-green-400">{statsData.enrolledCourses}</div>
                <div className="text-sm text-gray-300">Your Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-blue-400">{statsData.availableCourses}</div>
                <div className="text-sm text-gray-300">Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-yellow-400">{statsData.completionRate}%</div>
                <div className="text-sm text-gray-300">Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
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
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1 border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all" className="bg-gray-800">All Levels</option>
                  <option value="Beginner" className="bg-gray-800">Beginner</option>
                  <option value="Intermediate" className="bg-gray-800">Intermediate</option>
                  <option value="Advanced" className="bg-gray-800">Advanced</option>
                </select>

                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all" className="bg-gray-800">All Prices</option>
                  <option value="free" className="bg-gray-800">Free</option>
                  <option value="low" className="bg-gray-800">$1 - $100</option>
                  <option value="medium" className="bg-gray-800">$101 - $500</option>
                  <option value="high" className="bg-gray-800">$500+</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="newest" className="bg-gray-800">Newest First</option>
                  <option value="title" className="bg-gray-800">Alphabetical</option>
                  <option value="price-low" className="bg-gray-800">Price: Low to High</option>
                  <option value="price-high" className="bg-gray-800">Price: High to Low</option>
                  <option value="popularity" className="bg-gray-800">Most Popular</option>
                  <option value="level" className="bg-gray-800">Difficulty Level</option>
                </select>

                <div className="flex items-center justify-center px-4 py-3 text-sm text-gray-300">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Courses Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} onEnroll={handleEnroll} enrollingId={enrollingCourseId} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCourses.map((course) => (
              <CourseListItem key={course.id} course={course} onEnroll={handleEnroll} enrollingId={enrollingCourseId} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No courses found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || selectedLevel !== 'all' || selectedPrice !== 'all' 
                ? 'Try adjusting your search criteria or filters to find more courses.' 
                : 'No courses are available at this time. Check back soon for new additions!'}
            </p>
            {(searchTerm || selectedLevel !== 'all' || selectedPrice !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedLevel('all')
                  setSelectedPrice('all')
                }}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Course Card Component for Grid View
function CourseCard({ course, onEnroll, enrollingId }: { 
  course: Course; 
  onEnroll: (id: string) => void; 
  enrollingId: string | null 
}) {
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
      month: 'short',
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

  return (
    <div className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 overflow-hidden">
      {/* Course Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/courses/${course.id}`} className="group-hover:text-red-400 transition-colors">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">{course.title}</h3>
            </Link>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getLevelColor(course.level)}`}>
                {course.level}
              </span>
              {course.price === 0 && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  FREE
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{course.description}</p>

        {/* Course Meta */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-300">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{course.instructor}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-300">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>Starts {formatDate(course.startDate)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <UsersIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{course._count.enrollments} students enrolled</span>
          </div>

          {/* Schedule Preview */}
          {course.schedules && course.schedules.length > 0 && (
            <div className="flex items-center text-sm text-gray-300">
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {course.schedules[0].dayOfWeek}: {formatTime(course.schedules[0].startTime)}
                {course.schedules.length > 1 && ` +${course.schedules.length - 1} more`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-1 text-yellow-400" />
            <span className="text-white font-bold text-xl">{formatCurrency(course.price)}</span>
          </div>
          
          {course.rating && (
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-300 ml-1">
                {course.rating} ({course.totalReviews})
              </span>
            </div>
          )}
        </div>

        {course.isEnrolled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Enrolled</span>
            </div>
            <Link
              href={`/courses/${course.id}`}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              <PlayIcon className="h-5 w-5" />
              <span>Continue Learning</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => onEnroll(course.id)}
              disabled={enrollingId === course.id}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95"
            >
              {enrollingId === course.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  <span>Enrolling...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Enroll Now</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </div>
              )}
            </button>
            <Link
              href={`/courses/${course.id}`}
              className="flex items-center justify-center w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20"
            >
              View Details
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Course List Item Component for List View
function CourseListItem({ course, onEnroll, enrollingId }: { 
  course: Course; 
  onEnroll: (id: string) => void; 
  enrollingId: string | null 
}) {
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
      month: 'short',
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

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Course Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Link href={`/courses/${course.id}`} className="hover:text-red-400 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
              </Link>
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
                {course.price === 0 && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    FREE
                  </span>
                )}
                <div className="flex items-center text-sm text-gray-300">
                  <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{course._count.enrollments} enrolled</span>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="flex items-center text-yellow-400 mb-1">
                <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                <span className="text-xl font-bold text-white">{formatCurrency(course.price)}</span>
              </div>
              {course.rating && (
                <div className="flex items-center text-sm">
                  <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-gray-300">{course.rating} ({course.totalReviews})</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{course.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-300">
              <UserIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{course.instructor}</span>
            </div>
            
            <div className="flex items-center text-gray-300">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>Starts {formatDate(course.startDate)}</span>
            </div>

            {course.schedules && course.schedules.length > 0 && (
              <div className="flex items-center text-gray-300">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {course.schedules[0].dayOfWeek}: {formatTime(course.schedules[0].startTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48">
          {course.isEnrolled ? (
            <>
              <div className="flex items-center justify-center py-2 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Enrolled</span>
              </div>
              <Link
                href={`/courses/${course.id}`}
                className="flex items-center justify-center space-x-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Continue</span>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => onEnroll(course.id)}
                disabled={enrollingId === course.id}
                className="py-2 px-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                {enrollingId === course.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    <span>Enrolling...</span>
                  </div>
                ) : (
                  'Enroll Now'
                )}
              </button>
              <Link
                href={`/courses/${course.id}`}
                className="py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors text-center border border-white/20"
              >
                View Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
