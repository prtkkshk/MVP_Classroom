import { create } from 'zustand'
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
  enrolled_students?: number
  schedule: string
  classroom: string
  is_live: boolean
  created_at: string
  updated_at: string
}

interface CourseMaterial {
  id: string
  course_id: string
  name: string
  type: string
  file_url: string
  uploaded_by: string
  created_at: string
}

interface Doubt {
  id: string
  course_id: string
  student_id: string
  student_name?: string
  text: string
  anonymous: boolean
  upvotes: number
  answered: boolean
  created_at: string
}

interface CourseEnrollment {
  id: string
  course_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface CourseStore {
  courses: Course[]
  enrolledCourses: Course[]
  courseMaterials: CourseMaterial[]
  doubts: Doubt[]
  enrollments: CourseEnrollment[]
  isLoading: boolean
  
  // Course management
  fetchCourses: () => Promise<void>
  fetchEnrolledCourses: (studentId: string) => Promise<void>
  fetchProfessorCourses: (professorId: string) => Promise<void>
  createCourse: (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>
  updateCourse: (id: string, updates: Partial<Course>) => Promise<{ success: boolean; error?: string }>
  deleteCourse: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Course materials
  fetchCourseMaterials: (courseId: string) => Promise<void>
  uploadMaterial: (materialData: Omit<CourseMaterial, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  deleteMaterial: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Doubts
  fetchDoubts: (courseId: string) => Promise<void>
  submitDoubt: (doubtData: Omit<Doubt, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  upvoteDoubt: (doubtId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  markDoubtAnswered: (doubtId: string) => Promise<{ success: boolean; error?: string }>
  
  // Enrollments
  fetchEnrollments: (courseId: string) => Promise<void>
  enrollInCourse: (courseId: string, studentId: string) => Promise<{ success: boolean; error?: string }>
  approveEnrollment: (enrollmentId: string) => Promise<{ success: boolean; error?: string }>
  rejectEnrollment: (enrollmentId: string) => Promise<{ success: boolean; error?: string }>
  
  // Utilities
  checkCourseCodeExists: (code: string) => Promise<boolean>
}

const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  enrolledCourses: [],
  courseMaterials: [],
  doubts: [],
  enrollments: [],
  isLoading: false,

  fetchCourses: async () => {
    try {
      set({ isLoading: true })
      
      // Start with empty courses array
      set({ courses: [] })
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchEnrolledCourses: async (studentId: string) => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            professor:users!courses_professor_id_fkey(name)
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'approved')

      if (error) throw error

      const enrolledCourses = data?.map(enrollment => ({
        ...enrollment.course,
        professor_name: enrollment.course.professor?.name
      })) || []

      set({ enrolledCourses })
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchProfessorCourses: async (professorId: string) => {
    try {
      set({ isLoading: true })
      
      // Get existing courses from state (including newly created ones)
      const existingCourses = get().courses
      
      // Filter courses for the specific professor
      const professorCourses = existingCourses.filter(course => course.professor_id === professorId)
      
      set({ courses: professorCourses })
    } catch (error) {
      console.error('Error fetching professor courses:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createCourse: async (courseData) => {
    try {
      // Mock course creation for development
      const newCourse: Course = {
        id: `course_${Date.now()}`,
        ...courseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add to local state
      set(state => ({
        courses: [newCourse, ...state.courses]
      }))

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to create course' }
    }
  },

  updateCourse: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh courses list
      await get().fetchCourses()
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update course' }
    }
  },

  deleteCourse: async (id) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh courses list
      await get().fetchCourses()
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete course' }
    }
  },

  fetchCourseMaterials: async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ courseMaterials: data || [] })
    } catch (error) {
      console.error('Error fetching course materials:', error)
    }
  },

  uploadMaterial: async (materialData) => {
    try {
      const { error } = await supabase
        .from('course_materials')
        .insert(materialData)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh materials list
      await get().fetchCourseMaterials(materialData.course_id)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to upload material' }
    }
  },

