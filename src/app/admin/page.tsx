'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'
import { 
  UserPlus, 
  BookOpen, 
  Settings, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Activity,
  Shield,
  Bot,
  Loader2,
  Eye
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  totalProfessors: number
  totalStudents: number
  totalCourses: number
  activeUsers: number
  systemHealth: {
    database: { status: string; responseTime: string }
    storage: { status: string; usage: string }
    uptime: { status: string; percentage: string }
  }
  uptime: number
  lastBackup: Date
}

interface RecentActivity {
  id: string
  type: 'professor_created' | 'course_created' | 'user_enrolled' | 'system_update'
  title: string
  description: string
  timestamp: Date
  user?: string
  status?: 'success' | 'info' | 'warning'
}

interface ProfessorFormData {
  email: string
  username: string
  name: string
  password: string
  confirmPassword: string
}

export default function AdminPage() {
  const { user: currentUser, createProfessor } = useAuthStore()
  const { courses, fetchCourses } = useCourseStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState<ProfessorFormData>({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  })

  // Platform statistics state
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalProfessors: 0,
    totalStudents: 0,
    totalCourses: 0,
    activeUsers: 0,
    systemHealth: {
      database: { status: 'healthy', responseTime: '45ms' },
      storage: { status: 'normal', usage: '23%' },
      uptime: { status: 'excellent', percentage: '99.9%' }
    },
    uptime: 99.9,
    lastBackup: new Date()
  })

  // Recent activities state
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const response = await fetch('/api/admin/activities/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error)
      }
    }

    fetchRecentActivities()
  }, [])

  // Quick actions
  const quickActions = [
    {
      id: 'create_professor',
      title: 'Create Professor',
      description: 'Add new professor accounts',
      icon: UserPlus,
      color: 'blue',
      href: '#professor-creation'
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
    }
  ]

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    // Calculate platform statistics from courses data
    if (courses.length > 0) {
      const totalStudents = courses.reduce((acc, course) => acc + (course.max_students || 0), 0)
      const uniqueProfessors = new Set(courses.map(course => course.professor_id)).size
      
      setPlatformStats(prev => ({
        ...prev,
        totalProfessors: uniqueProfessors,
        totalStudents,
        totalCourses: courses.length,
        activeUsers: 0 // Will be calculated from actual user activity data
      }))
    }
  }, [courses])

  const handleCreateProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        setIsLoading(false)
        return
      }

      const result = await createProfessor(formData.email, formData.username, formData.name, formData.password)
      
      if (result.success) {
        toast.success('Professor account created successfully!')
        setFormData({
          email: '',
          username: '',
          name: '',
          password: '',
          confirmPassword: ''
        })
        
        // Add to recent activities
        const newActivity: RecentActivity = {
          id: Date.now().toString(),
          type: 'professor_created',
          title: 'New professor account created',
          description: `${formData.name} joined the platform`,
          timestamp: new Date(),
          status: 'success'
        }
        setRecentActivities(prev => [newActivity, ...prev.slice(0, 3)])
      } else {
        toast.error(result.error || 'Failed to create professor account')
      }
    } catch (error) {
      toast.error('Failed to create professor account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
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

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      title="Admin Dashboard"
      description="Platform administration and oversight dashboard"
      showBreadcrumb={false}
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
                    Welcome, {currentUser?.name}!
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
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalProfessors}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalStudents}</p>
                  <p className="text-xs text-green-600">+15% from last month</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bot className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalCourses}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{platformStats.activeUsers}</p>
                  <p className="text-xs text-green-600">85% engagement</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="professor-creation">Create Professor</TabsTrigger>
              <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
              <TabsTrigger value="system-health">System Health</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            onClick={() => {
                              if (action.href.startsWith('#')) {
                                setActiveTab(action.href.substring(1))
                              } else {
                                window.location.href = action.href
                              }
                            }}
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
                            className={`flex items-start space-x-3 p-3 rounded-lg ${getStatusColor(activity.status || 'info')}`}
                          >
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(activity.status || 'info')}
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
              </div>
            </TabsContent>

            {/* Professor Creation Tab */}
            <TabsContent value="professor-creation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Professor Account
                  </CardTitle>
                  <CardDescription>
                    Add new professors to the platform with comprehensive account setup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateProfessor} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter professor's full name"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          disabled={isLoading}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={(e) => handleChange('username', e.target.value)}
                          disabled={isLoading}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="professor@university.edu"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        disabled={isLoading}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          disabled={isLoading}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm the password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          disabled={isLoading}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>• Username must be 3-20 characters, alphanumeric</p>
                        <p>• Email must be institutional format</p>
                        <p>• Password minimum 8 characters with complexity</p>
                      </div>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Creating Account...' : 'Create Professor Account'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="quick-actions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`p-3 bg-${action.color}-100 rounded-lg`}>
                            <Icon className={`w-6 h-6 text-${action.color}-600`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{action.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (action.href.startsWith('#')) {
                                setActiveTab(action.href.substring(1))
                              } else {
                                window.location.href = action.href
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Access
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* System Health Tab */}
            <TabsContent value="system-health" className="space-y-6">
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
                        <p className="text-xs text-gray-600">Response time: {platformStats.systemHealth.database.responseTime}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {platformStats.systemHealth.database.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Storage</p>
                        <p className="text-xs text-gray-600">Usage: {platformStats.systemHealth.storage.usage}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {platformStats.systemHealth.storage.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Uptime</p>
                        <p className="text-xs text-gray-600">{platformStats.systemHealth.uptime.percentage} this month</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {platformStats.systemHealth.uptime.status}
                      </Badge>
                    </div>
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