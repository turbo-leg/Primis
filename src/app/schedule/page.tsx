'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon
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

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Get first day of current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get first day of calendar (might be from previous month)
  const firstDayOfCalendar = new Date(firstDayOfMonth)
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay())
  
  // Get last day of calendar (might be from next month)
  const lastDayOfCalendar = new Date(lastDayOfMonth)
  lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()))

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const startDate = firstDayOfCalendar.toISOString().split('T')[0]
      const endDate = lastDayOfCalendar.toISOString().split('T')[0]
      
      const response = await fetch(`/api/schedule?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        console.error('Failed to fetch events:', response.status, response.statusText)
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getEventColor = (event: ScheduleEvent) => {
    switch (event.type) {
      case 'CLASS':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-800'
      case 'ASSIGNMENT':
        return 'bg-red-100 hover:bg-red-200 border-red-200 text-red-800'
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
    }
  }

  const getEventIcon = (event: ScheduleEvent) => {
    switch (event.type) {
      case 'CLASS':
        return <AcademicCapIcon className="h-3 w-3 flex-shrink-0" />
      case 'ASSIGNMENT':
        return <ClockIcon className="h-3 w-3 flex-shrink-0" />
      default:
        return <CalendarIcon className="h-3 w-3 flex-shrink-0" />
    }
  }

  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  }, [session, currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const generateCalendarDays = () => {
    const days = []
    const current = new Date(firstDayOfCalendar)
    
    while (current <= lastDayOfCalendar) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const calendarDays = generateCalendarDays()

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-slate-600">Please sign in to view your schedule.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Course Schedule</h1>
                  <p className="text-blue-100">Your upcoming classes and events</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-slate-600 border-r border-slate-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const isCurrentDay = isToday(date)
              const isInCurrentMonth = isCurrentMonth(date)
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-slate-200 last:border-r-0 p-2 ${
                    !isInCurrentMonth ? 'bg-slate-50' : 'bg-white'
                  } hover:bg-slate-50 transition-colors`}
                >
                  {/* Date Number */}
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full ${
                        isCurrentDay
                          ? 'bg-blue-600 text-white'
                          : isInCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={event.id}
                        className={`${getEventColor(event)} border rounded px-2 py-1 text-xs cursor-pointer transition-colors`}
                        title={`${event.courseTitle}\n${event.type === 'ASSIGNMENT' ? `Due: ${event.title}` : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}\nInstructor: ${event.instructor}${event.maxPoints ? `\nPoints: ${event.maxPoints}` : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {getEventIcon(event)}
                          <span className="font-medium truncate">
                            {event.type === 'ASSIGNMENT' ? 'Due' : formatTime(event.startTime)}
                          </span>
                        </div>
                        <div className="truncate font-medium">
                          {event.type === 'ASSIGNMENT' ? event.title.replace('Due: ', '') : event.courseTitle}
                        </div>
                        {event.maxPoints && (
                          <div className="text-xs opacity-75">
                            {event.maxPoints} pts
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Loading schedule...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