  deleteMaterial: async (id) => {
    try {
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh materials list
      const material = get().courseMaterials.find(m => m.id === id)
      if (material) {
        await get().fetchCourseMaterials(material.course_id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete material' }
    }
  },

  fetchDoubts: async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('doubts')
        .select(`
          *,
          student:users!doubts_student_id_fkey(name)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const doubtsWithStudentName = data?.map(doubt => ({
        ...doubt,
        student_name: doubt.student?.name
      })) || []

      set({ doubts: doubtsWithStudentName })
    } catch (error) {
      console.error('Error fetching doubts:', error)
    }
  },

  submitDoubt: async (doubtData) => {
    try {
      const { error } = await supabase
        .from('doubts')
        .insert(doubtData)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh doubts list
      await get().fetchDoubts(doubtData.course_id)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to submit doubt' }
    }
  },

  upvoteDoubt: async (doubtId: string, userId: string) => {
    try {
      // Check if user already upvoted
      const { data: existingUpvote } = await supabase
        .from('doubt_upvotes')
        .select('*')
        .eq('doubt_id', doubtId)
        .eq('user_id', userId)
        .single()

      if (existingUpvote) {
        // Remove upvote
        await supabase
          .from('doubt_upvotes')
          .delete()
          .eq('doubt_id', doubtId)
          .eq('user_id', userId)

        // Decrease upvote count
        await supabase.rpc('decrease_doubt_upvotes', { doubt_id: doubtId })
      } else {
        // Add upvote
        await supabase
          .from('doubt_upvotes')
          .insert({ doubt_id: doubtId, user_id: userId })

        // Increase upvote count
        await supabase.rpc('increase_doubt_upvotes', { doubt_id: doubtId })
      }

      // Refresh doubts list
      const doubt = get().doubts.find(d => d.id === doubtId)
      if (doubt) {
        await get().fetchDoubts(doubt.course_id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to upvote doubt' }
    }
  },

  markDoubtAnswered: async (doubtId: string) => {
    try {
      const { error } = await supabase
        .from('doubts')
        .update({ answered: true })
        .eq('id', doubtId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh doubts list
      const doubt = get().doubts.find(d => d.id === doubtId)
      if (doubt) {
        await get().fetchDoubts(doubt.course_id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to mark doubt as answered' }
    }
  },

  fetchEnrollments: async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          student:users!course_enrollments_student_id_fkey(name, email)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ enrollments: data || [] })
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  },

  enrollInCourse: async (courseId: string, studentId: string) => {
    try {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .single()

      if (existingEnrollment) {
        return { success: false, error: 'Already enrolled in this course' }
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: studentId,
          status: 'pending'
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to enroll in course' }
    }
  },

  approveEnrollment: async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ status: 'approved' })
        .eq('id', enrollmentId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh enrollments list
      const enrollment = get().enrollments.find(e => e.id === enrollmentId)
      if (enrollment) {
        await get().fetchEnrollments(enrollment.course_id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to approve enrollment' }
    }
  },

  rejectEnrollment: async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ status: 'rejected' })
        .eq('id', enrollmentId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refresh enrollments list
      const enrollment = get().enrollments.find(e => e.id === enrollmentId)
      if (enrollment) {
        await get().fetchEnrollments(enrollment.course_id)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to reject enrollment' }
    }
  },

  checkCourseCodeExists: async (code: string) => {
    try {
      // Check in existing courses (for development with mock data)
      const existingCourses = get().courses
      const codeExists = existingCourses.some(course => course.code === code)
      
      // In a real implementation, this would check the database
      // const { data, error } = await supabase
      //   .from('courses')
      //   .select('id')
      //   .eq('code', code)
      //   .single()
      
      // return !!data
      
      return codeExists
    } catch (error) {
      console.error('Error checking course code:', error)
      return false
    }
  },
}))

export default useCourseStore 