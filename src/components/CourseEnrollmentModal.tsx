'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, BookOpen, Users, Calendar, Search, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'

interface CourseEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CourseEnrollmentModal({ isOpen, onClose }: CourseEnrollmentModalProps) {
  const { user } = useAuthStore()
  const { enrollInCourse, checkCourseCodeExists, fetchCourses } = useCourseStore()
  const [courseCode, setCourseCode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [foundCourse, setFoundCourse] = useState<any>(null)
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'search' | 'browse'>('search')

  // Fetch available courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCourses()
    }
  }, [isOpen])

  const fetchAvailableCourses = async () => {
    try {
      // Fetch available courses from the API
      const response = await fetch('/api/courses/available')
      if (response.ok) {
        const data = await response.json()
        setAvailableCourses(data.courses || [])
      } else {
        setAvailableCourses([])
      }
    } catch (error) {
      console.error('Error fetching available courses:', error)
      setAvailableCourses([])
    }
  }

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
        // Fetch the actual course details from the API
        const response = await fetch(`/api/courses/${courseCode.toUpperCase()}`)
        if (response.ok) {
          const courseData = await response.json()
          setFoundCourse(courseData)
        } else {
          setError('Course found but details could not be retrieved.')
        }
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

  const handleEnrollFromBrowse = async (course: any) => {
    if (!user) return

    setIsEnrolling(true)
    try {
      const result = await enrollInCourse(course.id, user.id)
      
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <Card className="h-full flex flex-col shadow-2xl border-0 bg-white">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 text-xl">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      Join Course
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                      Search by course code or browse available courses
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-10 w-10 p-0 hover:bg-gray-100 active:scale-95 transition-all duration-150 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {/* Tabs */}
                <div className="px-6 pt-6">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                        activeTab === 'search'
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Search by Code
                    </button>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                        activeTab === 'browse'
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Browse Courses
                    </button>
                  </div>
                </div>

                {/* Search Tab */}
                {activeTab === 'search' && (
                  <div className="px-6 py-6 pb-8 space-y-6">
                    {/* Course Code Input */}
                    <div className="space-y-3">
                      <Label htmlFor="courseCode" className="text-sm font-medium text-gray-700">Course Code</Label>
                      <div className="flex gap-3">
                        <Input
                          id="courseCode"
                          value={courseCode}
                          onChange={(e) => {
                            setCourseCode(e.target.value.toUpperCase())
                            setError('')
                          }}
                          placeholder="e.g., CS101"
                          className="font-mono text-lg tracking-wider border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1"
                          maxLength={10}
                        />
                        <Button
                          onClick={handleSearch}
                          disabled={isSearching || !courseCode.trim()}
                          size="default"
                          className="px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-md"
                        >
                          {isSearching ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                    </div>

                    {/* Course Details */}
                    {foundCourse && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <Badge variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                            {foundCourse.code}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">{foundCourse.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {foundCourse.professor_name}
                        </p>
                        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{foundCourse.description}</p>
                        
                        <div className="space-y-3 text-sm text-gray-600 mb-5">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium">Semester:</span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium">{foundCourse.semester}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium">Classroom:</span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium">{foundCourse.classroom}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="font-medium">Enrollment:</span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium">
                              {foundCourse.enrolled_students}/{foundCourse.max_students}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={handleEnroll}
                          disabled={isEnrolling}
                          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-md font-medium"
                        >
                          {isEnrolling ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enrolling...
                            </div>
                          ) : (
                            'Join Course'
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Browse Tab */}
                {activeTab === 'browse' && (
                  <div className="px-6 py-6 pb-8 space-y-6 h-full flex flex-col">
                    {/* Search Filter */}
                    <div className="space-y-3">
                      <Label htmlFor="searchCourses" className="text-sm font-medium text-gray-700">Search Courses</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="searchCourses"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by course name, code, or professor..."
                          className="w-full pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Available Courses List */}
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      {availableCourses.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">No courses available</h3>
                          <p className="text-gray-600 max-w-sm mx-auto">
                            There are currently no courses available for enrollment. Check back later!
                          </p>
                        </div>
                      ) : (
                        availableCourses
                          .filter(course => 
                            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.professor_name.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((course) => (
                            <div key={course.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                                  {course.code}
                                </Badge>
                              </div>
                              
                              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{course.title}</h3>
                              <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {course.professor_name}
                              </p>
                              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{course.description}</p>
                              
                              <div className="space-y-3 text-sm text-gray-600 mb-5">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="font-medium">Semester:</span>
                                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">{course.semester}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="font-medium">Classroom:</span>
                                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">{course.classroom}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="font-medium">Enrollment:</span>
                                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                                    {course.enrolled_students}/{course.max_students}
                                  </span>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleEnrollFromBrowse(course)}
                                disabled={isEnrolling}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-md font-medium"
                              >
                                {isEnrolling ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Enrolling...
                                  </div>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Join Course
                                  </>
                                )}
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 