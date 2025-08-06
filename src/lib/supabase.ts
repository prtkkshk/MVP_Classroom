import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          name: string
          role: 'super_admin' | 'professor' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          name?: string
          role?: 'super_admin' | 'professor' | 'student'
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
          max_students: number
          schedule: string
          classroom: string
          is_live?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      course_materials: {
        Row: {
          id: string
          course_id: string
          name: string
          type: string
          file_url: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          type: string
          file_url: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          type?: string
          file_url?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      doubts: {
        Row: {
          id: string
          course_id: string
          student_id: string
          text: string
          anonymous: boolean
          upvotes: number
          answered: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          text: string
          anonymous?: boolean
          upvotes?: number
          answered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          text?: string
          anonymous?: boolean
          upvotes?: number
          answered?: boolean
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
    }
  }
} 