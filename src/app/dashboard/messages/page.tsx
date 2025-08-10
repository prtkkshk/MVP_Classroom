'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { 
  MessageSquare, 
  Search, 
  Send,
  MoreHorizontal,
  User,
  Users,
  Plus,
  X,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  AtSign
} from 'lucide-react'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  is_read: boolean
  created_at: string
  sender_name?: string
  sender_avatar?: string
  is_admin_message?: boolean
  notification_title?: string
}

interface ChatRoom {
  id: string
  user_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
  is_online?: boolean
}

interface User {
  id: string
  name: string
  username: string
  email: string
  avatar_url?: string
  role: string
  is_online?: boolean
}

interface MessageRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  created_at: string
  requester?: User
  recipient?: User
}

export default function MessagesPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedUserForRequest, setSelectedUserForRequest] = useState<User | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [activeTab, setActiveTab] = useState('chats')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user: currentUser } = useAuthStore()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch message requests
  const fetchMessageRequests = async () => {
    if (!currentUser?.id) return

    try {
      const response = await fetch(`/api/chat/message-requests?userId=${currentUser.id}`)
      const result = await response.json()

      if (response.ok) {
        // Filter out approved requests - they should not show in the requests section
        const filteredRequests = (result.data || []).filter((request: any) => request.status !== 'approved')
        setMessageRequests(filteredRequests)
      } else {
        console.error('Error fetching message requests:', result.error)
      }
    } catch (error) {
      console.error('Error fetching message requests:', error)
    }
  }

  // Search for users
  const searchUsersByQuery = async (query: string) => {
    if (!query.trim() || !currentUser?.id) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/chat/search-users?q=${encodeURIComponent(query)}&currentUserId=${currentUser.id}`)
      const result = await response.json()

      if (response.ok) {
        setSearchResults(result.data || [])
      } else {
        console.error('Error searching users:', result.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Send message request
  const sendMessageRequest = async () => {
    if (!selectedUserForRequest || !currentUser?.id) return

    try {
      const response = await fetch('/api/chat/message-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: currentUser.id,
          recipientId: selectedUserForRequest.id,
          message: requestMessage.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Message request sent successfully')
        setShowRequestModal(false)
        setSelectedUserForRequest(null)
        setRequestMessage('')
        fetchMessageRequests()
      } else {
        toast.error(result.error || 'Failed to send message request')
      }
    } catch (error) {
      console.error('Error sending message request:', error)
      toast.error('Failed to send message request')
    }
  }

  // Handle message request response
  const handleMessageRequestResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!currentUser?.id) return

    try {
      const response = await fetch('/api/chat/message-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          userId: currentUser.id
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Message request ${status}`)
        
        // Remove the request from local state immediately
        setMessageRequests(prev => prev.filter(request => request.id !== requestId))
        
        if (status === 'approved') {
          fetchChatRooms() // Refresh chat rooms to include new approved connection
        }
      } else {
        toast.error(result.error || `Failed to ${status} message request`)
      }
    } catch (error) {
      console.error('Error handling message request:', error)
      toast.error(`Failed to ${status} message request`)
    }
  }

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    if (!currentUser?.id) return

    try {
      setIsLoading(true)
      
      console.log('Fetching users for chat rooms...')
      
      // Use the chat API route to bypass RLS
      const response = await fetch(`/api/chat/users?currentUserId=${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', result.error)
        toast.error('Failed to load users. Please check your connection.')
        return
      }

      const users = result.users
      console.log('Users fetched successfully:', users?.length || 0)

      // Filter users to only include those with approved message requests
      const approvedUsers = users.filter((user: any) => {
        // Check if there's an approved message request between current user and this user
        const hasApprovedRequest = messageRequests.some(request => 
          (request.requester_id === currentUser.id && request.recipient_id === user.id && request.status === 'approved') ||
          (request.requester_id === user.id && request.recipient_id === currentUser.id && request.status === 'approved')
        )
        return hasApprovedRequest
      })

      // Create chat rooms for approved users only
      const rooms: ChatRoom[] = await Promise.all(approvedUsers.map(async (user: any) => {
        // Fetch the last message for this chat
        let lastMessage = ''
        let lastMessageTime = ''
        let unreadCount = 0
        
        try {
          const response = await fetch(`/api/chat/messages?userId=${currentUser.id}&otherUserId=${user.id}`)
          const result = await response.json()
          
          if (response.ok && result.data && result.data.length > 0) {
            // Get the last message (most recent)
            const lastMsg = result.data[result.data.length - 1]
            lastMessage = lastMsg.content
            lastMessageTime = lastMsg.created_at
            
            // Count unread messages (messages sent by other user that are not read)
            unreadCount = result.data.filter((msg: any) => 
              msg.sender_id === user.id && !msg.is_read
            ).length
          }
        } catch (error) {
          console.error('Error fetching last message for chat:', error)
        }
        
        return {
          id: `chat_${currentUser.id}_${user.id}`,
          user_id: currentUser.id,
          other_user_id: user.id,
          other_user_name: user.name,
          other_user_avatar: user.avatar_url,
          last_message: lastMessage,
          last_message_time: lastMessageTime,
          unread_count: unreadCount,
          is_online: Math.random() > 0.5 // Simulate online status
        }
      }))

      // Check if there are admin messages (notifications) and add admin chat room
      const { data: adminNotifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('type', 'system')

      console.log('Admin notifications found:', adminNotifications?.length || 0)
      
      if (!notificationsError && adminNotifications && adminNotifications.length > 0) {
        // Add admin chat room
        const adminRoom: ChatRoom = {
          id: `admin_chat_${currentUser.id}`,
          user_id: currentUser.id,
          other_user_id: 'admin',
          other_user_name: 'Admin',
          other_user_avatar: undefined,
          last_message: adminNotifications[adminNotifications.length - 1]?.message || '',
          last_message_time: adminNotifications[adminNotifications.length - 1]?.created_at || '',
          unread_count: adminNotifications.filter(n => !n.is_read).length,
          is_online: true
        }
        rooms.unshift(adminRoom) // Add admin room at the beginning
        console.log('Admin chat room added:', adminRoom)
      } else if (notificationsError) {
        console.error('Error fetching admin notifications:', notificationsError)
      }

      setChatRooms(rooms)
      setAvailableUsers(users || [])
      
      // If no users were fetched, show a helpful message
      if (!users || users.length === 0) {
        console.log('No users found in database')
        toast.info('No other users found. You may be the only user in the system.')
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
      toast.error('Failed to load chat rooms')
      // Set empty arrays to prevent undefined errors
      setChatRooms([])
      setAvailableUsers([])
    } finally {
      setIsLoading(false)
    }
  }

    // Fetch messages for a specific chat (including admin notifications)
  const fetchMessages = async (chatRoom: ChatRoom) => {
    try {
      const allMessages: ChatMessage[] = []

      // Check if this is an admin chat room
      if (chatRoom.other_user_id === 'admin') {
        console.log('Fetching admin messages for user:', currentUser?.id)
        // Only fetch admin notifications for admin chat room
        try {
          const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser?.id)
            .eq('type', 'system')
            .order('created_at', { ascending: true })

          console.log('Admin notifications fetched:', notifications?.length || 0)

          if (!notificationsError && notifications) {
            const adminMessages = notifications.map((notification: any) => ({
              id: notification.id,
              sender_id: 'admin',
              receiver_id: currentUser?.id || '',
              content: notification.message,
              message_type: 'text' as const,
              is_read: notification.is_read,
              created_at: notification.created_at,
              sender_name: 'Admin',
              sender_avatar: undefined,
              is_admin_message: true,
              notification_title: notification.title
            }))
            allMessages.push(...adminMessages)
            console.log('Admin messages processed:', adminMessages.length)
          } else if (notificationsError) {
            console.error('Error fetching admin notifications:', notificationsError)
          }
        } catch (notificationsError) {
          console.error('Error fetching notifications:', notificationsError)
        }
      } else {
        // Regular user chat - fetch chat messages between users
        try {
          const response = await fetch(`/api/chat/messages?userId=${chatRoom.user_id}&otherUserId=${chatRoom.other_user_id}`)
          const result = await response.json()

          if (response.ok && result.data) {
            const enhancedMessages = result.data.map((message: any) => ({
              ...message,
              sender_name: message.sender_id === currentUser?.id ? 'You' : chatRoom.other_user_name,
              sender_avatar: message.sender_id === currentUser?.id ? (currentUser as any)?.avatar_url : chatRoom.other_user_avatar
            }))
            allMessages.push(...enhancedMessages)
          }
        } catch (chatError) {
          console.error('Error fetching chat messages:', chatError)
        }
      }

      // Sort all messages by creation time
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      if (allMessages.length === 0) {
        // No messages exist, set empty array
        setMessages([])
        return
      }

      setMessages(allMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }

    // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser?.id) return

    // Don't allow sending messages to admin (admin messages are one-way)
    if (selectedChat.other_user_id === 'admin') {
      toast.error('You cannot send messages to admin. Please contact support through other channels.')
      return
    }

    try {
      setIsSending(true)
      
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedChat.other_user_id,
          content: newMessage.trim(),
          messageType: 'text'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error sending message:', result.error)
        // If API fails, add to local state
        const localMessage: ChatMessage = {
          id: Date.now().toString(),
          sender_id: currentUser.id,
          receiver_id: selectedChat.other_user_id,
          content: newMessage.trim(),
          message_type: 'text',
          is_read: false,
          created_at: new Date().toISOString(),
          sender_name: 'You',
          sender_avatar: (currentUser as any)?.avatar_url
        }
        setMessages(prev => [...prev, localMessage])
      } else {
        // Add to local state
        const enhancedMessage: ChatMessage = {
          ...result.data,
          sender_name: 'You',
          sender_avatar: (currentUser as any)?.avatar_url
        }
        setMessages(prev => [...prev, enhancedMessage])
      }

      // Update the chat room's last message
      updateChatRoomLastMessage(selectedChat.other_user_id, newMessage.trim())
      
      setNewMessage('')
      toast.success('Message sent')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Update chat room's last message
  const updateChatRoomLastMessage = (otherUserId: string, messageContent: string) => {
    setChatRooms(prev => prev.map(room => {
      if (room.other_user_id === otherUserId) {
        return {
          ...room,
          last_message: messageContent,
          last_message_time: new Date().toISOString()
        }
      }
      return room
    }))
  }

  // Handle chat selection
  const handleChatSelect = (chat: ChatRoom) => {
    setSelectedChat(chat)
    // Clear messages immediately when switching chats to prevent showing old messages
    setMessages([])
    fetchMessages(chat)
  }



  // Filter chat rooms based on search
  const filteredChatRooms = chatRooms.filter(room =>
    room.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  )



  useEffect(() => {
    if (currentUser?.id) {
      fetchMessageRequests()
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (currentUser?.id && messageRequests.length > 0) {
      fetchChatRooms()
    }
  }, [currentUser?.id, messageRequests])

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      title="Messages"
      description="Chat with other users on the platform"
    >
      <div className="h-[calc(100vh-120px)] flex bg-white rounded-lg shadow-sm border">
        {/* Chat Rooms Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <Button
                size="sm"
                onClick={() => setActiveTab('requests')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats" className="mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
              </TabsContent>
              
              <TabsContent value="requests" className="mt-4">
                {/* Search for new users */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchUsersByQuery(e.target.value)
                    }}
                    className="pl-10"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            {activeTab === 'chats' ? (
              // Chat Rooms List
              <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredChatRooms.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                    <p className="text-gray-600">Send message requests to start chatting.</p>
                    <Button
                      onClick={() => setActiveTab('requests')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Find Users
                    </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChatRooms.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={chat.other_user_avatar} />
                          <AvatarFallback>
                            {chat.other_user_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {chat.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {chat.other_user_name}
                          </h3>
                          {chat.last_message_time && (
                            <span className="text-xs text-gray-500">
                              {new Date(chat.last_message_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {chat.unread_count > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
                  </div>
                )}
              </>
            ) : (
              // Message Requests and Search Results
              <div className="space-y-4 p-4">
                {/* Search Results */}
                {searchQuery && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Search Results</h3>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No users found</p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                            onClick={() => {
                              setSelectedUserForRequest(user)
                              setShowRequestModal(true)
                            }}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                              <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Requests */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Message Requests</h3>
                  {messageRequests.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No message requests</p>
                  ) : (
                    <div className="space-y-2">
                      {messageRequests.map((request) => {
                        const isReceived = request.recipient_id === currentUser?.id
                        const otherUser = isReceived ? request.requester : request.recipient
                        
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={otherUser?.avatar_url} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {otherUser?.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm">{otherUser?.name}</h4>
                                <p className="text-xs text-gray-500">@{otherUser?.username}</p>
                              </div>
                              <Badge 
                                variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            
                            {request.message && (
                              <p className="text-sm text-gray-600 mb-2">{request.message}</p>
                            )}
                            
                            {isReceived && request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleMessageRequestResponse(request.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMessageRequestResponse(request.id, 'rejected')}
                                >
                                  <UserX className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedChat.other_user_avatar} />
                      <AvatarFallback>
                        {selectedChat.other_user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedChat.other_user_name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedChat.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.sender_id === currentUser?.id ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.is_admin_message 
                            ? 'bg-purple-600 text-white border-l-4 border-purple-400' 
                            : message.sender_id === currentUser?.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.is_admin_message && message.notification_title && (
                            <div className="text-xs opacity-80 mb-1 font-medium">
                              {message.notification_title}
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                          message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {message.sender_id === currentUser?.id && (
                            <span>
                              {message.is_read ? (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                {selectedChat.other_user_id === 'admin' ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>Admin messages are read-only. Contact support through other channels.</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message... 😊"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="pr-12"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        onClick={() => {
                          // Simple emoji picker - you can enhance this with a proper emoji picker library
                          const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😎', '🤔', '👏', '🙏', '😍', '🥳', '😭', '🤣', '😅', '😉', '😋', '😴', '🤗', '🤫', '🤐', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '😷', '🤒', '🤕', '🤢', '🤧', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
                          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
                          setNewMessage(prev => prev + randomEmoji)
                        }}
                      >
                        😊
                      </Button>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={isSending || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messages</h3>
                <p className="text-gray-600 mb-4">Select a conversation to start chatting or send message requests to connect with others</p>
                <Button
                  onClick={() => setActiveTab('requests')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Users
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Message Request Modal */}
        {showRequestModal && selectedUserForRequest && (
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white/95 backdrop-blur-sm rounded-xl p-6 w-[500px] max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Send Message Request</h3>
                  <p className="text-sm text-gray-600 mt-1">Send a request to start chatting with {selectedUserForRequest.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg mb-4">
                          <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedUserForRequest.avatar_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedUserForRequest.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedUserForRequest.name}</h4>
                  <p className="text-sm text-gray-500">@{selectedUserForRequest.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{selectedUserForRequest.role.replace('_', ' ')}</p>
                        </div>
                          </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Message
                  </label>
                  <Textarea
                    placeholder="Add a personal message to your request..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                        </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                        <Button
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1"
                >
                  Cancel
                        </Button>
                  <Button
                  onClick={sendMessageRequest}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Request
                  </Button>
              </div>
            </motion.div>
          </div>
        )}


      </div>
    </MainLayout>
  )
}
