'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Users, Calendar, FileText, Video, Search } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import CourseEnrollmentModal from '@/components/CourseEnrollmentModal'

export default function CoursesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { courses, enrolledCourses, fetchEnrolledCourses, fetchProfessorCourses, isLoading } = useCourseStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState(user?.role === 'professor' ? 'enrolled' : 'all') // all, enrolled, available
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.role === 'professor') {
        fetchProfessorCourses(user.id)
      } else {
        fetchEnrolledCourses(user.id)
      }
    }
  }, [user, fetchEnrolledCourses, fetchProfessorCourses])

  // For professors, we'll use courses as their created courses
  const professorCourses = user?.role === 'professor' ? courses : []
  const studentCourses = user?.role === 'student' ? enrolledCourses : []

  // Available courses data (empty for now)
  const availableCourses = user?.role === 'student' ? [] : []

  const handleJoinCourse = (courseId: string) => {
    // TODO: Implement join course functionality for students
    console.log('Joining course:', courseId)
  }

  // Filter courses based on search term
  const filteredProfessorCourses = user?.role === 'professor' ? professorCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.classroom.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) : []

  const filteredStudentCourses = user?.role === 'student' ? studentCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.professor_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) : []

  const filteredCourses = user?.role === 'student' ? availableCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.professor_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'professor' ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'professor' 
              ? 'Manage your teaching courses' 
              : 'Browse and manage your courses'
            }
          </p>
        </div>
        <div className="flex gap-2">
                     {user?.role === 'professor' && (
                           <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150"
                onClick={() => router.push('/dashboard/courses/create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
           )}
          {user?.role === 'student' && (
                         <Button 
               size="lg" 
               className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150"
               onClick={() => setShowEnrollmentModal(true)}
             >
               <Plus className="w-4 h-4 mr-2" />
               Join New Course
             </Button>
          )}
        </div>
      </motion.div>

      {/* Search and Filter */}
      {user?.role === 'student' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
                         <Button
               variant={filter === 'all' ? 'default' : 'outline'}
               onClick={() => setFilter('all')}
               size="sm"
               className="active:scale-95 transition-all duration-150"
             >
               All Courses
             </Button>
             <Button
               variant={filter === 'enrolled' ? 'default' : 'outline'}
               onClick={() => setFilter('enrolled')}
               size="sm"
               className="active:scale-95 transition-all duration-150"
             >
               Enrolled ({studentCourses.length})
             </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>
      )}

      {/* Professor Courses Section */}
      {user?.role === 'professor' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                My Courses
              </CardTitle>
              <CardDescription>
                Courses you have created and are teaching
              </CardDescription>
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
                             ) : filteredProfessorCourses.length === 0 ? (
                 <div className="text-center py-8">
                   <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">
                     {searchTerm ? 'No courses found' : 'No active courses'}
                   </h3>
                   <p className="text-gray-600 mb-4">
                     {searchTerm 
                       ? 'Try adjusting your search terms or create a new course.' 
                       : 'Create a new course to start teaching.'
                     }
                   </p>
                                       <Button 
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150 text-white"
                      onClick={() => router.push('/dashboard/courses/create')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create a New Course
                    </Button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {filteredProfessorCourses.map((course) => (
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/courses/${course.id}/materials`)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Materials
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/courses/${course.id}/live`)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Live
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Student Enrolled Courses Section */}
      {user?.role === 'student' && (filter === 'all' || filter === 'enrolled') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Enrolled Courses
              </CardTitle>
              <CardDescription>
                Courses you are currently enrolled in
              </CardDescription>
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
                             ) : filteredStudentCourses.length === 0 ? (
                 <div className="text-center py-8">
                   <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">
                     {searchTerm ? 'No courses found' : 'No courses enrolled'}
                   </h3>
                   <p className="text-gray-600 mb-4">
                     {searchTerm 
                       ? 'Try adjusting your search terms or join a course.' 
                       : 'Join a course to get started with your learning journey.'
                     }
                   </p>
                   <Button 
                     className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150 text-white"
                     onClick={() => setShowEnrollmentModal(true)}
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     Join Your First Course
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {filteredStudentCourses.map((course) => (
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/courses/${course.id}/materials`)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Materials
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/courses/${course.id}/live`)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Live
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Available Courses Section - Only for Students */}
      {filter === 'all' && user?.role === 'student' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Courses
              </CardTitle>
              <CardDescription>
                Explore and join new courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or check back later for new courses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {course.code}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{course.professor_name}</p>
                      <p className="text-xs text-gray-500 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{course.enrolled_students}/{course.max_students}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {course.semester}
                        </Badge>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleJoinCourse(course.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Join Course
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Course Enrollment Modal - Only for Students */}
      {user?.role === 'student' && (
        <CourseEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
        />
      )}
    </div>
  )
} 