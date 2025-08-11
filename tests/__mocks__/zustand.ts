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

// Create a more sophisticated mock that allows method replacement
const createMockAuthStore = () => {
  let methods = {
    signUp: jest.fn().mockResolvedValue({ success: true, error: null }),
    signIn: jest.fn().mockImplementation((username: string, password: string, csrfToken?: string) => {
      // Mock CSRF validation
      if (csrfToken && csrfToken !== 'valid-csrf-token') {
        return Promise.resolve({ success: false, error: 'Invalid CSRF token' })
      }
      
      // Mock successful login for specific users
      if (username === 'admin' && password === 'password123') {
        return Promise.resolve({ 
          success: true, 
          error: null,
          user: {
            id: 'admin-1',
            username: 'admin',
            role: 'super_admin',
            email: 'admin@institute.edu'
          }
        })
      }
      
      if (username === 'professor' && password === 'password123') {
        return Promise.resolve({ 
          success: true, 
          error: null,
          user: {
            id: 'prof-1',
            username: 'professor',
            role: 'professor',
            email: 'professor@institute.edu'
          }
        })
      }
      
      if (username === 'student' && password === 'password123') {
        return Promise.resolve({ 
          success: true, 
          error: null,
          user: {
            id: 'student-1',
            username: 'student',
            role: 'student',
            email: 'student@institute.edu'
          }
        })
      }
      
      // Default to failed login
      return Promise.resolve({ success: false, error: 'Invalid username or password' })
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    initializeAuth: jest.fn().mockResolvedValue(undefined),
    createProfessor: jest.fn().mockResolvedValue({ success: true, error: null }),
    updateProfile: jest.fn().mockResolvedValue({ success: true, error: null }),
  }

  let state = {
    user: null,
    supabaseUser: null,
    isAuthenticated: false,
    isLoading: false,
  }

  const mockStore = {
    getState: () => ({
      ...state,
      ...methods,
    }),
    setState: (newState: any) => {
      state = { ...state, ...newState }
    },
    // Method to replace individual methods
    replaceMethod: (methodName: string, implementation: any) => {
      methods[methodName as keyof typeof methods] = implementation
    },
    // Method to reset all methods to defaults
    resetMethods: () => {
      methods = {
        signUp: jest.fn().mockResolvedValue({ success: true, error: null }),
        signIn: jest.fn().mockImplementation((username: string, password: string, csrfToken?: string) => {
          if (csrfToken && csrfToken !== 'valid-csrf-token') {
            return Promise.resolve({ success: false, error: 'Invalid CSRF token' })
          }
          return Promise.resolve({ success: true, error: null })
        }),
        signOut: jest.fn().mockResolvedValue(undefined),
        initializeAuth: jest.fn().mockResolvedValue(undefined),
        createProfessor: jest.fn().mockResolvedValue({ success: true, error: null }),
        updateProfile: jest.fn().mockResolvedValue({ success: true, error: null }),
      }
    }
  }

  return mockStore
}

export const mockAuthStore = createMockAuthStore()

// Mock the useAuthStore hook
export const useAuthStore = jest.fn((selector: any) => {
  const state = mockAuthStore.getState()
  if (typeof selector === 'function') {
    return selector(state)
  }
  return state
})

// Mock the store's getState method for direct access
export const mockUseAuthStore = {
  getState: () => mockAuthStore.getState(),
  setState: (newState: any) => mockAuthStore.setState(newState)
}

// Mock the store instance for direct method access
export const mockAuthStoreInstance = {
  ...mockAuthStore,
  // Override signOut to actually clear the state
  signOut: jest.fn().mockImplementation(async () => {
    mockAuthStore.setState({
      user: null,
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: false,
    })
    return Promise.resolve()
  }),
  // Override signIn to actually update the state
  signIn: jest.fn().mockImplementation(async (username: string, password: string, csrfToken?: string) => {
    // Mock successful login for testuser
    if (username === 'testuser' && password === 'password123') {
      const user = {
        id: 'user-1',
        username: 'testuser',
        role: 'student',
        email: 'testuser@institute.edu'
      }
      mockAuthStore.setState({
        user,
        supabaseUser: null,
        isAuthenticated: true,
        isLoading: false,
      })
      return Promise.resolve({ success: true, error: null, user })
    }
    
    // Default behavior
    if (csrfToken && csrfToken !== 'valid-csrf-token') {
      return Promise.resolve({ success: false, error: 'Invalid CSRF token' })
    }
    return Promise.resolve({ success: true, error: null })
  }),
  // Override signUp to actually update the state
  signUp: jest.fn().mockImplementation(async (email: string, password: string, username: string, name: string, role: string) => {
    // Mock successful registration
    const user = {
      id: 'user-1',
      username,
      role,
      email,
      name
    }
    mockAuthStore.setState({
      user,
      supabaseUser: null,
      isAuthenticated: true,
      isLoading: false,
    })
    return Promise.resolve({ success: true, error: null, user })
  }),
}

export const mockCourseStore = createMockStore({
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,
  // Add methods that are used in tests
  fetchLiveSessions: jest.fn(),
  startLiveSession: jest.fn(),
  endLiveSession: jest.fn(),
  submitDoubt: jest.fn(),
  upvoteDoubt: jest.fn(),
  markDoubtAnswered: jest.fn(),
  fetchNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  createCourse: jest.fn().mockResolvedValue({ success: true, error: null }),
  checkCourseCodeExists: jest.fn().mockResolvedValue(false),
  liveSessions: [],
  materials: [],
  announcements: [],
  doubts: [],
  assignments: [],
  calendarEvents: [],
  notifications: [],
  enrollments: [],
  enrolledCourses: [],
  isInitialLoading: false,
  // Add other methods that might be needed
  fetchCourses: jest.fn(),
  fetchProfessorCourses: jest.fn(),
  fetchEnrolledCourses: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
  fetchEnrollments: jest.fn(),
  enrollInCourse: jest.fn(),
  updateEnrollmentStatus: jest.fn(),
  fetchMaterials: jest.fn(),
  uploadMaterial: jest.fn(),
  deleteMaterial: jest.fn(),
  fetchAnnouncements: jest.fn(),
  createAnnouncement: jest.fn(),
  updateAnnouncement: jest.fn(),
  deleteAnnouncement: jest.fn(),
  fetchDoubts: jest.fn(),
  removeUpvote: jest.fn(),
  answerDoubt: jest.fn(),
  fetchPolls: jest.fn(),
  createPoll: jest.fn(),
  endPoll: jest.fn(),
  submitPollResponse: jest.fn(),
  fetchPollResponses: jest.fn(),
  fetchAssignments: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
  fetchCalendarEvents: jest.fn(),
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn(),
  clearError: jest.fn(),
  clearStore: jest.fn(),
})
