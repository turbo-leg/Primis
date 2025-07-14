'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/components/providers/i18n-provider'
import Link from 'next/link'
import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? (
                      <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                    )}
                    <span className="sr-only">{trend === 'up' ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session?.user?.name}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/courses" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Course
            </Link>
            <Link href="/admin/students" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Manage Students
            </Link>
            <Link href="/admin/schedules" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              Schedule Classes
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              change={stats.growth.students}
              trend={stats.growth.students >= 0 ? 'up' : 'down'}
              icon={UserGroupIcon}
            />
            <StatCard
              title="Active Courses"
              value={stats.activeCourses}
              change={stats.growth.courses}
              trend={stats.growth.courses >= 0 ? 'up' : 'down'}
              icon={BookOpenIcon}
            />
            <StatCard
              title="Total Enrollments"
              value={stats.totalEnrollments}
              change={stats.growth.enrollments}
              trend={stats.growth.enrollments >= 0 ? 'up' : 'down'}
              icon={ChartBarIcon}
            />
            <StatCard
              title="Upcoming Classes"
              value={stats.upcomingClasses}
              icon={CalendarDaysIcon}
            />
          </div>
        )}

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}