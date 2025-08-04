'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Schedule {
  id: string
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  course: {
    id: string
    title: string
    level: string
    price: number
    startDate: string
    instructor?: string
  }
}

interface ScheduleFormData {
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Course {
  id: string
  title: string
  level: string
  instructor: string
}

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const dayNameMap: { [key: number]: string } = {
  0: 'Sunday',
  1: 'Monday', 
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

export default function AdminSchedules() {
  const { data: session, status } = useSession()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState<ScheduleFormData>({
    courseId: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        redirect('/dashboard')
        return
      }
      fetchData()
    } else if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status, session])

  useEffect(() => {
    filterSchedules()
  }, [schedules, searchTerm, selectedDay])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [schedulesResponse, coursesResponse] = await Promise.all([
        fetch('/api/admin/schedules'),
        fetch('/api/admin/courses/list')
      ])

      if (!schedulesResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [schedulesData, coursesData] = await Promise.all([
        schedulesResponse.json(),
        coursesResponse.json()
      ])

      setSchedules(schedulesData)
      setCourses(coursesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load schedules. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterSchedules = () => {
    const filtered = schedules.filter(schedule => {
      const matchesSearch = 
        schedule.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (schedule.course.instructor && schedule.course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const dayName = dayNameMap[schedule.dayOfWeek]
      const matchesDay = selectedDay === 'all' || dayName === selectedDay

      return matchesSearch && matchesDay && schedule.isActive
    })

    // Sort by day of week and then by start time
    filtered.sort((a, b) => {
      const dayCompare = a.dayOfWeek - b.dayOfWeek
      if (dayCompare !== 0) return dayCompare
      return a.startTime.localeCompare(b.startTime)
    })

    setFilteredSchedules(filtered)
  }

  const resetForm = () => {
    setFormData({
      courseId: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: ''
    })
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create schedule')
      }

      const newSchedule = await response.json()
      setSchedules([...schedules, newSchedule])
      setShowCreateModal(false)
      resetForm()
      setError(null)
    } catch (error) {
      console.error('Error creating schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to create schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSchedule) return

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/admin/schedules/${selectedSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update schedule')
      }

      const updatedSchedule = await response.json()
      setSchedules(schedules.map(s => s.id === selectedSchedule.id ? updatedSchedule : s))
      setShowEditModal(false)
      setSelectedSchedule(null)
      resetForm()
    } catch (error) {
      console.error('Error updating schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to update schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (schedule: Schedule) => {
    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      setSchedules(schedules.filter(s => s.id !== schedule.id))
      setShowDeleteDialog(false)
      setScheduleToDelete(null)
    } catch (error) {
      console.error('Error deleting schedule:', error)
      setError('Failed to delete schedule. Please try again.')
    }
  }

  const openEditModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setFormData({
      courseId: schedule.courseId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    })
    setShowEditModal(true)
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Schedule Management</h1>
              <p className="text-gray-300 mt-2">Manage class schedules and time slots</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Schedule</span>
            </button>
          </div>
        </div>

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
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all" className="bg-gray-800">All Days</option>
            {daysOfWeek.map(day => (
              <option key={day} value={day} className="bg-gray-800">{day}</option>
            ))}
          </select>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 flex items-center justify-center">
            <span className="text-white font-medium">{filteredSchedules.length}</span>
            <span className="text-gray-300 ml-1">schedules</span>
          </div>
        </div>

        {/* Schedules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{schedule.course.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{dayNameMap[schedule.dayOfWeek]}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                    </div>
                    {schedule.course.instructor && (
                      <div className="flex items-center text-sm text-gray-300">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{schedule.course.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(schedule)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="Edit Schedule"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setScheduleToDelete(schedule)
                      setShowDeleteDialog(true)
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete Schedule"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-medium rounded border ${
                  schedule.course.level === 'Beginner' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  schedule.course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {schedule.course.level}
                </span>
                <span className="text-white font-bold">${schedule.course.price}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredSchedules.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No schedules found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {searchTerm || selectedDay !== 'all' ? 'Try adjusting your filters.' : 'Create your first schedule to get started.'}
            </p>
          </div>
        )}

        {/* Create/Edit Schedule Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={showCreateModal ? handleCreateSchedule : handleEditSchedule} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {showCreateModal ? 'Create Schedule' : 'Edit Schedule'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowEditModal(false)
                      setSelectedSchedule(null)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="" className="bg-gray-800">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id} className="bg-gray-800">
                          {course.title} ({course.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Day of Week</label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={day} value={index} className="bg-gray-800">
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                      <select
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="" className="bg-gray-800">Start</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time} className="bg-gray-800">
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                      <select
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="" className="bg-gray-800">End</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time} className="bg-gray-800">
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowEditModal(false)
                      setSelectedSchedule(null)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {submitting ? 'Saving...' : (showCreateModal ? 'Create' : 'Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && scheduleToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Delete Schedule</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete the schedule for <strong>{scheduleToDelete.course.title}</strong> on <strong>{dayNameMap[scheduleToDelete.dayOfWeek]}</strong>? 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false)
                      setScheduleToDelete(null)
                    }}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(scheduleToDelete)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
