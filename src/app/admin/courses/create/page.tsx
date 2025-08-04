'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  AcademicCapIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  name: string
  email: string
  createdAt: string
}

interface CourseFormData {
  title: string
  instructorId: string
  description: string
  duration: number
  durationUnit: 'weeks' | 'months'
  startDate: string
  weeklySchedule: {
    days: string[]
    startTime: string
    endTime: string
  }
  timezone: string
  price: number
  level: 'beginner' | 'intermediate' | 'advanced'
  capacity: number
}

export default function CreateCoursePage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    instructorId: '',
    description: '',
    duration: 8,
    durationUnit: 'weeks',
    startDate: '',
    weeklySchedule: {
      days: [],
      startTime: '09:00',
      endTime: '11:00'
    },
    timezone: 'Eastern Time',
    price: 0,
    level: 'beginner',
    capacity: 20
  })

  // Redirect if not authenticated or not admin
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstructors()
    }
  }, [status])

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/admin/instructors')
      if (!response.ok) {
        throw new Error('Failed to fetch instructors')
      }
      const instructorsData = await response.json()
      setInstructors(instructorsData)
    } catch (error) {
      console.error('Error fetching instructors:', error)
      setInstructors([])
      setErrors(prev => ({ 
        ...prev, 
        instructors: 'Failed to load instructors. Please refresh the page.' 
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CourseFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleScheduleChange = (field: keyof CourseFormData['weeklySchedule'], value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: { ...prev.weeklySchedule, [field]: value }
    }))
  }

  const handleDaysChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        days: checked 
          ? [...prev.weeklySchedule.days, day]
          : prev.weeklySchedule.days.filter(d => d !== day)
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    }

    if (!formData.instructorId) {
      newErrors.instructorId = 'Please select an instructor'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    } else {
      const startDate = new Date(formData.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) {
        newErrors.startDate = 'Start date must be today or in the future'
      }
    }

    if (formData.weeklySchedule.days.length === 0) {
      newErrors.schedule = 'Please select at least one day of the week'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructorId: formData.instructorId,
        duration: formData.duration,
        durationUnit: formData.durationUnit,
        price: formData.price,
        level: formData.level.toUpperCase(),
        capacity: formData.capacity,
        startDate: formData.startDate,
        schedule: formData.weeklySchedule,
        timezone: formData.timezone
      }

      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create course')
      }

      // Redirect to admin courses with success message
      router.push('/admin/courses?created=true')
      
    } catch (error) {
      console.error('Error creating course:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create course' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  const timezones = [
    'Eastern Time',
    'Central Time',
    'Mountain Time',
    'Pacific Time',
    'UTC',
    'GMT',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai'
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <AcademicCapIcon className="h-8 w-8 text-green-400" />
                Хичээл үүсгэх
              </h1>
              <p className="text-gray-300 mt-2">Create a new course with detailed scheduling</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {instructors.length === 0 && !loading ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Instructors Available</h3>
            <p className="text-gray-300 mb-6">
              You need to have users with instructor role in the system before creating courses.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/admin')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Back to Admin Dashboard
              </button>
              <button
                onClick={() => {
                  setLoading(true)
                  fetchInstructors()
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Refresh Instructors
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3">
                Course Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Enter course title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Instructor Selection */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3">
                Instructor
              </label>
              <select
                value={formData.instructorId}
                onChange={(e) => handleInputChange('instructorId', e.target.value)}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.instructorId ? 'border-red-500' : 'border-white/20'
                }`}
              >
                <option value="">Select an instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.email})
                  </option>
                ))}
              </select>
              {errors.instructorId && (
                <p className="text-red-400 text-sm mt-1">{errors.instructorId}</p>
              )}
            </div>

            {/* Description */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Describe what students will learn in this course"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Duration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3">
                Duration
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  className={`flex-1 bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.duration ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="8"
                />
                <select
                  value={formData.durationUnit}
                  onChange={(e) => handleInputChange('durationUnit', e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              {errors.duration && (
                <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="yyyy.mm.dd"
              />
              {errors.startDate && (
                <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-purple-400" />
                Weekly Schedule
              </h3>
              
              <div className="space-y-6">
                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select days of the week:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {daysOfWeek.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.weeklySchedule.days.includes(day.value)}
                          onChange={(e) => handleDaysChange(day.value, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-300 text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.schedule && (
                    <p className="text-red-400 text-sm mt-1">{errors.schedule}</p>
                  )}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.weeklySchedule.startTime}
                      onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.weeklySchedule.endTime}
                      onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-400" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <label className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="0"
                />
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Level */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <label className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-purple-400" />
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <label className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-orange-400" />
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="20"
              />
              {errors.capacity && (
                <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Course...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    Create Course
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}