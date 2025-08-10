'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  MessageSquare, 
  BookOpen, 
  Target, 
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  MoreHorizontal
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'enrollment' | 'announcement' | 'assignment' | 'live_session' | 'doubt' | 'poll' | 'system'
  title: string
  message: string
  courseId?: string
  courseName?: string
  isRead: boolean
  createdAt: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  metadata?: Record<string, any>
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('all')
  const [isLoading, setIsLoading] = useState(false)
  
  const { user } = useAuthStore()
  const { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useCourseStore()
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length)
  }, [notifications])

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Fetch real notifications from database
      await fetchNotifications(user.id)
      
      // Get notifications from store
      const storeNotifications = useCourseStore.getState().notifications
      
      // Transform to local format
      const realNotifications: Notification[] = storeNotifications.map(notification => ({
        id: notification.id,
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        courseId: notification.course_id,
        courseName: notification.course_name,
        isRead: notification.is_read,
        createdAt: new Date(notification.created_at),
        priority: notification.priority as any,
        actionUrl: notification.action_url
      }))
      
      setNotifications(realNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead(user?.id || '')
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    
    setIsOpen(false)
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.isRead)
      case 'important':
        return notifications.filter(n => n.priority === 'high' || n.priority === 'urgent')
      default:
        return notifications
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="w-4 h-4" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4" />
      case 'assignment':
        return <Target className="w-4 h-4" />
      case 'live_session':
        return <Calendar className="w-4 h-4" />
      case 'doubt':
        return <MessageSquare className="w-4 h-4" />
      case 'poll':
        return <BookOpen className="w-4 h-4" />
      case 'system':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'bg-blue-100 text-blue-700'
      case 'announcement':
        return 'bg-purple-100 text-purple-700'
      case 'assignment':
        return 'bg-red-100 text-red-700'
      case 'live_session':
        return 'bg-green-100 text-green-700'
      case 'doubt':
        return 'bg-orange-100 text-orange-700'
      case 'poll':
        return 'bg-indigo-100 text-indigo-700'
      case 'system':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'normal':
        return 'bg-blue-100 text-blue-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Badge 
              variant="destructive" 
              className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </motion.div>
        )}
      </motion.button>

      {/* Notification Center */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      Mark all read
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-3">
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'important', label: 'Important', count: notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 text-xs px-3 py-1 rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </motion.button>
                ))}
              </div>
            </div>

            <ScrollArea className="max-h-96">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {activeTab === 'all' ? 'No notifications' : 
                       activeTab === 'unread' ? 'No unread notifications' : 
                       'No important notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative group ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            !notification.isRead ? 'border-blue-200' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-1 rounded ${getTypeColor(notification.type)}`}>
                                {getTypeIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {notification.priority !== 'normal' && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                                      >
                                        {notification.priority}
                                      </Badge>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteNotification(notification.id)
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 rounded-md hover:bg-red-100 text-red-600 transition-all"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </motion.button>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeAgo(notification.createdAt)}
                                    {notification.courseName && (
                                      <>
                                        <span>•</span>
                                        <span>{notification.courseName}</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {/* Navigate to notification settings */}}
                    className="text-xs p-1 h-6 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Settings
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 