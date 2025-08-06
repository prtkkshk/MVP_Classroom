import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UsernameAvailabilityState {
  isChecking: boolean
  isAvailable: boolean | null
  error: string | null
}

export function useUsernameAvailability(username: string, minLength: number = 3) {
  const [state, setState] = useState<UsernameAvailabilityState>({
    isChecking: false,
    isAvailable: null,
    error: null
  })

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < minLength) {
      setState({
        isChecking: false,
        isAvailable: null,
        error: null
      })
      return
    }

    // Check for invalid characters
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(usernameToCheck)) {
      setState({
        isChecking: false,
        isAvailable: false,
        error: 'Username can only contain letters, numbers, and underscores'
      })
      return
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      // Use a more specific query that should work with RLS
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', usernameToCheck)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors

      if (error) {
        // If it's a 500 error or RLS policy issue, we'll assume the username is available
        // This prevents the feature from breaking completely
        console.warn('Username availability check failed:', error)
        setState({
          isChecking: false,
          isAvailable: null, // Set to null to not block registration
          error: null
        })
        return
      }

      const isAvailable = !data // If no data found, username is available
      
      setState({
        isChecking: false,
        isAvailable,
        error: null
      })
    } catch (error) {
      console.error('Username availability check error:', error)
      setState({
        isChecking: false,
        isAvailable: null, // Set to null to not block registration
        error: null
      })
    }
  }, [minLength])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsername(username)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [username, checkUsername])

  return state
} 