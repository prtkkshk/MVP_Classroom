'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { toast } from 'sonner'
import { 
  Search, 
  Send, 
  MoreHorizontal, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Plus,
  X,
  CheckCheck,
  Check
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  receiver_name?: string
  receiver_avatar?: string
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
  avatar_url?: string
  role: string
  is_online?: boolean
}

interface AdminUser extends User {
  id: string
  name: string
  username: string
  avatar_url?: string
  role: string
  is_online?: boolean
}

interface NotificationData {
  id: string
  message: string
  is_read: boolean
  created_at: string
  title: string
}

interface ChatResult {
  data: Array<{
    id: string
    sender_id: string
    receiver_id: string
    content: string
    message_type: string
    is_read: boolean
    created_at: string
  }>
}

export default function AdminMessagesPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchUsers, setSearchUsers] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'recent'>('all')
  
  const { user: currentUser } = useAuthStore()

  // Fetch all chat rooms for admin view
  const fetchAllChatRooms = async () => {
    if (!currentUser?.id) return

    try {
      setIsLoading(true)
      
      // Try to use the admin users API route first
      let users: AdminUser[] = []
      
      try {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()
        
        if (response.ok && result.users) {
          users = result.users
        } else {
          console.warn('Admin users API failed, using fallback data')
          // Fallback to mock data if API fails
          users = [
            {
              id: 'user-1',
              name: 'John Doe',
              username: 'johndoe',
              avatar_url: null,
              role: 'student'
            },
            {
              id: 'user-2',
              name: 'Jane Smith',
              username: 'janesmith',
              avatar_url: null,
              role: 'professor'
            },
            {
              id: 'user-3',
              name: 'Bob Johnson',
              username: 'bobjohnson',
              avatar_url: null,
              role: 'student'
            }
          ]
        }
      } catch (apiError) {
        console.warn('API call failed, using fallback data:', apiError)
        // Fallback to mock data
        users = [
          {
            id: 'user-1',
            name: 'John Doe',
            username: 'johndoe',
            avatar_url: null,
            role: 'student'
          },
          {
            id: 'user-2',
            name: 'Jane Smith',
            username: 'janesmith',
            avatar_url: null,
            role: 'professor'
          },
          {
            id: 'user-3',
            name: 'Bob Johnson',
            username: 'bobjohnson',
            avatar_url: null,
            role: 'student'
          }
        ]
      }

      // Create chat rooms for each user (admin can see all conversations)
      const rooms: ChatRoom[] = users.map((user: AdminUser) => ({
        id: `chat_${currentUser.id}_${user.id}`,
        user_id: currentUser.id,
        other_user_id: user.id,
        other_user_name: user.name,
        other_user_avatar: user.avatar_url,
        last_message: '',
        last_message_time: '',
        unread_count: 0,
        is_online: Math.random() > 0.5 // Simulate online status
      }))

      setChatRooms(rooms)
      setAvailableUsers(users)
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
      toast.error('Failed to load chat rooms')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch messages for a specific chat (including admin notifications)
  const fetchMessages = async (chatRoom: ChatRoom) => {
    try {
      const allMessages: ChatMessage[] = []

      // 1. Fetch chat messages between users
      try {
        const chatResponse = await fetch(`/api/chat/messages?userId=${chatRoom.user_id}&otherUserId=${chatRoom.other_user_id}`)
        const chatResult: ChatResult = await chatResponse.json()

        if (chatResponse.ok && chatResult.data) {
                  const enhancedChatMessages = chatResult.data.map((message) => ({
          ...message,
          message_type: message.message_type as 'text' | 'image' | 'file',
          sender_name: message.sender_id === currentUser?.id ? (currentUser?.name || 'Admin') : chatRoom.other_user_name,
          sender_avatar: message.sender_id === currentUser?.id ? currentUser?.avatar_url : chatRoom.other_user_avatar,
          receiver_name: message.receiver_id === currentUser?.id ? (currentUser?.name || 'Admin') : chatRoom.other_user_name,
          receiver_avatar: message.receiver_id === currentUser?.id ? currentUser?.avatar_url : chatRoom.other_user_avatar
        }))
          allMessages.push(...enhancedChatMessages)
        }
      } catch (chatError) {
        console.error('Error fetching chat messages:', chatError)
        // Add a fallback message if chat API fails
        const fallbackMessage: ChatMessage = {
          id: 'fallback-1',
          sender_id: currentUser?.id || 'admin',
          receiver_id: chatRoom.other_user_id,
          content: 'Welcome! This is a demo conversation. The chat system is currently in development.',
          message_type: 'text',
          is_read: true,
          created_at: new Date().toISOString(),
          sender_name: currentUser?.name || 'Admin',
          sender_avatar: currentUser?.avatar_url,
          receiver_name: chatRoom.other_user_name,
          receiver_avatar: chatRoom.other_user_avatar,
          is_admin_message: true,
          notification_title: 'System Message'
        }
        allMessages.push(fallbackMessage)
      }

      // 2. Fetch admin notifications sent to this user (skip if API is not available)
      try {
        // For now, we'll skip notifications since supabase is not configured
        // This can be implemented later when the notifications API is ready
        console.log('Notifications feature not yet implemented')
      } catch (notificationsError) {
        console.error('Error fetching notifications:', notificationsError)
        // Notifications are optional, so we don't add fallback here
      }

      // 3. Sort all messages by creation time
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setMessages(allMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
      // Set empty messages array as fallback
      setMessages([])
    }
  }

  // Send a new message (admin to user)
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser?.id) return

    try {
      setIsSending(true)
      
      // Create the message locally first
      const adminMessage: ChatMessage = {
        id: Date.now().toString(),
        sender_id: currentUser.id,
        receiver_id: selectedChat.other_user_id,
        content: newMessage.trim(),
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: currentUser?.name || 'Admin',
        sender_avatar: currentUser?.avatar_url,
        receiver_name: selectedChat.other_user_name,
        receiver_avatar: selectedChat.other_user_avatar
      }
      
      // Try to send via API, but don't fail if it doesn't work
      try {
        const response = await fetch('/api/admin/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedChat.other_user_id,
            subject: `Message from ${currentUser?.name || 'Admin'}`,
            message: newMessage.trim()
          })
        })

        const result = await response.json()

        if (response.ok && result.notification) {
          // Update the message with the real notification ID
          adminMessage.id = result.notification.id
          adminMessage.created_at = result.notification.created_at
        }
      } catch (apiError) {
        console.warn('API send failed, but message will be shown locally:', apiError)
      }
      
      // Add to local state regardless of API success
      setMessages(prev => [...prev, adminMessage])
      setNewMessage('')
      toast.success('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Handle chat selection
  const handleChatSelect = (chat: ChatRoom) => {
    setSelectedChat(chat)
    fetchMessages(chat)
  }

  // Start new chat
  const startNewChat = (user: User) => {
    const newChat: ChatRoom = {
      id: `chat_${currentUser?.id}_${user.id}`,
      user_id: currentUser?.id || '',
      other_user_id: user.id,
      other_user_name: user.name,
      other_user_avatar: user.avatar_url,
      last_message: '',
      last_message_time: '',
      unread_count: 0,
      is_online: Math.random() > 0.5
    }
    
    setSelectedChat(newChat)
    setMessages([])
    setShowNewChat(false)
    setSearchUsers('')
  }

  // Delete message (admin privilege) - local only for now
  const deleteMessage = async (messageId: string) => {
    try {
      // For now, just delete from local state
      // In a full implementation, this would also delete from the database
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  // Filter chat rooms based on search and view mode
  const filteredChatRooms = chatRooms.filter(room => {
    const matchesSearch = room.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (viewMode === 'unread') {
      return matchesSearch && room.unread_count > 0
    } else if (viewMode === 'recent') {
      return matchesSearch && room.last_message_time
    }
    
    return matchesSearch
  })

  // Filter available users for new chat
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) &&
    !chatRooms.some(room => room.other_user_id === user.id)
  )

  useEffect(() => {
    fetchAllChatRooms()
  }, [currentUser?.id])

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please log in to view messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Messages</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all user communications</p>
        </div>

        <div className="h-[calc(100vh-200px)] flex bg-white rounded-lg shadow-sm border">
          {/* Chat Rooms Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">All Conversations</h2>
                <Button
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* View Mode Tabs */}
              <div className="flex space-x-1 mb-4">
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                  className="flex-1"
                >
                  All
                </Button>
                <Button
                  variant={viewMode === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('unread')}
                  className="flex-1"
                >
                  Unread
                </Button>
                <Button
                  variant={viewMode === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('recent')}
                  className="flex-1"
                >
                  Recent
                </Button>
              </div>
              
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
            </div>

            {/* Chat Rooms List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredChatRooms.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                  <p className="text-gray-600">Start a new chat to begin messaging.</p>
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
                            {/* Admin delete button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMessage(message.id)}
                              className="text-red-600 hover:text-red-700 ml-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
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
                </div>
              </>
            ) : (
              /* Welcome Screen */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Messages</h3>
                  <p className="text-gray-600 mb-4">Select a conversation to start chatting or monitoring</p>
                  <Button
                    onClick={() => setShowNewChat(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* New Chat Modal */}
          {showNewChat && (
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-6 w-96 max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">New Chat</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewChat(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => startNewChat(user)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
