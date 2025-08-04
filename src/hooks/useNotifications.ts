'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { NotificationType } from '@prisma/client'

// ================================
// TYPES & INTERFACES
// ================================

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  updatedAt: string
  data?: Record<string, any>
}

export interface NotificationFilters {
  unreadOnly?: boolean
  types?: string[]
  limit?: number
  offset?: number
}

export interface UseNotificationsReturn {
  // State
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  hasMore: boolean
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (notificationId: string) => Promise<boolean>
  createNotification: (data: {
    title: string
    message: string
    type?: string
    data?: any
  }) => Promise<Notification | null>
  
  // Utilities
  refetch: () => Promise<void>
  clearError: () => void
  loadMore: () => Promise<void>
}

// ================================
// CUSTOM HOOK
// ================================

export function useNotifications(): UseNotificationsReturn {
  const { data: session, status } = useSession()
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Refs for managing state
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentFiltersRef = useRef<NotificationFilters>({})

  // ================================
  // CORE FUNCTIONS
  // ================================

  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    if (!session?.user?.id || status !== 'authenticated') return

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    currentFiltersRef.current = filters

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.unreadOnly) params.set('unreadOnly', 'true')
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.offset) params.set('offset', filters.offset.toString())
      if (filters.types) params.set('types', filters.types.join(','))

      const response = await fetch(`/api/notifications?${params}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (filters.offset && filters.offset > 0) {
        // Append to existing notifications (for pagination)
        setNotifications(prev => [...prev, ...data.notifications])
      } else {
        // Replace notifications (for fresh fetch)
        setNotifications(data.notifications)
      }
      
      setUnreadCount(data.unreadCount)
      setHasMore(data.hasMore)
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status])

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        return true
      }
      
      throw new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setError('Failed to mark notification as read')
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        )
        setUnreadCount(0)
        return true
      }
      
      throw new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      setError('Failed to mark all notifications as read')
      return false
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        return true
      }
      
      throw new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      console.error('Error deleting notification:', error)
      setError('Failed to delete notification')
      return false
    }
  }, [notifications])

  const createNotification = useCallback(async (data: {
    title: string
    message: string
    type?: string
    data?: any
  }): Promise<Notification | null> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const newNotification = await response.json()
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        return newNotification
      }
      
      throw new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      console.error('Error creating notification:', error)
      setError('Failed to create notification')
      return null
    }
  }, [])

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return
    
    const offset = notifications.length
    await fetchNotifications({
      ...currentFiltersRef.current,
      offset
    })
  }, [hasMore, loading, notifications.length, fetchNotifications])

  const refetch = useCallback(async (): Promise<void> => {
    await fetchNotifications(currentFiltersRef.current)
  }, [fetchNotifications])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ================================
  // EFFECTS
  // ================================

  // Initial fetch when session is available
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      fetchNotifications()
    }
  }, [session?.user?.id, status, fetchNotifications])

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      const interval = setInterval(() => {
        // Only refetch if not currently loading and no error
        if (!loading && !error) {
          fetchNotifications(currentFiltersRef.current)
        }
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, status, loading, error, fetchNotifications])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // ================================
  // RETURN
  // ================================

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    
    // Utilities
    refetch,
    clearError,
    loadMore
  }
}
