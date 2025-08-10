import { act } from '@testing-library/react'

export const createMockStore = (initialState: any) => {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const setState = (newState: any) => {
    state = { ...state, ...newState }
    listeners.forEach(listener => listener())
  }

  const getState = () => state

  return {
    subscribe,
    setState,
    getState,
  }
}

export const mockAuthStore = createMockStore({
  user: null,
  session: null,
  loading: false,
  isAuthenticated: false,
})

export const mockCourseStore = createMockStore({
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,
})
