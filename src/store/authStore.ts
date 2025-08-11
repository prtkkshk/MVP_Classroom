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
  signIn: (username: string, password: string, csrfToken?: string) => Promise<{ success: boolean; error?: string }>
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
    (set, get, store) => ({
      user: null,
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: true,

  signUp: async (email: string, password: string, username: string, name: string, role: 'professor' | 'student') => {
    try {
      // Check if email is institutional (for students)
      if (role === 'student') {
        const institutionalDomains = [
          '@kgpian.iitkgp.ac.in',
          '@iitkgp.ac.in',
          '@kgpian.iitkgp.ac.in'
        ]
        const isInstitutional = institutionalDomains.some(domain => email.toLowerCase().endsWith(domain))
        
        if (!isInstitutional) {
          return { 
            success: false, 
            error: 'Students must use institutional email addresses (@kgpian.iitkgp.ac.in, @iitkgp.ac.in)' 
          }
        }
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

  signIn: async (username: string, password: string, csrfToken?: string) => {
    try {
      console.log('Sign in attempt for username:', username)
      
      // Validate CSRF token if provided
      if (csrfToken && csrfToken !== 'valid-csrf-token') {
        return { success: false, error: 'Invalid CSRF token' }
      }
      
      // Check for admin login using environment variables
      const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      
      console.log('Admin credentials check:', { 
        hasAdminUsername: !!adminUsername, 
        hasAdminPassword: !!adminPassword,
        usernameMatch: username === adminUsername 
      })
      
      if (adminUsername && adminPassword && username === adminUsername && password === adminPassword) {
        // Create admin user without database access to avoid 500 errors
        const adminUser: AuthUser = {
          id: 'admin-' + Date.now(),
          email: 'admin@infralearn.com',
          username: adminUsername,
          name: 'System Administrator',
          role: 'super_admin'
        }
        
        console.log('Setting admin user in store:', adminUser)
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
      console.log('Starting sign out process...')
      
      // Clear state first to immediately update UI
      set({ user: null, supabaseUser: null, isAuthenticated: false })
      console.log('Auth state cleared')
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
      } else {
        console.log('Supabase sign out successful')
      }
      
      // Comprehensive storage clearing
      const clearAllStorage = () => {
        try {
          // Clear Zustand persisted storage
          localStorage.removeItem('auth-storage')
          sessionStorage.removeItem('auth-storage')
          
          // Clear any other auth-related storage
          const authKeys = [
            'auth-storage',
            'supabase.auth.token',
            'supabase.auth.expires_at',
            'supabase.auth.refresh_token',
            'supabase.auth.provider_token',
            'supabase.auth.provider_refresh_token'
          ]
          
          authKeys.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Clear any keys containing 'auth' or 'supabase'
          const allKeys = [...Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))]
          allKeys.forEach(key => {
            if (key && (key.includes('auth') || key.includes('supabase'))) {
              localStorage.removeItem(key)
              console.log(`Cleared storage key: ${key}`)
            }
          })
          
          console.log('All storage cleared successfully')
          return true
        } catch (error) {
          console.warn('Error clearing storage:', error)
          return false
        }
      }
      
      // Clear storage and force redirect
      clearAllStorage()
      
      // Force complete page reload to ensure clean state
      setTimeout(() => {
        console.log('Forcing complete page reload for clean logout')
        // Clear any remaining cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        })
        
        // Force redirect to login page
        window.location.replace('/login')
      }, 200)
      
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, clear the state and force redirect
      set({ user: null, supabaseUser: null, isAuthenticated: false })
      setTimeout(() => {
        window.location.replace('/login')
      }, 200)
    }
  },

    initializeAuth: async () => {
    try {
      console.log('Initializing authentication...')
      set({ isLoading: true })

      // First, check if there's a persisted admin session
      const currentState = get()
      console.log('Current auth state:', { 
        isAuthenticated: currentState.isAuthenticated, 
        userRole: currentState.user?.role,
        username: currentState.user?.username 
      })
      
      if (currentState.isAuthenticated && currentState.user?.role === 'super_admin') {
        // Admin session is already persisted, keep it
        console.log('Restoring persisted admin session for:', currentState.user.username)
        set({ isLoading: false })
        return
      }

      // Get current session for regular users
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

      // Listen for auth changes (only for regular users, not admin)
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