'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { 
  BellIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// ================================
// TYPES & INTERFACES
// ================================

interface NotificationDropdownProps {
  roleStyles: {
    accent: string
    hover: string
    button: string
    bg?: string
  }
}

// ================================
// NOTIFICATION DROPDOWN COMPONENT
// ================================

export default function NotificationDropdown({ roleStyles }: NotificationDropdownProps) {
  const { data: session } = useSession()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
    clearError
  } = useNotifications()

  // Local state
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ================================
  // HANDLERS
  // ================================

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (error) clearError()
  }

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await deleteNotification(notificationId)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    // Handle navigation based on notification data
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl
    }
  }

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5"
    
    switch (type) {
      case 'SUCCESS':
      case 'GRADE':
        return <CheckCircleIcon className={`${iconClass} text-green-400`} />
      case 'WARNING':
      case 'REMINDER':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-400`} />
      case 'ERROR':
        return <XCircleIcon className={`${iconClass} text-red-400`} />
      case 'ASSIGNMENT':
        return <AcademicCapIcon className={`${iconClass} text-blue-400`} />
      case 'MESSAGE':
        return <ChatBubbleLeftIcon className={`${iconClass} text-purple-400`} />
      case 'ENROLLMENT':
        return <CheckCircleIcon className={`${iconClass} text-green-400`} />
      default:
        return <InformationCircleIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'GRADE':
      case 'ENROLLMENT':
        return 'text-green-400'
      case 'WARNING':
      case 'REMINDER':
        return 'text-yellow-400'
      case 'ERROR':
        return 'text-red-400'
      case 'ASSIGNMENT':
        return 'text-blue-400'
      case 'MESSAGE':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  // ================================
  // EFFECTS
  // ================================

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Don't render if user is not authenticated
  if (!session?.user?.id) return null

  // ================================
  // RENDER
  // ================================

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className={`relative p-3 text-slate-200 hover:text-white transition-all duration-200 ${roleStyles.hover} rounded-xl group`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-600/20 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-600/20 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={refetch}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                  title="Refresh notifications"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'all'
                    ? `${roleStyles.accent} bg-slate-700/50`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'unread'
                    ? `${roleStyles.accent} bg-slate-700/50`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors ml-auto"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-300 hover:text-red-200 text-xs mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-3"></div>
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs mt-1 opacity-75">
                  {filter === 'unread' ? "You're all caught up!" : "You'll see new notifications here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-600/20">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-700/30 transition-all cursor-pointer group ${
                      !notification.isRead ? 'bg-slate-700/20 border-l-2 border-l-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-white' : 'text-slate-300'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(notification.type)} bg-current/10`}>
                                {notification.type}
                              </span>
                              <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <ClockIcon className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-slate-400 hover:text-green-400 transition-colors p-1 rounded"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-600/20 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
              <Link
                href="/notifications"
                className="block w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-2 rounded-lg hover:bg-slate-700/30"
                onClick={() => setIsOpen(false)}
              >
                <EyeIcon className="h-4 w-4 inline mr-2" />
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
