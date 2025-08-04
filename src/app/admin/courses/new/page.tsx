'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import { useSchedule } from '@/contexts/ScheduleContext'
import {
  AcademicCapIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  name: string
  email: string
  createdAt: string
  isSelected?: boolean
}

interface CourseFormData {
  title: string
  description: string
  instructorId: string
  duration: number
  durationUnit: 'weeks' | 'months'
  price: number
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  capacity: number
  startDate: string
  schedule: {
    days: string[]
    startTime: string
    endTime: string
  }
}

export default function CreateCoursePage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const { refreshSchedule } = useSchedule()
  
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    instructorId: '',
    duration: 8,
    durationUnit: 'weeks',
    price: 0,
    level: 'BEGINNER',
    capacity: 20,
    startDate: '',
    schedule: {
      days: [],
      startTime: '09:00',
      endTime: '17:00'
    }
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
      
      // Auto-select first instructor if available and none is selected
      if (instructorsData.length > 0 && !formData.instructorId) {
        setFormData(prev => ({ ...prev, instructorId: instructorsData[0].id }))
      }
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

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleScheduleChange = (field: keyof CourseFormData['schedule'], value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }))
  }

  const handleDaysChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: checked 
          ? [...prev.schedule.days, day]
          : prev.schedule.days.filter(d => d !== day)
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    }

    if (!formData.instructorId) {
      newErrors.instructorId = 'Please select an instructor from the available options'
    } else {
      // Validate that the selected instructor actually exists in our list
      const instructorExists = instructors.find(instructor => instructor.id === formData.instructorId)
      if (!instructorExists) {
        newErrors.instructorId = 'Selected instructor is not valid. Please choose from the available instructors.'
      }
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    } else {
      const startDate = new Date(formData.startDate)
      if (startDate <= new Date()) {
        newErrors.startDate = 'Start date must be in the future'
      }
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0'
    }

    if (formData.schedule.days.length === 0) {
      newErrors.schedule = 'Please select at least one day'
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
        level: formData.level,
        capacity: formData.capacity,
        startDate: formData.startDate,
        schedule: formData.schedule
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

      const newCourse = await response.json()
      
      // Refresh schedule data so new course appears immediately
      await refreshSchedule()
      
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
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <AcademicCapIcon className="h-8 w-8 text-green-400" />
                Create New Course
              </h1>
              <p className="text-gray-300 mt-2">Set up a new course with instructor assignment</p>
            </div>
          </div>

          {/* Instructor Info */}
          {instructors.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                {instructors.length} instructor{instructors.length > 1 ? 's' : ''} available for assignment
              </p>
            </div>
          )}

          {/* Error loading instructors */}
          {errors.instructors && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{errors.instructors}</p>
              </div>
              <button
                onClick={() => {
                  setErrors(prev => ({ ...prev, instructors: '' }))
                  setLoading(true)
                  fetchInstructors()
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-blue-400" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="e.g., Introduction to Programming"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Instructor Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Assigned Instructor *
                  </label>
                  <p className="text-xs text-gray-400 mb-4">
                    Select from existing instructors only. Cannot add new instructors here.
                  </p>
                  
                  {/* Instructor Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        onClick={() => handleInputChange('instructorId', instructor.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          formData.instructorId === instructor.id
                            ? 'bg-blue-600/20 border-blue-400 ring-2 ring-blue-400/50'
                            : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-white font-medium text-sm">{instructor.name || 'Unnamed Instructor'}</h3>
                            <p className="text-gray-400 text-xs mt-1">{instructor.email}</p>
                          </div>
                          {formData.instructorId === instructor.id && (
                            <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined: {new Date(instructor.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Clear Selection Button */}
                  {formData.instructorId && (
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => handleInputChange('instructorId', '')}
                        className="text-gray-400 hover:text-white text-sm underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                  
                  {/* Fallback Select for Mobile */}
                  <div className="mt-4 md:hidden">
                    <select
                      value={formData.instructorId}
                      onChange={(e) => handleInputChange('instructorId', e.target.value)}
                      className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.instructorId ? 'border-red-500' : 'border-white/20'
                      }`}
                    >
                      <option value="">Select an existing instructor</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name || 'Unnamed Instructor'} ({instructor.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {errors.instructorId && (
                    <p className="text-red-400 text-sm mt-1">{errors.instructorId}</p>
                  )}
                  
                  {/* Selected Instructor Info */}
                  {formData.instructorId && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 text-sm font-medium">Selected Instructor:</span>
                        <span className="text-white text-sm">
                          {instructors.find(i => i.id === formData.instructorId)?.name || 'Unknown Instructor'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      className={`flex-1 bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.duration ? 'border-red-500' : 'border-white/20'
                      }`}
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

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price ($) *
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
                  />
                  {errors.price && (
                    <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.capacity ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.capacity && (
                    <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Describe what students will learn..."
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule & Timing */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-purple-400" />
                Schedule & Timing
              </h2>

              <div className="space-y-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.startDate ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
                  )}
                </div>

                {/* Days of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Class Days *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {daysOfWeek.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.schedule.days.includes(day.value)}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.startTime}
                      onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.endTime}
                      onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
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