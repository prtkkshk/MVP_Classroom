'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText, 
  Video, 
  MessageSquare,
  Target,
  Download,
  Eye,
  Play,
  Plus,
  Search
} from 'lucide-react'

interface CourseMaterial {
  id: string
  name: string
  description: string
  type: 'syllabus' | 'slides' | 'readings' | 'assignments' | 'videos' | 'other'
  file_size: string
  upload_date: Date
  download_url: string
  icon: React.ReactNode
}

interface LiveSession {
  id: string
  title: string
  description: string
  start_time: Date
  end_time: Date
  is_active: boolean
  participant_count: number
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: Date
  max_points: number
  status: 'upcoming' | 'due_soon' | 'due_today' | 'overdue'
}

export default function StudentCourseDetailPage({ params }: { params: { courseId: string } }) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [course] = useState({
    id: params.courseId,
    title: 'Advanced Data Structures',
    code: 'CS301',
    description: 'Learn fundamental data structures and algorithms including arrays, linked lists, stacks, queues, trees, and graphs. Understand time and space complexity analysis.',
    professor_name: 'Dr. Sarah Johnson',
    semester: 'Spring 2024',
    schedule: 'Mon, Wed, Fri 10:00 AM - 11:30 AM',
    classroom: 'Computer Science Building, Room 205',
    enrolled_students: 45,
    max_students: 50,
    progress: 65
  })

  const [materials] = useState<CourseMaterial[]>([
    {
      id: '1',
      name: 'Course Syllabus',
      description: 'Complete course outline and grading policy',
      type: 'syllabus',
      file_size: '245 KB',
      upload_date: new Date('2024-01-15'),
      download_url: '#',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: '2',
      name: 'Lecture 1: Introduction to Data Structures',
      description: 'Slides from the first lecture covering basic concepts',
      type: 'slides',
      file_size: '2.1 MB',
      upload_date: new Date('2024-01-16'),
      download_url: '#',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: '3',
      name: 'Binary Trees Implementation',
      description: 'Code examples and implementation details for binary trees',
      type: 'readings',
      file_size: '1.8 MB',
      upload_date: new Date('2024-01-17'),
      download_url: '#',
      icon: <FileText className="w-4 h-4" />
    }
  ])

  const [liveSessions] = useState<LiveSession[]>([
    {
      id: '1',
      title: 'Data Structures Review Session',
      description: 'Interactive review session covering arrays, linked lists, and basic algorithms',
      start_time: new Date('2024-01-20T14:00:00'),
      end_time: new Date('2024-01-20T15:30:00'),
      is_active: false,
      participant_count: 42
    },
    {
      id: '2',
      title: 'Algorithm Complexity Workshop',
      description: 'Hands-on workshop focusing on time and space complexity analysis',
      start_time: new Date('2024-01-22T10:00:00'),
      end_time: new Date('2024-01-22T11:30:00'),
      is_active: true,
      participant_count: 38
    }
  ])

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Linked List Implementation',
      description: 'Implement a singly linked list with basic operations',
      due_date: new Date('2024-01-25T23:59:00'),
      max_points: 100,
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Stack and Queue Analysis',
      description: 'Analyze the efficiency of different stack and queue implementations',
      due_date: new Date('2024-01-28T23:59:00'),
      max_points: 75,
      status: 'upcoming'
    }
  ])

  const getMaterialTypeColor = (type: string) => {
    switch (type) {
      case 'syllabus':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'slides':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'readings':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'assignments':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'videos':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'due_today':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'upcoming':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date()
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <MainLayout 
      title={course.title}
      description={`Course: ${course.code} - ${course.semester}`}
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                      <p className="text-gray-600">{course.code} • {course.semester}</p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-700 mb-6">{course.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Professor: {course.professor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{course.classroom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{course.enrolled_students}/{course.max_students} students</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Course Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    Join Live Session
                  </Button>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Question
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Course Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
              <TabsTrigger value="doubts">Doubts</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="p-2 bg-blue-100 rounded">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">New material uploaded</p>
                          <p className="text-sm text-gray-600">Binary Trees Implementation</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="p-2 bg-green-100 rounded">
                          <Video className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Live session completed</p>
                          <p className="text-sm text-gray-600">Binary Trees Deep Dive</p>
                          <p className="text-xs text-gray-500">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Materials Downloaded</span>
                        <Badge variant="secondary">12</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Live Sessions Attended</span>
                        <Badge variant="secondary">8</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Questions Asked</span>
                        <Badge variant="secondary">15</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Assignments Completed</span>
                        <Badge variant="secondary">5/8</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="syllabus">Syllabus</SelectItem>
                      <SelectItem value="slides">Slides</SelectItem>
                      <SelectItem value="readings">Readings</SelectItem>
                      <SelectItem value="assignments">Assignments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <Card key={material.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded ${getMaterialTypeColor(material.type)}`}>
                          {material.icon}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {material.file_size}
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1">{material.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Uploaded {material.upload_date.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Live Sessions Tab */}
            <TabsContent value="live-sessions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Live Sessions</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              </div>

              <div className="space-y-4">
                {liveSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{session.title}</h3>
                            {session.is_active && (
                              <Badge className="bg-green-100 text-green-800">Live Now</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{session.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(session.start_time)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.participant_count} participants
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {session.is_active ? (
                            <Button>
                              <Play className="w-4 h-4 mr-2" />
                              Join Now
                            </Button>
                          ) : (
                            <Button variant="outline" disabled>
                              <Clock className="w-4 h-4 mr-2" />
                              Upcoming
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Doubts Tab */}
            <TabsContent value="doubts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Doubts</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No doubts yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start asking questions to get help with course concepts
                    </p>
                    <Button>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask Your First Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Assignments</h2>
              </div>

              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{assignment.title}</h3>
                            <Badge className={getAssignmentStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{assignment.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {assignment.max_points} points
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due {formatDate(assignment.due_date)}
                            </span>
                            {assignment.status === 'upcoming' && (
                              <span className="text-blue-600">
                                {getDaysUntilDue(assignment.due_date)} days left
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button>
                            <FileText className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Calendar</h2>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Calendar
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Course Events</h3>
                    <p className="text-gray-600">
                      View all course events, deadlines, and live sessions in the calendar
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  )
} 