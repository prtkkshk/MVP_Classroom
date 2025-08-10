'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Video, 
  Users, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Plus,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Mic,
  MicOff,
  Camera,
  CameraOff
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'

interface LiveSession {
  id: string
  title: string
  status: 'scheduled' | 'live' | 'ended'
  start_time: string
  end_time?: string
  participants: number
  max_participants: number
  created_by: string
}

interface Doubt {
  id: string
  text: string
  student_name: string
  anonymous: boolean
  upvotes: number
  answered: boolean
  created_at: string
}

export default function LiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { submitDoubt, upvoteDoubt, markDoubtAnswered } = useCourseStore()
  
  const courseId = params.courseId as string
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [newDoubt, setNewDoubt] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)

  useEffect(() => {
    if (courseId) {
      loadSessions()
      loadDoubts()
    }
  }, [courseId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentSession?.status === 'live') {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentSession])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      // Fetch live sessions from API
      const response = await fetch(`/api/courses/${courseId}/live-sessions`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        setSessions([])
      }
    } catch (error) {
      toast.error('Failed to load sessions')
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadDoubts = async () => {
    try {
      // Fetch doubts from API
      const response = await fetch(`/api/courses/${courseId}/doubts`)
      if (response.ok) {
        const data = await response.json()
        setDoubts(data.doubts || [])
      } else {
        setDoubts([])
      }
    } catch (error) {
      toast.error('Failed to load doubts')
      setDoubts([])
    }
  }

  const handleJoinSession = (session: LiveSession) => {
    setCurrentSession(session)
    setSessionTimer(0)
    toast.success(`Joined ${session.title}`)
  }

  const handleLeaveSession = () => {
    setCurrentSession(null)
    setSessionTimer(0)
    toast.info('Left the session')
  }

  const handleSubmitDoubt = async () => {
    if (!newDoubt.trim()) {
      toast.error('Please enter a doubt')
      return
    }

    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      const result = await submitDoubt({
        course_id: courseId,
        student_id: user.id,
        text: newDoubt,
        anonymous: isAnonymous
      })

      if (result.success) {
        toast.success('Doubt submitted successfully!')
        setNewDoubt('')
        loadDoubts()
      } else {
        toast.error(result.error || 'Failed to submit doubt')
      }
    } catch (error) {
      toast.error('Failed to submit doubt')
    }
  }

  const handleUpvoteDoubt = async (doubtId: string) => {
    if (!user) return

    try {
      const result = await upvoteDoubt(doubtId, user.id)
      if (result.success) {
        loadDoubts()
      }
    } catch (error) {
      toast.error('Failed to upvote doubt')
    }
  }

  const handleMarkAnswered = async (doubtId: string) => {
    try {
      const result = await markDoubtAnswered(doubtId)
      if (result.success) {
        loadDoubts()
        toast.success('Doubt marked as answered')
      }
    } catch (error) {
      toast.error('Failed to mark doubt as answered')
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (currentSession) {
    return (
      <div className="p-6 space-y-6">
        {/* Session Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveSession}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant={currentSession.status === 'live' ? 'default' : 'secondary'}>
                  {currentSession.status === 'live' ? 'LIVE' : 'SCHEDULED'}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {currentSession.participants}/{currentSession.max_participants}
                </div>
                {currentSession.status === 'live' && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <Clock className="w-4 h-4" />
                    {formatTime(sessionTimer)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMicOn(!isMicOn)}
              className={isMicOn ? 'bg-green-100 text-green-700' : ''}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={isCameraOn ? 'bg-green-100 text-green-700' : ''}
            >
              {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Area */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Live Session</p>
                    <p className="text-sm opacity-75">Video stream will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Controls */}
            {user?.role === 'professor' && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                    <Button variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                                              <Square className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Doubts Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Doubts & Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Submit Doubt */}
                <div className="space-y-2">
                  <Input
                    placeholder="Ask a question..."
                    value={newDoubt}
                    onChange={(e) => setNewDoubt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitDoubt()}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded"
                      />
                      Ask anonymously
                    </label>
                    <Button size="sm" onClick={handleSubmitDoubt}>
                      Submit
                    </Button>
                  </div>
                </div>

                {/* Doubts List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {doubts.map((doubt) => (
                    <motion.div
                      key={doubt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 border rounded-lg ${doubt.answered ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {doubt.text}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{doubt.student_name}</span>
                            <span>•</span>
                            <span>{formatDate(doubt.created_at)}</span>
                            {doubt.answered && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Answered
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpvoteDoubt(doubt.id)}
                            className="p-1 h-auto"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {doubt.upvotes}
                          </Button>
                          {user?.role === 'professor' && !doubt.answered && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAnswered(doubt.id)}
                              className="p-1 h-auto text-green-600"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600">Join live lectures and interactive sessions</p>
        </div>
        {user?.role === 'professor' && (
          <Button
            onClick={() => setShowCreateSession(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        )}
      </motion.div>

      {/* Sessions List */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : sessions.filter(s => s.status === 'scheduled').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No upcoming sessions
                </h3>
                <p className="text-gray-600">
                  Check back later for scheduled live sessions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions
                .filter(s => s.status === 'scheduled')
                .map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{formatDate(session.start_time)}</span>
                          <span>•</span>
                          <span>{session.created_by}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinSession(session)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Join Session
                    </Button>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          {sessions.filter(s => s.status === 'live').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No live sessions
                </h3>
                <p className="text-gray-600">
                  There are no active live sessions at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions
                .filter(s => s.status === 'live')
                .map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border-2 border-red-200 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Video className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <Badge variant="destructive">LIVE NOW</Badge>
                          <span>{session.created_by}</span>
                          <span>•</span>
                          <span>{session.participants} participants</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinSession(session)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Join Live
                    </Button>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No past sessions
              </h3>
              <p className="text-gray-600">
                Past session recordings will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 