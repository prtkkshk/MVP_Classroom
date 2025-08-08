import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          name: string
          role: 'super_admin' | 'professor' | 'student'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          name: string
          role: 'super_admin' | 'professor' | 'student'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          name?: string
          role?: 'super_admin' | 'professor' | 'student'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          code: string
          description: string
          professor_id: string
          semester: string
          max_students: number
          schedule: string
          classroom: string
          is_live: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          code: string
          description: string
          professor_id: string
          semester: string
          max_students?: number
          schedule: string
          classroom: string
          is_live?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          code?: string
          description?: string
          professor_id?: string
          semester?: string
          max_students?: number
          schedule?: string
          classroom?: string
          is_live?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          course_id: string
          student_id: string
          status: 'pending' | 'approved' | 'rejected'
          enrolled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          status?: 'pending' | 'approved' | 'rejected'
          enrolled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          enrolled_at?: string
          created_at?: string
        }
      }
      course_materials: {
        Row: {
          id: string
          course_id: string
          name: string
          description: string | null
          type: string
          file_url: string
          file_size: number | null
          file_type: string | null
          uploaded_by: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          description?: string | null
          type: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          description?: string | null
          type?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by?: string
          is_public?: boolean
          created_at?: string
        }
      }
      course_announcements: {
        Row: {
          id: string
          course_id: string
          title: string
          content: string
          type: 'announcement' | 'bulletin' | 'assignment'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content: string
          type?: 'announcement' | 'bulletin' | 'assignment'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          content?: string
          type?: 'announcement' | 'bulletin' | 'assignment'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      live_sessions: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          started_by: string
          started_at: string
          ended_at: string | null
          is_active: boolean
          participant_count: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          started_by: string
          started_at?: string
          ended_at?: string | null
          is_active?: boolean
          participant_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          started_by?: string
          started_at?: string
          ended_at?: string | null
          is_active?: boolean
          participant_count?: number
          created_at?: string
        }
      }
      doubts: {
        Row: {
          id: string
          course_id: string
          live_session_id: string | null
          student_id: string
          text: string
          anonymous: boolean
          upvotes: number
          answered: boolean
          answered_by: string | null
          answered_at: string | null
          answer_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          live_session_id?: string | null
          student_id: string
          text: string
          anonymous?: boolean
          upvotes?: number
          answered?: boolean
          answered_by?: string | null
          answered_at?: string | null
          answer_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          live_session_id?: string | null
          student_id?: string
          text?: string
          anonymous?: boolean
          upvotes?: number
          answered?: boolean
          answered_by?: string | null
          answered_at?: string | null
          answer_text?: string | null
          created_at?: string
        }
      }
      doubt_upvotes: {
        Row: {
          id: string
          doubt_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          doubt_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          doubt_id?: string
          user_id?: string
          created_at?: string
        }
      }
      live_polls: {
        Row: {
          id: string
          live_session_id: string
          question: string
          options: any
          created_by: string
          is_active: boolean
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          live_session_id: string
          question: string
          options: any
          created_by: string
          is_active?: boolean
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          live_session_id?: string
          question?: string
          options?: any
          created_by?: string
          is_active?: boolean
          created_at?: string
          ended_at?: string | null
        }
      }
      poll_responses: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          selected_option: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          selected_option: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          selected_option?: number
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          due_date: string
          max_points: number | null
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description: string
          due_date: string
          max_points?: number | null
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          due_date?: string
          max_points?: number | null
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          event_type: 'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'
          start_date: string
          end_date: string | null
          all_day: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          event_type: 'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'
          start_date: string
          end_date?: string | null
          all_day?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          event_type?: 'assignment' | 'exam' | 'live_session' | 'deadline' | 'other'
          start_date?: string
          end_date?: string | null
          all_day?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'enrollment' | 'announcement' | 'assignment' | 'live_session' | 'doubt' | 'poll' | 'system'
          is_read: boolean
          related_id: string | null
          related_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'enrollment' | 'announcement' | 'assignment' | 'live_session' | 'doubt' | 'poll' | 'system'
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'enrollment' | 'announcement' | 'assignment' | 'live_session' | 'doubt' | 'poll' | 'system'
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          created_at?: string
        }
      }
    }
  }
} 