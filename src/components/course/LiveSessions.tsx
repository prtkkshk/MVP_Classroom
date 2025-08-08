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
  Video, 
  Play, 
  Square, 
  Users, 
  Plus, 
  Clock,
  Calendar,
  User,
  MessageSquare,
  BarChart3
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type LiveSession = Database['public']['Tables']['live_sessions']['Row'] & {
  users?: {
    name: string
    username: string
  }
}

interface LiveSessionsProps {
  courseId: string
  isProfessor: boolean
}

export default function LiveSessions({ courseId, isProfessor }: LiveSessionsProps) {
  const { user } = useAuthStore()
  const { 
    liveSessions, 
    fetchLiveSessions, 
    startLiveSession, 
    endLiveSession,
    isLoading 
  } = useCourseStore()
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)

  useEffect(() => {
    fetchLiveSessions(courseId)
  }, [courseId, fetchLiveSessions])

  useEffect(() => {
    const active = liveSessions.find(session => session.is_active)
    setActiveSession(active || null)
  }, [liveSessions])

  const handleStartSession = async () => {
    if (!sessionTitle || !user) return

    const sessionData = {
      course_id: courseId,
      title: sessionTitle,
      description: sessionDescription,
      started_by: user.id,
      is_active: true,
      participant_count: 0
    }

    const result = await startLiveSession(sessionData)
    if (result.success) {
      setIsStartDialogOpen(false)
      setSessionTitle('')
      setSessionDescription('')
    } else {
      alert('Failed to start live session')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to end this live session?')) {
      const result = await endLiveSession(sessionId)
      if (!result.success) {
        alert('Failed to end live session')
      }
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Sessions</h2>
          <p className="text-muted-foreground">
            Manage and participate in real-time classroom sessions
          </p>
        </div>
        
        {isProfessor && (
          <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Start Live Session</DialogTitle>
                <DialogDescription>
                  Begin a new live classroom session
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Enter session title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    placeholder="Enter session description (optional)"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsStartDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartSession}
                  disabled={!sessionTitle}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Session */}
      {activeSession && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Badge variant="default" className="bg-green-500">
                    LIVE
                  </Badge>
                </div>
                <CardTitle className="text-lg">{activeSession.title}</CardTitle>
              </div>
              
              {isProfessor && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEndSession(activeSession.id)}
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Duration: {formatDuration(activeSession.started_at)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Participants: {activeSession.participant_count}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Started by: {activeSession.users?.name}
                </span>
              </div>
            </div>
            
            {activeSession.description && (
              <p className="text-sm text-muted-foreground mt-3">
                {activeSession.description}
              </p>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Session
              </Button>
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Polls
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      ) : liveSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No live sessions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isProfessor 
                ? "Start your first live session to engage with students"
                : "No live sessions have been scheduled for this course yet"
              }
            </p>
            {isProfessor && (
              <Button onClick={() => setIsStartDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {liveSessions
            .filter(session => !session.is_active) // Show only ended sessions
            .map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">Ended</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {session.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Duration: {formatDuration(session.started_at, session.ended_at || undefined)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Participants: {session.participant_count}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {session.users?.name}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Doubts
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Polls
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 