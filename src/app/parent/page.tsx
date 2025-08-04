'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Child {
  id: string
  name: string
  email: string
  phone?: string
  enrollmentCount: number
}

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes?: string
  course: {
    id: string
    title: string
    instructor: string
  }
}

interface AttendanceData {
  child: {
    id: string
    name: string
    email: string
  }
  attendance: {
    records: AttendanceRecord[]
    statistics: {
      totalClasses: number
      presentCount: number
      absentCount: number
      lateCount: number
      excusedCount: number
      attendanceRate: number
    }
  }
}

interface GradeData {
  child: {
    id: string
    name: string
    email: string
  }
  grades: {
    courses: any[]
    overallStatistics: {
      totalAssignments: number
      completedAssignments: number
      totalPoints: number
      earnedPoints: number
      overallGradePercentage: number
    }
  }
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildEmail, setNewChildEmail] = useState('')
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades'>('attendance')

  useEffect(() => {
    if (session?.user?.role === 'PARENT') {
      fetchChildren()
    }
  }, [session])

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.id)
    }
  }, [selectedChild, activeTab])

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children)
        if (data.children.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0])
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildData = async (childId: string) => {
    setLoading(true)
    try {
      if (activeTab === 'attendance') {
        const response = await fetch(`/api/parent/attendance?childId=${childId}`)
        if (response.ok) {
          const data = await response.json()
          setAttendanceData(data)
        }
      } else {
        const response = await fetch(`/api/parent/grades?childId=${childId}`)
        if (response.ok) {
          const data = await response.json()
          setGradeData(data)
        }
      }
    } catch (error) {
      console.error('Error fetching child data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addChild = async () => {
    try {
      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentEmail: newChildEmail })
      })

      if (response.ok) {
        setNewChildEmail('')
        setShowAddChild(false)
        fetchChildren()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add child')
      }
    } catch (error) {
      console.error('Error adding child:', error)
      alert('Failed to add child')
    }
  }

  const sendWeeklyReport = async (childId: string) => {
    try {
      const response = await fetch('/api/parent/weekly-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          parentId: session?.user?.id, 
          studentId: childId,
          force: true 
        })
      })

      if (response.ok) {
        alert('Weekly report sent successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send report')
      }
    } catch (error) {
      console.error('Error sending report:', error)
      alert('Failed to send report')
    }
  }

  if (session?.user?.role !== 'PARENT') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to parents.</p>
        </div>
      </div>
    )
  }

  if (loading && children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor your children's academic progress
              </p>
            </div>
            
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Child</span>
            </button>
          </div>

          {/* Children Selection */}
          {children.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Child
              </label>
              <div className="flex space-x-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedChild?.id === child.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No children added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your child's student email.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddChild(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Child
                </button>
              </div>
            </div>
          ) : selectedChild && (
            <>
              {/* Quick Actions */}
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedChild.name}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedChild.email}</p>
                      <p className="text-sm text-gray-500">
                        Enrolled in {selectedChild.enrollmentCount} courses
                      </p>
                    </div>
                    <button
                      onClick={() => sendWeeklyReport(selectedChild.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                      <span>Send Weekly Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'attendance'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                      Attendance
                    </button>
                    <button
                      onClick={() => setActiveTab('grades')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'grades'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <ChartBarIcon className="h-5 w-5 inline mr-2" />
                      Grades
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'attendance' && attendanceData && (
                    <div className="space-y-6">
                      {/* Attendance Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {attendanceData.attendance.statistics.attendanceRate}%
                            </div>
                            <div className="text-sm text-gray-600">Attendance Rate</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {attendanceData.attendance.statistics.presentCount}
                            </div>
                            <div className="text-sm text-gray-600">Classes Attended</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {attendanceData.attendance.statistics.absentCount}
                            </div>
                            <div className="text-sm text-gray-600">Absences</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {attendanceData.attendance.statistics.totalClasses}
                            </div>
                            <div className="text-sm text-gray-600">Total Classes</div>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Records */}
                      <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Recent Attendance</h3>
                        </div>
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Course
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Instructor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {attendanceData.attendance.records.map((record) => (
                                <tr key={record.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {record.date}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {record.course.title}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {record.course.instructor}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      record.status === 'PRESENT' 
                                        ? 'bg-green-100 text-green-800'
                                        : record.status === 'ABSENT'
                                        ? 'bg-red-100 text-red-800'
                                        : record.status === 'LATE'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {record.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'grades' && gradeData && (
                    <div className="space-y-6">
                      {/* Grade Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {gradeData.grades.overallStatistics.overallGradePercentage}%
                            </div>
                            <div className="text-sm text-gray-600">Overall Grade</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {gradeData.grades.overallStatistics.completedAssignments}
                            </div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {gradeData.grades.overallStatistics.totalAssignments}
                            </div>
                            <div className="text-sm text-gray-600">Total Assignments</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {gradeData.grades.overallStatistics.earnedPoints}/{gradeData.grades.overallStatistics.totalPoints}
                            </div>
                            <div className="text-sm text-gray-600">Points</div>
                          </div>
                        </div>
                      </div>

                      {/* Course Grades */}
                      <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Course Performance</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          {gradeData.grades.courses.map((course) => (
                            <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{course.title}</h4>
                                <span className="text-sm text-gray-500">
                                  Instructor: {course.instructor}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-lg font-semibold text-blue-600">
                                  {course.statistics.gradePercentage}%
                                </span>
                                <span className="text-sm text-gray-600">
                                  {course.statistics.completedAssignments}/{course.statistics.totalAssignments} assignments
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${course.statistics.gradePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Add Child Modal */}
          {showAddChild && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Child</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Email
                    </label>
                    <input
                      type="email"
                      value={newChildEmail}
                      onChange={(e) => setNewChildEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAddChild(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addChild}
                      disabled={!newChildEmail}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Child
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
