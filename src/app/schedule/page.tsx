'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/components/providers/i18n-provider'
import { redirect } from 'next/navigation'
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface ScheduleItem {
  id: string
  title: string
  instructor: string
  startTime: string
  endTime: string
  date: string
  room: string
  type: 'class' | 'exam' | 'workshop'
  enrolledCount: number
  capacity: number
}

export default function Schedule() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week')
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchScheduleItems()
    }
  }, [status])

  const fetchScheduleItems = async () => {
    try {
      const response = await fetch('/api/schedule')
      if (response.ok) {
        const data = await response.json()
        setScheduleItems(data)
      } else {
        console.error('Failed to fetch schedule')
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'exam':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'workshop':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              {t('schedule.title')}
            </h1>
            <p className="text-xl max-w-3xl mx-auto text-gray-300">
              {t('schedule.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Schedule Controls */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            
            {/* View Toggle */}
            <div className="flex space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => setSelectedView('week')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedView === 'week'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {t('schedule.gridView')}
              </button>
              <button
                onClick={() => setSelectedView('month')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedView === 'month'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {t('schedule.listView')}
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronLeftIcon className="h-5 w-5 text-white" />
              </button>
              
              <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronRightIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedView === 'week' ? (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {getWeekDays().map((day, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </h3>
                    <p className="text-gray-300">
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {scheduleItems
                      .filter(item => {
                        const itemDate = new Date(item.date)
                        return itemDate.toDateString() === day.toDateString()
                      })
                      .map((item) => (
                        <div key={item.id} className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(item.type)}`}>
                              {t(`schedule.${item.type}`)}
                            </span>
                            <span className="text-gray-300 text-xs">
                              {item.startTime}
                            </span>
                          </div>
                          <h4 className="text-white font-medium text-sm mb-1">
                            {item.title}
                          </h4>
                          <p className="text-gray-300 text-xs">
                            {item.instructor}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View for Month */
            <div className="space-y-6">
              {scheduleItems.map((item) => (
                <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    
                    {/* Date & Time */}
                    <div className="flex items-center space-x-4">
                      <div className="bg-red-500 rounded-lg p-3">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-gray-300 text-sm">
                          {item.startTime} - {item.endTime}
                        </p>
                      </div>
                    </div>

                    {/* Class Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {item.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                          {t(`schedule.${item.type}`)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {item.instructor}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {item.room}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment */}
                    <div className="text-right">
                      <div className="text-white font-medium mb-1">
                        {item.enrolledCount}/{item.capacity}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min((item.enrolledCount / item.capacity) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-400 text-xs">{t('schedule.enrolled')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gradient-to-r from-[#0a1554] to-[#1a2570]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('schedule.helpTitle')}
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            {t('schedule.helpSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
              {t('schedule.accessMaterials')}
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold transition-all border border-white/20">
              {t('schedule.contactInstructor')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
