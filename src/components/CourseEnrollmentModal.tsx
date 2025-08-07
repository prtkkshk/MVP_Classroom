'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, BookOpen, Users, Calendar, Search, AlertCircle, CheckCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'

interface CourseEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CourseEnrollmentModal({ isOpen, onClose }: CourseEnrollmentModalProps) {
  const { user } = useAuthStore()
  const { enrollInCourse, checkCourseCodeExists } = useCourseStore()
  const [courseCode, setCourseCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [foundCourse, setFoundCourse] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!courseCode.trim()) {
      setError('Please enter a course code')
      return
    }

    setIsSearching(true)
    setError('')
    setFoundCourse(null)

    try {
      // Check if course exists by code
      const exists = await checkCourseCodeExists(courseCode.toUpperCase())
      
      if (exists) {
        // In a real implementation, you would fetch the course details here
        // For now, we'll create a mock course object
        setFoundCourse({
          id: `course_${Date.now()}`,
          title: 'Sample Course',
          code: courseCode.toUpperCase(),
          description: 'This is a sample course description.',
          professor_name: 'Dr. Smith',
          semester: 'Spring 2025',
          max_students: 30,
          enrolled_students: 25,
          classroom: 'Room 301'
        })
      } else {
        setError('Course not found. Please check the code and try again.')
      }
    } catch (error) {
      setError('An error occurred while searching for the course.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleEnroll = async () => {
    if (!foundCourse || !user) return

    setIsEnrolling(true)
    try {
      const result = await enrollInCourse(foundCourse.id, user.id)
      
      if (result.success) {
        toast.success('Successfully enrolled in the course!')
        onClose()
        // Reset form
        setCourseCode('')
        setFoundCourse(null)
        setError('')
      } else {
        toast.error(result.error || 'Failed to enroll in course')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setCourseCode('')
    setFoundCourse(null)
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Join Course
                    </CardTitle>
                    <CardDescription>
                      Enter a course code to join a course
                    </CardDescription>
                  </div>
                                     <Button
                     variant="ghost"
                     size="sm"
                     onClick={handleClose}
                     className="h-8 w-8 p-0 active:scale-95 transition-all duration-150"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="courseCode"
                      value={courseCode}
                      onChange={(e) => {
                        setCourseCode(e.target.value.toUpperCase())
                        setError('')
                      }}
                      placeholder="e.g., EP40201"
                      className="font-mono"
                      maxLength={10}
                    />
                                         <Button
                       onClick={handleSearch}
                       disabled={isSearching || !courseCode.trim()}
                       size="sm"
                       className="active:scale-95 transition-all duration-150"
                     >
                       {isSearching ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                       ) : (
                         <Search className="w-4 h-4" />
                       )}
                     </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Course Details */}
                {foundCourse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {foundCourse.code}
                      </Badge>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1">{foundCourse.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{foundCourse.professor_name}</p>
                    <p className="text-xs text-gray-500 mb-3">{foundCourse.description}</p>
                    
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Semester:</span>
                        <span>{foundCourse.semester}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Classroom:</span>
                        <span>{foundCourse.classroom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enrollment:</span>
                        <span>{foundCourse.enrolled_students}/{foundCourse.max_students}</span>
                      </div>
                    </div>

                                         <Button
                       onClick={handleEnroll}
                       disabled={isEnrolling}
                       className="w-full mt-4 active:scale-95 transition-all duration-150"
                     >
                       {isEnrolling ? 'Enrolling...' : 'Join Course'}
                     </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 