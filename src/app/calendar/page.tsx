'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface CalendarEvent {
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
}

export default function Calendar() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/schedule')
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  }, [session])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't handle if user is typing in an input
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (event.shiftKey) {
            goToPreviousMonth()
          } else {
            goToPreviousWeek()
          }
          event.preventDefault()
          break
        case 'ArrowRight':
          if (event.shiftKey) {
            goToNextMonth()
          } else {
            goToNextWeek()
          }
          event.preventDefault()
          break
        case 'Home':
          goToToday()
          event.preventDefault()
          break
        case 't':
        case 'T':
          goToToday()
          event.preventDefault()
          break
        case 'r':
        case 'R':
          fetchEvents()
          event.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Simple Mongolia time helper
  const getMongoliaTime = (date?: Date): Date => {
    const now = date || new Date()
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }))
  }

  // Format date for comparison (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const mongoliaDate = getMongoliaTime(date)
    return mongoliaDate.toISOString().split('T')[0]
  }

  // Get week days starting from Monday
  const getWeekDays = (date: Date): Date[] => {
    const days = []
    const monday = new Date(date)
    
    // Find Monday of current week
    const dayOfWeek = monday.getDay()
    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    monday.setDate(diff)
    
    // Generate 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  // Get events for specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = formatDate(date)
    const dayEvents = events.filter(event => event.date === dateStr)
    return dayEvents
  }

  // Week navigation with Mongolia timezone handling
  const navigateWeek = (direction: 'prev' | 'next') => {
    const mongoliaDate = getMongoliaTime(currentDate)
    const newDate = new Date(mongoliaDate)
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    const today = getMongoliaTime()
    setCurrentDate(today)
  }

  // Additional navigation functions
  const goToNextWeek = () => {
    navigateWeek('next')
  }

  const goToPreviousWeek = () => {
    navigateWeek('prev')
  }

  const goToSpecificWeek = (date: Date) => {
    const mongoliaDate = getMongoliaTime(date)
    setCurrentDate(mongoliaDate)
  }

  // Quick navigation functions
  const goToNextMonth = () => {
    const mongoliaDate = getMongoliaTime(currentDate)
    const newDate = new Date(mongoliaDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToPreviousMonth = () => {
    const mongoliaDate = getMongoliaTime(currentDate)
    const newDate = new Date(mongoliaDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const goToThisWeek = () => {
    goToToday()
  }

  // Week range helper
  const getWeekRange = () => {
    const start = weekDays[0]
    const end = weekDays[6]
    return {
      start: formatDate(start),
      end: formatDate(end),
      startDisplay: start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Ulaanbaatar'
      }),
      endDisplay: end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Ulaanbaatar'
      })
    }
  }

  const weekDays = getWeekDays(currentDate)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load calendar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchEvents}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="mt-1 text-sm text-gray-600">
                Your class schedule and events (Mongolia Time)
              </p>
            </div>
            
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Previous Week"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                Week of {weekDays[0].toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'Asia/Ulaanbaatar'
                })}
              </h2>
              
              <button
                onClick={goToNextWeek}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Next Week"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousWeek}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                ← Previous
              </button>
              
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
              
              <button
                onClick={goToNextWeek}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Week View Calendar */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-7 gap-0">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDate(day)
                const isToday = formatDate(day) === formatDate(getMongoliaTime())
                
                return (
                  <div key={index} className="border-r last:border-r-0 min-h-[400px]">
                    {/* Day Header */}
                    <div className={`p-4 text-center border-b ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div className="text-sm font-medium text-gray-900">
                        {dayNames[index]}
                      </div>
                      <div className={`text-lg font-semibold ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>
                    
                    {/* Events */}
                    <div className="p-2 space-y-2">
                      {dayEvents.length > 0 ? (
                        dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              event.type === 'CLASS' 
                                ? 'bg-blue-50 border-blue-400 text-blue-900' 
                                : 'bg-red-50 border-red-400 text-red-900'
                            }`}
                          >
                            <div className="font-medium text-sm truncate">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                              <div className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center mt-1">
                                <UserIcon className="h-3 w-3 mr-1" />
                                {event.instructor}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 text-sm py-8">
                          No events
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's Events Summary */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Today's Events ({formatDate(getMongoliaTime())})
            </h3>
            <div className="space-y-3">
              {getEventsForDate(getMongoliaTime()).length > 0 ? (
                getEventsForDate(getMongoliaTime()).map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.courseTitle}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {event.startTime} - {event.endTime}
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {event.instructor}
                          </div>
                        </div>
                      </div>
                      {event.isEnrolled && (
                        <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                          Join Class
                        </button>
                      )}
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

          {/* Keyboard Shortcuts Help */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="grid grid-cols-2 gap-4">
                <div>← / → : Previous / Next week</div>
                <div>Shift + ← / → : Previous / Next month</div>
                <div>T : Go to today</div>
                <div>R : Refresh events</div>
                <div>Home : Go to today</div>
                <div>Click on dates to navigate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}