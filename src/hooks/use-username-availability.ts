import { useState, useEffect, useCallback } from 'react'

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
      // Use the API route instead of direct Supabase query
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(usernameToCheck)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Username availability check failed:', errorData)
        
        // For API errors, we'll assume the username is available
        // This prevents the feature from breaking completely
        setState({
          isChecking: false,
          isAvailable: null, // Set to null to not block registration
          error: errorData.error || 'Failed to check username availability'
        })
        return
      }

      const data = await response.json()
      const isAvailable = data.isAvailable
      
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
        error: 'Network error occurred'
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