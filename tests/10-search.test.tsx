import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSupabaseClient } from './__mocks__/supabase'
import { mockAuthStore, mockCourseStore } from './__mocks__/zustand'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Zustand stores
jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: mockAuthStore,
}))

jest.mock('@/store/courseStore', () => ({
  __esModule: true,
  default: mockCourseStore,
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ courseId: 'course-1' }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Search Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store states
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
    mockCourseStore.setState({
      currentCourse: {
        id: 'course-1',
        title: 'Test Course',
        code: 'TEST101',
        professor_id: 'prof-1'
      }
    })
  })

  describe('1. Keyword Search', () => {
    test('should search across all categories by keyword', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'Test Course', type: 'course' },
            { id: 'material-1', title: 'Test Material', type: 'material' },
            { id: 'assignment-1', title: 'Test Assignment', type: 'assignment' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(mockSupabaseClient.from().or).toHaveBeenCalled()
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Test Material')).toBeInTheDocument()
        expect(screen.getByText('Test Assignment')).toBeInTheDocument()
      })
    })

    test('should handle empty search results', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
        expect(screen.getByText(/try different keywords/i)).toBeInTheDocument()
      })
    })

    test('should search with partial matches', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'Advanced Mathematics', type: 'course' },
            { id: 'course-2', title: 'Mathematics for Engineers', type: 'course' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'math')

      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
        expect(screen.getByText('Mathematics for Engineers')).toBeInTheDocument()
      })
    })

    test('should handle special characters in search', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'C++ Programming', type: 'course' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'C++')

      await waitFor(() => {
        expect(screen.getByText('C++ Programming')).toBeInTheDocument()
      })
    })
  })

  describe('2. Category Filtering', () => {
    test('should filter search by courses only', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'Test Course 1', type: 'course' },
            { id: 'course-2', title: 'Test Course 2', type: 'course' }
          ],
          error: null
        })
      })

      const courseFilter = screen.getByRole('button', { name: /courses/i })
      await user.click(courseFilter)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'course')
        expect(screen.getByText('Test Course 1')).toBeInTheDocument()
        expect(screen.getByText('Test Course 2')).toBeInTheDocument()
      })
    })

    test('should filter search by materials only', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'material-1', title: 'Test Material 1', type: 'material' },
            { id: 'material-2', title: 'Test Material 2', type: 'material' }
          ],
          error: null
        })
      })

      const materialFilter = screen.getByRole('button', { name: /materials/i })
      await user.click(materialFilter)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'material')
        expect(screen.getByText('Test Material 1')).toBeInTheDocument()
        expect(screen.getByText('Test Material 2')).toBeInTheDocument()
      })
    })

    test('should filter search by assignments only', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'assignment-1', title: 'Test Assignment 1', type: 'assignment' },
            { id: 'assignment-2', title: 'Test Assignment 2', type: 'assignment' }
          ],
          error: null
        })
      })

      const assignmentFilter = screen.getByRole('button', { name: /assignments/i })
      await user.click(assignmentFilter)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'assignment')
        expect(screen.getByText('Test Assignment 1')).toBeInTheDocument()
        expect(screen.getByText('Test Assignment 2')).toBeInTheDocument()
      })
    })

    test('should clear category filter', async () => {
      const user = userEvent.setup()
      
      const courseFilter = screen.getByRole('button', { name: /courses/i })
      await user.click(courseFilter)

      const clearFilterButton = screen.getByRole('button', { name: /clear filter/i })
      await user.click(clearFilterButton)

      await waitFor(() => {
        expect(screen.getByText(/all categories/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Keyboard Navigation', () => {
    test('should navigate search results with arrow keys', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'result-1', title: 'First Result', type: 'course' },
            { id: 'result-2', title: 'Second Result', type: 'material' },
            { id: 'result-3', title: 'Third Result', type: 'assignment' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      // Navigate down
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByText('First Result')).toHaveClass('selected')
      })

      // Navigate down again
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getByText('Second Result')).toHaveClass('selected')
      })

      // Navigate up
      await user.keyboard('{ArrowUp}')
      await waitFor(() => {
        expect(screen.getByText('First Result')).toHaveClass('selected')
      })
    })

    test('should select result with Enter key', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'result-1', title: 'Test Result', type: 'course' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      // Navigate to first result
      await user.keyboard('{ArrowDown}')
      
      // Select with Enter
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Test Result')).toHaveClass('selected')
      })
    })

    test('should close search with Escape key', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      // Close with Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText(/search results/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('4. Search History', () => {
    test('should save search queries to history', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test query')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(localStorage.getItem('search_history')).toContain('test query')
      })
    })

    test('should display search history', async () => {
      // Mock search history
      localStorage.setItem('search_history', JSON.stringify([
        'test query 1',
        'test query 2',
        'test query 3'
      ]))

      const searchInput = screen.getByPlaceholderText(/search/i)
      await userEvent.click(searchInput)

      await waitFor(() => {
        expect(screen.getByText('test query 1')).toBeInTheDocument()
        expect(screen.getByText('test query 2')).toBeInTheDocument()
        expect(screen.getByText('test query 3')).toBeInTheDocument()
      })
    })

    test('should clear search history', async () => {
      const user = userEvent.setup()
      
      // Mock search history
      localStorage.setItem('search_history', JSON.stringify([
        'test query 1',
        'test query 2'
      ]))

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.click(searchInput)

      const clearHistoryButton = screen.getByRole('button', { name: /clear history/i })
      await user.click(clearHistoryButton)

      await waitFor(() => {
        expect(localStorage.getItem('search_history')).toBeNull()
        expect(screen.queryByText('test query 1')).not.toBeInTheDocument()
      })
    })

    test('should limit search history size', async () => {
      const user = userEvent.setup()
      
      // Mock large search history
      const largeHistory = Array.from({ length: 20 }, (_, i) => `query ${i}`)
      localStorage.setItem('search_history', JSON.stringify(largeHistory))

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'new query')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('search_history') || '[]')
        expect(history.length).toBeLessThanOrEqual(10) // Max 10 items
        expect(history[0]).toBe('new query') // Most recent first
      })
    })
  })

  describe('5. Search Suggestions', () => {
    test('should show search suggestions while typing', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'suggestion-1', title: 'Test Course', type: 'course' },
            { id: 'suggestion-2', title: 'Test Material', type: 'material' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Test Material')).toBeInTheDocument()
      })
    })

    test('should debounce search suggestions', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search/i)
      
      // Type quickly
      await user.type(searchInput, 't')
      await user.type(searchInput, 'e')
      await user.type(searchInput, 's')
      await user.type(searchInput, 't')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 300))

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('6. Search Results Display', () => {
    test('should display search results with proper formatting', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'course-1',
              title: 'Test Course',
              type: 'course',
              description: 'Course description',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Course description')).toBeInTheDocument()
        expect(screen.getByText(/course/i)).toBeInTheDocument()
      })
    })

    test('should highlight search terms in results', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'course-1',
              title: 'Test Course',
              type: 'course'
            }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        const highlightedElement = screen.getByText('Test Course')
        expect(highlightedElement.innerHTML).toContain('<mark>test</mark>')
      })
    })
  })

  describe('7. Search Performance', () => {
    test('should handle large search results efficiently', async () => {
      const startTime = performance.now()
      
      // Mock large result set
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: `result-${i}`,
        title: `Result ${i}`,
        type: 'course'
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeResults.slice(0, 50), // Paginated results
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        const endTime = performance.now()
        const searchTime = endTime - startTime
        
        // Search should complete within 500ms
        expect(searchTime).toBeLessThan(500)
        expect(screen.getByText(/showing 50 of 1000 results/i)).toBeInTheDocument()
      })
    })

    test('should cache search results for performance', async () => {
      const searchInput = screen.getByPlaceholderText(/search/i)
      
      // First search
      await userEvent.type(searchInput, 'test')
      await userEvent.clear(searchInput)
      
      // Second search with same term
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        // Should use cached results
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })
    })
  })
})
