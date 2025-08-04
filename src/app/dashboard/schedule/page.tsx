'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSchedule } from '@/contexts/ScheduleContext'
import { getCurrentMongoliaTime, toMongoliaTime, formatMongoliaDateShort } from '@/lib/timezone'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ScheduleEvent {
  id: string
  title: string
  courseTitle: string
  startTime: string
  endTime: string
  date: string
  instructor: string
  type: 'CLASS' | 'ASSIGNMENT'
  isEnrolled: boolean
  courseId: string
  description?: string
  assignmentId?: string
  maxPoints?: number
  color?: string
}

export default function Schedule() {
  const { data: session } = useSession()
  const { events, refreshSchedule, loading, error } = useSchedule()
  const [currentDate, setCurrentDate] = useState(getCurrentMongoliaTime())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  useEffect(() => {
    // Refresh schedule when component mounts or date changes
    refreshSchedule()
  }, [currentDate, refreshSchedule])

  // Auto-refresh every 30 seconds to catch new courses/assignments
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSchedule()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [refreshSchedule])

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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load schedule</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshSchedule}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Helper function to format dates in Mongolia timezone consistently
  const formatDateForComparison = (date: Date): string => {
    const mongoliaDate = toMongoliaTime(date)
    return mongoliaDate.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Ulaanbaatar',
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  const getWeekDays = (date: Date): Date[] => {
    const days = []
    // Use Mongolia timezone for consistent week calculation
    const mongoliaDate = toMongoliaTime(date)
    const monday = new Date(mongoliaDate)
    
    // Get Monday of current week in Mongolia timezone
    const dayOfWeek = monday.getDay()
    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    monday.setDate(diff)
    
    // Generate 7 days starting from Monday (removed offset for now)
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  const getEventsForDate = (date: Date): ScheduleEvent[] => {
    // Format date in Mongolia timezone to match backend format
    const dateStr = formatDateForComparison(date)
    return events.filter(event => event.date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = toMongoliaTime(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(getCurrentMongoliaTime())
  }

  const weekDays = getWeekDays(currentDate)
  
  const getTodaysEvents = () => {
    const today = getCurrentMongoliaTime()
    return getEventsForDate(today)
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              <p className="mt-1 text-sm text-gray-600">
                View your upcoming classes and events (Mongolia Time)
              </p>
              {/* Debug info to check day alignment */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  Debug: Week days - {weekDays.map((day, i) => `${dayNames[i]}: ${formatDateForComparison(day)}`).join(', ')}
                  <br />
                  Available events: {events.map(e => `${e.title} on ${e.date}`).join(', ')}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refreshSchedule()}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-2 rounded-l-md text-sm font-medium ${
                    viewMode === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-2 rounded-r-md text-sm font-medium border-l ${
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

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {formatMongoliaDateShort(weekDays[0])} - {formatMongoliaDateShort(weekDays[6])}
              </h2>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Today
            </button>
          </div>

          {/* Today's Events */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Today's Events ({formatMongoliaDateShort(getCurrentMongoliaTime())})
            </h3>
            <div className="space-y-4">
              {getTodaysEvents().length > 0 ? (
                getTodaysEvents().map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{event.courseTitle}</p>
                        
                        <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {event.startTime} - {event.endTime}
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

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-7 gap-0 border-b">
                {weekDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day)
                  const isToday = formatDateForComparison(day) === formatDateForComparison(getCurrentMongoliaTime())
                  
                  return (
                    <div key={index} className="border-r last:border-r-0 min-h-[300px]">
                      <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="text-sm font-medium text-gray-900">
                          {day.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Ulaanbaatar' })}
                        </div>
                        <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </div>
                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-500">
                            {formatDateForComparison(day)} | Events: {dayEvents.length}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2 space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-2 rounded text-xs ${
                              event.type === 'CLASS' 
                                ? 'bg-blue-100 text-blue-800 border-l-2 border-blue-500' 
                                : 'bg-red-100 text-red-800 border-l-2 border-red-500'
                            }`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">
                              {event.startTime} - {event.endTime}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {event.instructor}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Debug Information:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Current Mongolia Time: {getCurrentMongoliaTime().toString()}</div>
                <div>Events Count: {events.length}</div>
                <div>Today's Events Count: {getTodaysEvents().length}</div>
                <div>Week Range: {formatDateForComparison(weekDays[0])} to {formatDateForComparison(weekDays[6])}</div>
                <div className="mt-2">
                  <strong>All Events:</strong>
                  {events.slice(0, 5).map(event => (
                    <div key={event.id} className="ml-2">
                      {event.title} on {event.date} ({event.startTime}-{event.endTime})
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <strong>Week Days:</strong>
                  {weekDays.map((day, i) => (
                    <div key={i} className="ml-2">
                      {day.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Ulaanbaatar' })}: {formatDateForComparison(day)} (Events: {getEventsForDate(day).length})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
