'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface ScheduleEvent {
  id: string
  title: string
  courseTitle: string
  startTime: string
  endTime: string
  date: string
  location: string
  instructor: string
  type: 'CLASS' | 'EXAM' | 'WORKSHOP'
  isEnrolled: boolean
}

export default function Schedule() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const startDate = new Date(currentDate)
      startDate.setDate(startDate.getDate() - 30) // 30 days before
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + 60) // 60 days after

      const response = await fetch(`/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      const data = await response.json()
      setEvents(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => {
              setError(null)
              fetchEvents()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'CLASS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'WORKSHOP':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'EXAM':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              <p className="mt-1 text-sm text-gray-600">
                View your upcoming classes and events
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {formatDate(currentDate)}
              </h2>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map((day, index) => (
                <div key={index} className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {day.getDate()}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    {getEventsForDate(day).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${getEventTypeColor(event.type)} ${
                          !event.isEnrolled ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{event.title}</div>
                        <div className="text-xs text-gray-600 mb-2">
                          {event.courseTitle}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's Events */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Events</h3>
            <div className="space-y-4">
              {getEventsForDate(new Date()).length > 0 ? (
                getEventsForDate(new Date()).map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.courseTitle}</p>
                        
                        <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {event.startTime} - {event.endTime}
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            {event.instructor}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {event.isEnrolled ? (
                          <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                            Join Class
                          </button>
                        ) : (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                            Enroll
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No events today</h4>
                  <p className="text-gray-600">You don't have any classes scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600">{event.courseTitle}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span>{event.startTime} - {event.endTime}</span>
                              <span className="mx-2">•</span>
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h4>
                    <p className="text-gray-600">You don't have any classes scheduled. Enroll in courses to see your schedule here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
