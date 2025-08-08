'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  User, 
  Calendar,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type Doubt = Database['public']['Tables']['doubts']['Row'] & {
  users?: {
    name: string
    username: string
  }
  answered_by_user?: {
    name: string
    username: string
  }
}

interface CourseDoubtsProps {
  courseId: string
  isProfessor: boolean
}

export default function CourseDoubts({ courseId, isProfessor }: CourseDoubtsProps) {
  const { user } = useAuthStore()
  const { 
    doubts, 
    fetchDoubts, 
    submitDoubt, 
    upvoteDoubt, 
    removeUpvote,
    answerDoubt,
    isLoading 
  } = useCourseStore()
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false)
  const [answeringDoubt, setAnsweringDoubt] = useState<Doubt | null>(null)
  const [doubtText, setDoubtText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [answerText, setAnswerText] = useState('')

  useEffect(() => {
    fetchDoubts(courseId)
  }, [courseId, fetchDoubts])

  const handleSubmitDoubt = async () => {
    if (!doubtText || !user) return

    const doubtData = {
      course_id: courseId,
      student_id: user.id,
      text: doubtText,
      anonymous: isAnonymous,
      upvotes: 0,
      answered: false
    }

    const result = await submitDoubt(doubtData)
    if (result.success) {
      setIsSubmitDialogOpen(false)
      setDoubtText('')
      setIsAnonymous(false)
    } else {
      alert('Failed to submit doubt')
    }
  }

  const handleUpvote = async (doubtId: string) => {
    if (!user) return

    const result = await upvoteDoubt(doubtId, user.id)
    if (!result.success) {
      alert('Failed to upvote doubt')
    }
  }

  const handleAnswerDoubt = async () => {
    if (!answeringDoubt || !answerText || !user) return

    const result = await answerDoubt(answeringDoubt.id, answerText, user.id)
    if (result.success) {
      setIsAnswerDialogOpen(false)
      setAnsweringDoubt(null)
      setAnswerText('')
    } else {
      alert('Failed to answer doubt')
    }
  }

  const openAnswerDialog = (doubt: Doubt) => {
    setAnsweringDoubt(doubt)
    setIsAnswerDialogOpen(true)
  }

  const sortedDoubts = [...doubts].sort((a, b) => {
    // Sort by answered status first (unanswered first)
    if (a.answered !== b.answered) {
      return a.answered ? 1 : -1
    }
    // Then sort by upvotes (highest first)
    return b.upvotes - a.upvotes
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Doubts & Questions</h2>
          <p className="text-muted-foreground">
            Ask questions and get answers from professors and peers
          </p>
        </div>
        
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ask Doubt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit a Doubt</DialogTitle>
              <DialogDescription>
                Ask a question about the course material
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="doubt">Your Question</Label>
                <Textarea
                  id="doubt"
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="Enter your question here..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                />
                <Label htmlFor="anonymous">Submit anonymously</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSubmitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitDoubt}
                disabled={!doubtText}
              >
                Submit Doubt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doubts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading doubts...</p>
          </div>
        </div>
      ) : doubts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No doubts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Be the first to ask a question about this course
            </p>
            <Button onClick={() => setIsSubmitDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ask Doubt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDoubts.map((doubt) => (
            <Card key={doubt.id} className={`hover:shadow-md transition-shadow ${doubt.answered ? 'border-green-200 bg-green-50 dark:bg-green-950' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {doubt.answered && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant={doubt.answered ? "default" : "secondary"}>
                        {doubt.answered ? "Answered" : "Unanswered"}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{doubt.text}</CardTitle>
                      <CardDescription className="text-sm mt-2">
                        {doubt.anonymous ? (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Anonymous
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {doubt.users?.name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(doubt.id)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {doubt.upvotes}
                    </Button>
                    
                    {isProfessor && !doubt.answered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAnswerDialog(doubt)}
                      >
                        Answer
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {doubt.answered && doubt.answer_text && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Answer by {doubt.answered_by_user?.name}
                      </span>
                    </div>
                    <p className="text-sm">{doubt.answer_text}</p>
                    {doubt.answered_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Answered on {new Date(doubt.answered_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {doubt.upvotes} upvotes
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(doubt.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Answer Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Answer Doubt</DialogTitle>
            <DialogDescription>
              Provide an answer to the student's question
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {answeringDoubt && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Question:</p>
                <p className="text-sm">{answeringDoubt.text}</p>
              </div>
            )}

            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Enter your answer here..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnswerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnswerDoubt}
              disabled={!answerText}
            >
              Submit Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 