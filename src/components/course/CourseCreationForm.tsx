'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MapPin, 
  Plus,
  Loader2,
  CheckCircle
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'

const courseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  code: z.string().min(2, 'Course code must be at least 2 characters').max(10, 'Course code must be at most 10 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  semester: z.string().min(1, 'Please select a semester'),
  max_students: z.number().min(1, 'Maximum students must be at least 1').max(500, 'Maximum students cannot exceed 500'),
  schedule: z.string().min(1, 'Please enter class schedule'),
  classroom: z.string().min(1, 'Please enter classroom location'),
  is_public: z.boolean().default(true),
  allow_enrollment: z.boolean().default(true),
  prerequisites: z.string().optional(),
  learning_objectives: z.string().optional()
})

type CourseFormData = z.infer<typeof courseSchema>

export default function CourseCreationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { user } = useAuthStore()
  const { createCourse, checkCourseCodeExists } = useCourseStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      is_public: true,
      allow_enrollment: true,
      max_students: 50
    }
  })

  const watchedCode = watch('code')

  // Check course code availability
  const handleCodeBlur = async () => {
    if (watchedCode && watchedCode.length >= 2) {
      const exists = await checkCourseCodeExists(watchedCode)
      if (exists) {
        toast.error('Course code already exists. Please choose a different one.')
        setValue('code', '')
      }
    }
  }

  const onSubmit = async (data: CourseFormData) => {
    if (!user || user.role !== 'professor') {
      toast.error('Only professors can create courses')
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await createCourse({
        ...data,
        professor_id: user.id,
        is_live: false,
        is_active: true
      })

      if (result.success) {
        setIsSuccess(true)
        toast.success('Course created successfully!')
        reset()
        
        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000)
      } else {
        toast.error(result.error || 'Failed to create course')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Course creation error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Created Successfully!</h2>
        <p className="text-gray-600 mb-6">Your course has been created and is now available for student enrollment.</p>
        <Button onClick={() => setIsSuccess(false)} variant="outline">
          Create Another Course
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6" />
            Create New Course
          </CardTitle>
          <CardDescription>
            Set up a new course with all the essential details and settings
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Computer Science"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., CS101"
                  {...register('code')}
                  onBlur={handleCodeBlur}
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a comprehensive description of the course content, objectives, and what students will learn..."
                rows={4}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select onValueChange={(value) => setValue('semester', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                    <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                  </SelectContent>
                </Select>
                {errors.semester && (
                  <p className="text-sm text-red-500">{errors.semester.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_students">Max Students *</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  max="500"
                  {...register('max_students', { valueAsNumber: true })}
                  className={errors.max_students ? 'border-red-500' : ''}
                />
                {errors.max_students && (
                  <p className="text-sm text-red-500">{errors.max_students.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Class Schedule *</Label>
                <Input
                  id="schedule"
                  placeholder="e.g., Mon/Wed 10:00-11:30 AM"
                  {...register('schedule')}
                  className={errors.schedule ? 'border-red-500' : ''}
                />
                {errors.schedule && (
                  <p className="text-sm text-red-500">{errors.schedule.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom Location *</Label>
              <Input
                id="classroom"
                placeholder="e.g., Room 201, Computer Science Building"
                {...register('classroom')}
                className={errors.classroom ? 'border-red-500' : ''}
              />
              {errors.classroom && (
                <p className="text-sm text-red-500">{errors.classroom.message}</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerequisites (Optional)</Label>
                <Textarea
                  id="prerequisites"
                  placeholder="List any prerequisites or recommended background knowledge..."
                  rows={3}
                  {...register('prerequisites')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learning_objectives">Learning Objectives (Optional)</Label>
                <Textarea
                  id="learning_objectives"
                  placeholder="What will students be able to do after completing this course?"
                  rows={3}
                  {...register('learning_objectives')}
                />
              </div>
            </div>

            {/* Course Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Course Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_public">Public Course</Label>
                  <p className="text-sm text-gray-600">Make this course visible to all students</p>
                </div>
                <Switch
                  id="is_public"
                  checked={watch('is_public')}
                  onCheckedChange={(checked) => setValue('is_public', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow_enrollment">Allow Enrollment</Label>
                  <p className="text-sm text-gray-600">Students can request to join this course</p>
                </div>
                <Switch
                  id="allow_enrollment"
                  checked={watch('allow_enrollment')}
                  onCheckedChange={(checked) => setValue('allow_enrollment', checked)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
