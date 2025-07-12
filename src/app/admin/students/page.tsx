'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
  enrollments: Array<{
    id: string
    status: string
    enrolledAt: string
    course: {
      id: string
      title: string
      level: string
      price: number
    }
  }>
  _count: {
    enrollments: number
  }
}

type SortField = 'name' | 'email' | 'createdAt' | 'enrollments'
type SortOrder = 'asc' | 'desc'

export default function AdminStudents() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        redirect('/dashboard')
        return
      }
      fetchStudents()
    } else if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status, session])

  useEffect(() => {
    filterAndSortStudents()
  }, [students, searchTerm, sortField, sortOrder])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/students/all')
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to load students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortStudents = () => {
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'enrollments':
          aValue = a._count.enrollments
          bValue = b._count.enrollments
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredStudents(filtered)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete student')
      }

      setStudents(students.filter(s => s.id !== student.id))
      setShowDeleteDialog(false)
      setStudentToDelete(null)
    } catch (error) {
      console.error('Error deleting student:', error)
      setError('Failed to delete student. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'enrolled':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled':
      case 'withdrawn':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchStudents}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
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
              <h1 className="text-3xl font-bold text-white">{t('admin.students.title')}</h1>
              <p className="text-gray-300 mt-2">{t('admin.students.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <span className="text-white font-medium">{filteredStudents.length}</span>
                <span className="text-gray-300 ml-1">students</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.students.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('admin.students.name')}</span>
                      {sortField === 'name' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('common.email')}</span>
                      {sortField === 'email' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('enrollments')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('admin.students.enrollments')}</span>
                      {sortField === 'enrollments' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Joined</span>
                      {sortField === 'createdAt' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('admin.students.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{student.name}</div>
                          <div className="text-sm text-gray-400">Student ID: {student.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="text-sm text-gray-400 flex items-center mt-1">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {student.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-white">{student._count.enrollments} courses</span>
                      </div>
                      {student.enrollments.length > 0 && (
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(student.enrollments[0].status)}`}>
                            {student.enrollments[0].status}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-white">{formatDate(student.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(student)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Student"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No students found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'Try adjusting your search terms.' : 'No students have been created yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Student Details</h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Student Info */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedStudent.name}</h4>
                      <p className="text-gray-300">{selectedStudent.email}</p>
                      <p className="text-gray-400 text-sm">Joined {formatDate(selectedStudent.createdAt)}</p>
                    </div>
                  </div>

                  {/* Enrollments */}
                  <div>
                    <h5 className="text-lg font-semibold text-white mb-4">Enrollments ({selectedStudent.enrollments.length})</h5>
                    {selectedStudent.enrollments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedStudent.enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="font-medium text-white">{enrollment.course.title}</h6>
                                <p className="text-sm text-gray-400">Level: {enrollment.course.level}</p>
                                <p className="text-sm text-gray-400">Enrolled: {formatDate(enrollment.enrolledAt)}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded border ${getStatusColor(enrollment.status)}`}>
                                  {enrollment.status}
                                </span>
                                <p className="text-sm text-gray-300 mt-1">{formatCurrency(enrollment.course.price)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No enrollments yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && studentToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Delete Student</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <strong>{studentToDelete.name}</strong>? 
                  This action cannot be undone and will remove all their enrollments.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false)
                      setStudentToDelete(null)
                    }}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(studentToDelete)}
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