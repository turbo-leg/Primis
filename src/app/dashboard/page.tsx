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
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  activeCourses: number
  todayClasses: number
  unreadMessages: number
  attendanceRate: number
  enrollments: any[]
  todaySchedules: any[]
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats()
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
    <div>
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
      </div>
    </div>
  )
}
