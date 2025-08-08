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
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit,
  Calendar,
  User,
  AlertTriangle,
  Info,
  FileText
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type CourseAnnouncement = Database['public']['Tables']['course_announcements']['Row'] & {
  users?: {
    name: string
    username: string
  }
}

interface CourseAnnouncementsProps {
  courseId: string
  isProfessor: boolean
}

export default function CourseAnnouncements({ courseId, isProfessor }: CourseAnnouncementsProps) {
  const { user } = useAuthStore()
  const { announcements, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, isLoading } = useCourseStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<CourseAnnouncement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'announcement' | 'bulletin' | 'assignment'>('announcement')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')

  useEffect(() => {
    fetchAnnouncements(courseId)
  }, [courseId, fetchAnnouncements])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'low':
        return <Info className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'normal':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Bell className="h-4 w-4" />
      case 'bulletin':
        return <FileText className="h-4 w-4" />
      case 'assignment':
        return <FileText className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleCreate = async () => {
    if (!title || !content || !user) return

    const announcementData = {
      course_id: courseId,
      title,
      content,
      type,
      priority,
      created_by: user.id
    }

    const result = await createAnnouncement(announcementData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      setTitle('')
      setContent('')
      setType('announcement')
      setPriority('normal')
    } else {
      alert('Failed to create announcement')
    }
  }

  const handleEdit = async () => {
    if (!editingAnnouncement || !title || !content) return

    const updates = {
      title,
      content,
      type,
      priority
    }

    const result = await updateAnnouncement(editingAnnouncement.id, updates)
    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingAnnouncement(null)
      setTitle('')
      setContent('')
      setType('announcement')
      setPriority('normal')
    } else {
      alert('Failed to update announcement')
    }
  }

  const handleDelete = async (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const result = await deleteAnnouncement(announcementId)
      if (!result.success) {
        alert('Failed to delete announcement')
      }
    }
  }

  const openEditDialog = (announcement: CourseAnnouncement) => {
    setEditingAnnouncement(announcement)
    setTitle(announcement.title)
    setContent(announcement.content)
    setType(announcement.type)
    setPriority(announcement.priority)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Announcements</h2>
          <p className="text-muted-foreground">
            Stay updated with course announcements, bulletins, and important information
          </p>
        </div>
        
        {isProfessor && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Share important information with your students
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement content"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: any) => setType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="bulletin">Bulletin</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  disabled={!title || !content}
                >
                  Create Announcement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading announcements...</p>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isProfessor 
                ? "Create your first announcement to keep students informed"
                : "No announcements have been posted for this course yet"
              }
            </p>
            {isProfessor && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityIcon(announcement.priority)}
                      {getTypeIcon(announcement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <Badge variant={getPriorityBadgeVariant(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">
                          {announcement.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {announcement.content}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {isProfessor && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {announcement.users && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {announcement.users.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter announcement content"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="bulletin">Bulletin</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              disabled={!title || !content}
            >
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 