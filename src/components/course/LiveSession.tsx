'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Video, 
  MessageSquare, 
  Users, 
  Clock, 
  Mic, 
  MicOff,
  BarChart3,
  Plus,
  Send,
  ThumbsUp,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { supabase } from '@/lib/supabase'

interface LiveSessionProps {
  courseId: string
  sessionId?: string
}

interface Doubt {
  id: string
  text: string
  anonymous: boolean
  upvotes: number
  answered: boolean
  student_id: string
  student_name?: string
  created_at: string
}

interface Poll {
  id: string
  question: string
  options: string[]
  is_active: boolean
  responses: { [key: number]: number }
  total_responses: number
}

export default function LiveSession({ courseId, sessionId }: LiveSessionProps) {
  const { user } = useAuthStore()
  const { startLiveSession, endLiveSession } = useCourseStore()
  
  const [isLive, setIsLive] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [participantCount, setParticipantCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [newDoubt, setNewDoubt] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  const [polls, setPolls] = useState<Poll[]>([])
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  
  const [activeTab, setActiveTab] = useState<'chat' | 'polls' | 'participants'>('chat')
  
  const doubtsEndRef = useRef<HTMLDivElement>(null)
  const sessionStartTime = useRef<Date | null>(null)

  // Real-time subscription for doubts
  useEffect(() => {
    if (!isLive || !sessionId) return

    const doubtsChannel = supabase
      .channel(`doubts-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'doubts',
        filter: `live_session_id=eq.${sessionId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDoubts(prev => [...prev, payload.new as Doubt])
        } else if (payload.eventType === 'UPDATE') {
          setDoubts(prev => prev.map(d => d.id === payload.new.id ? payload.new as Doubt : d))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(doubtsChannel)
    }
  }, [isLive, sessionId])

  // Auto-scroll to bottom of doubts
  useEffect(() => {
    doubtsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [doubts])

  const handleStartSession = async () => {
    if (!sessionTitle.trim()) {
      toast.error('Please enter a session title')
      return
    }

    try {
      const result = await startLiveSession({
        course_id: courseId,
        title: sessionTitle,
        description: `Live session: ${sessionTitle}`,
        started_by: user!.id,
        started_at: new Date().toISOString(),
        is_active: true,
        participant_count: 1
      })

      if (result.success) {
        setIsLive(true)
        sessionStartTime.current = new Date()
        toast.success('Live session started!')
      } else {
        toast.error(result.error || 'Failed to start session')
      }
    } catch (error) {
      toast.error('Failed to start live session')
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return

    try {
      const result = await endLiveSession(sessionId)
      if (result.success) {
        setIsLive(false)
        sessionStartTime.current = null
        toast.success('Live session ended')
      }
    } catch (error) {
      toast.error('Failed to end session')
    }
  }

  const submitDoubt = async () => {
    if (!newDoubt.trim() || !sessionId) return

    try {
      const doubtData = {
        course_id: courseId,
        live_session_id: sessionId,
        student_id: user!.id,
        text: newDoubt.trim(),
        anonymous: isAnonymous,
        upvotes: 0,
        answered: false
      }

      const { error } = await supabase
        .from('doubts')
        .insert(doubtData)

      if (error) throw error

      setNewDoubt('')
      toast.success('Doubt submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit doubt')
    }
  }

  const upvoteDoubt = async (doubtId: string) => {
    try {
      const { error } = await supabase
        .from('doubt_upvotes')
        .insert({
          doubt_id: doubtId,
          user_id: user!.id
        })

      if (error) throw error

      // Update local state
      setDoubts(prev => prev.map(d => 
        d.id === doubtId ? { ...d, upvotes: d.upvotes + 1 } : d
      ))
    } catch (error) {
      toast.error('Failed to upvote doubt')
    }
  }

  const createPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
      toast.error('Please fill in all poll fields')
      return
    }

    try {
      const pollData = {
        live_session_id: sessionId!,
        question: pollQuestion.trim(),
        options: pollOptions.filter(opt => opt.trim()),
        created_by: user!.id,
        is_active: true
      }

      const { error } = await supabase
        .from('live_polls')
        .insert(pollData)

      if (error) throw error

      setPollQuestion('')
      setPollOptions(['', ''])
      setShowPollForm(false)
      toast.success('Poll created successfully!')
    } catch (error) {
      toast.error('Failed to create poll')
    }
  }

  const addPollOption = () => {
    setPollOptions([...pollOptions, ''])
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const getSessionDuration = () => {
    if (!sessionStartTime.current) return '00:00:00'
    
    const now = new Date()
    const diff = now.getTime() - sessionStartTime.current.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isLive) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Video className="w-6 h-6" />
            Start Live Session
          </CardTitle>
          <CardDescription>
            Begin an interactive live session with your students
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTitle">Session Title</Label>
            <Input
              id="sessionTitle"
              placeholder="e.g., Introduction to React Hooks"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleStartSession}
            disabled={!sessionTitle.trim()}
            className="w-full"
          >
            <Video className="w-4 h-4 mr-2" />
            Start Live Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Live Session Header */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-semibold">LIVE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sessionTitle}</h1>
                <p className="text-gray-600">Live Session in Progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{getSessionDuration()}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{participantCount}</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleEndSession}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                End Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video/Audio Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Session Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={() => setIsRecording(!isRecording)}
                  className="flex items-center gap-2"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                
                <Badge variant={isRecording ? "destructive" : "secondary"}>
                  {isRecording ? 'Recording' : 'Not Recording'}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• Students can submit doubts anonymously</p>
                <p>• Create live polls to engage students</p>
                <p>• Monitor real-time participation</p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Doubts & Chat
                </Button>
                <Button
                  variant={activeTab === 'polls' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('polls')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Live Polls
                </Button>
                <Button
                  variant={activeTab === 'participants' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('participants')}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Participants
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Doubts & Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {/* Submit Doubt */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="newDoubt">Submit a Doubt</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        id="newDoubt"
                        placeholder="Type your doubt or question here..."
                        value={newDoubt}
                        onChange={(e) => setNewDoubt(e.target.value)}
                        rows={2}
                      />
                      <Button
                        onClick={submitDoubt}
                        disabled={!newDoubt.trim()}
                        className="px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Doubts List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {doubts.map((doubt, index) => (
                        <motion.div
                          key={doubt.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900">{doubt.text}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                <span>
                                  {doubt.anonymous ? 'Anonymous' : doubt.student_name || 'Student'}
                                </span>
                                <span>•</span>
                                <span>{new Date(doubt.created_at).toLocaleTimeString()}</span>
                                {doubt.answered && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Answered
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => upvoteDoubt(doubt.id)}
                              className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{doubt.upvotes}</span>
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={doubtsEndRef} />
                  </div>
                </div>
              )}

              {/* Live Polls Tab */}
              {activeTab === 'polls' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowPollForm(!showPollForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Poll
                  </Button>

                  {showPollForm && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pollQuestion">Poll Question</Label>
                          <Input
                            id="pollQuestion"
                            placeholder="What would you like to ask?"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Poll Options</Label>
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                              />
                              {pollOptions.length > 2 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePollOption(index)}
                                  className="px-2"
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addPollOption}
                            className="text-sm"
                          >
                            + Add Option
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={createPoll} className="flex-1">
                            Create Poll
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowPollForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Active Polls */}
                  <div className="space-y-4">
                    {polls.filter(p => p.is_active).map((poll) => (
                      <Card key={poll.id} className="border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg">{poll.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {poll.options.map((option, index) => {
                            const votes = poll.responses[index] || 0
                            const percentage = poll.total_responses > 0 
                              ? (votes / poll.total_responses) * 100 
                              : 0
                            
                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{option}</span>
                                  <span>{votes} votes ({percentage.toFixed(1)}%)</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            )
                          })}
                          <div className="text-sm text-gray-600 text-center pt-2">
                            Total responses: {poll.total_responses}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Participant list will be displayed here</p>
                    <p className="text-sm">Currently {participantCount} participants</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-semibold">{getSessionDuration()}</span>
              </div>
              <div className="flex justify-between">
                <span>Participants</span>
                <span className="font-semibold">{participantCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Doubts Submitted</span>
                <span className="font-semibold">{doubts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Polls</span>
                <span className="font-semibold">{polls.filter(p => p.is_active).length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('polls')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Poll
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                View Doubts
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
