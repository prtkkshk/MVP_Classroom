'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  Target, 
  TrendingUp,
  MessageSquare,
  FileText,
  Video,
  Calendar,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type: 'text' | 'suggestion' | 'resource'
}

interface Suggestion {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
}

export default function AICompanionPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI learning companion. I can help you with course concepts, problem solving, study guidance, and more. What would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const suggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Explain a Concept',
      description: 'Get help understanding course concepts',
      icon: <Lightbulb className="w-4 h-4" />,
      action: () => handleSuggestion('Can you explain the concept of binary trees in data structures?')
    },
    {
      id: '2',
      title: 'Help with Problem',
      description: 'Get step-by-step problem solving help',
      icon: <Target className="w-4 h-4" />,
      action: () => handleSuggestion('I need help solving a time complexity problem. Can you walk me through it?')
    },
    {
      id: '3',
      title: 'Study Tips',
      description: 'Get personalized study recommendations',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => handleSuggestion('What are some effective study strategies for learning algorithms?')
    },
    {
      id: '4',
      title: 'Practice Questions',
      description: 'Get practice questions on any topic',
      icon: <BookOpen className="w-4 h-4" />,
      action: () => handleSuggestion('Can you give me some practice questions on recursion?')
    }
  ]

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000))

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputValue),
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('binary tree') || input.includes('data structure')) {
      return "A binary tree is a hierarchical data structure where each node has at most two children, referred to as the left child and right child. It's commonly used for efficient searching and sorting operations. The key properties are:\n\n• Each node contains a value\n• Each node has at most two children\n• Left subtree contains nodes with values less than the parent\n• Right subtree contains nodes with values greater than the parent\n\nWould you like me to explain any specific operations on binary trees?"
    }
    
    if (input.includes('time complexity') || input.includes('algorithm')) {
      return "Time complexity measures how the runtime of an algorithm grows with input size. Common complexities include:\n\n• O(1) - Constant time\n• O(log n) - Logarithmic time\n• O(n) - Linear time\n• O(n²) - Quadratic time\n• O(2ⁿ) - Exponential time\n\nFor example, a simple loop through an array is O(n), while nested loops are often O(n²). Would you like me to analyze a specific algorithm's complexity?"
    }
    
    if (input.includes('study') || input.includes('strategy')) {
      return "Here are some effective study strategies for algorithms:\n\n1. **Practice Regularly**: Solve problems daily, even if just one\n2. **Understand First**: Don't memorize - understand the logic\n3. **Draw It Out**: Visualize algorithms with diagrams\n4. **Implement**: Code the algorithms yourself\n5. **Review**: Revisit concepts periodically\n6. **Group Study**: Discuss with peers\n7. **Break Down**: Divide complex problems into smaller parts\n\nWhat specific topic are you studying right now?"
    }
    
    if (input.includes('recursion') || input.includes('practice')) {
      return "Here are some practice questions on recursion:\n\n1. **Factorial**: Write a function to calculate n!\n2. **Fibonacci**: Generate the nth Fibonacci number\n3. **Sum of Array**: Find sum of array elements recursively\n4. **Reverse String**: Reverse a string using recursion\n5. **Binary Search**: Implement binary search recursively\n6. **Tree Traversal**: Implement inorder, preorder, postorder\n7. **Tower of Hanoi**: Solve the classic puzzle\n\nWould you like me to walk you through any of these problems?"
    }
    
    return "I understand you're asking about learning. I can help you with:\n\n• Explaining course concepts\n• Problem solving strategies\n• Study techniques\n• Practice questions\n• Learning path recommendations\n\nWhat specific area would you like to focus on? Feel free to ask me anything about your courses!"
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <MainLayout 
      title="AI Learning Companion" 
      description="Get personalized learning assistance and study guidance"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Learning Companion</h1>
            <p className="text-gray-600 text-lg">
              Ask me anything about your courses, get study tips, and practice problems
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Chat with AI
                </CardTitle>
                <CardDescription>
                  Your personalized learning assistant
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-2 rounded-full ${message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            {message.sender === 'user' ? (
                              <User className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Bot className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className={`p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            <Bot className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="p-3 rounded-lg bg-gray-100">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm text-gray-600">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your courses..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Suggestions Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common questions and tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={suggestion.action}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-1 bg-blue-100 rounded">
                        {suggestion.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{suggestion.title}</div>
                        <div className="text-xs text-gray-500">{suggestion.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions Asked</span>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Study Sessions</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Topics Covered</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <Separator />
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <div className="text-xs text-gray-500">Understanding Score</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Binary Trees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Time Complexity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Recursion</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Sorting Algorithms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
} 