'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import { useNotifications } from '@/hooks/useNotifications'
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'

interface ChatRoom {
  id: string
  name: string
  courseId?: string
  isPublic: boolean
  course?: {
    id: string
    title: string
    instructor: string
  } | null
  memberCount: number
  messageCount: number
}

interface Message {
  id: string
  content: string
  userId: string
  user: {
    id: string
    name: string
    role: string
    image?: string
  }
  chatRoomId: string
  createdAt: string
}

interface Participant {
  id: string
  name: string
  role: string
  image?: string
  isOnline: boolean
}

export default function Chat() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const { refetch: refetchNotifications } = useNotifications()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChatRooms()
    }
  }, [status])

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id)
    }
  }, [selectedRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms')
      }
      const rooms = await response.json()
      setChatRooms(rooms)
      if (rooms.length > 0) {
        setSelectedRoom(rooms[0])
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      setMessagesLoading(true)
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const fetchedMessages = await response.json()
      setMessages(fetchedMessages)
      
      // Also fetch participants for the room
      fetchParticipants(roomId)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const fetchParticipants = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/participants`)
      if (!response.ok) {
        throw new Error('Failed to fetch participants')
      }
      const fetchedParticipants = await response.json()
      setParticipants(fetchedParticipants)
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !session?.user) return

    try {
      const response = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newMessageData = await response.json()
      setMessages(prev => [...prev, newMessageData])
      setNewMessage('')
      
      // Refresh notifications to update counts
      refetchNotifications()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400" />
            {t('chat.title')}
          </h1>
          <p className="text-gray-300 mt-2">{t('chat.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Chat Rooms Sidebar */}
          <div className="lg:col-span-1 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{t('chat.rooms')}</h2>
                <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  <PlusIcon className="h-4 w-4 text-white" />
                </button>
              </div>
              
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('chat.searchRooms')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-4 border-b border-white/10 hover:bg-white/10 transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-white/15' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{room.name}</h3>
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                      <p className="text-gray-400 text-sm truncate">
                        {room.course ? `Course: ${room.course.title}` : 'General Discussion'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <UserGroupIcon className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500 text-xs">{room.memberCount} members</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-500 text-xs">{room.messageCount} messages</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex flex-col">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedRoom.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{selectedRoom.memberCount} participants</span>
                      <span>•</span>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Active</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.userId === session?.user?.id
                      const messageDate = new Date(message.createdAt)
                      const timestamp = messageDate.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium mb-1 opacity-70">{message.user.name}</p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{timestamp}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <FaceSmileIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <input
                      type="text"
                      placeholder={t('chat.typeMessage')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <PaperAirplaneIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">{t('chat.selectRoom')}</h3>
                  <p className="text-gray-400">{t('chat.selectRoomDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Online Users */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4">{t('chat.onlineUsers')}</h3>
          <div className="flex flex-wrap gap-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{participant.name.charAt(0)}</span>
                </div>
                <span className="text-white text-sm">{participant.name}</span>
                <div className={`h-2 w-2 rounded-full ${participant.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-gray-400">No participants in this room yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
