'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Clock, Target, BookOpen, Video, FileText, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Plus, Filter, Download } from 'lucide-react'
import { format, parseISO, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
  courses?: {
    id: string
    title: string
    code: string
  }
  users?: {
    id: string
    name: string
    username: string
    role: string
  }
}

type CalendarView = 'month' | 'week' | 'day' | 'list'
type EventFilter = 'all' | 'personal' | 'course'

export default function CalendarSystem() {
  const { user } = useAuthStore()
  const { calendarEvents, fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useCourseStore()
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<CalendarView>('month')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([])
  
  // Event creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'>('assignment')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  
  // Event editing state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEventType, setEditEventType] = useState<'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'>('assignment')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editAllDay, setEditAllDay] = useState(false)
  const [editSelectedCourseId, setEditSelectedCourseId] = useState<string>('')
  
  // Date click modal state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([])

  // Fetch calendar data
  useEffect(() => {
    if (user) {
      fetchCalendarData()
    }
  }, [user, selectedCourse, selectedEventType, eventFilter])

  // Also fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchCalendarData()
    }
  }, [user])

  const fetchCalendarData = async () => {
    setIsLoading(true)
    try {
      // Fetch calendar events
      const eventsParams = new URLSearchParams({
        userId: user!.id,
        courseId: selectedCourse,
        eventType: selectedEventType,
        view: eventFilter
      })
      
      // Fetch calendar events directly from Supabase
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          courses!calendar_events_course_id_fkey(
            id,
            title,
            code
          ),
          users!calendar_events_created_by_fkey(
            id,
            name,
            username
          )
        `)
        .eq('created_by', user!.id)
        .order('start_date', { ascending: true })

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
      } else {
        setLocalEvents(events || [])
      }

      // Fetch courses for filtering
      const coursesResponse = await fetch(`/api/calendar/courses?userId=${user!.id}`)
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calendar navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    if (selectedView === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    }
  }

  // Date click handler
  const handleDateClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(date)
    setSelectedDateEvents(dayEvents)
    setIsDateModalOpen(true)
  }

  // Create event for specific date
  const handleCreateEventForDate = () => {
    if (selectedDate) {
      setStartDate(format(selectedDate, 'yyyy-MM-dd'))
      setEndDate('') // Clear end date
      setAllDay(true) // Default to all day for date-only events
      setIsDateModalOpen(false)
      setIsCreateDialogOpen(true)
    }
  }

  // Event creation handler
  const handleCreateEvent = async () => {
    if (!title || !startDate || !user) return

    // Convert date to ISO format if it's just a date
    const formatDateForDB = (dateStr: string) => {
      if (dateStr && !dateStr.includes('T')) {
        // If it's just a date (YYYY-MM-DD), add time
        return `${dateStr}T00:00:00.000Z`
      }
      return dateStr
    }

    // Only send the essential fields that definitely exist in the database
    const eventData = {
      title,
      description: description || null,
      event_type: eventType,
      start_date: formatDateForDB(startDate),
      end_date: endDate ? formatDateForDB(endDate) : null,
      all_day: allDay,
      created_by: user.id,
      course_id: selectedCourseId === 'personal' ? null : selectedCourseId
    }
    
    try {
      // Use a simple direct Supabase call
      const insertResult = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single()

      const { data, error } = insertResult

      if (error) {
        console.error('Supabase error:', error)
        console.error('Error details:', error.details, 'hint:', error.hint, 'code:', error.code)
        alert(`Failed to create event: ${error.message}`)
      } else {
        // Add the new event to local state immediately
        setLocalEvents(prev => {
          const newEvents = [data, ...prev]
          return newEvents
        })
        setIsCreateDialogOpen(false)
        // Reset form
        setTitle('')
        setDescription('')
        setEventType('assignment')
        setStartDate('')
        setEndDate('')
        setAllDay(false)
        setSelectedCourseId('personal')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      console.error('Full error object:', error)
      alert('Failed to create event')
    }
  }

  // Event editing handler
  const handleEditEvent = async () => {
    if (!editingEvent || !editTitle || !editStartDate || !user) return

    const formatDateForDB = (dateStr: string) => {
      if (dateStr && !dateStr.includes('T')) {
        return `${dateStr}T00:00:00.000Z`
      }
      return dateStr
    }

    const eventData = {
      title: editTitle,
      description: editDescription || null,
      event_type: editEventType,
      start_date: formatDateForDB(editStartDate),
      end_date: editEndDate ? formatDateForDB(editEndDate) : null,
      all_day: editAllDay,
      course_id: editSelectedCourseId === 'personal' ? null : editSelectedCourseId
    }

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', editingEvent.id)
        .select()
        .single()

      if (error) {
        alert(`Failed to update event: ${error.message}`)
      } else {
        // Update local state
        setLocalEvents(prev => 
          prev.map(event => 
            event.id === editingEvent.id ? data : event
          )
        )
        setIsEditDialogOpen(false)
        setEditingEvent(null)
        // Reset edit form
        setEditTitle('')
        setEditDescription('')
        setEditEventType('assignment')
        setEditStartDate('')
        setEditEndDate('')
        setEditAllDay(false)
        setEditSelectedCourseId('personal')
      }
    } catch (error) {
      alert('Failed to update event')
    }
  }

  // Event deletion handler
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) {
        alert(`Failed to delete event: ${error.message}`)
      } else {
        // Remove from local state
        setLocalEvents(prev => prev.filter(event => event.id !== eventId))
        setIsEditDialogOpen(false)
        setEditingEvent(null)
      }
    } catch (error) {
      alert('Failed to delete event')
    }
  }

  // Open edit dialog
  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditEventType(event.event_type as any)
    setEditStartDate(event.start_date.split('T')[0])
    setEditEndDate(event.end_date ? event.end_date.split('T')[0] : '')
    setEditAllDay(event.all_day)
    setEditSelectedCourseId(event.course_id || 'personal')
    setIsEditDialogOpen(true)
  }

  // Event utilities
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

  const getEventColor = (type: string, priority?: string) => {
    const baseColors = {
      assignment: 'bg-blue-100 text-blue-800 border-blue-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      live_session: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      urgent: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-500'
    }

    const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.other
    const priorityColor = priority ? priorityColors[priority as keyof typeof priorityColors] : priorityColors.normal
    
    return `${baseColor} ${priorityColor}`.trim()
  }

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm')
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy')
  }

  // Filtered events
  const filteredEvents = useMemo(() => {
    let events = localEvents

    if (selectedCourse !== 'all') {
      events = events.filter(event => event.course_id === selectedCourse)
    }

    if (selectedEventType !== 'all') {
      events = events.filter(event => event.event_type === selectedEventType)
    }

    return events
  }, [localEvents, selectedCourse, selectedEventType])

  // Today's events
  const todayEvents = useMemo(() => {
    const today = new Date()
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.start_date)
      return isSameDay(eventDate, today)
    })
  }, [filteredEvents])

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return filteredEvents
      .filter(event => parseISO(event.start_date) > now)
      .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
      .slice(0, 5)
  }, [filteredEvents])

  // Overdue events
  const overdueEvents = useMemo(() => {
    const now = new Date()
    return filteredEvents.filter(event => {
      return parseISO(event.start_date) < now && event.event_type === 'assignment'
    })
  }, [filteredEvents])

  return (
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
              Manage your academic schedule and events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="active:scale-95 transition-transform duration-75"
              onClick={() => {
                fetchCalendarData()
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Refresh
            </Button>









            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform duration-75">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Calendar Event</DialogTitle>
                  <DialogDescription>
                    Create a new event for your calendar
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter event description (optional)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                      <SelectTrigger className="active:scale-95 transition-transform duration-75">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="live_session">Live Session</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="course">Course (Optional)</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="active:scale-95 transition-transform duration-75">
                        <SelectValue placeholder="Select a course (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">No course (personal event)</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">
                        Start Date
                      </Label>
                      <Input
                        id="start-date"
                        type={allDay ? "date" : "datetime-local"}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={selectedDate ? "border-blue-300 bg-blue-50" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-date">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type={allDay ? "date" : "datetime-local"}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-day"
                      checked={allDay}
                      onCheckedChange={(checked) => setAllDay(checked as boolean)}
                    />
                    <Label htmlFor="all-day">All day event</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="active:scale-95 transition-transform duration-75"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={!title || !startDate}
                    className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform duration-75 disabled:scale-100"
                  >
                    Create Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Date Events Modal */}
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              View and manage events for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Events ({selectedDateEvents.length})</h3>
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                    <div className={`p-2 rounded ${getEventColor(event.event_type, event.priority)}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{event.all_day ? 'All day' : formatTime(event.start_date)}</span>
                        {event.course_id && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Course Event
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No events scheduled for this date</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDateModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleCreateEventForDate}
              className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform duration-75"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Calendar Event</DialogTitle>
            <DialogDescription>
              Modify the event details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-event-type">Event Type</Label>
              <Select value={editEventType} onValueChange={(value: any) => setEditEventType(value)}>
                <SelectTrigger className="active:scale-95 transition-transform duration-75">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="live_session">Live Session</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-course">Course (Optional)</Label>
              <Select value={editSelectedCourseId} onValueChange={setEditSelectedCourseId}>
                <SelectTrigger className="active:scale-95 transition-transform duration-75">
                  <SelectValue placeholder="Select a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">No course (personal event)</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type={editAllDay ? "date" : "datetime-local"}
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                <Input
                  id="edit-end-date"
                  type={editAllDay ? "date" : "datetime-local"}
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-all-day"
                checked={editAllDay}
                onCheckedChange={(checked) => setEditAllDay(checked as boolean)}
              />
              <Label htmlFor="edit-all-day">All day event</Label>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => editingEvent && handleDeleteEvent(editingEvent.id)}
              className="active:scale-95 transition-transform duration-75"
            >
              Delete Event
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="active:scale-95 transition-transform duration-75"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditEvent}
                disabled={!editTitle || !editStartDate}
                className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform duration-75 disabled:scale-100"
              >
                Update Event
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      onClick={() => navigateDate('prev')}
                      className="active:scale-95 transition-transform duration-75"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                      className="active:scale-95 transition-transform duration-75"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedView} onValueChange={(value: CalendarView) => setSelectedView(value)}>
                    <SelectTrigger className="w-32 active:scale-95 transition-transform duration-75">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedView} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
                
                <TabsContent value="month" className="mt-6">
                  <MonthView 
                    currentDate={currentDate}
                    events={filteredEvents}
                    onDateClick={handleDateClick}
                    onEventClick={openEditDialog}
                  />
                </TabsContent>
                
                <TabsContent value="week" className="mt-6">
                  <WeekView 
                    currentDate={currentDate}
                    events={filteredEvents}
                    onDateClick={handleDateClick}
                    onEventClick={openEditDialog}
                  />
                </TabsContent>
                
                <TabsContent value="day" className="mt-6">
                  <DayView 
                    currentDate={currentDate}
                    events={filteredEvents}
                    onDateClick={handleDateClick}
                    onEventClick={openEditDialog}
                  />
                </TabsContent>
                
                <TabsContent value="list" className="mt-6">
                  <ListView 
                    events={filteredEvents}
                    onDateClick={handleDateClick}
                    onEventClick={openEditDialog}
                  />
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
                  View
                </label>
                <Select value={eventFilter} onValueChange={(value: EventFilter) => setEventFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Course
                </label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="active:scale-95 transition-transform duration-75">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Event Type
                </label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger className="active:scale-95 transition-transform duration-75">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="live_session">Live Session</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
              {todayEvents.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No events today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className={`p-1 rounded ${getEventColor(event.event_type, event.priority)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {event.all_day ? 'All day' : formatTime(event.start_date)} • Personal
                        </p>
                      </div>
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
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border">
                    <div className={`p-1 rounded ${getEventColor(event.event_type, event.priority)}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(event.start_date)} • Personal
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Assignments */}
          {overdueEvents.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Overdue Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg border border-red-200 bg-white">
                      <div className="p-1 rounded bg-red-100 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          Due {formatDate(event.start_date)} • Personal
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
  )
}

