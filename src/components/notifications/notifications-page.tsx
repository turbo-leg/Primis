'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useTranslation } from '@/components/providers/i18n-provider'
import { formatDistanceToNow } from 'date-fns'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
    loadMore,
    clearError
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-6 w-6"
    
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
        return 'bg-green-500/10 text-green-400 border-green-400/20'
      case 'WARNING':
      case 'REMINDER':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20'
      case 'ERROR':
        return 'bg-red-500/10 text-red-400 border-red-400/20'
      case 'ASSIGNMENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-400/20'
      case 'MESSAGE':
        return 'bg-purple-500/10 text-purple-400 border-purple-400/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-400/20'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BellIcon className="h-8 w-8 text-blue-400" />
                Notifications
              </h1>
              <p className="text-gray-300 mt-2">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
                title="Refresh notifications"
              >
                <ArrowPathIcon className={`h-5 w-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {notificationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-300 hover:text-red-200 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <BellIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm opacity-75">
                {filter === 'unread' ? "You're all caught up!" : "Notifications will appear here when you receive them"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-white/5 transition-all group ${
                    !notification.isRead ? 'bg-white/5 border-l-4 border-l-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            !notification.isRead ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <ClockIcon className="h-4 w-4" />
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-green-400 transition-colors p-2 rounded-lg hover:bg-green-400/10"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
                            title="Delete notification"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={loadMore}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
              >
                Load More Notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}