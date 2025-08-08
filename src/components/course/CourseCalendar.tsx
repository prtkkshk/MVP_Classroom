'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Plus, 
  Clock,
  User,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
  users?: {
    name: string
    username: string
  }
}

interface CourseCalendarProps {
  courseId: string
  isProfessor: boolean
}

export default function CourseCalendar({ courseId, isProfessor }: CourseCalendarProps) {
  const { user } = useAuthStore()
  const { 
    calendarEvents, 
    fetchCalendarEvents, 
    createCalendarEvent, 
    updateCalendarEvent, 
    deleteCalendarEvent,
    isLoading 
  } = useCourseStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'>('assignment')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchCalendarEvents(courseId)
  }, [courseId, fetchCalendarEvents])

  const handleCreate = async () => {
    if (!title || !startDate || !user) return

    const eventData = {
      course_id: courseId,
      title,
      description,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate || null,
      all_day,
      created_by: user.id
    }

    const result = await createCalendarEvent(eventData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      setTitle('')
      setDescription('')
      setEventType('assignment')
      setStartDate('')
      setEndDate('')
      setAllDay(false)
    } else {
      alert('Failed to create event')
    }
  }

  const handleEdit = async () => {
    if (!editingEvent || !title || !startDate) return

    const updates = {
      title,
      description,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate || null,
      all_day
    }

    const result = await updateCalendarEvent(editingEvent.id, updates)
    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingEvent(null)
      setTitle('')
      setDescription('')
      setEventType('assignment')
      setStartDate('')
      setEndDate('')
      setAllDay(false)
    } else {
      alert('Failed to update event')
    }
  }

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const result = await deleteCalendarEvent(eventId)
      if (!result.success) {
        alert('Failed to delete event')
      }
    }
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || '')
    setEventType(event.event_type)
    setStartDate(event.start_date)
    setEndDate(event.end_date || '')
    setAllDay(event.all_day)
    setIsEditDialogOpen(true)
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'assignment':
        return <FileText className="h-4 w-4" />
      case 'exam':
        return <AlertTriangle className="h-4 w-4" />
      case 'live_session':
        return <Video className="h-4 w-4" />
      case 'deadline':
        return <Clock className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'assignment':
        return 'default'
      case 'exam':
        return 'destructive'
      case 'live_session':
        return 'secondary'
      case 'deadline':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const sortedEvents = [...calendarEvents].sort((a, b) => {
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })

  const upcomingEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.start_date)
    return eventDate >= new Date()
  }).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Calendar</h2>
          <p className="text-muted-foreground">
            View and manage course events, deadlines, and schedules
          </p>
        </div>
        
        {isProfessor && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Calendar Event</DialogTitle>
                <DialogDescription>
                  Create a new event for the course calendar
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
                    <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type={allDay ? "date" : "datetime-local"}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
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
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!title || !startDate}
                >
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading events...</p>
                  </div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground">
                    {isProfessor 
                      ? "Add events to keep students informed about important dates"
                      : "No upcoming events scheduled for this course"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mt-1">
                        {getEventIcon(event.event_type)}
                        <Badge variant={getEventBadgeVariant(event.event_type)}>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.all_day ? (
                              formatDate(event.start_date)
                            ) : (
                              `${formatDate(event.start_date)} at ${formatTime(event.start_date)}`
                            )}
                          </div>
                          {event.users && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.users.name}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isProfessor && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Events</span>
                  <Badge variant="outline">{calendarEvents.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assignments</span>
                  <Badge variant="outline">
                    {calendarEvents.filter(e => e.event_type === 'assignment').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Live Sessions</span>
                  <Badge variant="outline">
                    {calendarEvents.filter(e => e.event_type === 'live_session').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exams</span>
                  <Badge variant="outline">
                    {calendarEvents.filter(e => e.event_type === 'exam').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {isProfessor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setEventType('live_session')
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Schedule Live Session
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setEventType('exam')
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Add Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Calendar Event</DialogTitle>
            <DialogDescription>
              Update the event information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-event-type">Event Type</Label>
              <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type={allDay ? "date" : "datetime-local"}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                <Input
                  id="edit-end-date"
                  type={allDay ? "date" : "datetime-local"}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-all-day"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(checked as boolean)}
              />
              <Label htmlFor="edit-all-day">All day event</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!title || !startDate}
            >
              Update Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 