// Month View Component
function MonthView({ 
  currentDate, 
  events, 
  onDateClick,
  onEventClick
}: {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date, dayEvents: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentDate])

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

  const getEventColor = (type: string, priority?: string) => {
    const baseColors = {
      assignment: 'bg-blue-100 text-blue-800 border-blue-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      live_session: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      urgent: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-500'
    }

    const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.other
    const priorityColor = priority ? priorityColors[priority as keyof typeof priorityColors] : priorityColors.normal
    
    return `${baseColor} ${priorityColor}`.trim()
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Calendar Headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
          {day}
        </div>
      ))}
      
      {/* Calendar Days */}
      {days.map((date, i) => {
        const dayEvents = events.filter(event => {
          const eventDate = parseISO(event.start_date)
          return isSameDay(eventDate, date)
        })
        
        const isCurrentMonth = isSameMonth(date, currentDate)
        const isToday = isSameDay(date, new Date())
        
        return (
          <div
            key={i}
            className={`min-h-[120px] p-2 border cursor-pointer hover:bg-gray-50 transition-colors ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => onDateClick(date, dayEvents)}
          >
            <div className={`text-sm font-medium ${
              isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
            } ${isToday ? 'text-blue-600' : ''}`}>
              {format(date, 'd')}
            </div>
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded border ${getEventColor(event.event_type, event.priority)} hover:shadow-sm transition-shadow`}
                  title={event.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle event click if needed
                  }}
                >
                  <div className="flex items-center gap-1">
                    {getEventIcon(event.event_type)}
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 3} more
                </div>
              )}

            </div>
          </div>
        )
      })}
    </div>
  )
}

