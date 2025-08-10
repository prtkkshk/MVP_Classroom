'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Plus,
  Calendar,
  FileText,
  Clock,
  Video,
  Award,
  Activity,
  ArrowRight
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'

interface DashboardStats {
  totalStudents: number
  activeCourses: number
  totalDoubts: number
  totalLiveSessions: number
  totalAssignments: number
  totalMaterials: number
  averageEngagement: number
  recentActivity: {
    type: string
    title: string
    course: string
    timestamp: Date
  }[]
}

export default function ProfessorDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { 
    courses, 
    doubts, 
    liveSessions, 
    assignments, 
    materials,
    fetchProfessorCourses, 
    fetchDoubts,
    fetchLiveSessions,
    fetchAssignments,
    fetchMaterials,
    isLoading 
  } = useCourseStore()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeCourses: 0,
    totalDoubts: 0,
    totalLiveSessions: 0,
    totalAssignments: 0,
    totalMaterials: 0,
    averageEngagement: 0,
    recentActivity: []
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    // Fetch all course-related data
    await Promise.all([
      fetchProfessorCourses(user.id),
      // Fetch data for each course
      ...courses.map(course => Promise.all([
        fetchDoubts(course.id),
        fetchLiveSessions(course.id),
        fetchAssignments(course.id),
        fetchMaterials(course.id)
      ]))
    ])

    // Calculate stats
    const totalStudents = courses.reduce((acc, course) => acc + (course.enrolled_students || 0), 0)
    const activeCourses = courses.filter(course => course.is_active).length
    const totalDoubts = doubts.length
    const totalLiveSessions = liveSessions.length
    const totalAssignments = assignments.length
    const totalMaterials = materials.length
    
    // Calculate engagement rate (mock calculation)
    const engagement = Math.round((totalStudents / Math.max(courses.length * 50, 1)) * 100) || 87

    // Generate recent activity
    const recentActivity = generateRecentActivity()

    setStats({
      totalStudents,
      activeCourses,
      totalDoubts,
      totalLiveSessions,
      totalAssignments,
      totalMaterials,
      averageEngagement: engagement,
      recentActivity
    })
  }

  const generateRecentActivity = () => {
    const activities = []
    
    // Add recent doubts
    doubts.slice(0, 3).forEach(doubt => {
      const course = courses.find(c => c.id === doubt.course_id)
      activities.push({
        type: 'doubt',
        title: doubt.text.substring(0, 50) + '...',
        course: course?.title || 'Unknown Course',
        timestamp: new Date(doubt.created_at)
      })
    })

    // Add recent assignments
    assignments.slice(0, 2).forEach(assignment => {
      const course = courses.find(c => c.id === assignment.course_id)
      activities.push({
        type: 'assignment',
        title: assignment.title,
        course: course?.title || 'Unknown Course',
        timestamp: new Date(assignment.created_at)
      })
    })

    // Add recent live sessions
    liveSessions.slice(0, 2).forEach(session => {
      const course = courses.find(c => c.id === session.course_id)
      activities.push({
        type: 'live_session',
        title: session.title,
        course: course?.title || 'Unknown Course',
        timestamp: new Date(session.started_at)
      })
    })

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'doubt': return <MessageSquare className="w-4 h-4" />
      case 'assignment': return <FileText className="w-4 h-4" />
      case 'live_session': return <Video className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'doubt': return 'text-blue-600 bg-blue-100'
      case 'assignment': return 'text-green-600 bg-green-100'
      case 'live_session': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const topPerformingCourses = courses
    .map(course => ({
      ...course,
      engagement: Math.floor(Math.random() * 40) + 60 // Mock engagement rate
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3)

  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Dashboard</h1>
          <p className="text-gray-600">Manage your courses and track student engagement</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/dashboard/courses/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
                <p className="text-xs text-blue-600">of {courses.length} total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doubts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDoubts}</p>
                <p className="text-xs text-green-600">+8% from last week</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageEngagement}%</p>
                <p className="text-xs text-green-600">+5% from last month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Course Management Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Course Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Manage your active courses and materials</CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/dashboard/courses/create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses created</h3>
                <p className="text-gray-600 mb-4">Create your first course to start teaching.</p>
                <Button onClick={() => router.push('/dashboard/courses/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.code} • {course.semester}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {course.enrolled_students || 0} students
                          </Badge>
                          {course.is_active && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length > 3 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/courses')}
                    >
                      View All {courses.length} Courses
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>Courses with highest student engagement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{course.title}</h3>
                      <p className="text-xs text-gray-600">{course.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{course.engagement}%</p>
                    <Progress value={course.engagement} className="w-20 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest activities across your courses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600">{activity.course}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
              {stats.recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/dashboard/courses/create')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Create New Course</p>
                    <p className="text-sm text-gray-600">Start a new course</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/dashboard/courses')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Manage Courses</p>
                    <p className="text-sm text-gray-600">View all courses</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => router.push('/dashboard/settings')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Settings</p>
                    <p className="text-sm text-gray-600">Manage preferences</p>
                  </div>
              </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 