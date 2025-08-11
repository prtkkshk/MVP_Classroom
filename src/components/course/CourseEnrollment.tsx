'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Users, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  UserX,
  Loader2,
  GraduationCap,
  Calendar,
  MapPin
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { supabase } from '@/lib/supabase'

interface Course {
  id: string
  title: string
  code: string
  description: string
  professor_id: string
  professor_name?: string
  semester: string
  max_students: number
  enrolled_students: number
  schedule: string
  classroom: string
  is_active: boolean
}

interface Enrollment {
  id: string
  course_id: string
  student_id: string
  student_name?: string
  student_email?: string
  status: 'pending' | 'approved' | 'rejected'
  enrolled_at: string
  created_at: string
}

export default function CourseEnrollment() {
  const { user } = useAuthStore()
  const { enrollInCourse, updateEnrollmentStatus } = useCourseStore()
  
  const [courseCode, setCourseCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundCourse, setFoundCourse] = useState<Course | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([])
  const [approvedEnrollments, setApprovedEnrollments] = useState<Enrollment[]>([])
  
  const [activeTab, setActiveTab] = useState<'join' | 'manage'>('join')

  // Fetch available courses and enrollments
  useEffect(() => {
    if (user) {
      fetchAvailableCourses()
      if (user.role === 'professor') {
        fetchPendingEnrollments()
        fetchApprovedEnrollments()
      }
    }
  }, [user])

  const fetchAvailableCourses = async () => {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_professor_id_fkey(name)
        `)
        .eq('is_active', true)
        .eq('is_public', true)
        .eq('allow_enrollment', true)

      if (error) throw error

      const formattedCourses = courses.map(course => ({
        ...course,
        professor_name: course.users?.name || 'Unknown Professor',
        enrolled_students: 0 // Will be updated with actual count
      }))

      setAvailableCourses(formattedCourses)
    } catch (error) {
      console.error('Error fetching available courses:', error)
    }
  }

  const fetchPendingEnrollments = async () => {
    if (!user || user.role !== 'professor') return

    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          users!course_enrollments_student_id_fkey(name, email)
        `)
        .eq('status', 'pending')
        .in('course_id', availableCourses.map(c => c.id))

      if (error) throw error

      const formattedEnrollments = enrollments.map(enrollment => ({
        ...enrollment,
        student_name: enrollment.users?.name || 'Unknown Student',
        student_email: enrollment.users?.email || 'Unknown Email'
      }))

      setPendingEnrollments(formattedEnrollments)
    } catch (error) {
      console.error('Error fetching pending enrollments:', error)
    }
  }

  const fetchApprovedEnrollments = async () => {
    if (!user || user.role !== 'professor') return

    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          users!course_enrollments_student_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .in('course_id', availableCourses.map(c => c.id))

      if (error) throw error

      const formattedEnrollments = enrollments.map(enrollment => ({
        ...enrollment,
        student_name: enrollment.users?.name || 'Unknown Student',
        student_email: enrollment.users?.email || 'Unknown Email'
      }))

      setApprovedEnrollments(formattedEnrollments)
    } catch (error) {
      console.error('Error fetching approved enrollments:', error)
    }
  }

  const searchCourseByCode = async () => {
    if (!courseCode.trim()) {
      toast.error('Please enter a course code')
      return
    }

    setIsSearching(true)
    setFoundCourse(null)

    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_professor_id_fkey(name)
        `)
        .eq('code', courseCode.trim().toUpperCase())
        .eq('is_active', true)
        .eq('is_public', true)
        .eq('allow_enrollment', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Course not found or not available for enrollment')
        } else {
          throw error
        }
        return
      }

      // Check if student is already enrolled
      if (user?.role === 'student') {
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', course.id)
          .eq('student_id', user.id)
          .single()

        if (existingEnrollment) {
          const statusText = existingEnrollment.status === 'pending' ? 'pending approval' : 
                           existingEnrollment.status === 'approved' ? 'already enrolled' : 'rejected'
          toast.info(`You are ${statusText} for this course`)
          return
        }
      }

      const formattedCourse = {
        ...course,
        professor_name: course.users?.name || 'Unknown Professor',
        enrolled_students: 0
      }

      setFoundCourse(formattedCourse)
    } catch (error) {
      console.error('Error searching for course:', error)
      toast.error('Failed to search for course')
    } finally {
      setIsSearching(false)
    }
  }

  const handleEnroll = async () => {
    if (!foundCourse || !user || user.role !== 'student') return

    setIsEnrolling(true)

    try {
      const result = await enrollInCourse(foundCourse.id, user.id)
      
      if (result.success) {
        toast.success('Enrollment request submitted successfully! Waiting for professor approval.')
        setFoundCourse(null)
        setCourseCode('')
      } else {
        toast.error(result.error || 'Failed to submit enrollment request')
      }
    } catch (error) {
      toast.error('Failed to submit enrollment request')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleEnrollmentAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      const result = await updateEnrollmentStatus(enrollmentId, action === 'approve' ? 'approved' : 'rejected')
      
      if (result.success) {
        toast.success(`Enrollment ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        
        // Refresh enrollments
        fetchPendingEnrollments()
        fetchApprovedEnrollments()
      } else {
        toast.error(result.error || `Failed to ${action} enrollment`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} enrollment`)
    }
  }

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (user?.role === 'professor') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrollment Management
            </CardTitle>
            <CardDescription>
              Manage student enrollment requests for your courses
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'join' | 'manage')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Pending Requests</TabsTrigger>
            <TabsTrigger value="manage">Approved Students</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Enrollment Requests
                </CardTitle>
                <CardDescription>
                  Review and approve/reject student enrollment requests
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {pendingEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No pending enrollment requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEnrollments.map((enrollment) => (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{enrollment.student_name}</h4>
                              <span className="text-sm text-gray-600">•</span>
                              <span className="text-sm text-gray-600">{enrollment.student_email}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Requested to join: {availableCourses.find(c => c.id === enrollment.course_id)?.title || 'Unknown Course'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Requested on {new Date(enrollment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEnrollmentAction(enrollment.id, 'approve')}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleEnrollmentAction(enrollment.id, 'reject')}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Approved Students
                </CardTitle>
                <CardDescription>
                  View all approved students in your courses
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {approvedEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No approved students yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedEnrollments.map((enrollment) => (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{enrollment.student_name}</h4>
                              <span className="text-sm text-gray-600">•</span>
                              <span className="text-sm text-gray-600">{enrollment.student_email}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Enrolled in: {availableCourses.find(c => c.id === enrollment.course_id)?.title || 'Unknown Course'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Approved on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {getEnrollmentStatusBadge(enrollment.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Join a Course
          </CardTitle>
          <CardDescription>
            Enter a course code to join a course or browse available courses
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'join' | 'manage')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join">Join by Code</TabsTrigger>
          <TabsTrigger value="manage">Browse Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="space-y-6">
          {/* Course Code Search */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="courseCode"
                      placeholder="e.g., CS101, MATH201"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchCourseByCode()}
                    />
                    <Button 
                      onClick={searchCourseByCode}
                      disabled={isSearching || !courseCode.trim()}
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {foundCourse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg bg-blue-50"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{foundCourse.title}</h3>
                          <p className="text-sm text-gray-600">Course Code: {foundCourse.code}</p>
                        </div>
                        <Badge variant="outline">{foundCourse.semester}</Badge>
                      </div>
                      
                      <p className="text-gray-700">{foundCourse.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{foundCourse.enrolled_students}/{foundCourse.max_students} students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{foundCourse.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{foundCourse.classroom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <span>{foundCourse.professor_name}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full"
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting Request...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Request Enrollment
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Courses
              </CardTitle>
              <CardDescription>
                Browse and join courses that are open for enrollment
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {availableCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No courses available for enrollment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <Badge variant="outline">{course.code}</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description}
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.enrolled_students}/{course.max_students} students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{course.schedule}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>{course.professor_name}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setCourseCode(course.code)
                            setActiveTab('join')
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Join Course
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