// Week View Component
function WeekView({ 
  currentDate, 
  events, 
  onDateClick,
  onEventClick
}: {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date, dayEvents: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate)
    return eachDayOfInterval({ 
      start: weekStart, 
      end: endOfWeek(currentDate) 
    })
  }, [currentDate])

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

  const getEventColor = (type: string, priority?: string) => {
    const baseColors = {
      assignment: 'bg-blue-100 text-blue-800 border-blue-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      live_session: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      urgent: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-500'
    }

    const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.other
    const priorityColor = priority ? priorityColors[priority as keyof typeof priorityColors] : priorityColors.normal
    
    return `${baseColor} ${priorityColor}`.trim()
  }

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((date, index) => {
          const isToday = isSameDay(date, new Date())
          const isCurrentMonth = isSameMonth(date, currentDate)
          
          return (
            <div
              key={index}
              className={`p-3 text-center border rounded-lg ${
                isToday 
                  ? 'bg-blue-50 border-blue-200 text-blue-900' 
                  : isCurrentMonth 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-50 border-gray-100 text-gray-500'
              }`}
            >
              <div className="text-sm font-medium">
                {format(date, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${
                isToday ? 'text-blue-600' : ''
              }`}>
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, dayIndex) => {
          const dayEvents = events.filter(event => {
            const eventDate = parseISO(event.start_date)
            return isSameDay(eventDate, date)
          })
          
          const isToday = isSameDay(date, new Date())
          const isCurrentMonth = isSameMonth(date, currentDate)
          
          return (
            <div
              key={dayIndex}
              className={`min-h-[200px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : isCurrentMonth 
                    ? 'bg-white' 
                    : 'bg-gray-50'
              }`}
              onClick={() => onDateClick(date, dayEvents)}
            >
              <div className="text-sm font-medium mb-2 text-gray-700">
                {format(date, 'MMM d')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 4).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-2 rounded border ${getEventColor(event.event_type, event.priority)} hover:shadow-sm transition-shadow`}
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle event click if needed
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {getEventIcon(event.event_type)}
                      <span className="truncate font-medium">{event.title}</span>
                    </div>
                    {!event.all_day && (
                      <div className="text-xs text-gray-600 mt-1">
                        {format(parseISO(event.start_date), 'HH:mm')}
                      </div>
                    )}
                  </div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Day View Component
function DayView({ 
  currentDate, 
  events, 
  onDateClick,
  onEventClick
}: {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date, dayEvents: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date)
      return isSameDay(eventDate, currentDate)
    }).sort((a, b) => {
      if (a.all_day && !b.all_day) return -1
      if (!a.all_day && b.all_day) return 1
      if (!a.all_day && !b.all_day) {
        return parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
      }
      return 0
    })
  }, [events, currentDate])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-5 h-5" />
      case 'exam':
        return <Target className="w-5 h-5" />
      case 'live_session':
        return <Video className="w-5 h-5" />
      case 'deadline':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const getEventColor = (type: string, priority?: string) => {
    const baseColors = {
      assignment: 'bg-blue-100 text-blue-800 border-blue-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      live_session: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      urgent: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-500'
    }

    const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.other
    const priorityColor = priority ? priorityColors[priority as keyof typeof priorityColors] : priorityColors.normal
    
    return `${baseColor} ${priorityColor}`.trim()
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="text-center p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <p className="text-gray-600 mt-1">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Time Grid */}
      <div className="border rounded-lg overflow-hidden">
        {timeSlots.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            if (event.all_day) return false
            const eventHour = parseISO(event.start_date).getHours()
            return eventHour === hour
          })

          return (
            <div key={hour} className="flex border-b last:border-b-0">
              {/* Time Label */}
              <div className="w-20 p-3 text-sm text-gray-500 border-r bg-gray-50 flex-shrink-0">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              
              {/* Events for this hour */}
              <div className="flex-1 p-3 min-h-[60px]">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`inline-block p-2 rounded border ${getEventColor(event.event_type, event.priority)} hover:shadow-sm transition-shadow mb-2`}
                    title={event.title}
                  >
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-gray-600">
                        {format(parseISO(event.start_date), 'HH:mm')}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day events */}
      {dayEvents.filter(event => event.all_day).length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-3">All-day Events</h4>
          <div className="space-y-2">
            {dayEvents.filter(event => event.all_day).map(event => (
              <div
                key={event.id}
                className={`p-3 rounded border ${getEventColor(event.event_type, event.priority)} bg-white`}
              >
                <div className="flex items-center gap-2">
                  {getEventIcon(event.event_type)}
                  <span className="font-medium">{event.title}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// List View Component
function ListView({ 
  events, 
  onDateClick,
  onEventClick
}: {
  events: CalendarEvent[]
  onDateClick: (date: Date, dayEvents: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    })
  }, [events])

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {}
    
    sortedEvents.forEach(event => {
      const dateKey = format(parseISO(event.start_date), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEvents]) => ({
        date: parseISO(date),
        events: dayEvents.sort((a, b) => {
          if (a.all_day && !b.all_day) return -1
          if (!a.all_day && b.all_day) return 1
          if (!a.all_day && !b.all_day) {
            return parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
          }
          return 0
        })
      }))
  }, [sortedEvents])

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

  const getEventColor = (type: string, priority?: string) => {
    const baseColors = {
      assignment: 'bg-blue-100 text-blue-800 border-blue-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      live_session: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      urgent: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-500'
    }

    const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.other
    const priorityColor = priority ? priorityColors[priority as keyof typeof priorityColors] : priorityColors.normal
    
    return `${baseColor} ${priorityColor}`.trim()
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-600">Try adjusting your filters or create a new event.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(({ date, events: dayEvents }) => (
        <div key={date.toISOString()} className="border rounded-lg overflow-hidden">
          {/* Date Header */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-medium text-gray-900">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-600">
              {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Events List */}
          <div className="divide-y">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${getEventColor(event.event_type, event.priority)}`}
                onClick={() => onDateClick(date, dayEvents)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {event.all_day ? (
                          <Badge variant="secondary">All day</Badge>
                        ) : (
                          <span>{format(parseISO(event.start_date), 'HH:mm')}</span>
                        )}
                        {event.course_id && (
                          <Badge variant="outline">Course</Badge>
                        )}
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(event.start_date), 'MMM dd, yyyy')}
                      </span>
                      {event.course_id && event.courses && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {event.courses.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
