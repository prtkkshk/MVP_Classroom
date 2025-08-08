'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target, 
  MessageSquare,
  Calendar,
  Award,
  BarChart3,
  Activity,
  Star,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface LearningMetric {
  id: string
  title: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: string
}

interface CourseProgress {
  id: string
  title: string
  progress: number
  totalTopics: number
  completedTopics: number
  grade: string
  lastActivity: Date
}

interface StudySession {
  id: string
  date: Date
  duration: number
  course: string
  topics: string[]
  efficiency: number
}

export default function StudentAnalyticsPage() {
  const { user } = useAuthStore()
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  const [metrics, setMetrics] = useState<LearningMetric[]>([
    {
      id: '1',
      title: 'Study Hours',
      value: 24.5,
      change: 12.5,
      changeType: 'increase',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      title: 'Questions Asked',
      value: 15,
      change: -3,
      changeType: 'decrease',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      id: '3',
      title: 'Materials Downloaded',
      value: 28,
      change: 8,
      changeType: 'increase',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      id: '4',
      title: 'Assignments Completed',
      value: 5,
      change: 0,
      changeType: 'neutral',
      icon: <Target className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ])

  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([
    {
      id: '1',
      title: 'Advanced Data Structures',
      progress: 75,
      totalTopics: 12,
      completedTopics: 9,
      grade: 'A-',
      lastActivity: new Date('2024-01-20')
    },
    {
      id: '2',
      title: 'Machine Learning Fundamentals',
      progress: 60,
      totalTopics: 15,
      completedTopics: 9,
      grade: 'B+',
      lastActivity: new Date('2024-01-19')
    },
    {
      id: '3',
      title: 'Web Development with React',
      progress: 45,
      totalTopics: 10,
      completedTopics: 4.5,
      grade: 'B',
      lastActivity: new Date('2024-01-18')
    }
  ])

  const [studySessions, setStudySessions] = useState<StudySession[]>([
    {
      id: '1',
      date: new Date('2024-01-20'),
      duration: 120,
      course: 'Advanced Data Structures',
      topics: ['Binary Trees', 'Tree Traversal'],
      efficiency: 85
    },
    {
      id: '2',
      date: new Date('2024-01-19'),
      duration: 90,
      course: 'Machine Learning Fundamentals',
      topics: ['Linear Regression', 'Gradient Descent'],
      efficiency: 92
    },
    {
      id: '3',
      date: new Date('2024-01-18'),
      duration: 60,
      course: 'Web Development with React',
      topics: ['React Hooks', 'State Management'],
      efficiency: 78
    }
  ])

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600'
    if (grade.startsWith('B')) return 'text-blue-600'
    if (grade.startsWith('C')) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 80) return 'text-blue-600'
    if (efficiency >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const totalStudyHours = studySessions.reduce((acc, session) => acc + session.duration, 0) / 60
  const averageEfficiency = studySessions.reduce((acc, session) => acc + session.efficiency, 0) / studySessions.length
  const totalProgress = courseProgress.reduce((acc, course) => acc + course.progress, 0) / courseProgress.length

  return (
    <MainLayout 
      title="Learning Analytics" 
      description="Track your learning progress and performance"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
              <p className="text-gray-600">
                Track your learning progress and performance across all courses
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {metrics.map((metric) => (
            <Card key={metric.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(metric.changeType)}
                    <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Course Progress</TabsTrigger>
              <TabsTrigger value="study-sessions">Study Sessions</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overall Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Overall Learning Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Course Progress</span>
                        <span className="text-sm font-bold">{totalProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={totalProgress} className="h-3" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Study Efficiency</span>
                        <span className="text-sm font-bold">{averageEfficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={averageEfficiency} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{totalStudyHours.toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Total Study Hours</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{courseProgress.length}</div>
                        <div className="text-sm text-gray-600">Active Courses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Learning Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studySessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-blue-100 rounded">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{session.course}</p>
                            <p className="text-xs text-gray-600">
                              {formatDuration(session.duration)} • {session.topics.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.date.toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`text-sm font-medium ${getEfficiencyColor(session.efficiency)}`}>
                            {session.efficiency}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Course Progress Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="space-y-4">
                {courseProgress.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <Badge className={`${getGradeColor(course.grade)} bg-gray-100`}>
                              {course.grade}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span>{course.completedTopics}/{course.totalTopics} topics completed</span>
                              <span>Last activity: {course.lastActivity.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant="outline">View Details</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Study Sessions Tab */}
            <TabsContent value="study-sessions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Study Sessions</h2>
                <Badge variant="outline">
                  Total: {formatDuration(studySessions.reduce((acc, s) => acc + s.duration, 0))}
                </Badge>
              </div>

              <div className="space-y-4">
                {studySessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{session.course}</h3>
                            <Badge variant="outline">{formatDuration(session.duration)}</Badge>
                            <div className={`flex items-center gap-1 text-sm font-medium ${getEfficiencyColor(session.efficiency)}`}>
                              <Star className="w-4 h-4" />
                              {session.efficiency}% efficiency
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            Topics: {session.topics.join(', ')}
                          </p>
                          
                          <p className="text-xs text-gray-500">
                            {session.date.toLocaleDateString()} at {session.date.toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant="outline">View Details</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Completed Achievements */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      Completed Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-green-100 rounded">
                        <Award className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">First Question</p>
                        <p className="text-xs text-gray-600">Asked your first question</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-green-100 rounded">
                        <BookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Study Streak</p>
                        <p className="text-xs text-gray-600">Studied for 7 consecutive days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-green-100 rounded">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Assignment Master</p>
                        <p className="text-xs text-gray-600">Completed 5 assignments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Achievements */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Target className="w-5 h-5" />
                      Upcoming Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-blue-100 rounded">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Perfect Score</p>
                        <p className="text-xs text-gray-600">Get 100% on an assignment</p>
                        <Progress value={80} className="h-1 mt-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-blue-100 rounded">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Question Master</p>
                        <p className="text-xs text-gray-600">Ask 25 questions</p>
                        <Progress value={60} className="h-1 mt-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="p-2 bg-blue-100 rounded">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Study Marathon</p>
                        <p className="text-xs text-gray-600">Study for 50 hours total</p>
                        <Progress value={48} className="h-1 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Learning Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Study Session</span>
                        <span className="font-medium">{formatDuration(studySessions.reduce((acc, s) => acc + s.duration, 0) / studySessions.length)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Best Efficiency</span>
                        <span className="font-medium text-green-600">{Math.max(...studySessions.map(s => s.efficiency))}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Most Studied Course</span>
                        <span className="font-medium">Advanced Data Structures</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Study Streak</span>
                        <span className="font-medium">5 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  )
} 