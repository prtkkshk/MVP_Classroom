'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Plus,
  Calendar,
  FileText,
  Video
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const { enrolledCourses, fetchEnrolledCourses, isLoading } = useCourseStore()
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalQuestions: 0,
    studyHours: 0,
    assignmentsDue: 0
  })

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses(user.id)
    }
  }, [user, fetchEnrolledCourses])

  useEffect(() => {
    // Calculate stats from enrolled courses
    setStats({
      totalCourses: enrolledCourses.length,
      totalQuestions: enrolledCourses.reduce((acc, course) => acc + (course.enrolled_students || 0), 0),
      studyHours: enrolledCourses.length * 3, // Mock data
      assignmentsDue: enrolledCourses.length * 2 // Mock data
    })
  }, [enrolledCourses])

  const recentActivities = [
    {
      id: '1',
      type: 'material_uploaded',
      title: 'New material uploaded',
      description: 'Binary Trees Implementation.cpp was uploaded to Advanced Data Structures',
      timestamp: new Date('2024-01-20T09:00:00'),
      courseId: '1'
    },
    {
      id: '2',
      type: 'doubt_asked',
      title: 'Question asked in live session',
      description: 'You asked about time complexity in Advanced Data Structures',
      timestamp: new Date('2024-01-15T10:30:00'),
      courseId: '1'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 text-lg">
                  You have {stats.assignmentsDue} upcoming deadlines and {stats.totalCourses} active courses.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="p-4 bg-blue-600 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
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
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questions Asked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Studied</p>
                <p className="text-2xl font-bold text-gray-900">{stats.studyHours}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments Due</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assignmentsDue}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Enrolled Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Manage your enrolled courses and access materials</CardDescription>
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
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
                  <p className="text-gray-600 mb-4">Join a course to get started with your learning journey.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Join Your First Course
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.professor_name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {course.code}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {course.semester}
                            </Badge>
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
                      </div>
                    </div>
                  ))}
                  {enrolledCourses.length > 3 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        View All {enrolledCourses.length} Courses
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask a Question
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Progress
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {activity.type === 'material_uploaded' ? (
                        <FileText className="w-4 h-4 text-gray-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Structures Assignment</p>
                    <p className="text-xs text-gray-600">Due in 2 days</p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">ML Project Report</p>
                    <p className="text-xs text-gray-600">Due in 5 days</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
} 