'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Shield,
  UserPlus,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const { courses, fetchCourses, isLoading } = useCourseStore()
  const [stats, setStats] = useState({
    totalProfessors: 0,
    totalStudents: 0,
    totalCourses: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    // Calculate stats from courses and mock data
    const totalStudents = courses.reduce((acc, course) => acc + (course.enrolled_students || 0), 0)
    const uniqueProfessors = new Set(courses.map(course => course.professor_id)).size
    
    setStats({
      totalProfessors: uniqueProfessors,
      totalStudents,
      totalCourses: courses.length,
      activeUsers: Math.round((totalStudents + uniqueProfessors) * 0.85) // Mock active users
    })
  }, [courses])

  const recentActivities = [
    {
      id: '1',
      type: 'professor_created',
      title: 'New professor account created',
      description: 'Dr. Sarah Johnson joined the platform',
      timestamp: new Date('2024-01-20T10:00:00'),
      status: 'success'
    },
    {
      id: '2',
      type: 'course_created',
      title: 'New course added',
      description: 'Advanced Mathematics by Prof. Smith',
      timestamp: new Date('2024-01-20T09:30:00'),
      status: 'success'
    },
    {
      id: '3',
      type: 'enrollment_spike',
      title: 'Student enrollment spike',
      description: '15 new students joined today',
      timestamp: new Date('2024-01-20T08:15:00'),
      status: 'info'
    },
    {
      id: '4',
      type: 'system_alert',
      title: 'System maintenance completed',
      description: 'Database optimization finished successfully',
      timestamp: new Date('2024-01-20T07:00:00'),
      status: 'success'
    }
  ]

  const quickActions = [
    {
      id: 'create_professor',
      title: 'Create Professor',
      description: 'Add new professor accounts',
      icon: UserPlus,
      color: 'blue',
      href: '/admin/users'
    },
    {
      id: 'manage_courses',
      title: 'Course Oversight',
      description: 'Monitor and manage courses',
      icon: BookOpen,
      color: 'green',
      href: '/admin/courses'
    },
    {
      id: 'system_settings',
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      color: 'purple',
      href: '/admin/settings'
    },
    {
      id: 'view_analytics',
      title: 'View Analytics',
      description: 'Platform usage statistics',
      icon: TrendingUp,
      color: 'orange',
      href: '/admin/analytics'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50'
      case 'info':
        return 'bg-blue-50'
      case 'warning':
        return 'bg-yellow-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
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
                  Welcome, {user?.name}!
                </h1>
                <p className="text-gray-600 text-lg">
                  Platform administration and oversight dashboard
                </p>
              </div>
              <div className="hidden md:block">
                <div className="p-4 bg-blue-600 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <p className="text-sm font-medium text-gray-600">Total Professors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProfessors}</p>
                <p className="text-xs text-green-600">+2 this month</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-xs text-green-600">+15% from last month</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                <p className="text-xs text-green-600">+3 new courses</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                <p className="text-xs text-green-600">85% engagement</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
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
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => window.location.href = action.href}
                  >
                    <div className={`p-2 bg-${action.color}-100 rounded-lg mr-3`}>
                      <Icon className={`w-4 h-4 text-${action.color}-600`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activities and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${getStatusColor(activity.status)}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Database</p>
                  <p className="text-xs text-gray-600">Response time: 45ms</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Storage</p>
                  <p className="text-xs text-gray-600">Usage: 23%</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Normal
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Uptime</p>
                  <p className="text-xs text-gray-600">99.9% this month</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Excellent
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 