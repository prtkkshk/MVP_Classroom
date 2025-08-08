'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { 
  BookOpen, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Shield,
  BarChart3,
  FileText,
  MessageSquare
} from 'lucide-react'

interface CourseAnalytics {
  id: string
  engagementRate: number
  completionRate: number
  studentSatisfaction: number
  materialCount: number
  doubtCount: number
  lastActivity: Date
}

export default function CourseOversightPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [qualityFilter, setQualityFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { user: currentUser } = useAuthStore()
  const { courses: courseStoreCourses, fetchCourses } = useCourseStore()

  // Mock course analytics data
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([
    {
      id: '1',
      engagementRate: 87,
      completionRate: 92,
      studentSatisfaction: 4.5,
      materialCount: 15,
      doubtCount: 23,
      lastActivity: new Date('2024-01-20T10:30:00')
    },
    {
      id: '2',
      engagementRate: 76,
      completionRate: 85,
      studentSatisfaction: 4.2,
      materialCount: 12,
      doubtCount: 18,
      lastActivity: new Date('2024-01-20T09:15:00')
    },
    {
      id: '3',
      engagementRate: 94,
      completionRate: 88,
      studentSatisfaction: 4.8,
      materialCount: 20,
      doubtCount: 31,
      lastActivity: new Date('2024-01-20T11:45:00')
    }
  ])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (courseStoreCourses.length > 0) {
      // Enhance courses with analytics data
      const enhancedCourses = courseStoreCourses.map(course => {
        const analytics = courseAnalytics.find(a => a.id === course.id) || {
          engagementRate: Math.floor(Math.random() * 30) + 70,
          completionRate: Math.floor(Math.random() * 20) + 80,
          studentSatisfaction: Math.random() * 2 + 3.5,
          materialCount: Math.floor(Math.random() * 10) + 5,
          doubtCount: Math.floor(Math.random() * 20) + 10,
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
        
        return {
          ...course,
          analytics,
          status: Math.random() > 0.1 ? 'active' : 'inactive',
          qualityScore: Math.floor(Math.random() * 30) + 70
        }
      })
      
      setCourses(enhancedCourses)
      setFilteredCourses(enhancedCourses)
      setIsLoading(false)
    }
  }, [courseStoreCourses, courseAnalytics])

  // Filter courses based on search and filters
  useEffect(() => {
    let filtered = courses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.professor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    // Quality filter
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(course => {
        const score = course.qualityScore
        switch (qualityFilter) {
          case 'excellent':
            return score >= 90
          case 'good':
            return score >= 80 && score < 90
          case 'average':
            return score >= 70 && score < 80
          case 'poor':
            return score < 70
          default:
            return true
        }
      })
    }

    setFilteredCourses(filtered)
  }, [courses, searchTerm, statusFilter, qualityFilter])

  const getQualityBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    } else if (score >= 80) {
      return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    } else if (score >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Poor</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 80) return 'text-blue-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
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
      title="Course Oversight"
      description="Monitor and manage course quality and compliance"
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
              <h1 className="text-3xl font-bold text-gray-900">Course Oversight</h1>
              <p className="text-gray-600 mt-2">Monitor course quality and educational standards</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length > 0 
                      ? Math.round(courses.reduce((acc, c) => acc + c.analytics.engagementRate, 0) / courses.length)
                      : 0}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length > 0 
                      ? Math.round(courses.reduce((acc, c) => acc + c.qualityScore, 0) / courses.length)
                      : 0}/100
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search courses by title, code, or professor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quality</SelectItem>
                    <SelectItem value="excellent">Excellent (90+)</SelectItem>
                    <SelectItem value="good">Good (80-89)</SelectItem>
                    <SelectItem value="average">Average (70-79)</SelectItem>
                    <SelectItem value="poor">Poor (&lt;70)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Courses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Courses ({filteredCourses.length})</CardTitle>
              <CardDescription>Monitor course quality and student engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500">{course.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">{course.professor_name || 'Unknown'}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(course.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getQualityBadge(course.qualityScore)}
                              <span className="text-sm text-gray-600">{course.qualityScore}/100</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={course.analytics.engagementRate} 
                                className="w-16 h-2"
                              />
                              <span className={`text-sm font-medium ${getEngagementColor(course.analytics.engagementRate)}`}>
                                {course.analytics.engagementRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{course.enrolled_students || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {course.analytics.lastActivity.toLocaleDateString()}
                              <br />
                              <span className="text-xs text-gray-500">
                                {course.analytics.lastActivity.toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Course Details</DialogTitle>
                                  <DialogDescription>
                                    Comprehensive course information and analytics
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-gray-900">Course Information</h4>
                                      <div className="mt-2 space-y-2 text-sm">
                                        <div><span className="font-medium">Title:</span> {course.title}</div>
                                        <div><span className="font-medium">Code:</span> {course.code}</div>
                                        <div><span className="font-medium">Professor:</span> {course.professor_name || 'Unknown'}</div>
                                        <div><span className="font-medium">Status:</span> {course.status}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">Analytics</h4>
                                      <div className="mt-2 space-y-2 text-sm">
                                        <div><span className="font-medium">Engagement:</span> {course.analytics.engagementRate}%</div>
                                        <div><span className="font-medium">Completion:</span> {course.analytics.completionRate}%</div>
                                        <div><span className="font-medium">Satisfaction:</span> {course.analytics.studentSatisfaction}/5</div>
                                        <div><span className="font-medium">Materials:</span> {course.analytics.materialCount}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Course
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      Analytics
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Contact Prof
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quality Assurance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance Summary</CardTitle>
              <CardDescription>Platform-wide course quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Quality Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Excellent (90+)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.qualityScore >= 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Good (80-89)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.qualityScore >= 80 && c.qualityScore < 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average (70-79)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.qualityScore >= 70 && c.qualityScore < 80).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Poor (&lt;70)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.qualityScore < 70).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Engagement Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Engagement (90%+)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.analytics.engagementRate >= 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Good Engagement (80-89%)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.analytics.engagementRate >= 80 && c.analytics.engagementRate < 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low Engagement (&lt;80%)</span>
                      <span className="font-medium">
                        {courses.filter(c => c.analytics.engagementRate < 80).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    {courses.filter(c => c.qualityScore < 70).length > 0 && (
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
                        {courses.filter(c => c.qualityScore < 70).length} courses need quality review
                      </div>
                    )}
                    {courses.filter(c => c.analytics.engagementRate < 80).length > 0 && (
                      <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                        <Clock className="w-4 h-4 text-yellow-600 inline mr-2" />
                        {courses.filter(c => c.analytics.engagementRate < 80).length} courses have low engagement
                      </div>
                    )}
                    {courses.filter(c => c.status === 'inactive').length > 0 && (
                      <div className="p-2 bg-gray-50 rounded border border-gray-200">
                        <CheckCircle className="w-4 h-4 text-gray-600 inline mr-2" />
                        {courses.filter(c => c.status === 'inactive').length} inactive courses
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
} 