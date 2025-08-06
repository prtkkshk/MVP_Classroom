import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  role: 'super_admin' | 'professor' | 'student'
}

interface AuthStore {
  user: AuthUser | null
  supabaseUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth methods
  signUp: (email: string, password: string, username: string, name: string, role: 'professor' | 'student') => Promise<{ success: boolean; error?: string }>
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
  
  // User management
  createProfessor: (email: string, username: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
}

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  supabaseUser: null,
  isAuthenticated: false,
  isLoading: true,

  signUp: async (email: string, password: string, username: string, name: string, role: 'professor' | 'student') => {
    try {
      // Check if email is institutional (for students)
      if (role === 'student' && !email.includes('@kgpian.iitkgp.ac.in')) {
        return { success: false, error: 'Students must use institutional email addresses' }
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username already taken' }
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (authData.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            username,
            name,
            role,
          })

        if (profileError) {
          // Clean up auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id)
          return { success: false, error: profileError.message }
        }

        // Set user in store
        const newUser: AuthUser = {
          id: authData.user.id,
          email,
          username,
          name,
          role,
        }

        set({ user: newUser, supabaseUser: authData.user, isAuthenticated: true })
        return { success: true }
      }

      return { success: false, error: 'Failed to create user' }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  signIn: async (username: string, password: string) => {
    try {
      // Check for hardcoded admin login
      if (username === 'pepper_admin' && password === '14627912') {
        const adminUser: AuthUser = {
          id: 'admin-001',
          email: 'admin@infralearn.com',
          username: 'pepper_admin',
          name: 'System Administrator',
          role: 'super_admin'
        }
        
        set({ 
          user: adminUser, 
          supabaseUser: null, 
          isAuthenticated: true 
        })
        return { success: true }
      }

      // First, find the user by username to get their email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single()

      if (userError || !userData) {
        return { success: false, error: 'Invalid username or password' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Get user profile from our users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          return { success: false, error: 'User profile not found' }
        }

        set({ 
          user: userProfile, 
          supabaseUser: data.user, 
          isAuthenticated: true 
        })
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, supabaseUser: null, isAuthenticated: false })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true })

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Get user profile
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!error && userProfile) {
          set({ 
            user: userProfile, 
            supabaseUser: session.user, 
            isAuthenticated: true 
          })
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userProfile) {
            set({ 
              user: userProfile, 
              supabaseUser: session.user, 
              isAuthenticated: true 
            })
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, supabaseUser: null, isAuthenticated: false })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createProfessor: async (email: string, username: string, name: string, password: string) => {
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username already taken' }
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (authData.user) {
        // Create professor profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            username,
            name,
            role: 'professor',
          })

        if (profileError) {
          await supabase.auth.admin.deleteUser(authData.user.id)
          return { success: false, error: profileError.message }
        }

        return { success: true }
      }

      return { success: false, error: 'Failed to create professor' }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  updateProfile: async (updates: Partial<AuthUser>) => {
    try {
      const { user } = get()
      if (!user) {
        return { success: false, error: 'No user logged in' }
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Update local state
      set({ user: { ...user, ...updates } })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  },
}))

export default useAuthStore 