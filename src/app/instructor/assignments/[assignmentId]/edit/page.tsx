'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  courseTitle: string
  dueDate: string | null
  maxPoints: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface AssignmentEditPageProps {
  params: Promise<{
    assignmentId: string
  }>
}

export default function AssignmentEditPage({ params }: AssignmentEditPageProps) {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [assignmentId, setAssignmentId] = useState<string>('')
  const router = useRouter()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '23:59',
    maxPoints: '',
    isPublished: false
  })

  // Resolve params
  useEffect(() => {
    params.then(({ assignmentId: paramAssignmentId }) => {
      setAssignmentId(paramAssignmentId)
    })
  }, [params])

  useEffect(() => {
    if (session?.user?.role !== 'INSTRUCTOR') {
      router.push('/dashboard')
      return
    }
    
    fetchAssignment()
  }, [assignmentId, session])

  const fetchAssignment = async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/assignments/${assignmentId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Assignment not found')
        } else if (response.status === 403) {
          setError('You do not have permission to edit this assignment')
        } else {
          setError('Failed to load assignment')
        }
        return
      }

      const data = await response.json()
      setAssignment(data)
      
      // Parse due date
      let dueDate = ''
      let dueTime = '23:59'
      if (data.dueDate) {
        const date = new Date(data.dueDate)
        dueDate = date.toISOString().split('T')[0]
        dueTime = date.toTimeString().slice(0, 5)
      }
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        dueDate,
        dueTime,
        maxPoints: data.maxPoints?.toString() || '',
        isPublished: data.isPublished || false
      })
    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear messages when user starts editing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Assignment title is required')
        setSaving(false)
        return
      }

      if (!formData.description.trim()) {
        setError('Assignment description is required')
        setSaving(false)
        return
      }

      // Prepare due date
      let dueDate: string | null = null
      if (formData.dueDate && formData.dueTime) {
        dueDate = `${formData.dueDate}T${formData.dueTime}:00.000Z`
      }

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          dueDate,
          maxPoints: formData.maxPoints ? parseInt(formData.maxPoints) : null,
          isPublished: formData.isPublished
        }),
      })

      if (response.ok) {
        const updatedAssignment = await response.json()
        setAssignment(updatedAssignment)
        setSuccess('Assignment updated successfully!')
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/instructor/assignments')
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      setError('Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  if (session?.user?.role !== 'INSTRUCTOR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center">
        <div className="text-emerald-100 text-xl">Access denied. Instructors only.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center">
        <div className="text-emerald-100 text-xl">Loading assignment...</div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            href="/instructor/assignments"
            className="mt-4 inline-flex items-center text-emerald-300 hover:text-emerald-100"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Assignments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-green-700/50 backdrop-blur-sm border-b border-emerald-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/instructor/assignments"
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-emerald-100">Edit Assignment</h1>
              <p className="text-emerald-200 mt-2">Course: {assignment?.courseTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {assignment?.isPublished ? (
                <div className="flex items-center text-emerald-300">
                  <EyeIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">Published</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-300">
                  <EyeSlashIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">Draft</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20">
          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assignment Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-emerald-100 mb-2">
                <ClipboardDocumentListIcon className="h-5 w-5 inline mr-2" />
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-emerald-700/30 border border-emerald-500/30 rounded-lg text-emerald-100 placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                placeholder="Enter assignment title"
                required
              />
            </div>

            {/* Assignment Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-emerald-100 mb-2">
                <BookOpenIcon className="h-5 w-5 inline mr-2" />
                Description *
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 bg-emerald-700/30 border border-emerald-500/30 rounded-lg text-emerald-100 placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-vertical"
                placeholder="Describe the assignment requirements, objectives, and any special instructions..."
                required
              />
            </div>

            {/* Due Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-emerald-100 mb-2">
                  <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-4 py-3 bg-emerald-700/30 border border-emerald-500/30 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-emerald-100 mb-2">
                  Due Time
                </label>
                <input
                  type="time"
                  id="dueTime"
                  value={formData.dueTime}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                  className="w-full px-4 py-3 bg-emerald-700/30 border border-emerald-500/30 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Max Points */}
            <div>
              <label htmlFor="maxPoints" className="block text-sm font-medium text-emerald-100 mb-2">
                Maximum Points
              </label>
              <input
                type="number"
                id="maxPoints"
                min="1"
                max="1000"
                value={formData.maxPoints}
                onChange={(e) => handleInputChange('maxPoints', e.target.value)}
                className="w-full px-4 py-3 bg-emerald-700/30 border border-emerald-500/30 rounded-lg text-emerald-100 placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                placeholder="e.g., 100"
              />
            </div>

            {/* Publish Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-emerald-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-emerald-100">
                Publish assignment (students can see and submit)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Assignment'
                )}
              </button>
              
              <Link
                href="/instructor/assignments"
                className="px-6 py-3 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-100 rounded-lg font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
