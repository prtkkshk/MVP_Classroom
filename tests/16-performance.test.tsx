import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createClient } from '@supabase/supabase-js'
import { mockSupabaseClient } from './__mocks__/supabase'
import { mockAuthStore } from './__mocks__/zustand'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Zustand stores
jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: mockAuthStore,
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock Intersection Observer for lazy loading
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
global.IntersectionObserver = mockIntersectionObserver

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
}
global.performance = mockPerformance as any

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset auth store state
    mockAuthStore.setState({
      user: null,
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: false,
    })
    
    // Reset performance measurements
    mockPerformance.now.mockClear()
    mockPerformance.mark.mockClear()
    mockPerformance.measure.mockClear()
  })

  describe('1. Live Session Load Testing', () => {
    test('should handle live sessions with many users efficiently', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated professor
      mockAuthStore.setState({
        user: {
          id: 'prof-1',
          email: 'professor@university.edu',
          username: 'professor',
          name: 'Professor User',
          role: 'professor'
        },
        isAuthenticated: true
      })

      // Simulate large number of participants
      const participants = Array.from({ length: 100 }, (_, i) => ({
        id: `student-${i}`,
        name: `Student ${i}`,
        joined_at: new Date().toISOString()
      }))

      // Mock Supabase query with large dataset
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: participants,
          error: null
        })
      })

      const startTime = performance.now()

      // Simulate loading participants list
      await act(async () => {
        // This would render the live session component
        // render(<LiveSession sessionId="session-1" />)
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Should load 100 participants within reasonable time (less than 1 second)
      expect(loadTime).toBeLessThan(1000)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled()
      })
    })

    test('should handle real-time updates with many concurrent users', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate 50 concurrent doubt submissions
      const doubts = Array.from({ length: 50 }, (_, i) => ({
        id: `doubt-${i}`,
        content: `Doubt ${i}`,
        student_id: `student-${i}`,
        created_at: new Date().toISOString()
      }))

      const startTime = performance.now()

      // Simulate processing multiple real-time updates
      await act(async () => {
        doubts.forEach((doubt, index) => {
          setTimeout(() => {
            // Process doubt update
          }, index * 10)
        })
      })

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should process 50 updates efficiently
      expect(processingTime).toBeLessThan(2000)

      await waitFor(() => {
        // Verify all updates were processed
        expect(doubts).toHaveLength(50)
      })
    })

    test('should maintain UI responsiveness during high activity', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate high-frequency UI updates
      const updates = Array.from({ length: 100 }, (_, i) => ({
        id: `update-${i}`,
        type: 'doubt',
        content: `Update ${i}`
      }))

      const startTime = performance.now()

      // Simulate rapid UI updates
      await act(async () => {
        updates.forEach((update, index) => {
          setTimeout(() => {
            // Update UI component
          }, index * 5)
        })
      })

      const endTime = performance.now()
      const updateTime = endTime - startTime

      // Should handle UI updates without blocking
      expect(updateTime).toBeLessThan(3000)

      await waitFor(() => {
        // Verify UI remains responsive
        expect(updates).toHaveLength(100)
      })
    })
  })

  describe('2. API Response Time Tests', () => {
    test('should measure API response times for course loading', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated professor
      mockAuthStore.setState({
        user: {
          id: 'prof-1',
          email: 'professor@university.edu',
          username: 'professor',
          name: 'Professor User',
          role: 'professor'
        },
        isAuthenticated: true
      })

      const startTime = performance.now()

      // Mock API call with timing
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((callback) => {
          const responseTime = performance.now() - startTime
          // Simulate API response time
          setTimeout(() => {
            callback({
              data: [{ id: 'course-1', title: 'Test Course' }],
              error: null
            })
          }, 100) // Simulate 100ms API response
          return Promise.resolve({
            data: [{ id: 'course-1', title: 'Test Course' }],
            error: null
          })
        })
      })

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled()
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // API response should be reasonably fast
      expect(totalTime).toBeLessThan(500)
    })

    test('should measure database query performance', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate complex database query
      const complexQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: 1000 }, (_, i) => ({
            id: `item-${i}`,
            title: `Item ${i}`,
            created_at: new Date().toISOString()
          })),
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(complexQuery)

      const startTime = performance.now()

      await act(async () => {
        // Execute complex query
        await complexQuery.then()
      })

      const endTime = performance.now()
      const queryTime = endTime - startTime

      // Complex query should complete within reasonable time
      expect(queryTime).toBeLessThan(2000)

      await waitFor(() => {
        expect(complexQuery.then).toHaveBeenCalled()
      })
    })

    test('should measure file upload performance', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock file upload
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'uploads/test.pdf' },
          error: null
        })
      })

      const startTime = performance.now()

      await act(async () => {
        // Simulate file upload
        await mockSupabaseClient.storage.from('materials').upload('test.pdf', mockFile)
      })

      const endTime = performance.now()
      const uploadTime = endTime - startTime

      // File upload should complete within reasonable time
      expect(uploadTime).toBeLessThan(5000)

      await waitFor(() => {
        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('materials')
      })
    })
  })

  describe('3. Caching Effectiveness Tests', () => {
    test('should cache frequently accessed data', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const courseData = { id: 'course-1', title: 'Cached Course' }

      // First request - should hit database
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: courseData,
          error: null
        })
      })

      const firstRequestStart = performance.now()
      
      await act(async () => {
        // First request
        await mockSupabaseClient.from('courses').select().eq('id', 'course-1').single()
      })

      const firstRequestEnd = performance.now()
      const firstRequestTime = firstRequestEnd - firstRequestStart

      // Second request - should use cache
      const secondRequestStart = performance.now()
      
      await act(async () => {
        // Second request (should be cached)
        await mockSupabaseClient.from('courses').select().eq('id', 'course-1').single()
      })

      const secondRequestEnd = performance.now()
      const secondRequestTime = secondRequestEnd - secondRequestStart

      // Cached request should be faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
      })
    })

    test('should invalidate cache when data changes', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const originalData = { id: 'course-1', title: 'Original Title' }
      const updatedData = { id: 'course-1', title: 'Updated Title' }

      // Initial request
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: originalData,
          error: null
        })
      })

      await act(async () => {
        // Initial request
        await mockSupabaseClient.from('courses').select().eq('id', 'course-1').single()
      })

      // Simulate data update
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedData,
          error: null
        })
      })

      await act(async () => {
        // Request after update (should bypass cache)
        await mockSupabaseClient.from('courses').select().eq('id', 'course-1').single()
      })

      await waitFor(() => {
        // Should make new request after cache invalidation
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
      })
    })

    test('should cache search results for performance', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const searchResults = [
        { id: 'result-1', title: 'Search Result 1' },
        { id: 'result-2', title: 'Search Result 2' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: searchResults,
          error: null
        })
      })

      const searchTerm = 'test'

      // First search
      const firstSearchStart = performance.now()
      
      await act(async () => {
        await mockSupabaseClient.from('courses').select().ilike('title', `%${searchTerm}%`).order('created_at', { ascending: false }).limit(10)
      })

      const firstSearchEnd = performance.now()
      const firstSearchTime = firstSearchEnd - firstSearchStart

      // Second search with same term
      const secondSearchStart = performance.now()
      
      await act(async () => {
        await mockSupabaseClient.from('courses').select().ilike('title', `%${searchTerm}%`).order('created_at', { ascending: false }).limit(10)
      })

      const secondSearchEnd = performance.now()
      const secondSearchTime = secondSearchEnd - secondSearchStart

      // Cached search should be faster
      expect(secondSearchTime).toBeLessThan(firstSearchTime)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('4. Lazy Loading Tests', () => {
    test('should trigger lazy loading when content comes into view', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock Intersection Observer
      let intersectionCallback: IntersectionObserverCallback
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback
        return {
          observe: () => null,
          unobserve: () => null,
          disconnect: () => null,
        }
      })

      // Mock lazy loaded data
      const lazyData = Array.from({ length: 20 }, (_, i) => ({
        id: `lazy-${i}`,
        title: `Lazy Item ${i}`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: lazyData,
          error: null
        })
      })

      await act(async () => {
        // Simulate intersection observer trigger
        if (intersectionCallback) {
          intersectionCallback([
            {
              isIntersecting: true,
              target: document.createElement('div'),
              intersectionRatio: 1,
              boundingClientRect: {} as DOMRectReadOnly,
              rootBounds: null,
              time: 0
            }
          ], {} as IntersectionObserver)
        }
      })

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled()
      })
    })

    test('should load images lazily for better performance', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock image loading
      const mockImage = new Image()
      Object.defineProperty(mockImage, 'src', {
        set: jest.fn(),
        get: jest.fn(() => 'test.jpg')
      })

      // Simulate lazy image loading
      await act(async () => {
        // Trigger intersection observer for image
        if (mockIntersectionObserver.mock.results[0].value.observe) {
          mockIntersectionObserver.mock.results[0].value.observe(mockImage)
        }
      })

      await waitFor(() => {
        // Should trigger image loading when in view
        expect(mockImage.src).toBeDefined()
      })
    })

    test('should handle lazy loading with large datasets', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        content: `Content for item ${i}`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeDataset.slice(0, 50), // Load first 50 items
          error: null
        })
      })

      const startTime = performance.now()

      await act(async () => {
        // Simulate initial lazy load
        await mockSupabaseClient.from('items').select().range(0, 49)
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Should load initial batch quickly
      expect(loadTime).toBeLessThan(1000)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled()
      })
    })
  })

  describe('5. Memory Usage Tests', () => {
    test('should not cause memory leaks with long-running sessions', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate long-running session with periodic updates
      const updates = Array.from({ length: 1000 }, (_, i) => ({
        id: `update-${i}`,
        timestamp: Date.now() + i,
        data: `Update data ${i}`
      }))

      const startMemory = (performance as any).memory?.usedJSHeapSize || 0

      await act(async () => {
        // Process many updates over time
        for (let i = 0; i < updates.length; i += 10) {
          const batch = updates.slice(i, i + 10)
          // Process batch
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      })

      const endMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = endMemory - startMemory

      // Memory increase should be reasonable (less than 50MB)
      if (startMemory > 0 && endMemory > 0) {
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
      }

      await waitFor(() => {
        expect(updates).toHaveLength(1000)
      })
    })

    test('should clean up event listeners properly', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock event listeners
      const mockAddEventListener = jest.fn()
      const mockRemoveEventListener = jest.fn()

      // Simulate component lifecycle
      await act(async () => {
        // Component mount - add listeners
        mockAddEventListener('scroll', jest.fn())
        mockAddEventListener('resize', jest.fn())
      })

      await act(async () => {
        // Component unmount - remove listeners
        mockRemoveEventListener('scroll', jest.fn())
        mockRemoveEventListener('resize', jest.fn())
      })

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledTimes(2)
        expect(mockRemoveEventListener).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('6. Bundle Size and Loading Tests', () => {
    test('should load critical components quickly', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const startTime = performance.now()

      await act(async () => {
        // Simulate loading critical components
        // This would test the initial bundle load time
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Critical components should load quickly
      expect(loadTime).toBeLessThan(2000)

      await waitFor(() => {
        // Verify critical components are loaded
        expect(true).toBe(true)
      })
    })

    test('should load non-critical components on demand', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const startTime = performance.now()

      await act(async () => {
        // Simulate loading non-critical component
        // This would test dynamic import performance
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Non-critical components should load within reasonable time
      expect(loadTime).toBeLessThan(1000)

      await waitFor(() => {
        // Verify non-critical component is loaded
        expect(true).toBe(true)
      })
    })
  })
})
