'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  Video, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Download
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description: string
  type: 'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'
  start_date: Date
  end_date?: Date
  course_id: string
  course_name: string
  is_all_day: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export default function StudentCalendarPage() {
  const { user } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Data Structures Assignment Due',
      description: 'Submit implementation of binary search tree',
      type: 'assignment',
      start_date: new Date('2024-01-25T23:59:00'),
      course_id: '1',
      course_name: 'Advanced Data Structures',
      is_all_day: false,
      priority: 'urgent'
    },
    {
      id: '2',
      title: 'Machine Learning Midterm Exam',
      description: 'Covers topics 1-5 from the syllabus',
      type: 'exam',
      start_date: new Date('2024-01-28T14:00:00'),
      end_date: new Date('2024-01-28T16:00:00'),
      course_id: '2',
      course_name: 'Machine Learning Fundamentals',
      is_all_day: false,
      priority: 'high'
    },
    {
      id: '3',
      title: 'Live Session: Web Development',
      description: 'React hooks and state management',
      type: 'live_session',
      start_date: new Date('2024-01-26T10:00:00'),
      end_date: new Date('2024-01-26T11:30:00'),
      course_id: '3',
      course_name: 'Web Development with React',
      is_all_day: false,
      priority: 'normal'
    },
    {
      id: '4',
      title: 'Project Proposal Deadline',
      description: 'Submit final project proposal',
      type: 'deadline',
      start_date: new Date('2024-01-30T23:59:00'),
      course_id: '1',
      course_name: 'Advanced Data Structures',
      is_all_day: false,
      priority: 'high'
    }
  ])

  const courses = [
    { id: 'all', name: 'All Courses' },
    { id: '1', name: 'Advanced Data Structures' },
    { id: '2', name: 'Machine Learning Fundamentals' },
    { id: '3', name: 'Web Development with React' }
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-4 h-4" />
      case 'exam':
        return <Target className="w-4 h-4" />
      case 'live_session':
        return <Video className="w-4 h-4" />
      case 'deadline':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'live_session':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'deadline':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'normal':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter(event => event.start_date > now)
      .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
      .slice(0, 5)
  }

  const getTodayEvents = () => {
    const today = new Date()
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.toDateString() === today.toDateString()
    })
  }

  const getOverdueEvents = () => {
    const now = new Date()
    return events.filter(event => {
      return event.start_date < now && event.type === 'assignment'
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const filteredEvents = selectedCourse === 'all' 
    ? events 
    : events.filter(event => event.course_id === selectedCourse)

  return (
    <MainLayout 
      title="Calendar" 
      description="View your course events, deadlines, and schedules"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
              <p className="text-gray-600">
                Manage your course events and deadlines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h2 className="text-xl font-semibold">
                        {currentDate.toLocaleDateString([], { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedView} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="month" className="mt-6">
                    <div className="grid grid-cols-7 gap-1">
                      {/* Calendar Headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      
                      {/* Calendar Days */}
                      {Array.from({ length: 35 }, (_, i) => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                        date.setDate(date.getDate() + i - date.getDay())
                        
                        const dayEvents = filteredEvents.filter(event => {
                          const eventDate = new Date(event.start_date)
                          return eventDate.toDateString() === date.toDateString()
                        })
                        
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                        const isToday = date.toDateString() === new Date().toDateString()
                        
                        return (
                          <div
                            key={i}
                            className={`min-h-[100px] p-2 border ${
                              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                            } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            <div className={`text-sm font-medium ${
                              isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                            } ${isToday ? 'text-blue-600' : ''}`}>
                              {date.getDate()}
                            </div>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded border ${getEventColor(event.type)}`}
                                  title={event.title}
                                >
                                  <div className="flex items-center gap-1">
                                    {getEventIcon(event.type)}
                                    <span className="truncate">{event.title}</span>
                                  </div>
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="week" className="mt-6">
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Week view coming soon</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="day" className="mt-6">
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Day view coming soon</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Course
                  </label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Today's Events */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Events</CardTitle>
              </CardHeader>
              <CardContent>
                {getTodayEvents().length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No events today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getTodayEvents().map(event => (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border">
                        <div className={`p-1 rounded ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatTime(event.start_date)} • {event.course_name}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingEvents().map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className={`p-1 rounded ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(event.start_date)} • {event.course_name}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Assignments */}
            {getOverdueEvents().length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Overdue Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getOverdueEvents().map(event => (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border border-red-200 bg-white">
                        <div className="p-1 rounded bg-red-100 text-red-800">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            Due {formatDate(event.start_date)} • {event.course_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
} 