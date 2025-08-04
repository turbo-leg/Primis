'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/components/providers/i18n-provider'
import AssignmentSubmission from '@/components/assignments/AssignmentSubmission'
import { Announcement as AnnouncementType, CreateAnnouncementData } from '@/types/announcements'
import {
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PlusIcon,
  PhotoIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  isActive: boolean
  createdAt: string
  submission?: {
    id: string
    content: string
    fileUrl: string
    fileName: string
    grade: number | null
    feedback: string | null
    status: string
    submittedAt: string
    gradedAt: string | null
  } | null
}

interface LocalAnnouncement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  author: {
    id: string
    name: string
    role: string
  }
  isImportant: boolean
}

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  level: string
  startDate: string
  assignments: Assignment[]
  isEnrolled: boolean
  schedules?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    room?: string
  }>
  announcements?: LocalAnnouncement[]
}

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [course, setCourse] = useState<Course | null>(null)
  const [courseId, setCourseId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewAssignment, setShowNewAssignment] = useState(false)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(({ courseId: paramCourseId }) => {
      setCourseId(paramCourseId)
    })
  }, [params])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-xl">Course not found</div>
      </div>
    )
  }

  const isInstructor = session?.user?.role === 'INSTRUCTOR'
  const isStudent = session?.user?.role === 'STUDENT'
  const isAdmin = session?.user?.role === 'ADMIN'

  // Role-based styling
  const getRoleStyles = () => {
    if (isInstructor) {
      return { 
        accent: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-600/20 text-green-400',
        tab: 'border-green-500 text-green-400'
      }
    } else if (isStudent) {
      return { 
        accent: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-600/20 text-blue-400',
        tab: 'border-blue-500 text-blue-400'
      }
    } else {
      return { 
        accent: 'bg-purple-600 hover:bg-purple-700',
        badge: 'bg-purple-600/20 text-purple-400',
        tab: 'border-purple-500 text-purple-400'
      }
    }
  }

  const roleStyles = getRoleStyles()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Course Hero Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6 sm:mb-8">
          {/* Course Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-8 py-8 sm:py-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpenIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <span className={`px-3 py-1 sm:px-4 ${roleStyles.badge} rounded-full text-xs sm:text-sm font-semibold`}>
                      {isInstructor ? 'Instructor View' : isStudent ? 'Student View' : 'Admin View'}
                    </span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">{course.title}</h1>
                <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 max-w-3xl">{course.description}</p>
                
                {/* Course Meta Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 text-blue-100">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-blue-200">Instructor</div>
                      <div className="font-semibold text-sm sm:text-base">{course.instructor}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-blue-100">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-blue-200">Level</div>
                      <div className="font-semibold text-sm sm:text-base capitalize">{course.level.toLowerCase()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-blue-100 sm:col-span-2 lg:col-span-1">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-blue-200">Start Date</div>
                      <div className="font-semibold text-sm sm:text-base">{new Date(course.startDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {isInstructor && (
                <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowNewAssignment(true)}
                    className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg transition-all text-sm sm:text-base"
                  >
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">New Assignment</span>
                    <span className="sm:hidden">New</span>
                  </button>
                  <button className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 font-semibold transition-all text-sm sm:text-base">
                    <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Schedule Class</span>
                    <span className="sm:hidden">Schedule</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Course Statistics Bar */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-800">{course.assignments?.length || 0}</div>
                <div className="text-xs sm:text-sm text-slate-600">Assignments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Professional Dashboard */}
        {isInstructor && (
          <>
            {/* Course Management Header */}
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-green-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Course Management</h2>
                    <p className="text-green-400 text-sm sm:text-base">{course.title} - Instructor Dashboard</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowNewAssignment(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
                  >
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    New Assignment
                  </button>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base">
                    <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Schedule Class
                  </button>
                </div>
              </div>

              {/* Advanced Analytics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10 hover:border-green-400/30 transition-all cursor-pointer group"
                     onClick={() => setActiveTab('students')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4">
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all mb-2 sm:mb-0">
                      <UserIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-white">3</div>
                      <div className="text-xs sm:text-sm text-green-400 font-medium">Students</div>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-300">Active:</span>
                      <span className="text-green-400 font-medium">3</span>
                    </div>
                    <div className="w-full bg-green-900/30 rounded-full h-1.5 sm:h-2">
                      <div className="bg-green-500 h-1.5 sm:h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10 hover:border-blue-400/30 transition-all cursor-pointer group"
                     onClick={() => setActiveTab('assignments')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4">
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all mb-2 sm:mb-0">
                      <DocumentTextIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-white">{course.assignments?.length || 0}</div>
                      <div className="text-xs sm:text-sm text-blue-400 font-medium">Assignments</div>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-300">Published:</span>
                      <span className="text-blue-400 font-medium">{course.assignments?.length || 0}</span>
                    </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-1.5 sm:h-2">
                      <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full w-4/5"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10 hover:border-yellow-400/30 transition-all cursor-pointer group"
                     onClick={() => setActiveTab('submissions')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4">
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-all mb-2 sm:mb-0">
                      <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-white">2</div>
                      <div className="text-xs sm:text-sm text-yellow-400 font-medium">Pending</div>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-yellow-400 font-medium">5</span>
                    </div>
                    <div className="w-full bg-yellow-900/30 rounded-full h-1.5 sm:h-2">
                      <div className="bg-yellow-500 h-1.5 sm:h-2 rounded-full w-2/5"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10 hover:border-purple-400/30 transition-all cursor-pointer group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4">
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-all mb-2 sm:mb-0">
                      <AcademicCapIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-white">92%</div>
                      <div className="text-xs sm:text-sm text-purple-400 font-medium">Avg Grade</div>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-300">Highest:</span>
                      <span className="text-purple-400 font-medium">98%</span>
                    </div>
                    <div className="w-full bg-purple-900/30 rounded-full h-1.5 sm:h-2">
                      <div className="bg-purple-500 h-1.5 sm:h-2 rounded-full w-11/12"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Activity Feed & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Recent Activity</h3>
                  <button className="text-green-400 hover:text-green-300 text-xs sm:text-sm font-medium">View All</button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3 sm:space-x-4 p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">New submission received</p>
                      <p className="text-green-400 text-xs sm:text-sm truncate">John Doe submitted "Linear Algebra Project" • 2 hours ago</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm flex-shrink-0">Review</button>
                  </div>
                  
                  <div className="flex items-start space-x-3 sm:space-x-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">Student question</p>
                      <p className="text-blue-400 text-xs sm:text-sm truncate">Jane Smith asked about Assignment 2 • 4 hours ago</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm flex-shrink-0">Reply</button>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">Assignment due soon</p>
                      <p className="text-purple-400 text-xs sm:text-sm truncate">"Calculus Problem Set 1" due in 2 days • 1 pending submission</p>
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm flex-shrink-0">Remind</button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/10">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Quick Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => setShowNewAssignment(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-all text-sm sm:text-base"
                  >
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Create Assignment
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-all text-sm sm:text-base"
                  >
                    <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Review Submissions
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('students')}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-all text-sm sm:text-base"
                  >
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Student Progress
                  </button>

                  <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-all text-sm sm:text-base">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Send Announcement
                  </button>

                  <button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center gap-2 sm:gap-3 transition-all text-sm sm:text-base">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Schedule Office Hours
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <nav className="flex border-b border-slate-200 justify-center sm:justify-start">
            {['overview', 'assignments', 'announcements', ...(isInstructor ? ['submissions', 'students'] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 sm:px-6 py-4 sm:py-5 font-semibold transition-all group ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={tab.charAt(0).toUpperCase() + tab.slice(1)}
              >
                <div className="flex items-center justify-center">
                  {tab === 'overview' && <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {tab === 'assignments' && <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {tab === 'announcements' && <MegaphoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {tab === 'submissions' && <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {tab === 'students' && <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </div>
                
                {/* Add notification badges */}
                {tab === 'submissions' && isInstructor && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    2
                  </span>
                )}
                {tab === 'assignments' && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {course.assignments?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {activeTab === 'overview' && <CourseOverview course={course} />}
          {activeTab === 'assignments' && (
            <AssignmentsTab 
              course={course} 
              isInstructor={isInstructor} 
              isStudent={isStudent} 
              onRefresh={fetchCourse} 
            />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsTab 
              courseId={course.id} 
              isInstructor={isInstructor} 
              isStudent={isStudent}
            />
          )}
          {activeTab === 'submissions' && isInstructor && (
            <SubmissionsTab courseId={course.id} />
          )}
          {activeTab === 'students' && (isInstructor || isAdmin) && (
            <StudentsTab courseId={course.id} />
          )}
        </div>

        {/* New Assignment Modal */}
        {showNewAssignment && isInstructor && (
          <NewAssignmentModal
            courseId={courseId}
            onClose={() => setShowNewAssignment(false)}
            onSuccess={() => {
              setShowNewAssignment(false)
              fetchCourse()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Assignment Card Component
function AssignmentCard({ assignment, isInstructor, isStudent, onRefresh }: {
  assignment: Assignment
  isInstructor: boolean
  isStudent: boolean
  onRefresh: () => void
}) {
  const [showSubmission, setShowSubmission] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)

  const dueDate = new Date(assignment.dueDate)
  const isOverdue = dueDate < new Date() && !assignment.submission
  const hasSubmission = assignment.submission !== null
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
      <div className="p-4 sm:p-6">
        {/* Assignment Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 sm:mb-6 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center ${
                hasSubmission ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <DocumentTextIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  hasSubmission ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{assignment.title}</h3>
                  {isInstructor && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      assignment.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {assignment.isActive ? 'Published' : 'Draft'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {hasSubmission && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Submitted
                    </span>
                  )}
                  {isOverdue && !hasSubmission && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      Overdue
                    </span>
                  )}
                  {!isOverdue && !hasSubmission && daysUntilDue <= 3 && daysUntilDue > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      Due Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4 text-sm sm:text-base">{assignment.description}</p>
          </div>
          
          {/* Assignment Meta */}
          <div className="lg:text-right lg:ml-6 flex flex-row lg:flex-col gap-3 lg:gap-3">
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 flex-1 lg:flex-none">
              <div className="text-xs sm:text-sm text-slate-500 mb-1">Due Date</div>
              <div className="font-semibold text-slate-800 text-sm sm:text-base">
                {dueDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {!isOverdue && (
                <div className="text-xs text-slate-500 mt-1">
                  {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Due today'}
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 flex-1 lg:flex-none">
              <div className="text-xs sm:text-sm text-slate-500 mb-1">Points</div>
              <div className="font-semibold text-slate-800 text-sm sm:text-base">{assignment.maxPoints}</div>
            </div>
            {isInstructor && (
              <button
                onClick={() => setShowSubmissions(!showSubmissions)}
                className="lg:mt-3 w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                View Submissions
              </button>
            )}
          </div>
        </div>

        {/* Student Submission Section */}
        {isStudent && (
          <div className="border-t border-slate-200 pt-6">
            {hasSubmission ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">Assignment Submitted</div>
                        <div className="text-sm text-green-600">
                          Submitted on {new Date(assignment.submission!.submittedAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {assignment.submission!.fileName && (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-white rounded-lg border">
                        <PaperClipIcon className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">{assignment.submission!.fileName}</span>
                      </div>
                    )}
                    
                    {assignment.submission!.content && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-slate-700 mb-2">Submission Content:</div>
                        <div className="p-3 bg-white rounded-lg border text-sm text-slate-600">
                          {assignment.submission!.content}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {assignment.submission!.grade !== null && (
                    <div className="ml-6 text-center">
                      <div className="bg-white rounded-xl p-4 border shadow-sm">
                        <div className="text-2xl font-bold text-slate-800 mb-1">
                          {assignment.submission!.grade}/{assignment.maxPoints}
                        </div>
                        <div className="text-sm text-slate-500">Grade</div>
                        <div className={`text-xs font-semibold mt-2 px-2 py-1 rounded-full ${
                          (assignment.submission!.grade / assignment.maxPoints) >= 0.9 
                            ? 'bg-green-100 text-green-700'
                            : (assignment.submission!.grade / assignment.maxPoints) >= 0.7
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round((assignment.submission!.grade / assignment.maxPoints) * 100)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {assignment.submission!.feedback && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">Instructor Feedback:</div>
                    <div className="text-blue-700">{assignment.submission!.feedback}</div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowSubmission(!showSubmission)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {showSubmission ? 'Hide Submission Details' : 'View/Edit Submission'}
                </button>
              </div>
            ) : (
              <div className={`rounded-xl p-6 border-2 border-dashed ${
                isOverdue ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
              }`}>
                <div className="text-center">
                  <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isOverdue ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <DocumentTextIcon className={`h-8 w-8 ${
                      isOverdue ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className={`text-lg font-semibold mb-2 ${
                    isOverdue ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {isOverdue ? 'Assignment Overdue' : 'Ready to Submit'}
                  </div>
                  <div className={`text-sm mb-4 ${
                    isOverdue ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {isOverdue 
                      ? 'This assignment is past due. Late submissions may be penalized.'
                      : 'Click below to start working on this assignment.'
                    }
                  </div>
                  <button
                    onClick={() => setShowSubmission(!showSubmission)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isOverdue 
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {showSubmission ? 'Hide Submission Form' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructor View */}
        {isInstructor && showSubmissions && (
          <div className="border-t border-slate-200 pt-6 mt-6">
            <InstructorSubmissionsList assignmentId={assignment.id} />
          </div>
        )}
      </div>

      {/* Assignment Submission Component */}
      {showSubmission && isStudent && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="p-6">
            <AssignmentSubmission
              assignmentId={assignment.id}
              assignmentTitle={assignment.title}
              assignmentDescription={assignment.description}
              dueDate={assignment.dueDate}
              maxPoints={assignment.maxPoints}
              onSubmissionSuccess={() => {
                setShowSubmission(false)
                onRefresh()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Instructor Submissions List Component
function InstructorSubmissionsList({ assignmentId }: { assignmentId: string }) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [assignmentId])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions?assignmentId=${assignmentId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-300">Loading submissions...</div>
  }

  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium">Student Submissions ({submissions.length})</h4>
      {submissions.length > 0 ? (
        submissions.map((submission) => (
          <div key={submission.id} className="bg-white/5 rounded p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white text-sm font-medium">{submission.student?.name}</div>
                <div className="text-gray-400 text-xs">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
                {submission.fileName && (
                  <div className="text-gray-300 text-xs mt-1">
                    <PaperClipIcon className="h-3 w-3 inline mr-1" />
                    {submission.fileName}
                  </div>
                )}
              </div>
              <div className="text-right">
                {submission.grade !== null ? (
                  <span className="text-green-400 font-bold text-sm">
                    {submission.grade}/{submission.assignment?.maxPoints}
                  </span>
                ) : (
                  <span className="text-yellow-400 text-xs">Pending</span>
                )}
              </div>
            </div>
            {submission.content && (
              <div className="text-gray-300 text-xs mt-2 bg-white/10 rounded p-2">
                {submission.content.substring(0, 100)}...
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-gray-400 text-sm text-center py-4">
          No submissions yet
        </div>
      )}
    </div>
  )
}

// New Assignment Modal (for instructors)
function NewAssignmentModal({ courseId, onClose, onSuccess }: {
  courseId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100,
    isPublished: true // Default to published so students can see it immediately
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          courseId,
          dueDate: new Date(formData.dueDate).toISOString()
        })
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Create New Assignment</h2>
                <p className="text-blue-100 text-xs sm:text-sm">Design engaging content for your students</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Assignment Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Enter a descriptive title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              rows={4}
              placeholder="Provide clear instructions and requirements..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date & Time</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Max Points</label>
              <input
                type="number"
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                min="1"
                max="1000"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <label htmlFor="isPublished" className="text-sm font-semibold text-blue-800 cursor-pointer">
                  Publish immediately
                </label>
                <p className="text-xs text-blue-600 mt-1">
                  Students will be able to see and submit to this assignment right away. 
                  You can unpublish it later if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 sm:py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Course Overview Component
function CourseOverview({ course }: { course: Course }) {
  return (
    <div className="space-y-8">
      {/* Course Description */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookOpenIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">About This Course</h2>
            <p className="text-slate-600">Learn what you'll gain from this educational experience</p>
          </div>
        </div>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed text-lg">{course.description}</p>
        </div>
      </div>

      {/* Course Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Information */}
        {course.schedules && course.schedules.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Class Schedule</h3>
            </div>
            <div className="space-y-4">
              {course.schedules.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{schedule.dayOfWeek}</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]}
                      </div>
                      <div className="text-sm text-slate-600">{schedule.startTime} - {schedule.endTime}</div>
                    </div>
                  </div>
                  {schedule.room && (
                    <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full">
                      {schedule.room}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Course Metrics</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{course.assignments?.length || 0}</div>
              <div className="text-sm text-blue-700 font-medium">Assignments</div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

// Assignments Tab Component
function AssignmentsTab({ course, isInstructor, isStudent, onRefresh }: {
  course: Course
  isInstructor: boolean
  isStudent: boolean
  onRefresh: () => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredAssignments = course.assignments?.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'pending' && isStudent) {
      return matchesSearch && !assignment.submission
    }
    if (filterStatus === 'submitted' && isStudent) {
      return matchesSearch && assignment.submission
    }
    if (filterStatus === 'graded' && isStudent) {
      return matchesSearch && assignment.submission?.grade !== null
    }
    if (filterStatus === 'overdue' && isStudent) {
      return matchesSearch && new Date(assignment.dueDate) < new Date() && !assignment.submission
    }
    
    return matchesSearch
  }) || []

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      {(course.assignments?.length > 0 || isInstructor) && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {isStudent && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Assignments</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            )}
            {isInstructor && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Assignments</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            )}
          </div>
          
          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredAssignments.length}</span> of <span className="font-semibold">{course.assignments?.length || 0}</span> assignments
              {searchTerm && (
                <span className="text-blue-600"> matching "<span className="font-medium">{searchTerm}</span>"</span>
              )}
            </div>
            {isStudent && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">Submitted</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <span className="text-slate-600">Overdue</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {filteredAssignments.length > 0 ? (
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isInstructor={isInstructor}
              isStudent={isStudent}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ) : course.assignments?.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No assignments match your search</h3>
          <p className="text-slate-600 mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {isInstructor ? 'Ready to create your first assignment?' : 'No assignments yet'}
          </h3>
          <p className="text-slate-600">
            {isInstructor 
              ? 'Click the "New Assignment" button to get started and engage your students.' 
              : 'Your instructor hasn\'t created any assignments yet. Check back soon!'
            }
          </p>
        </div>
      )}
    </div>
  )
}

// Submissions Tab Component (Instructor View)
function SubmissionsTab({ courseId }: { courseId: string }) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSubmissions()
  }, [courseId])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions?courseId=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.assignment?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'pending') return matchesSearch && submission.grade === null
    if (filterStatus === 'graded') return matchesSearch && submission.grade !== null
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-2 text-white">Loading submissions...</span>
      </div>
    )
  }

  const pendingCount = submissions.filter(s => s.grade === null).length
  const gradedCount = submissions.filter(s => s.grade !== null).length
  
  return (
    <div className="space-y-6">
      {/* Grading Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{pendingCount}</div>
              <div className="text-sm text-yellow-400">Pending Reviews</div>
            </div>
          </div>
        </div>
        <div className="bg-green-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-green-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{gradedCount}</div>
              <div className="text-sm text-green-400">Graded</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{submissions.length}</div>
              <div className="text-sm text-blue-400">Total Submissions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Student Submissions</h2>
          {pendingCount > 0 && (
            <button
              onClick={() => setFilterStatus('pending')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Review {pendingCount} Pending
            </button>
          )}
        </div>

        {/* Search and Filter Bar */}
        {submissions.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by student name or assignment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Review</option>
                <option value="graded">Graded</option>
              </select>
            </div>
            
            <div className="mt-3 text-sm text-gray-300">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </div>
        )}
        
        {filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onGraded={fetchSubmissions}
              />
            ))}
          </div>
        ) : submissions.length > 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No submissions match your search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No submissions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Students Tab Component (Instructor View)
function StudentsTab({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [courseId])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/students`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-2 text-white">Loading students...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Summary */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Enrolled Students ({students.length})</h2>
          <div className="flex gap-2">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
              Export List
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              Send Message
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {students.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            <div className="mt-3 text-sm text-gray-300">
              Showing {filteredStudents.length} of {students.length} students
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </div>
        )}
        
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {student.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{student.name}</div>
                    <div className="text-gray-300 text-sm">{student.email}</div>
                    <div className="flex gap-2 mt-2">
                      <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                        View Progress
                      </button>
                      <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length > 0 ? (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No students match your search criteria.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No students enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Submission Card Component (for instructor grading)
function SubmissionCard({ submission, onGraded }: {
  submission: any
  onGraded: () => void
}) {
  const [showGrading, setShowGrading] = useState(false)
  const [grade, setGrade] = useState(submission.grade || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [grading, setGrading] = useState(false)

  const handleGrade = async () => {
    setGrading(true)
    try {
      const response = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: parseInt(grade), feedback })
      })

      if (response.ok) {
        setShowGrading(false)
        onGraded()
      }
    } catch (error) {
      console.error('Error grading submission:', error)
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-white font-medium">{submission.student?.name}</div>
          <div className="text-gray-300 text-sm">{submission.assignment?.title}</div>
          <div className="text-gray-400 text-xs">
            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          {submission.grade !== null ? (
            <div className="text-green-400 font-bold">
              {submission.grade}/{submission.assignment?.maxPoints}
            </div>
          ) : (
            <span className="text-yellow-400 text-sm">Pending</span>
          )}
        </div>
      </div>

      {submission.content && (
        <div className="bg-white/5 rounded p-3 mb-3">
          <div className="text-gray-300 text-sm">{submission.content}</div>
        </div>
      )}

      {submission.fileName && (
        <div className="flex items-center text-sm text-gray-300 mb-3">
          <PaperClipIcon className="h-4 w-4 mr-2" />
          <a 
            href={submission.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            {submission.fileName}
          </a>
        </div>
      )}

      {submission.feedback && (
        <div className="bg-blue-900/20 rounded p-3 mb-3">
          <div className="text-blue-400 text-sm font-medium mb-1">Feedback:</div>
          <div className="text-gray-300 text-sm">{submission.feedback}</div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowGrading(!showGrading)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          {submission.grade !== null ? 'Update Grade' : 'Grade'}
        </button>
      </div>

      {showGrading && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Grade</label>
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                max={submission.assignment?.maxPoints}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Max Points</label>
              <div className="px-3 py-2 bg-gray-600 rounded text-gray-300">
                {submission.assignment?.maxPoints}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              rows={3}
              placeholder="Optional feedback for the student..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGrade}
              disabled={grading || !grade}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded"
            >
              {grading ? 'Saving...' : 'Save Grade'}
            </button>
            <button
              onClick={() => setShowGrading(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Announcements Tab Component
function AnnouncementsTab({ courseId, isInstructor, isStudent }: {
  courseId: string
  isInstructor: boolean
  isStudent: boolean
}) {
  const [announcements, setAnnouncements] = useState<LocalAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [courseId])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/announcements`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        // If API fails, show empty state instead of mock data
        console.error('Failed to fetch announcements:', response.statusText)
        setAnnouncements([])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (announcementData: any) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      })

      if (response.ok) {
        await fetchAnnouncements()
        setShowNewAnnouncement(false)
      } else {
        console.error('Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'normal': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <MegaphoneIcon className="h-5 w-5 text-red-500" />
      case 'normal': return <SpeakerWaveIcon className="h-5 w-5 text-blue-500" />
      case 'low': return <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
      default: return <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-white">Loading announcements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MegaphoneIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            Course Announcements
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Stay updated with the latest course information and updates
          </p>
        </div>
        
        {isInstructor && (
          <button
            onClick={() => setShowNewAnnouncement(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base font-semibold shadow-lg"
          >
            <MegaphoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">New Announcement</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {announcements.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 sm:h-24 sm:w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MegaphoneIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">No announcements yet</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {isInstructor 
                  ? "You haven't created any announcements for this course yet. Keep your students informed with important updates and information."
                  : "Your instructor hasn't posted any announcements yet. Check back here for important course updates and information."
                }
              </p>
              {isInstructor && (
                <button
                  onClick={() => setShowNewAnnouncement(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors gap-2 font-semibold shadow-lg"
                >
                  <MegaphoneIcon className="h-5 w-5" />
                  Create First Announcement
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 sm:p-6 border-l-4 ${getPriorityColor(announcement.priority)} hover:bg-slate-50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      {getPriorityIcon(announcement.priority)}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                        {announcement.title}
                        {announcement.isImportant && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                            Important
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span>By {announcement.author.name}</span>
                        <span>•</span>
                        <span>{formatDate(announcement.createdAt)}</span>
                        <span>•</span>
                        <span className="capitalize">{announcement.priority} priority</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-slate-700 leading-relaxed whitespace-pre-line pl-13">
                  {announcement.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      {showNewAnnouncement && (
        <NewAnnouncementModal
          courseId={courseId}
          onClose={() => setShowNewAnnouncement(false)}
          onSuccess={handleCreateAnnouncement}
        />
      )}
    </div>
  )
}

// New Announcement Modal Component
function NewAnnouncementModal({ courseId, onClose, onSuccess }: {
  courseId: string
  onClose: () => void
  onSuccess: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    isImportant: false,
    isDraft: false
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      return
    }

    setSubmitting(true)
    await onSuccess(formData)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MegaphoneIcon className="h-6 w-6 text-blue-400" />
            Create New Announcement
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Announcement title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Write your announcement content here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData(prev => ({ ...prev, isImportant: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">Mark as Important</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>              <button
                type="submit"
                disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : formData.isDraft ? 'Save Draft' : 'Create Announcement'}
              </button>
          </div>
        </form>
      </div>
    </div>
  )
}
