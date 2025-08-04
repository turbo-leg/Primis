'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface DashboardData {
  overview: {
    totalCourses: number
    totalStudents: number
    totalAssignments: number
    pendingSubmissions: number
    gradedSubmissions: number
  }
  courses: Array<{
    id: string
    title: string
    description: string
    studentCount: number
    assignmentCount: number
    students: Array<{
      id: string
      name: string
      email: string
    }>
  }>
  recentActivity: Array<{
    id: string
    studentName: string
    assignmentTitle: string
    submittedAt: string
    status: string
    grade: number | null
  }>
  upcomingAssignments: Array<{
    id: string
    title: string
    courseName: string
    dueDate: string
    submissionCount: number
  }>
}

export default function InstructorDashboard() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/instructor/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-300 text-lg">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 text-lg mb-4">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { overview, courses, recentActivity, upcomingAssignments } = dashboardData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back, {session?.user?.name}
                </h1>
                <p className="text-slate-300 text-lg">
                  Here's your teaching overview for today
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all">
                  <BellIcon className="h-6 w-6 text-slate-300" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {overview.pendingSubmissions}
                  </span>
                </button>
                <Link
                  href="/instructor/courses/new"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Course
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <AcademicCapIcon className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="ml-4">
                  <p className="text-slate-400 text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-white">{overview.totalCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <UserGroupIcon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-slate-400 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-white">{overview.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <DocumentTextIcon className="h-8 w-8 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-slate-400 text-sm font-medium">Assignments</p>
                  <p className="text-3xl font-bold text-white">{overview.totalAssignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <ClockIcon className="h-8 w-8 text-amber-400" />
                </div>
                <div className="ml-4">
                  <p className="text-slate-400 text-sm font-medium">Pending Reviews</p>
                  <p className="text-3xl font-bold text-white">{overview.pendingSubmissions}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="ml-4">
                  <p className="text-slate-400 text-sm font-medium">Graded</p>
                  <p className="text-3xl font-bold text-white">{overview.gradedSubmissions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                <Link
                  href="/instructor/activity"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{activity.studentName}</p>
                          <p className="text-slate-400 text-sm">
                            Submitted "{activity.assignmentTitle}"
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(activity.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.grade !== null ? (
                          <span className="text-emerald-400 font-medium">Graded</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Pending</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>

            {/* Quick Actions & Upcoming */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/instructor/assignments/new"
                    className="flex items-center gap-3 w-full p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Assignment
                  </Link>
                  <Link
                    href="/instructor/submissions"
                    className="flex items-center gap-3 w-full p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-xl text-amber-300 transition-all"
                  >
                    <ClockIcon className="h-5 w-5" />
                    Review Submissions
                  </Link>
                  <Link
                    href="/instructor/analytics"
                    className="flex items-center gap-3 w-full p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 transition-all"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    View Analytics
                  </Link>
                </div>
              </div>

              {/* Upcoming Assignments */}
              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30"
                      >
                        <p className="text-white font-medium text-sm">{assignment.title}</p>
                        <p className="text-slate-400 text-xs">{assignment.courseName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-slate-500 text-xs">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                          <span className="text-amber-400 text-xs">
                            {assignment.submissionCount} submissions
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No upcoming deadlines</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white">Your Courses</h3>
                <Link
                  href="/instructor/courses"
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  View All Courses
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all transform hover:scale-105"
                  >
                    <h4 className="text-lg font-semibold text-white mb-2">{course.title}</h4>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-slate-400 text-sm">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {course.studentCount}
                        </span>
                        <span className="flex items-center text-slate-400 text-sm">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          {course.assignmentCount}
                        </span>
                      </div>
                      <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
