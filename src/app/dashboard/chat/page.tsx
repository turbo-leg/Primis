'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { getProfileImageUrl } from '@/lib/images'
import { useTranslation } from '@/components/providers/i18n-provider'
import { 
  UserGroupIcon, 
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Image component with fallback
const ProfileImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className 
}: { 
  src?: string; 
  alt: string; 
  width: number; 
  height: number; 
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false)
  const processedSrc = getProfileImageUrl(src)
  const [imageSrc, setImageSrc] = useState(processedSrc)

  useEffect(() => {
    const newSrc = getProfileImageUrl(src)
    setImageSrc(newSrc)
    setImageError(false)
  }, [src])

  const handleImageError = () => {
    console.log('Image failed to load:', imageSrc)
    setImageError(true)
  }

  if (!imageSrc || imageError) {
    return <UserCircleIcon className={className || `w-${width/4} h-${height/4} text-gray-400`} />
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      unoptimized={imageSrc.startsWith('/uploads')} // Disable optimization for local uploads
    />
  )
}

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    role: string
    image?: string
  }
  chatRoomId: string
}

interface ChatRoom {
  id: string
  name: string
  courseId?: string
  course?: {
    title: string
  }
}

interface Participant {
  id: string
  name: string
  role: string
  image?: string
  isOnline: boolean
}

interface UserProfile {
  id: string
  name: string
  email?: string
  image?: string
  role: string
  phone?: string
  memberSince: string
  stats?: {
    enrollments: number
    messages: number
  }
}

