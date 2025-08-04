'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

interface NewAssignmentPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100
  })

  // Resolve params
  useEffect(() => {
    params.then(({ courseId: paramCourseId }) => {
      setCourseId(paramCourseId)
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          courseId: courseId
        }),
      })

      if (response.ok) {
        router.push(`/instructor/courses/${courseId}/assignments`)
      } else {
        const error = await response.json()
        alert('Error creating assignment: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxPoints' ? parseInt(value) || 0 : value
    }))
  }

  if (session?.user?.role !== 'INSTRUCTOR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center">
        <div className="text-emerald-100 text-xl">Access denied. Instructors only.</div>
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
              href={courseId ? `/instructor/courses/${courseId}/assignments` : '#'}
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-emerald-100">Create Assignment</h1>
              <p className="text-emerald-200 mt-2">Add a new assignment for your course</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-emerald-800/20 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assignment Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-emerald-100 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., JavaScript Functions Quiz"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-emerald-100 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Provide detailed instructions for the assignment..."
              />
            </div>

            {/* Due Date and Max Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-emerald-100 mb-2">
                  Due Date *
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-400" />
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    required
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maxPoints" className="block text-sm font-medium text-emerald-100 mb-2">
                  Maximum Points
                </label>
                <input
                  type="number"
                  id="maxPoints"
                  name="maxPoints"
                  min="1"
                  max="1000"
                  value={formData.maxPoints}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-emerald-800/30 border border-emerald-500/20 rounded-lg text-emerald-100 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Link
                href={courseId ? `/instructor/courses/${courseId}/assignments` : '#'}
                className="px-6 py-3 border border-emerald-500/30 text-emerald-200 rounded-lg hover:bg-emerald-800/30 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <ClipboardDocumentListIcon className="h-5 w-5" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
