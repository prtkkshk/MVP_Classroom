'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Plus,
  Calendar,
  FileText,
  Video,
  BarChart3,
  Clock
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'

export default function ProfessorDashboard() {
  const { user } = useAuthStore()
  const { courses, fetchProfessorCourses, isLoading } = useCourseStore()
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    weeklyQuestions: 0,
    engagementRate: 0
  })

  useEffect(() => {
    if (user) {
      fetchProfessorCourses(user.id)
    }
  }, [user, fetchProfessorCourses])

  useEffect(() => {
    // Calculate stats from courses
    const totalStudents = courses.reduce((acc, course) => acc + (course.enrolled_students || 0), 0)
    setStats({
      totalStudents,
      activeCourses: courses.length,
      weeklyQuestions: courses.length * 5, // Mock data
      engagementRate: Math.round((totalStudents / (courses.length * 50)) * 100) || 87
    })
  }, [courses])

  const recentQuestions = [
    {
      id: '1',
      text: 'Can you explain the time complexity of binary search trees?',
      course: 'Advanced Data Structures',
      student: 'Anonymous',
      timestamp: new Date('2024-01-15T10:30:00'),
      upvotes: 5
    },
    {
      id: '2',
      text: 'What is the difference between DFS and BFS traversal?',
      course: 'Advanced Data Structures',
      student: 'Alice Johnson',
      timestamp: new Date('2024-01-15T10:35:00'),
      upvotes: 3
    }
  ]

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
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </motion.div>

      {/* Analytics Overview */}
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
                <p className="text-sm font-medium text-gray-600">Questions This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.weeklyQuestions}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.engagementRate}%</p>
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
              <Button size="sm" variant="outline">
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
                <Button>
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
                          {course.is_live && (
                            <Badge variant="destructive" className="text-xs">
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Materials
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="w-4 h-4 mr-1" />
                        Live
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length > 3 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      View All {courses.length} Courses
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Questions</CardTitle>
                <CardDescription>Latest doubts from your students</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuestions.map((question) => (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {question.course}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {question.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{question.upvotes}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{question.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">by {question.student}</span>
                    <Button size="sm" variant="outline">
                      Answer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Create Course</h3>
              <p className="text-sm text-gray-600 mb-4">Start a new course and invite students</p>
              <Button size="sm" className="w-full">Get Started</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Start Live Session</h3>
              <p className="text-sm text-gray-600 mb-4">Begin an interactive live class</p>
              <Button size="sm" variant="outline" className="w-full">Go Live</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Upload Materials</h3>
              <p className="text-sm text-gray-600 mb-4">Share course materials with students</p>
              <Button size="sm" variant="outline" className="w-full">Upload</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">View Analytics</h3>
              <p className="text-sm text-gray-600 mb-4">Track student engagement and progress</p>
              <Button size="sm" variant="outline" className="w-full">Analytics</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 