export default function ChatPage() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [sending, setSending] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatRooms()
  }, [])

  useEffect(() => {
    if (activeRoom) {
      // Reset states
      setMessages([])
      setParticipants([])
      setLoadingMessages(true)
      setLoadingParticipants(true)
      
      // Fetch messages and participants in parallel for better performance
      Promise.all([
        fetchMessages(activeRoom),
        fetchParticipants(activeRoom)
      ])
    }
  }, [activeRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const data = await response.json()
        setChatRooms(data)
      } else {
        console.error('Failed to fetch chat rooms')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
      setLoading(false)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error('Failed to fetch messages')
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchParticipants = async (roomId: string) => {
    try {
      setLoadingParticipants(true)
      const response = await fetch(`/api/chat/rooms/${roomId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      } else {
        console.error('Failed to fetch participants')
        setParticipants([])
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately to prevent double submission

    try {
      const response = await fetch(`/api/chat/rooms/${activeRoom}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent
        }),
      })

      if (response.ok) {
        const newMessageData = await response.json()
        // Optimistically add the new message instead of refetching all messages
        setMessages(prev => [...prev, newMessageData])
      } else {
        console.error('Failed to send message')
        // Restore message if failed
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message if failed
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!activeRoom || deletingMessageId || session?.user?.role !== 'ADMIN') return

    if (!confirm(t('chat.deleteMessageConfirm'))) {
      return
    }

    setDeletingMessageId(messageId)

    try {
      const response = await fetch(`/api/chat/rooms/${activeRoom}/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the message from the local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      } else {
        const error = await response.json()
        console.error('Failed to delete message:', error)
        alert(`Failed to delete message: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message. Please try again.')
    } finally {
      setDeletingMessageId(null)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const profile = await response.json()
        setSelectedUserProfile(profile)
        setShowProfileModal(true)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleUserClick = (user: Message['user'] | Participant) => {
    if (user.id !== session?.user?.id) {
      fetchUserProfile(user.id)
    }
  }

  const closeProfileModal = () => {
    setShowProfileModal(false)
    setSelectedUserProfile(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white-900">Class Chat</h1>
        <p className="text-gray-600 mt-2">Communicate with your classmates and instructors</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex">
        {/* Chat Rooms Sidebar */}
        <div className="w-1/4 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              {t('chat.rooms')}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('chat.noRooms')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('chat.noRoomsDesc')}
                </p>
              </div>
            ) : (
              chatRooms.map((room: ChatRoom) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 ${
                    activeRoom === room.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{room.name}</div>
                  {room.course && (
                    <div className="text-sm text-gray-500">{room.course.title}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">{t('chat.loadingMessages')}</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>{t('chat.noMessages')}</p>
                  </div>
                ) : (
                  messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-2 ${
                        message.user.id === session?.user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Profile Image for other users (left side) */}
                      {message.user.id !== session?.user?.id && (
                        <button
                          onClick={() => handleUserClick(message.user)}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <ProfileImage
                            src={message.user.image}
                            alt={message.user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover cursor-pointer"
                          />
                        </button>
                      )}

                      <div className="flex flex-col">
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                            message.user.id === session?.user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.user.id !== session?.user?.id && (
                            <div className="text-xs font-medium mb-1 opacity-75">
                              <button
                                onClick={() => handleUserClick(message.user)}
                                className="hover:underline cursor-pointer"
                              >
                                {message.user.name}
                              </button>
                              {(message.user.role === 'INSTRUCTOR' || message.user.role === 'ADMIN') && (
                                <span className="ml-1 text-xs bg-green-200 text-green-800 px-1 rounded">
                                  {message.user.role === 'ADMIN' ? t('chat.admin') : t('chat.instructor')}
                                </span>
                              )}
                            </div>
                          )}
                          <div>{message.content}</div>
                          <div className="text-xs mt-1 opacity-75">
                            {formatTime(message.createdAt)}
                          </div>

                          {/* Admin Delete Button */}
                          {session?.user?.role === 'ADMIN' && (
                            <button
                              onClick={() => deleteMessage(message.id)}
                              disabled={deletingMessageId === message.id}
                              className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                                message.user.id === session?.user?.id
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Delete message (Admin only)"
                            >
                              {deletingMessageId === message.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                              ) : (
                                <TrashIcon className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Profile Image for current user (right side) */}
                      {message.user.id === session?.user?.id && (
                        <div className="flex-shrink-0">
                          <ProfileImage
                            src={message.user.image}
                            alt={message.user.name || 'You'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!sending) {
                      sendMessage()
                    }
                  }} 
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a chat room</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a room from the sidebar to start chatting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Participants Sidebar */}
        <div className="w-1/4 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Participants ({participants.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeRoom ? (
              loadingParticipants ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="p-4 text-center">
                  <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No participants</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Participants will appear here when they join.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {participants.map((participant: Participant) => (
                    <button
                      key={participant.id}
                      onClick={() => handleUserClick(participant)}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <ProfileImage
                        src={participant.image}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {participant.name}
                          {participant.id === session?.user?.id && (
                            <span className="ml-1 text-xs text-gray-500">(You)</span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            participant.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            participant.role === 'INSTRUCTOR' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {participant.role === 'ADMIN' && 'Admin'}
                            {participant.role === 'INSTRUCTOR' && 'Instructor'}
                            {participant.role === 'STUDENT' && 'Student'}
                          </span>
                          {participant.isOnline && (
                            <div className="ml-2 w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">Select a chat room to see participants</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUserProfile && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeProfileModal}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
              <button
                onClick={closeProfileModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex flex-col items-center">
              <ProfileImage
                src={selectedUserProfile.image}
                alt={selectedUserProfile.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
              />
              
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {selectedUserProfile.name}
              </h2>
              
              <div className="mt-2 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedUserProfile.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  selectedUserProfile.role === 'INSTRUCTOR' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedUserProfile.role === 'ADMIN' && '👨‍💼 Admin'}
                  {selectedUserProfile.role === 'INSTRUCTOR' && '👨‍🏫 Instructor'}
                  {selectedUserProfile.role === 'STUDENT' && '🎓 Student'}
                </span>
              </div>

              {selectedUserProfile.email && (
                <p className="mt-3 text-sm text-gray-600">
                  📧 {selectedUserProfile.email}
                </p>
              )}

              {selectedUserProfile.phone && (
                <p className="mt-2 text-sm text-gray-600">
                  📞 {selectedUserProfile.phone}
                </p>
              )}

              <div className="mt-4 w-full">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member since:</span>
                    <span className="text-gray-900">
                      {new Date(selectedUserProfile.memberSince).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {selectedUserProfile.stats && (
                    <>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-500">Enrollments:</span>
                        <span className="text-gray-900">{selectedUserProfile.stats.enrollments}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-500">Messages sent:</span>
                        <span className="text-gray-900">{selectedUserProfile.stats.messages}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
