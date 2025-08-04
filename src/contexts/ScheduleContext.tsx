import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { getCurrentMongoliaTime } from '@/lib/timezone'

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

interface ScheduleContextType {
  events: ScheduleEvent[]
  setEvents: (events: ScheduleEvent[]) => void
  refreshSchedule: () => Promise<void>
  loading: boolean
  error: string | null
}

const ScheduleContext = createContext<ScheduleContextType | null>(null)

export const useSchedule = () => {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
}

interface ScheduleProviderProps {
  children: ReactNode
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSchedule = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentTime = getCurrentMongoliaTime()
      const startDate = new Date(currentTime)
      startDate.setDate(startDate.getDate() - 30) // 30 days before
      const endDate = new Date(currentTime)
      endDate.setDate(endDate.getDate() + 60) // 60 days after

      const response = await fetch(`/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      
      const data = await response.json()
      
      // SHIFT ALL EVENTS BACK BY 1 DAY
      const shiftedEvents = data.map((event: any) => {
        const eventDate = new Date(event.date + 'T00:00:00')
        eventDate.setDate(eventDate.getDate() - 1) // Move back 1 day
        
        const shiftedDateStr = eventDate.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Ulaanbaatar',
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit'
        })
        
        console.log(`Shifted event "${event.title}" from ${event.date} to ${shiftedDateStr}`)
        
        return {
          ...event,
          date: shiftedDateStr
        }
      })
      
      setEvents(shiftedEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  const value: ScheduleContextType = {
    events,
    setEvents,
    refreshSchedule,
    loading,
    error
  }

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  )
}
