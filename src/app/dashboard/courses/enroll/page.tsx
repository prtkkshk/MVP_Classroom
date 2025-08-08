'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { BookOpen, Users, Calendar, MapPin, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface CoursePreview {
  id: string
  title: string
  code: string
  description: string
  professor_name: string
  semester: string
  schedule: string
  classroom: string
  max_students: number
  enrolled_students: number
}

export default function CourseEnrollmentPage() {
  const { user } = useAuthStore()
  const [courseCode, setCourseCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coursePreview, setCoursePreview] = useState<CoursePreview | null>(null)
  const [enrollmentHistory, setEnrollmentHistory] = useState([
    {
      id: '1',
      course_title: 'Advanced Data Structures',
      course_code: 'CS301',
      professor: 'Dr. Sarah Johnson',
      status: 'approved',
      requested_at: new Date('2024-01-15'),
      reviewed_at: new Date('2024-01-16')
    },
    {
      id: '2',
      course_title: 'Machine Learning Fundamentals',
      course_code: 'CS401',
      professor: 'Dr. Michael Chen',
      status: 'pending',
      requested_at: new Date('2024-01-20')
    }
  ])

  const handleCourseCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setCourseCode(value)
    
    // Simulate course preview when code is entered
    if (value.length === 8) {
      // Mock course data - in real app, this would be an API call
      const mockCourse: CoursePreview = {
        id: '3',
        title: 'Web Development with React',
        code: value,
        description: 'Learn modern web development using React, TypeScript, and modern JavaScript frameworks.',
        professor_name: 'Dr. Emily Rodriguez',
        semester: 'Spring 2024',
        schedule: 'Mon, Wed, Fri 10:00 AM - 11:30 AM',
        classroom: 'Computer Science Building, Room 205',
        max_students: 50,
        enrolled_students: 32
      }
      setCoursePreview(mockCourse)
    } else {
      setCoursePreview(null)
    }
  }

  const handleEnroll = async () => {
    if (!courseCode || courseCode.length !== 8) {
      toast.error('Please enter a valid 8-character course code')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Add to enrollment history
      const newEnrollment = {
        id: Date.now().toString(),
        course_title: coursePreview?.title || 'Unknown Course',
        course_code: courseCode,
        professor: coursePreview?.professor_name || 'Unknown Professor',
        status: 'pending' as const,
        requested_at: new Date()
      }
      
      setEnrollmentHistory([newEnrollment, ...enrollmentHistory])
      setCourseCode('')
      setCoursePreview(null)
      
      toast.success('Enrollment request submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit enrollment request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <MainLayout 
      title="Course Enrollment" 
      description="Join courses using course codes provided by your professors"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Enrollment</h1>
            <p className="text-gray-600 text-lg">
              Enter the course code provided by your professor to join a course
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Code Entry */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Enter Course Code
                </CardTitle>
                <CardDescription>
                  Course codes are 8-character codes provided by your professors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code</Label>
                  <Input
                    id="courseCode"
                    placeholder="e.g., CS101ABC"
                    value={courseCode}
                    onChange={handleCourseCodeChange}
                    maxLength={8}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                  <p className="text-sm text-gray-500">
                    Enter exactly 8 characters (letters and numbers)
                  </p>
                </div>

                <Button 
                  onClick={handleEnroll}
                  disabled={!courseCode || courseCode.length !== 8 || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Enrollment Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Course Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {coursePreview ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Course Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{coursePreview.title}</h3>
                    <p className="text-sm text-gray-600">{coursePreview.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{coursePreview.code}</Badge>
                      <Badge variant="secondary">{coursePreview.semester}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>Professor: {coursePreview.professor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{coursePreview.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{coursePreview.classroom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{coursePreview.enrolled_students}/{coursePreview.max_students} students enrolled</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-500" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Enter a course code to preview course details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Enrollment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
              <CardDescription>
                Track your course enrollment requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No enrollment history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollmentHistory.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{enrollment.course_title}</h3>
                          <Badge variant="outline">{enrollment.course_code}</Badge>
                          {getStatusBadge(enrollment.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Professor: {enrollment.professor}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {enrollment.requested_at.toLocaleDateString()}
                          {enrollment.reviewed_at && (
                            <span className="ml-2">
                              • Reviewed: {enrollment.reviewed_at.toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
} 