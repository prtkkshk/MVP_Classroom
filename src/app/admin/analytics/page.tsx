'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  GraduationCap,
  Activity,
  Calendar,
  Download,
  Eye,
  Shield,
  Target,
  Zap,
  Clock,
  Star,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface AnalyticsData {
  userGrowth: {
    total: number
    professors: number
    students: number
    growthRate: number
    monthlyGrowth: number[]
  }
  courseMetrics: {
    total: number
    active: number
    completionRate: number
    engagementRate: number
    satisfactionScore: number
  }
  platformUsage: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    sessionDuration: number
    pageViews: number
  }
  engagement: {
    doubtsSubmitted: number
    materialsUploaded: number
    liveSessions: number
    announcements: number
  }
  trends: {
    userGrowthTrend: 'up' | 'down' | 'stable'
    courseCreationTrend: 'up' | 'down' | 'stable'
    engagementTrend: 'up' | 'down' | 'stable'
    satisfactionTrend: 'up' | 'down' | 'stable'
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: {
      total: 1247,
      professors: 23,
      students: 1224,
      growthRate: 15.3,
      monthlyGrowth: [1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750]
    },
    courseMetrics: {
      total: 45,
      active: 42,
      completionRate: 87.5,
      engagementRate: 82.3,
      satisfactionScore: 4.6
    },
    platformUsage: {
      dailyActiveUsers: 892,
      weeklyActiveUsers: 1156,
      monthlyActiveUsers: 1247,
      sessionDuration: 24.5,
      pageViews: 15420
    },
    engagement: {
      doubtsSubmitted: 234,
      materialsUploaded: 156,
      liveSessions: 89,
      announcements: 67
    },
    trends: {
      userGrowthTrend: 'up',
      courseCreationTrend: 'up',
      engagementTrend: 'up',
      satisfactionTrend: 'up'
    }
  })
  
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  
  const { user: currentUser } = useAuthStore()
  const { courses } = useCourseStore()

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  const getTrendText = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'Increasing'
      case 'down':
        return 'Decreasing'
      case 'stable':
        return 'Stable'
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
      title="Platform Analytics"
      description="Comprehensive platform analytics and insights"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive insights into platform performance and user behavior</p>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
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
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.userGrowth.total.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(analyticsData.trends.userGrowthTrend)}
                    <span className={`text-sm font-medium ml-1 ${getTrendColor(analyticsData.trends.userGrowthTrend)}`}>
                      {analyticsData.userGrowth.growthRate}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
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
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.courseMetrics.active}</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(analyticsData.trends.courseCreationTrend)}
                    <span className={`text-sm font-medium ml-1 ${getTrendColor(analyticsData.trends.courseCreationTrend)}`}>
                      +3
                    </span>
                    <span className="text-sm text-gray-500 ml-1">this month</span>
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.courseMetrics.engagementRate}%</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(analyticsData.trends.engagementTrend)}
                    <span className={`text-sm font-medium ml-1 ${getTrendColor(analyticsData.trends.engagementTrend)}`}>
                      +2.1%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.courseMetrics.satisfactionScore}/5</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(analyticsData.trends.satisfactionTrend)}
                    <span className={`text-sm font-medium ml-1 ${getTrendColor(analyticsData.trends.satisfactionTrend)}`}>
                      +0.2
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Usage</CardTitle>
                    <CardDescription>Daily, weekly, and monthly active users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Daily Active Users</span>
                      </div>
                      <span className="text-lg font-bold">{analyticsData.platformUsage.dailyActiveUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Weekly Active Users</span>
                      </div>
                      <span className="text-lg font-bold">{analyticsData.platformUsage.weeklyActiveUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">Monthly Active Users</span>
                      </div>
                      <span className="text-lg font-bold">{analyticsData.platformUsage.monthlyActiveUsers.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Session Duration</span>
                        <span className="font-medium">{analyticsData.platformUsage.sessionDuration} minutes</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span>Page Views</span>
                        <span className="font-medium">{analyticsData.platformUsage.pageViews.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>Monthly user growth over the past year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-1">
                      {analyticsData.userGrowth.monthlyGrowth.map((value, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{
                            height: `${(value / Math.max(...analyticsData.userGrowth.monthlyGrowth)) * 100}%`,
                            minHeight: '4px'
                          }}
                        ></div>
                      ))}
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Monthly user growth showing consistent upward trend
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Insights</CardTitle>
                  <CardDescription>Key findings and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-green-900">Strong Growth</h4>
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        User base growing at 15.3% monthly rate with high retention
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">High Engagement</h4>
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        82.3% engagement rate with 24.5 minute average session duration
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium text-purple-900">Quality Content</h4>
                      </div>
                      <p className="text-sm text-purple-700 mt-2">
                        4.6/5 satisfaction score with 87.5% course completion rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Demographics</CardTitle>
                    <CardDescription>Breakdown of user types and growth</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Students</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{analyticsData.userGrowth.students.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {((analyticsData.userGrowth.students / analyticsData.userGrowth.total) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Professors</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{analyticsData.userGrowth.professors.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {((analyticsData.userGrowth.professors / analyticsData.userGrowth.total) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Growth Rate</span>
                        <span className="font-medium text-green-600">+{analyticsData.userGrowth.growthRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>Recent user activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New Registrations</span>
                        <span className="font-medium">+156 this week</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Sessions</span>
                        <span className="font-medium">{analyticsData.platformUsage.dailyActiveUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Returning Users</span>
                        <span className="font-medium">78%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Performance</CardTitle>
                    <CardDescription>Key metrics for all courses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Courses</span>
                      <span className="font-medium">{analyticsData.courseMetrics.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Courses</span>
                      <span className="font-medium">{analyticsData.courseMetrics.active}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-medium">{analyticsData.courseMetrics.completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engagement Rate</span>
                      <span className="font-medium">{analyticsData.courseMetrics.engagementRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Satisfaction Score</span>
                      <span className="font-medium">{analyticsData.courseMetrics.satisfactionScore}/5</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Course Categories</CardTitle>
                    <CardDescription>Distribution by subject area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Computer Science</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={35} className="w-20 h-2" />
                          <span className="text-sm font-medium">35%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mathematics</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={25} className="w-20 h-2" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Physics</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={20} className="w-20 h-2" />
                          <span className="text-sm font-medium">20%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Other</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={20} className="w-20 h-2" />
                          <span className="text-sm font-medium">20%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                    <CardDescription>Platform interaction statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Doubts Submitted</span>
                      </div>
                      <span className="font-medium">{analyticsData.engagement.doubtsSubmitted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Materials Uploaded</span>
                      </div>
                      <span className="font-medium">{analyticsData.engagement.materialsUploaded}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Live Sessions</span>
                      </div>
                      <span className="font-medium">{analyticsData.engagement.liveSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">Announcements</span>
                      </div>
                      <span className="font-medium">{analyticsData.engagement.announcements}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Session Analytics</CardTitle>
                    <CardDescription>User session behavior patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Session Duration</span>
                        <span className="font-medium">{analyticsData.platformUsage.sessionDuration} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pages per Session</span>
                        <span className="font-medium">8.2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bounce Rate</span>
                        <span className="font-medium">12.3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Return Rate</span>
                        <span className="font-medium">78.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Predictions</CardTitle>
                    <CardDescription>Forecasted platform growth</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Month Users</span>
                      <span className="font-medium">~1,450</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Quarter Users</span>
                      <span className="font-medium">~1,800</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Year Users</span>
                      <span className="font-medium">~3,200</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Based on current growth trends and user behavior patterns
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>AI-powered platform optimization suggestions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Increase Course Variety</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Add more courses in high-demand subjects to increase enrollment
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Optimize Engagement</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Implement gamification features to boost student engagement
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Scale Infrastructure</span>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">
                          Prepare for increased user load with infrastructure scaling
                        </p>
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