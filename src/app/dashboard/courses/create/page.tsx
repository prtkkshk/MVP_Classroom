'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { toast } from 'sonner'
import WeekCalendar from '@/components/WeekCalendar'

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface CourseFormData {
  title: string
  code: string
  description: string
  semester: string
  max_students: number
  schedule: string
  classroom: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { createCourse, checkCourseCodeExists } = useCourseStore()
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    code: '',
    description: '',
    semester: '',
    max_students: 30,
    schedule: '',
    classroom: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Partial<CourseFormData>>({})
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [codeExists, setCodeExists] = useState(false)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const semesters = [
    'Spring 2025',
    'Autumn 2026'
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<CourseFormData> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required'
    } else if (formData.code.length < 3 || formData.code.length > 10) {
      newErrors.code = 'Course code must be between 3 and 10 characters'
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Course code must contain only uppercase letters and numbers'
    } else if (codeExists) {
      newErrors.code = 'This course code is already taken'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    }
    
    if (!formData.semester) {
      newErrors.semester = 'Semester is required'
    }
    
    if (formData.max_students < 1 || formData.max_students > 200) {
      newErrors.max_students = 'Max students must be between 1 and 200'
    }
    
    if (timeSlots.length === 0) {
      newErrors.schedule = 'At least one time slot is required'
    }
    
    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }



  const handleCodeChange = async (value: string) => {
    const upperCode = value.toUpperCase()
    setFormData(prev => ({ ...prev, code: upperCode }))
    setCodeExists(false)
    
    // Clear error when user starts typing
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: undefined }))
    }
    
    // Check if code exists (only if code is valid format)
    if (upperCode.length >= 3 && /^[A-Z0-9]+$/.test(upperCode)) {
      setIsCheckingCode(true)
      try {
        const exists = await checkCourseCodeExists(upperCode)
        setCodeExists(exists)
        if (exists) {
          setErrors(prev => ({ ...prev, code: 'This course code is already taken' }))
        }
      } catch (error) {
        console.error('Error checking course code:', error)
      } finally {
        setIsCheckingCode(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    if (!formData.code) {
      toast.error('Please enter a course code')
      return
    }
    
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Format schedule from time slots
      const scheduleText = timeSlots.map(slot => {
        const dayNames = {
          monday: 'Mon',
          tuesday: 'Tue', 
          wednesday: 'Wed',
          thursday: 'Thu',
          friday: 'Fri',
          saturday: 'Sat',
          sunday: 'Sun'
        }
        const day = dayNames[slot.day as keyof typeof dayNames] || slot.day
        const startTime = formatTimeForDisplay(slot.startTime)
        const endTime = formatTimeForDisplay(slot.endTime)
        return `${day} ${startTime} - ${endTime}`
      }).join(', ')

      const result = await createCourse({
        ...formData,
        schedule: scheduleText,
        professor_id: user.id,
        is_live: false
      })
      
      if (result.success) {
        toast.success('Course created successfully!')
        router.push('/dashboard/courses')
      } else {
        toast.error(result.error || 'Failed to create course')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Create course error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleTimeSlotsChange = (slots: TimeSlot[]) => {
    setTimeSlots(slots)
    // Clear schedule error when time slots are added
    if (errors.schedule) {
      setErrors(prev => ({ ...prev, schedule: undefined }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
                 <Button
           variant="ghost"
           size="sm"
           onClick={() => router.back()}
           className="p-2 active:scale-95 transition-all duration-150"
         >
           <ArrowLeft className="w-4 h-4" />
         </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600">Set up a new course for your students</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Creation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Information
              </CardTitle>
              <CardDescription>
                Fill in the details for your new course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Course Code */}
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <div className="relative">
                                                                                   <Input
                        id="courseCode"
                        value={formData.code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="e.g., EP40201, CS301"
                        className={`font-mono !bg-white ${errors.code ? 'border-red-500' : ''}`}
                        maxLength={10}
                      />
                    {isCheckingCode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.code && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.code}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Enter a unique code (3-10 characters, letters and numbers only) that students will use to enroll
                  </p>
                </div>

                {/* Course Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                                                                           <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Advanced Data Structures"
                      className={`!bg-white ${errors.title ? 'border-red-500' : ''}`}
                    />
                  {errors.title && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Course Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                                                                                                                                                     <Textarea
                       id="description"
                       value={formData.description}
                       onChange={(e) => handleInputChange('description', e.target.value)}
                       placeholder="Describe what students will learn in this course..."
                       rows={4}
                       className={`!bg-white ${errors.description ? 'border-red-500' : ''}`}
                     />
                  {errors.description && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Semester and Max Students */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                                         <Select
                       value={formData.semester}
                       onValueChange={(value) => handleInputChange('semester', value)}
                     >
                                                                                                                                                                                               <SelectTrigger className={`!bg-white ${errors.semester ? 'border-red-500' : ''}`}>
                         <SelectValue placeholder="Select semester" />
                       </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.semester && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.semester}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Maximum Students *</Label>
                                                                                   <Input
                        id="maxStudents"
                        type="number"
                        min="1"
                        max="200"
                        value={formData.max_students}
                        onChange={(e) => handleInputChange('max_students', parseInt(e.target.value))}
                        className={`!bg-white ${errors.max_students ? 'border-red-500' : ''}`}
                      />
                    {errors.max_students && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.max_students}
                      </p>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-2">
                  <Label>Schedule *</Label>
                                     <WeekCalendar
                     selectedSlots={timeSlots}
                     onSlotsChange={handleTimeSlotsChange}
                   />
                  {errors.schedule && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.schedule}
                    </p>
                  )}
                </div>

                {/* Classroom */}
                <div className="space-y-2">
                  <Label htmlFor="classroom">Classroom *</Label>
                                                                           <Input
                      id="classroom"
                      value={formData.classroom}
                      onChange={(e) => handleInputChange('classroom', e.target.value)}
                      placeholder="e.g., Room 301, Building A"
                      className={`!bg-white ${errors.classroom ? 'border-red-500' : ''}`}
                    />
                  {errors.classroom && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.classroom}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                                     <Button
                     type="button"
                     variant="outline"
                     onClick={() => setShowPreview(!showPreview)}
                     disabled={!formData.title || !formData.description}
                     className="active:scale-95 transition-all duration-150"
                   >
                     {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                     {showPreview ? 'Hide Preview' : 'Show Preview'}
                   </Button>
                   <Button
                     type="submit"
                     disabled={isLoading || !formData.code}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150"
                   >
                     {isLoading ? 'Creating Course...' : 'Create Course'}
                   </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Course Preview */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Course Preview
                </CardTitle>
                <CardDescription>
                  How your course will appear to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formData.code || 'XXXX'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {formData.title || 'Course Title'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {user?.full_name || 'Professor Name'}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {formData.description || 'Course description will appear here...'}
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Semester:</span>
                      <span>{formData.semester || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span>
                        {timeSlots.length > 0 
                          ? timeSlots.map(slot => {
                              const dayNames = {
                                monday: 'Mon',
                                tuesday: 'Tue', 
                                wednesday: 'Wed',
                                thursday: 'Thu',
                                friday: 'Fri',
                                saturday: 'Sat',
                                sunday: 'Sun'
                              }
                              const day = dayNames[slot.day as keyof typeof dayNames] || slot.day
                              const startTime = formatTimeForDisplay(slot.startTime)
                              const endTime = formatTimeForDisplay(slot.endTime)
                              return `${day} ${startTime}-${endTime}`
                            }).join(', ')
                          : 'Not set'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Classroom:</span>
                      <span>{formData.classroom || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Students:</span>
                      <span>{formData.max_students || 0}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Course ready to be created</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 