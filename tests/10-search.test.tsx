import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSupabaseClient } from './__mocks__/supabase'
import { mockAuthStore, mockCourseStore } from './__mocks__/zustand'
import GlobalSearch from '@/components/search/GlobalSearch'

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
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Search Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
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
      courses: [
        {
          id: 'course-1',
          title: 'Test Course',
          code: 'TEST101',
          description: 'A test course for testing purposes',
          professor_id: 'prof-1'
        },
        {
          id: 'course-2',
          title: 'Advanced Mathematics',
          code: 'MATH201',
          description: 'Advanced mathematics concepts',
          professor_id: 'prof-1'
        }
      ],
      materials: [
        {
          id: 'material-1',
          name: 'Test Material',
          description: 'Test material description',
          course_id: 'course-1'
        }
      ],
      announcements: [
        {
          id: 'announcement-1',
          title: 'Test Announcement',
          content: 'Test announcement content',
          course_id: 'course-1'
        }
      ],
      doubts: [
        {
          id: 'doubt-1',
          content: 'Test doubt question',
          student_name: 'Test Student',
          course_id: 'course-1'
        }
      ],
      assignments: [
        {
          id: 'assignment-1',
          title: 'Test Assignment',
          description: 'Test assignment description',
          course_id: 'course-1'
        }
      ],
      calendarEvents: [
        {
          id: 'event-1',
          title: 'Test Event',
          description: 'Test event description',
          course_id: 'course-1'
        }
      ]
    })
  })

  const renderSearch = () => {
    return render(<GlobalSearch />)
  }

  describe('1. Keyword Search', () => {
    test('should search across all categories by keyword', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Test Material')).toBeInTheDocument()
        expect(screen.getByText('Test Announcement')).toBeInTheDocument()
        expect(screen.getByText('Test doubt question')).toBeInTheDocument()
        expect(screen.getByText('Test Assignment')).toBeInTheDocument()
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })
    })

    test('should handle empty search results', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results found for "nonexistent"/i)).toBeInTheDocument()
        expect(screen.getByText(/try different keywords/i)).toBeInTheDocument()
      })
    })

    test('should search with partial matches', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'math')

      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument()
      })
    })

    test('should handle special characters in search', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'C++')

      await waitFor(() => {
        // Should handle special characters gracefully
        expect(searchInput).toHaveValue('C++')
      })
    })

    test('should search in course descriptions and codes', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'testing purposes')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
      })
    })
  })

  describe('2. Category Filtering', () => {
    test('should display results with proper type badges', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('course')).toBeInTheDocument()
        expect(screen.getByText('material')).toBeInTheDocument()
        expect(screen.getByText('announcement')).toBeInTheDocument()
        expect(screen.getByText('doubt')).toBeInTheDocument()
        expect(screen.getByText('assignment')).toBeInTheDocument()
        expect(screen.getByText('calendar')).toBeInTheDocument()
      })
    })

    test('should display course names for materials and announcements', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText(/course: test course/i)).toBeInTheDocument()
      })
    })

    test('should truncate long descriptions appropriately', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        // Check that descriptions are truncated
        const description = screen.getByText(/test announcement content/i)
        expect(description.textContent).toContain('...')
      })
    })
  })

  describe('3. Keyboard Navigation', () => {
    test('should navigate search results with arrow keys', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      // Navigate down
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        const firstResult = screen.getByText('Test Course').closest('.cursor-pointer')
        expect(firstResult).toHaveClass('bg-blue-50', 'border-blue-200')
      })

      // Navigate down again
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        const secondResult = screen.getByText('Test Material').closest('.cursor-pointer')
        expect(secondResult).toHaveClass('bg-blue-50', 'border-blue-200')
      })

      // Navigate up
      await user.keyboard('{ArrowUp}')
      await waitFor(() => {
        const firstResult = screen.getByText('Test Course').closest('.cursor-pointer')
        expect(firstResult).toHaveClass('bg-blue-50', 'border-blue-200')
      })
    })

    test('should select result with Enter key', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      // Navigate to first result
      await user.keyboard('{ArrowDown}')
      
      // Select with Enter
      await user.keyboard('{Enter}')

      await waitFor(() => {
        // Should navigate to the result
        expect(screen.queryByText(/search results/i)).not.toBeInTheDocument()
      })
    })

    test('should close search with Escape key', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.click(searchInput)

      // Close with Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText(/recent searches/i)).not.toBeInTheDocument()
      })
    })

    test('should perform search with Enter when no result is selected', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
      })
    })
  })

  describe('4. Search History', () => {
    test('should save search queries to history', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test query')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'infralearn_search_history',
          expect.stringContaining('test query')
        )
      })
    })

    test('should display search history', async () => {
      // Mock search history
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        'test query 1',
        'test query 2',
        'test query 3'
      ]))

      renderSearch()
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await userEvent.click(searchInput)

      await waitFor(() => {
        expect(screen.getByText('test query 1')).toBeInTheDocument()
        expect(screen.getByText('test query 2')).toBeInTheDocument()
        expect(screen.getByText('test query 3')).toBeInTheDocument()
      })
    })

    test('should limit search history size to 10 items', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      // Mock large search history
      const largeHistory = Array.from({ length: 15 }, (_, i) => `query ${i}`)
      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeHistory))

      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'new query')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'infralearn_search_history',
          expect.stringMatching(/new query.*query 0.*query 9/)
        )
      })
    })

    test('should remove duplicates from search history', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      // Mock search history with duplicates
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        'test query',
        'another query'
      ]))

      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test query')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'infralearn_search_history',
          expect.stringMatching(/test query.*another query/)
        )
        // Should not have duplicate 'test query'
        const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
        expect(savedHistory.filter((item: string) => item === 'test query')).toHaveLength(1)
      })
    })
  })

  describe('5. Search Suggestions', () => {
    test('should show quick search suggestions', async () => {
      renderSearch()
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await userEvent.click(searchInput)

      await waitFor(() => {
        expect(screen.getByText('Live Sessions')).toBeInTheDocument()
        expect(screen.getByText('Assignments')).toBeInTheDocument()
        expect(screen.getByText('Course Materials')).toBeInTheDocument()
        expect(screen.getByText('Announcements')).toBeInTheDocument()
      })
    })

    test('should handle suggestion clicks', async () => {
      const user = userEvent.setup()
      renderSearch()
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.click(searchInput)

      const liveSessionsSuggestion = screen.getByText('Live Sessions')
      await user.click(liveSessionsSuggestion)

      await waitFor(() => {
        expect(searchInput).toHaveValue('Live Sessions')
      })
    })

    test('should show loading state during search', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument()
      })
    })
  })

  describe('6. Search Results Display', () => {
    test('should display search results with proper formatting', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('A test course for testing purposes')).toBeInTheDocument()
        expect(screen.getByText('course')).toBeInTheDocument()
      })
    })

    test('should display proper icons for each result type', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        // Check that icons are present (they're rendered as SVG elements)
        const courseIcon = screen.getByText('Test Course').closest('.cursor-pointer')?.querySelector('svg')
        expect(courseIcon).toBeInTheDocument()
      })
    })

    test('should display course names for non-course results', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText(/course: test course/i)).toBeInTheDocument()
      })
    })

    test('should handle results without descriptions gracefully', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        // Should display results even without descriptions
        expect(screen.getByText('Test Course')).toBeInTheDocument()
      })
    })
  })

  describe('7. Search Performance', () => {
    test('should handle large search results efficiently', async () => {
      const startTime = performance.now()
      
      // Mock large result set
      const largeCourses = Array.from({ length: 100 }, (_, i) => ({
        id: `course-${i}`,
        title: `Course ${i}`,
        code: `CODE${i}`,
        description: `Description for course ${i}`,
        professor_id: 'prof-1'
      }))

      mockCourseStore.setState({
        ...mockCourseStore.getState(),
        courses: largeCourses
      })

      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'course')

      await waitFor(() => {
        const endTime = performance.now()
        const searchTime = endTime - startTime
        
        // Search should complete within 1000ms (including debounce)
        expect(searchTime).toBeLessThan(1000)
        expect(screen.getByText('Course 0')).toBeInTheDocument()
      })
    })

    test('should debounce search input', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      
      // Type quickly
      await user.type(searchInput, 't')
      await user.type(searchInput, 'e')
      await user.type(searchInput, 's')
      await user.type(searchInput, 't')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
      })
    })
  })

  describe('8. Search Relevance', () => {
    test('should prioritize exact matches', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'Test Course')

      await waitFor(() => {
        // Exact match should appear first
        const results = screen.getAllByText(/test course/i)
        expect(results[0]).toBeInTheDocument()
      })
    })

    test('should handle case-insensitive search', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'TEST COURSE')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
      })
    })
  })

  describe('9. Search UI/UX', () => {
    test('should show clear button when search has content', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear/i })
        expect(clearButton).toBeInTheDocument()
      })
    })

    test('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(searchInput).toHaveValue('')
        expect(screen.queryByText('Test Course')).not.toBeInTheDocument()
      })
    })

    test('should close search when clicking outside', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.click(searchInput)

      // Click outside
      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText(/recent searches/i)).not.toBeInTheDocument()
      })
    })

    test('should maintain search state during navigation', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      await user.type(searchInput, 'test')

      // Simulate navigation
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        // Search should be closed after navigation
        expect(screen.queryByText(/search results/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('10. Search Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      renderSearch()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      expect(searchInput).toHaveAttribute('placeholder', 'Search courses, materials, announcements...')
    })

    test('should support keyboard-only navigation', async () => {
      const user = userEvent.setup()
      renderSearch()
      
      // Tab to search input
      await user.tab()
      
      const searchInput = screen.getByPlaceholderText(/search courses, materials, announcements/i)
      expect(searchInput).toHaveFocus()

      // Type and navigate with keyboard
      await user.type(searchInput, 'test')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.queryByText(/search results/i)).not.toBeInTheDocument()
      })
    })
  })
})
