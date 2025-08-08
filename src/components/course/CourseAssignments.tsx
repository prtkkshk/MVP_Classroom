'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Plus, 
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  users?: {
    name: string
    username: string
  }
}

interface CourseAssignmentsProps {
  courseId: string
  isProfessor: boolean
}

export default function CourseAssignments({ courseId, isProfessor }: CourseAssignmentsProps) {
  const { user } = useAuthStore()
  const { 
    assignments, 
    fetchAssignments, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment,
    isLoading 
  } = useCourseStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxPoints, setMaxPoints] = useState('')

  useEffect(() => {
    fetchAssignments(courseId)
  }, [courseId, fetchAssignments])

  const handleCreate = async () => {
    if (!title || !description || !dueDate || !user) return

    const assignmentData = {
      course_id: courseId,
      title,
      description,
      due_date: dueDate,
      max_points: maxPoints ? parseInt(maxPoints) : null,
      created_by: user.id,
      is_active: true
    }

    const result = await createAssignment(assignmentData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      setTitle('')
      setDescription('')
      setDueDate('')
      setMaxPoints('')
    } else {
      alert('Failed to create assignment')
    }
  }

  const handleEdit = async () => {
    if (!editingAssignment || !title || !description || !dueDate) return

    const updates = {
      title,
      description,
      due_date: dueDate,
      max_points: maxPoints ? parseInt(maxPoints) : null
    }

    const result = await updateAssignment(editingAssignment.id, updates)
    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingAssignment(null)
      setTitle('')
      setDescription('')
      setDueDate('')
      setMaxPoints('')
    } else {
      alert('Failed to update assignment')
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      const result = await deleteAssignment(assignmentId)
      if (!result.success) {
        alert('Failed to delete assignment')
      }
    }
  }

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setTitle(assignment.title)
    setDescription(assignment.description)
    setDueDate(assignment.due_date)
    setMaxPoints(assignment.max_points?.toString() || '')
    setIsEditDialogOpen(true)
  }

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'overdue', text: 'Overdue', variant: 'destructive' as const }
    } else if (diffDays === 0) {
      return { status: 'due-today', text: 'Due Today', variant: 'default' as const }
    } else if (diffDays <= 3) {
      return { status: 'due-soon', text: `Due in ${diffDays} days`, variant: 'secondary' as const }
    } else {
      return { status: 'upcoming', text: `Due in ${diffDays} days`, variant: 'outline' as const }
    }
  }

  const sortedAssignments = [...assignments].sort((a, b) => {
    const aStatus = getDueDateStatus(a.due_date)
    const bStatus = getDueDateStatus(b.due_date)
    
    // Sort by status priority: overdue > due-today > due-soon > upcoming
    const statusPriority = { overdue: 0, 'due-today': 1, 'due-soon': 2, upcoming: 3 }
    const aPriority = statusPriority[aStatus.status as keyof typeof statusPriority]
    const bPriority = statusPriority[bStatus.status as keyof typeof statusPriority]
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // If same status, sort by due date
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">
            Manage course assignments and track deadlines
          </p>
        </div>
        
        {isProfessor && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for your students
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter assignment description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-points">Max Points (Optional)</Label>
                    <Input
                      id="max-points"
                      type="number"
                      value={maxPoints}
                      onChange={(e) => setMaxPoints(e.target.value)}
                      placeholder="100"
                    />
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
                  disabled={!title || !description || !dueDate}
                >
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isProfessor 
                ? "Create your first assignment to get started"
                : "No assignments have been posted for this course yet"
              }
            </p>
            {isProfessor && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => {
            const dueStatus = getDueDateStatus(assignment.due_date)
            return (
              <Card key={assignment.id} className={`hover:shadow-md transition-shadow ${
                dueStatus.status === 'overdue' ? 'border-red-200 bg-red-50 dark:bg-red-950' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {dueStatus.status === 'overdue' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={dueStatus.variant}>
                          {dueStatus.text}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription className="text-sm mt-2">
                          {assignment.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {isProfessor && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(assignment.due_date).toLocaleTimeString()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {assignment.users?.name}
                    </div>
                  </div>
                  
                  {assignment.max_points && (
                    <div className="mt-3">
                      <Badge variant="outline">
                        Max Points: {assignment.max_points}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {isProfessor && (
                      <Button size="sm" variant="outline">
                        View Submissions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Assignment Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter assignment description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-max-points">Max Points (Optional)</Label>
                <Input
                  id="edit-max-points"
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="100"
                />
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
              disabled={!title || !description || !dueDate}
            >
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 