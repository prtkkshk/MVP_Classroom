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
import { BookOpen, Plus, Loader2, ArrowLeft } from 'lucide-react'

interface CourseFormData {
  title: string
  description: string
  semester: string
  schedule: string
  classroom: string
  max_students: number
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
    max_students: 50
  })

  const [errors, setErrors] = useState<Partial<CourseFormData>>({})

  const semesters = [
    'Fall 2024',
    'Spring 2024',
    'Summer 2024',
    'Fall 2025',
    'Spring 2025',
    'Summer 2025'
  ]

  const generateCourseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const validateForm = () => {
    const newErrors: Partial<CourseFormData> = {}

    // Validate and sanitize title
    const titleValidation = validateCourseTitle(formData.title)
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error
    }

    // Validate and sanitize description
    const descriptionValidation = validateCourseDescription(formData.description)
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.error
    }

    if (!formData.semester) {
      newErrors.semester = 'Semester is required'
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required'
    }

    if (!formData.classroom.trim()) {
      newErrors.classroom = 'Classroom is required'
    }

    if (formData.max_students < 1 || formData.max_students > 200) {
      newErrors.max_students = 'Max students must be between 1 and 200'
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
      const courseCode = generateCourseCode()
      
      // Check if course code already exists
      const codeExists = await useCourseStore.getState().checkCourseCodeExists(courseCode)
      if (codeExists) {
        toast.error('Course code already exists. Please try again.')
        return
      }

      // Create course using real Supabase operation with sanitized data
      const courseData = {
        title: sanitizeInput(formData.title),
        code: courseCode,
        description: sanitizeInput(formData.description),
        professor_id: user?.id,
        semester: formData.semester,
        max_students: formData.max_students,
        schedule: sanitizeInput(formData.schedule),
        classroom: sanitizeInput(formData.classroom),
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

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
              <p className="text-gray-600">
                Set up a new course for your students. A unique course code will be generated automatically.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Course Creation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Information
              </CardTitle>
              <CardDescription>
                Fill in the details below to create your new course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Course Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Advanced Data Structures"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Course Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the course content, objectives, and what students will learn..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Semester and Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="schedule">Schedule *</Label>
                    <Input
                      id="schedule"
                      placeholder="e.g., Mon, Wed, Fri 10:00 AM - 11:30 AM"
                      value={formData.schedule}
                      onChange={(e) => handleInputChange('schedule', e.target.value)}
                      className={errors.schedule ? 'border-red-500' : ''}
                    />
                    {errors.schedule && (
                      <p className="text-sm text-red-600">{errors.schedule}</p>
                    )}
                  </div>
                </div>

                {/* Classroom and Max Students */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Classroom *</Label>
                    <Input
                      id="classroom"
                      placeholder="e.g., Computer Science Building, Room 205"
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
                <div className="flex justify-end pt-6">
                  <LoadingButton
                    type="submit"
                    loading={isLoading}
                    className="min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Course Code Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Course Code Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">Automatic Code Generation</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      A unique 8-character course code will be generated automatically when you create the course. 
                      Students will use this code to enroll in your course.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">Student Enrollment Process</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Students will enter the course code on their dashboard to request enrollment. 
                      You'll receive a notification and can approve or reject their request.
                    </p>
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