import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row']
type CourseMaterial = Database['public']['Tables']['course_materials']['Row']
type CourseAnnouncement = Database['public']['Tables']['course_announcements']['Row']
type LiveSession = Database['public']['Tables']['live_sessions']['Row']
type Doubt = Database['public']['Tables']['doubts']['Row']
type DoubtUpvote = Database['public']['Tables']['doubt_upvotes']['Row']
type LivePoll = Database['public']['Tables']['live_polls']['Row']
type PollResponse = Database['public']['Tables']['poll_responses']['Row']
type Assignment = Database['public']['Tables']['assignments']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']

interface CourseStore {
  // State
  courses: Course[]
  enrollments: CourseEnrollment[]
  materials: CourseMaterial[]
  announcements: CourseAnnouncement[]
  liveSessions: LiveSession[]
  doubts: Doubt[]
  doubtUpvotes: DoubtUpvote[]
  livePolls: LivePoll[]
  pollResponses: PollResponse[]
  assignments: Assignment[]
  calendarEvents: CalendarEvent[]
  notifications: Notification[]
  isLoading: boolean
  error: string | null

  // Course Management
  fetchCourses: () => Promise<void>
  fetchProfessorCourses: (professorId: string) => Promise<void>
  fetchEnrolledCourses: (studentId: string) => Promise<void>
  createCourse: (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'> & { is_public?: boolean; allow_enrollment?: boolean; prerequisites?: string; learning_objectives?: string }) => Promise<{ success: boolean; error?: string }>
  updateCourse: (id: string, updates: Partial<Course>) => Promise<{ success: boolean; error?: string }>
  deleteCourse: (id: string) => Promise<{ success: boolean; error?: string }>
  checkCourseCodeExists: (code: string) => Promise<boolean>

  // Enrollment Management
  fetchEnrollments: (courseId?: string) => Promise<void>
  enrollInCourse: (courseId: string, studentId: string) => Promise<{ success: boolean; error?: string }>
  updateEnrollmentStatus: (enrollmentId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; error?: string }>

  // Material Management
  fetchMaterials: (courseId: string) => Promise<void>
  uploadMaterial: (materialData: Omit<CourseMaterial, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  deleteMaterial: (id: string) => Promise<{ success: boolean; error?: string }>

  // Announcement Management
  fetchAnnouncements: (courseId: string) => Promise<void>
  createAnnouncement: (announcementData: Omit<CourseAnnouncement, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>
  updateAnnouncement: (id: string, updates: Partial<CourseAnnouncement>) => Promise<{ success: boolean; error?: string }>
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>

  // Live Session Management
  fetchLiveSessions: (courseId: string) => Promise<void>
  startLiveSession: (sessionData: Omit<LiveSession, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  endLiveSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  updateParticipantCount: (sessionId: string, count: number) => Promise<{ success: boolean; error?: string }>

  // Doubt Management
  fetchDoubts: (courseId: string, liveSessionId?: string) => Promise<void>
  submitDoubt: (doubtData: Omit<Doubt, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  upvoteDoubt: (doubtId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  removeUpvote: (doubtId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  answerDoubt: (doubtId: string, answerText: string, answeredBy: string) => Promise<{ success: boolean; error?: string }>

  // Live Poll Management
  fetchPolls: (liveSessionId: string) => Promise<void>
  createPoll: (pollData: Omit<LivePoll, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  endPoll: (pollId: string) => Promise<{ success: boolean; error?: string }>
  submitPollResponse: (responseData: Omit<PollResponse, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  fetchPollResponses: (pollId: string) => Promise<void>

  // Assignment Management
  fetchAssignments: (courseId: string) => Promise<void>
  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<{ success: boolean; error?: string }>
  deleteAssignment: (id: string) => Promise<{ success: boolean; error?: string }>

  // Calendar Management
  fetchCalendarEvents: (courseId: string) => Promise<void>
  createCalendarEvent: (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<{ success: boolean; error?: string }>
  deleteCalendarEvent: (id: string) => Promise<{ success: boolean; error?: string }>

  // Notification Management
  fetchNotifications: (userId: string) => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>
  markAllNotificationsAsRead: (userId: string) => Promise<{ success: boolean; error?: string }>
  deleteNotification: (notificationId: string) => Promise<{ success: boolean; error?: string }>

  // Utility
  clearError: () => void
  clearStore: () => void
}

const useCourseStore = create<CourseStore>((set, get) => ({
  // Initial state
  courses: [],
  enrollments: [],
  materials: [],
  announcements: [],
  liveSessions: [],
  doubts: [],
  doubtUpvotes: [],
  livePolls: [],
  pollResponses: [],
  assignments: [],
  calendarEvents: [],
  notifications: [],
  isLoading: false,
  error: null,

  // Course Management
  fetchCourses: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_professor_id_fkey(name, username)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ courses: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchProfessorCourses: async (professorId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ courses: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchEnrolledCourses: async (studentId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!course_enrollments_course_id_fkey(*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'approved')

      if (error) throw error
      set({ 
        enrollments: data || [], 
        courses: data?.map(e => e.courses).filter(Boolean) || [],
        isLoading: false 
      })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createCourse: async (courseData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      if (error) throw error
      
      const { courses } = get()
      set({ 
        courses: [data, ...courses],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateCourse: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { courses } = get()
      set({ 
        courses: courses.map(c => c.id === id ? data : c),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  deleteCourse: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { courses } = get()
      set({ 
        courses: courses.filter(c => c.id !== id),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  checkCourseCodeExists: async (code) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id')
        .eq('code', code)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      return false
    }
  },

  // Enrollment Management
  fetchEnrollments: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          users!course_enrollments_student_id_fkey(name, username, email)
        `)
        .order('created_at', { ascending: false })

      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query
      if (error) throw error
      set({ enrollments: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  enrollInCourse: async (courseId, studentId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: studentId,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      
      const { enrollments } = get()
      set({ 
        enrollments: [data, ...enrollments],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateEnrollmentStatus: async (enrollmentId, status) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({ status })
        .eq('id', enrollmentId)
        .select()
        .single()

      if (error) throw error
      
      const { enrollments } = get()
      set({ 
        enrollments: enrollments.map(e => e.id === enrollmentId ? data : e),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Material Management
  fetchMaterials: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select(`
          *,
          users!course_materials_uploaded_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ materials: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  uploadMaterial: async (materialData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .insert(materialData)
        .select()
        .single()

      if (error) throw error
      
      const { materials } = get()
      set({ 
        materials: [data, ...materials],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  deleteMaterial: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { materials } = get()
      set({ 
        materials: materials.filter(m => m.id !== id),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Announcement Management
  fetchAnnouncements: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_announcements')
        .select(`
          *,
          users!course_announcements_created_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ announcements: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createAnnouncement: async (announcementData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_announcements')
        .insert(announcementData)
        .select()
        .single()

      if (error) throw error
      
      const { announcements } = get()
      set({ 
        announcements: [data, ...announcements],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateAnnouncement: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('course_announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { announcements } = get()
      set({ 
        announcements: announcements.map(a => a.id === id ? data : a),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  deleteAnnouncement: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('course_announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { announcements } = get()
      set({ 
        announcements: announcements.filter(a => a.id !== id),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Live Session Management
  fetchLiveSessions: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          users!live_sessions_started_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .order('started_at', { ascending: false })

      if (error) throw error
      set({ liveSessions: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  startLiveSession: async (sessionData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error
      
      const { liveSessions } = get()
      set({ 
        liveSessions: [data, ...liveSessions],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  endLiveSession: async (sessionId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      
      const { liveSessions } = get()
      set({ 
        liveSessions: liveSessions.map(s => s.id === sessionId ? data : s),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateParticipantCount: async (sessionId, count) => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({ participant_count: count })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      
      const { liveSessions } = get()
      set({ 
        liveSessions: liveSessions.map(s => s.id === sessionId ? data : s)
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  // Doubt Management
  fetchDoubts: async (courseId, liveSessionId) => {
    set({ isLoading: true, error: null })
    try {
      let query = supabase
        .from('doubts')
        .select(`
          *,
          users!doubts_student_id_fkey(name, username),
          users!doubts_answered_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (liveSessionId) {
        query = query.eq('live_session_id', liveSessionId)
      }

      const { data, error } = await query
      if (error) throw error
      set({ doubts: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  submitDoubt: async (doubtData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('doubts')
        .insert(doubtData)
        .select()
        .single()

      if (error) throw error
      
      const { doubts } = get()
      set({ 
        doubts: [data, ...doubts],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  upvoteDoubt: async (doubtId, userId) => {
    try {
      const { data, error } = await supabase
        .from('doubt_upvotes')
        .insert({
          doubt_id: doubtId,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error
      
      const { doubtUpvotes } = get()
      set({ doubtUpvotes: [data, ...doubtUpvotes] })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  removeUpvote: async (doubtId, userId) => {
    try {
      const { error } = await supabase
        .from('doubt_upvotes')
        .delete()
        .eq('doubt_id', doubtId)
        .eq('user_id', userId)

      if (error) throw error
      
      const { doubtUpvotes } = get()
      set({ 
        doubtUpvotes: doubtUpvotes.filter(u => !(u.doubt_id === doubtId && u.user_id === userId))
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  answerDoubt: async (doubtId, answerText, answeredBy) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('doubts')
        .update({
          answered: true,
          answered_by: answeredBy,
          answered_at: new Date().toISOString(),
          answer_text: answerText
        })
        .eq('id', doubtId)
        .select()
        .single()

      if (error) throw error
      
      const { doubts } = get()
      set({ 
        doubts: doubts.map(d => d.id === doubtId ? data : d),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Live Poll Management
  fetchPolls: async (liveSessionId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_polls')
        .select(`
          *,
          users!live_polls_created_by_fkey(name, username)
        `)
        .eq('live_session_id', liveSessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ livePolls: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createPoll: async (pollData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_polls')
        .insert(pollData)
        .select()
        .single()

      if (error) throw error
      
      const { livePolls } = get()
      set({ 
        livePolls: [data, ...livePolls],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  endPoll: async (pollId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('live_polls')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', pollId)
        .select()
        .single()

      if (error) throw error
      
      const { livePolls } = get()
      set({ 
        livePolls: livePolls.map(p => p.id === pollId ? data : p),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  submitPollResponse: async (responseData) => {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .insert(responseData)
        .select()
        .single()

      if (error) throw error
      
      const { pollResponses } = get()
      set({ pollResponses: [data, ...pollResponses] })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  fetchPollResponses: async (pollId) => {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select(`
          *,
          users!poll_responses_user_id_fkey(name, username)
        `)
        .eq('poll_id', pollId)

      if (error) throw error
      set({ pollResponses: data || [] })
    } catch (error) {
      console.error('Error fetching poll responses:', error)
    }
  },

  // Assignment Management
  fetchAssignments: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          users!assignments_created_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('due_date', { ascending: true })

      if (error) throw error
      set({ assignments: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createAssignment: async (assignmentData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single()

      if (error) throw error
      
      const { assignments } = get()
      set({ 
        assignments: [data, ...assignments],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateAssignment: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { assignments } = get()
      set({ 
        assignments: assignments.map(a => a.id === id ? data : a),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { assignments } = get()
      set({ 
        assignments: assignments.filter(a => a.id !== id),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Calendar Management
  fetchCalendarEvents: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          users!calendar_events_created_by_fkey(name, username)
        `)
        .eq('course_id', courseId)
        .order('start_date', { ascending: true })

      if (error) throw error
      set({ calendarEvents: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createCalendarEvent: async (eventData) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error
      
      const { calendarEvents } = get()
      set({ 
        calendarEvents: [data, ...calendarEvents],
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  updateCalendarEvent: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { calendarEvents } = get()
      set({ 
        calendarEvents: calendarEvents.map(e => e.id === id ? data : e),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  deleteCalendarEvent: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { calendarEvents } = get()
      set({ 
        calendarEvents: calendarEvents.filter(e => e.id !== id),
        isLoading: false 
      })
      return { success: true }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return { success: false, error: (error as Error).message }
    }
  },

  // Notification Management
  fetchNotifications: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ notifications: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      
      const { notifications } = get()
      set({ 
        notifications: notifications.map(n => n.id === notificationId ? data : n)
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  markAllNotificationsAsRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      
      const { notifications } = get()
      set({ 
        notifications: notifications.map(n => ({ ...n, is_read: true }))
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      
      const { notifications } = get()
      set({ 
        notifications: notifications.filter(n => n.id !== notificationId)
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  // Utility
  clearError: () => set({ error: null }),
  clearStore: () => set({
    courses: [],
    enrollments: [],
    materials: [],
    announcements: [],
    liveSessions: [],
    doubts: [],
    doubtUpvotes: [],
    livePolls: [],
    pollResponses: [],
    assignments: [],
    calendarEvents: [],
    notifications: [],
    isLoading: false,
    error: null
  })
}))

export default useCourseStore 