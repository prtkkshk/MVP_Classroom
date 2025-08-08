import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

// Helper function to get or create admin user
const getOrCreateAdminUser = async (username: string): Promise<AuthUser> => {
  try {
    // First, try to find existing admin user
    const { data: existingAdmin, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', 'super_admin')
      .single()

    if (existingAdmin && !findError) {
      return existingAdmin
    }

    // If admin doesn't exist, create one
    const adminUserData = {
      email: 'admin@infralearn.com',
      username: username,
      name: 'System Administrator',
      role: 'super_admin' as const,
      avatar_url: null
    }

    const { data: newAdmin, error: createError } = await supabase
      .from('users')
      .insert(adminUserData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating admin user:', createError)
      // Return a fallback admin user if database creation fails
      return {
        id: 'admin-fallback',
        email: 'admin@infralearn.com',
        username: username,
        name: 'System Administrator',
        role: 'super_admin'
      }
    }

    return newAdmin
  } catch (error) {
    console.error('Error in getOrCreateAdminUser:', error)
    // Return a fallback admin user
    return {
      id: 'admin-fallback',
      email: 'admin@infralearn.com',
      username: username,
      name: 'System Administrator',
      role: 'super_admin'
    }
  }
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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
      // Check for admin login using environment variables
      const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      
      if (adminUsername && adminPassword && username === adminUsername && password === adminPassword) {
        // Create admin user without database access to avoid 500 errors
        const adminUser: AuthUser = {
          id: 'admin-' + Date.now(),
          email: 'admin@infralearn.com',
          username: adminUsername,
          name: 'System Administrator',
          role: 'super_admin'
        }
        
        set({ 
          user: adminUser, 
          supabaseUser: null, 
          isAuthenticated: true 
        })
        
        // Ensure the session is persisted
        console.log('Admin login successful, session will be persisted')
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
      // Clear persisted data
      localStorage.removeItem('auth-storage')
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
      } else {
        // Check if there's a persisted admin session
        const currentState = get()
        if (currentState.isAuthenticated && currentState.user?.role === 'super_admin') {
          // Admin session is already persisted, keep it
          console.log('Restoring persisted admin session')
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
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }), // only persist these fields
    }
  )
)

export default useAuthStore 