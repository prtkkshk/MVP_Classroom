'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import { validateCourseTitle, validateCourseDescription, sanitizeInput } from '@/lib/validation'
import { LoadingButton } from '@/components/ui/LoadingStates'
import { BookOpen, Plus, ArrowLeft, Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface CourseFormData {
  title: string
  description: string
  semester: string
  schedule: string
  classroom: string
  max_students: number
  timeSlots: TimeSlot[]
}

interface FormErrors {
  title?: string
  description?: string
  semester?: string
  schedule?: string
  classroom?: string
  max_students?: string
  timeSlots?: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    semester: '',
    schedule: '',
    classroom: '',
    max_students: 50,
    timeSlots: []
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const semesters = [
    'Fall 2024',
    'Spring 2024',
    'Summer 2024',
    'Fall 2025',
    'Spring 2025',
    'Summer 2025'
  ]

  const handleTimeSlotsChange = (slots: TimeSlot[]) => {
    setFormData(prev => ({ ...prev, timeSlots: slots }))
    
    // Generate schedule string from time slots
    if (slots.length > 0) {
      const scheduleString = slots.map(slot => 
        `${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} ${slot.startTime}-${slot.endTime}`
      ).join(', ')
      setFormData(prev => ({ ...prev, schedule: scheduleString }))
    } else {
      setFormData(prev => ({ ...prev, schedule: '' }))
    }
    
    // Clear time slots error
    if (errors.timeSlots) {
      setErrors(prev => ({ ...prev, timeSlots: undefined }))
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    // Validate title
    const titleValidation = validateCourseTitle(formData.title)
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error || 'Invalid title'
    }

    // Validate description
    const descriptionValidation = validateCourseDescription(formData.description)
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.error || 'Invalid description'
    }

    // Validate semester
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required'
    }

    // Validate time slots
    if (formData.timeSlots.length === 0) {
      newErrors.timeSlots = 'At least one time slot is required'
    }

    // Validate classroom
    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required'
    }

    // Validate max students
    if (formData.max_students < 1 || formData.max_students > 200) {
      newErrors.max_students = 'Maximum students must be between 1 and 200'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)

    try {
      // Generate a unique course code automatically
      const courseCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      // Create course using real Supabase operation with sanitized data
      const courseData = {
        title: sanitizeInput(formData.title),
        code: courseCode,
        description: sanitizeInput(formData.description),
        professor_id: user?.id || '',
        semester: formData.semester,
        max_students: formData.max_students,
        schedule: sanitizeInput(formData.schedule),
        classroom: sanitizeInput(formData.classroom),
        is_live: false,
        is_active: true
      }

      const result = await useCourseStore.getState().createCourse(courseData)
      
      if (result.success) {
        toast.success(`Course created successfully! Course code: ${courseCode}`)
        // Redirect to courses list - the new course will be loaded there
        router.push('/dashboard/courses')
      } else {
        toast.error(result.error || 'Failed to create course')
      }
    } catch (error) {
      toast.error('Failed to create course. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CourseFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <MainLayout 
      title="Create Course" 
      description="Create a new course for your students"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600">Set up your course details and schedule</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Course Information
              </CardTitle>
              <CardDescription>
                Fill in the details below to create your course. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Computer Science"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your course content, objectives, and what students will learn..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => handleInputChange('semester', value)}
                  >
                    <SelectTrigger className={errors.semester ? 'border-red-500' : ''}>
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
                    <p className="text-sm text-red-600">{errors.semester}</p>
                  )}
                </div>

                {/* Schedule Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Label className="text-lg font-semibold">Course Schedule</Label>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Time Slots */}
                    <div className="space-y-2">
                      <Label>Time Slots *</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.timeSlots.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="min-w-[80px] text-center">
                                  {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSlots = formData.timeSlots.filter((_, i) => i !== index)
                                  handleTimeSlotsChange(newSlots)
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                type="button"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {formData.timeSlots.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No time slots added yet. Use the form below to add your course schedule.
                          </p>
                        )}
                      </div>
                      
                      {errors.timeSlots && (
                        <p className="text-sm text-red-600">{errors.timeSlots}</p>
                      )}
                    </div>

                    {/* Add Time Slot Form */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Add New Time Slot</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="day">Day</Label>
                          <Select
                            value=""
                            onValueChange={(value) => {
                              const newSlot: TimeSlot = {
                                day: value,
                                startTime: '09:00',
                                endTime: '10:00'
                              }
                              handleTimeSlotsChange([...formData.timeSlots, newSlot])
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="tuesday">Tuesday</SelectItem>
                              <SelectItem value="wednesday">Wednesday</SelectItem>
                              <SelectItem value="thursday">Thursday</SelectItem>
                              <SelectItem value="friday">Friday</SelectItem>
                              <SelectItem value="saturday">Saturday</SelectItem>
                              <SelectItem value="sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value="09:00"
                            onChange={(e) => {
                              const newSlot: TimeSlot = {
                                day: 'monday',
                                startTime: e.target.value,
                                endTime: '10:00'
                              }
                              handleTimeSlotsChange([...formData.timeSlots, newSlot])
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="endTime">End Time</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value="10:00"
                            onChange={(e) => {
                              const newSlot: TimeSlot = {
                                day: 'monday',
                                startTime: '09:00',
                                endTime: e.target.value
                              }
                              handleTimeSlotsChange([...formData.timeSlots, newSlot])
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newSlot: TimeSlot = {
                              day: 'monday',
                              startTime: '09:00',
                              endTime: '10:00'
                            }
                            handleTimeSlotsChange([...formData.timeSlots, newSlot])
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classroom and Max Students */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Classroom *</Label>
                    <Input
                      id="classroom"
                      placeholder="e.g., Room 101, Building A"
                      value={formData.classroom}
                      onChange={(e) => handleInputChange('classroom', e.target.value)}
                      className={errors.classroom ? 'border-red-500' : ''}
                    />
                    {errors.classroom && (
                      <p className="text-sm text-red-600">{errors.classroom}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_students">Maximum Students</Label>
                    <Input
                      id="max_students"
                      type="number"
                      min="1"
                      max="200"
                      placeholder="50"
                      value={formData.max_students}
                      onChange={(e) => handleInputChange('max_students', parseInt(e.target.value) || 0)}
                      className={errors.max_students ? 'border-red-500' : ''}
                    />
                    {errors.max_students && (
                      <p className="text-sm text-red-600">{errors.max_students}</p>
                    )}
                    <p className="text-xs text-gray-500">Default: 50 students</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-8">
                  <LoadingButton
                    type="submit"
                    loading={isLoading}
                    className="min-w-[220px] px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0 focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Create Course
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
} 