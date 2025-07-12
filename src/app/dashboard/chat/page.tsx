'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  UserGroupIcon, 
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    role: string
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

export default function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatRooms()
  }, [])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom)
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
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error('Failed to fetch messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    try {
      const response = await fetch(`/api/chat/rooms/${activeRoom}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // Refresh messages
        await fetchMessages(activeRoom)
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Class Chat</h1>
        <p className="text-gray-600 mt-2">Communicate with your classmates and instructors</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex">
        {/* Chat Rooms Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Chat Rooms
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No chat rooms</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Chat rooms will be created when courses are available.
                </p>
              </div>
            ) : (
              chatRooms.map((room) => (
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
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.user.id === session?.user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.user.id === session?.user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.user.id !== session?.user?.id && (
                          <div className="text-xs font-medium mb-1 opacity-75">
                            {message.user.name}
                            {(message.user.role === 'INSTRUCTOR' || message.user.role === 'ADMIN') && (
                              <span className="ml-1 text-xs bg-green-200 text-green-800 px-1 rounded">
                                {message.user.role === 'ADMIN' ? 'Admin' : 'Instructor'}
                              </span>
                            )}
                          </div>
                        )}
                        <div>{message.content}</div>
                        <div className="text-xs mt-1 opacity-75">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
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
      </div>
    </div>
  )
}
