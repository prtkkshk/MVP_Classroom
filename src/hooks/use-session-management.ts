import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export const useSessionManagement = () => {
  const { user, isAuthenticated, signOut } = useAuthStore()
  const sessionTimeoutRef = useRef<NodeJS.Timeout>()
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }

    // Set up session timeout (30 minutes)
    const SESSION_TIMEOUT = 30 * 60 * 1000
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('Session timeout reached, signing out user')
      signOut()
    }, SESSION_TIMEOUT)

    // Set up periodic session refresh (every 25 minutes)
    const REFRESH_INTERVAL = 25 * 60 * 1000
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) {
          console.error('Session refresh failed:', error)
          signOut()
        } else {
          console.log('Session refreshed successfully')
        }
      } catch (error) {
        console.error('Session refresh error:', error)
        signOut()
      }
    }, REFRESH_INTERVAL)

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [isAuthenticated, user, signOut])

  // Check for expired JWT and handle refresh
  const checkAndRefreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        if (error.message?.includes('JWT expired') || error.message?.includes('Session expired')) {
          console.log('JWT expired, attempting refresh')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('Session refresh failed:', refreshError)
            signOut()
          } else {
            console.log('Session refreshed successfully')
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      signOut()
    }
  }

  // Handle concurrent sessions
  const handleConcurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if this is a duplicate session
        const existingSession = localStorage.getItem('current-session-id')
        if (existingSession && existingSession !== session.access_token) {
          console.log('Concurrent session detected, signing out')
          await signOut()
        } else {
          localStorage.setItem('current-session-id', session.access_token)
        }
      }
    } catch (error) {
      console.error('Concurrent session check error:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Check session on mount
      checkAndRefreshSession()
      handleConcurrentSession()
      
      // Set up periodic session checks
      const sessionCheckInterval = setInterval(checkAndRefreshSession, 5 * 60 * 1000) // Every 5 minutes
      
      return () => {
        clearInterval(sessionCheckInterval)
      }
    }
  }, [isAuthenticated])

  return {
    checkAndRefreshSession,
    handleConcurrentSession
  }
}
