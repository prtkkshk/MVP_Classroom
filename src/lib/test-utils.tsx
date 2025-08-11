// Comprehensive test utilities for InLearn MVP

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock Supabase
export const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    getSession: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
    catch: vi.fn()
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn()
    }))
  }
}

// Mock data
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'student',
  full_name: 'Test User',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com'
}

export const mockProfessorUser = {
  ...mockUser,
  id: 'prof-1',
  role: 'professor',
  username: 'professor',
  email: 'professor@example.com'
}

export const mockCourse = {
  id: 'course-1',
  title: 'Introduction to Computer Science',
  description: 'Learn the fundamentals of computer science',
  instructor_id: 'prof-1',
  instructor_name: 'Dr. Smith',
  category: 'Computer Science',
  level: 'Beginner',
  duration: 12,
  price: 99.99,
  image_url: 'https://example.com/course-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  status: 'active'
}

export const mockCourseMaterial = {
  id: 'material-1',
  course_id: 'course-1',
  title: 'Chapter 1: Introduction',
  type: 'document',
  file_url: 'https://example.com/chapter1.pdf',
  file_size: 1024000,
  file_type: 'application/pdf',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockAnnouncement = {
  id: 'announcement-1',
  course_id: 'course-1',
  title: 'Welcome to the Course!',
  content: 'Welcome everyone to our new course!',
  author_id: 'prof-1',
  author_name: 'Dr. Smith',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockAssignment = {
  id: 'assignment-1',
  course_id: 'course-1',
  title: 'First Assignment',
  description: 'Complete the exercises in Chapter 1',
  due_date: '2024-02-01T23:59:59Z',
  max_score: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockLiveSession = {
  id: 'session-1',
  course_id: 'course-1',
  title: 'Live Q&A Session',
  description: 'Ask questions about the course material',
  start_time: '2024-01-15T14:00:00Z',
  end_time: '2024-01-15T15:00:00Z',
  meeting_url: 'https://meet.google.com/abc-defg-hij',
  status: 'scheduled',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockCalendarEvent = {
  id: 'event-1',
  title: 'Course Meeting',
  description: 'Weekly course meeting',
  start_time: '2024-01-15T14:00:00Z',
  end_time: '2024-01-15T15:00:00Z',
  type: 'course',
  course_id: 'course-1',
  user_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockMessage = {
  id: 'message-1',
  sender_id: 'user-1',
  receiver_id: 'prof-1',
  content: 'Hello, I have a question about the course',
  message_type: 'text',
  status: 'sent',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockNotification = {
  id: 'notification-1',
  user_id: 'user-1',
  title: 'New Course Available',
  message: 'A new course has been added to your dashboard',
  type: 'course',
  read: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Test wrapper with providers
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
export const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  })
}

// Mock functions
export const mockFunctions = {
  navigate: vi.fn(),
  showToast: vi.fn(),
  logError: vi.fn(),
  validateInput: vi.fn(),
  sanitizeInput: vi.fn(),
  checkPermission: vi.fn(),
  formatDate: vi.fn(),
  formatCurrency: vi.fn(),
  generateId: vi.fn()
}

// Test helpers
export const testHelpers = {
  // Wait for loading to complete
  waitForLoadingToFinish: async () => {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  },

  // Wait for error to appear
  waitForError: async (errorText: string) => {
    await waitFor(() => {
      expect(screen.getByText(errorText)).toBeInTheDocument()
    })
  },

  // Wait for success message
  waitForSuccess: async (successText: string) => {
    await waitFor(() => {
      expect(screen.getByText(successText)).toBeInTheDocument()
    })
  },

  // Fill form fields
  fillForm: async (formData: Record<string, string>) => {
    const user = userEvent.setup()
    
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
      await user.clear(field)
      await user.type(field, value)
    }
  },

  // Submit form
  submitForm: async () => {
    const user = userEvent.setup()
    const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i })
    await user.click(submitButton)
  },

  // Check if element is visible
  isVisible: (element: HTMLElement) => {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  },

  // Mock API response
  mockApiResponse: (data: any, status = 200) => {
    return {
      data,
      error: null,
      status,
      statusText: status === 200 ? 'OK' : 'Error'
    }
  },

  // Mock API error
  mockApiError: (message: string, status = 400) => {
    return {
      data: null,
      error: { message, status },
      status,
      statusText: 'Error'
    }
  }
}

// Mock stores
export const mockAuthStore = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  refreshToken: vi.fn()
}

export const mockCourseStore = {
  courses: [mockCourse],
  currentCourse: mockCourse,
  isLoading: false,
  error: null,
  fetchCourses: vi.fn(),
  fetchCourse: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  enrollCourse: vi.fn(),
  unenrollCourse: vi.fn()
}

// Mock API calls
export const mockApiCalls = {
  auth: {
    login: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ user: mockUser, token: 'mock-token' })),
    register: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ user: mockUser, token: 'mock-token' })),
    logout: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true })),
    verifyEmail: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  courses: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockCourse])),
    getById: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourse)),
    create: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourse)),
    update: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourse)),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true })),
    enroll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true })),
    unenroll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  materials: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockCourseMaterial])),
    getById: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourseMaterial)),
    create: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourseMaterial)),
    update: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCourseMaterial)),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  announcements: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockAnnouncement])),
    getById: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAnnouncement)),
    create: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAnnouncement)),
    update: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAnnouncement)),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  assignments: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockAssignment])),
    getById: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAssignment)),
    create: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAssignment)),
    update: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockAssignment)),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  liveSessions: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockLiveSession])),
    getById: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockLiveSession)),
    create: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockLiveSession)),
    update: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockLiveSession)),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  calendar: {
    getEvents: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockCalendarEvent])),
    createEvent: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCalendarEvent)),
    updateEvent: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockCalendarEvent)),
    deleteEvent: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  },
  chat: {
    getMessages: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockMessage])),
    sendMessage: vi.fn().mockResolvedValue(testHelpers.mockApiResponse(mockMessage)),
    searchUsers: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockUser]))
  },
  notifications: {
    getAll: vi.fn().mockResolvedValue(testHelpers.mockApiResponse([mockNotification])),
    markAsRead: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true })),
    delete: vi.fn().mockResolvedValue(testHelpers.mockApiResponse({ success: true }))
  }
}

// Export everything
export * from '@testing-library/react'
export { vi } from 'vitest'
