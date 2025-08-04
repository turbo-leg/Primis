'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface Course {
  id: string
  title: string
  description: string
  enrolledStudents: number
}

interface AssignmentFormData {
  title: string
  description: string
  courseId: string
  dueDate: string
  dueTime: string
  maxPoints: number
  instructions: string
  resources: string[]
  allowLateSubmissions: boolean
  lateSubmissionPenalty: number
}

export default function NewAssignmentPage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newResource, setNewResource] = useState('')

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    dueTime: '23:59',
    maxPoints: 100,
    instructions: '',
    resources: [],
    allowLateSubmissions: false,
    lateSubmissionPenalty: 10
  })

  // Redirect if not authenticated or not instructor
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  if (status === 'authenticated' && session?.user?.role !== 'INSTRUCTOR') {
    redirect('/dashboard')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstructorCourses()
    }
  }, [status])

  const fetchInstructorCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      const allCourses = await response.json()
      
      // Filter courses where the current user is the instructor
      const instructorCourses = allCourses.filter((course: any) => 
        course.instructorId === session?.user?.id
      ).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        enrolledStudents: course._count?.enrollments || 0
      }))
      
      setCourses(instructorCourses)
      
      // Auto-select first course if available
      if (instructorCourses.length > 0) {
        setFormData(prev => ({ ...prev, courseId: instructorCourses[0].id }))
      }
    } catch (error) {
      console.error('Error fetching instructor courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AssignmentFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addResource = () => {
    if (newResource.trim()) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, newResource.trim()]
      }))
      setNewResource('')
    }
  }

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Assignment description is required'
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Please select a course'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    } else {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`)
      if (dueDateTime <= new Date()) {
        newErrors.dueDate = 'Due date must be in the future'
      }
    }

    if (formData.maxPoints <= 0 || formData.maxPoints > 1000) {
      newErrors.maxPoints = 'Points must be between 1 and 1000'
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Assignment instructions are required'
    }

    if (formData.allowLateSubmissions && (formData.lateSubmissionPenalty < 0 || formData.lateSubmissionPenalty > 100)) {
      newErrors.lateSubmissionPenalty = 'Late penalty must be between 0 and 100'
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
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`)
      
      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId,
        dueDate: dueDateTime.toISOString(),
        maxPoints: formData.maxPoints,
        instructions: formData.instructions.trim(),
        resources: formData.resources,
        allowLateSubmissions: formData.allowLateSubmissions,
        lateSubmissionPenalty: formData.allowLateSubmissions ? formData.lateSubmissionPenalty : 0
      }

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      const newAssignment = await response.json()
      
      // Redirect to assignments list with success message
      router.push('/instructor/assignments?created=true')
      
    } catch (error) {
      console.error('Error creating assignment:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create assignment' 
      })
    } finally {
      setSubmitting(false)
    }
  }

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
                <DocumentTextIcon className="h-8 w-8 text-green-400" />
                Create New Assignment
              </h1>
              <p className="text-gray-300 mt-2">Design and publish a new assignment for your students</p>
            </div>
          </div>

          {/* Course Selection Info */}
          {courses.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                You have {courses.length} course{courses.length > 1 ? 's' : ''} available for assignments
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {courses.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Courses Available</h3>
            <p className="text-gray-300 mb-6">You need to have courses assigned to you before creating assignments.</p>
            <button
              onClick={() => router.push('/instructor')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="e.g., Chapter 5 Problem Set"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.courseId ? 'border-red-500' : 'border-white/20'
                    }`}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.enrolledStudents} students)
                      </option>
                    ))}
                  </select>
                  {errors.courseId && (
                    <p className="text-red-400 text-sm mt-1">{errors.courseId}</p>
                  )}
                </div>

                {/* Max Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Points *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.maxPoints}
                    onChange={(e) => handleInputChange('maxPoints', parseInt(e.target.value) || 0)}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxPoints ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.maxPoints && (
                    <p className="text-red-400 text-sm mt-1">{errors.maxPoints}</p>
                  )}
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Brief overview of the assignment..."
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-purple-400" />
                Due Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dueDate ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleInputChange('dueTime', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Late Submissions */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="allowLateSubmissions"
                    checked={formData.allowLateSubmissions}
                    onChange={(e) => handleInputChange('allowLateSubmissions', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowLateSubmissions" className="text-gray-300">
                    Allow late submissions
                  </label>
                </div>

                {formData.allowLateSubmissions && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Late Submission Penalty (% per day)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lateSubmissionPenalty}
                      onChange={(e) => handleInputChange('lateSubmissionPenalty', parseInt(e.target.value) || 0)}
                      className={`w-32 bg-white/10 border rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lateSubmissionPenalty ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.lateSubmissionPenalty && (
                      <p className="text-red-400 text-sm mt-1">{errors.lateSubmissionPenalty}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
                Detailed Instructions
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignment Instructions *
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={8}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.instructions ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Provide detailed instructions for students..."
                />
                {errors.instructions && (
                  <p className="text-red-400 text-sm mt-1">{errors.instructions}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  Be specific about requirements, format, submission guidelines, etc.
                </p>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-orange-400" />
                Resources & References
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    placeholder="Add a resource link or reference..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  />
                  <button
                    type="button"
                    onClick={addResource}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {formData.resources.length > 0 && (
                  <div className="space-y-2">
                    {formData.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                        <span className="flex-1 text-gray-300">{resource}</span>
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
        )}
      </div>
    </div>
  )
}