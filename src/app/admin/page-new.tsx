'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  UserGroupIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  totalStudents: number
  activeCourses: number
  totalEnrollments: number
  pendingApplications: number
  upcomingClasses: number
  totalRevenue: number
  growth: {
    students: number
    courses: number
    enrollments: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
}

interface Student {
  id: string
  name: string
  email: string
  createdAt: string
  enrollments: Array<{
    course: {
      title: string
    }
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        redirect('/dashboard')
        return
      }
      fetchAdminData()
    } else if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status, session])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch admin stats and recent students in parallel
      const [statsResponse, studentsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/students')
      ])

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch admin stats')
      }

      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students')
      }

      const [statsData, studentsData] = await Promise.all([
        statsResponse.json(),
        studentsResponse.json()
      ])

      setStats(statsData)
      setRecentStudents(studentsData)
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to load admin data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpIcon className="h-4 w-4 text-green-400" />
    } else if (growth < 0) {
      return <ArrowDownIcon className="h-4 w-4 text-red-400" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchAdminData}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-300 mt-2">Manage your college prep platform - Database Driven</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white">{stats?.totalStudents || 0}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(stats?.growth.students || 0)}
                  <span className="text-xs text-gray-400 ml-1">
                    +{stats?.growth.students || 0} this week
                  </span>
                </div>
              </div>
              <UserGroupIcon className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Active Courses</p>
                <p className="text-2xl font-bold text-white">{stats?.activeCourses || 0}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(stats?.growth.courses || 0)}
                  <span className="text-xs text-gray-400 ml-1">
                    +{stats?.growth.courses || 0} this week
                  </span>
                </div>
              </div>
              <BookOpenIcon className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    From {stats?.totalEnrollments || 0} enrollments
                  </span>
                </div>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Active Enrollments</p>
                <p className="text-2xl font-bold text-white">{stats?.totalEnrollments || 0}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(stats?.growth.enrollments || 0)}
                  <span className="text-xs text-gray-400 ml-1">
                    +{stats?.growth.enrollments || 0} this week
                  </span>
                </div>
              </div>
              <ChartBarIcon className="h-10 w-10 text-purple-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Upcoming Classes</p>
                <p className="text-2xl font-bold text-white">{stats?.upcomingClasses || 0}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    Starting soon
                  </span>
                </div>
              </div>
              <CalendarIcon className="h-10 w-10 text-red-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Applications</p>
                <p className="text-2xl font-bold text-white">{stats?.pendingApplications || 0}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    Need review
                  </span>
                </div>
              </div>
              <ClockIcon className="h-10 w-10 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions and Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                href="/admin/courses"
                className="block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 rounded-lg p-2 group-hover:bg-blue-400 transition-colors">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Manage Courses</h3>
                    <p className="text-gray-400 text-sm">Create and edit courses</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/students"
                className="block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-lg p-2 group-hover:bg-green-400 transition-colors">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Manage Students</h3>
                    <p className="text-gray-400 text-sm">View and manage student accounts</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/schedules"
                className="block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 rounded-lg p-2 group-hover:bg-purple-400 transition-colors">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Schedules</h3>
                    <p className="text-gray-400 text-sm">Manage class schedules</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-500 rounded-lg p-2 group-hover:bg-yellow-400 transition-colors">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Reports</h3>
                    <p className="text-gray-400 text-sm">View analytics and reports</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Students */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Recent Students</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {recentStudents.length > 0 ? (
                  recentStudents.slice(0, 8).map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-gray-400 text-sm">{student.email}</p>
                        <p className="text-gray-500 text-xs">
                          {student.enrollments.length} course{student.enrollments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">
                          {formatDate(student.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No students yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="border-b border-white/10 pb-3 last:border-b-0">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}