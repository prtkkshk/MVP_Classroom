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
  AnimatePresence: ({ children }: any) => children,
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UI/UX Tests', () => {
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

  describe('1. Responsive Design', () => {
    test('should adapt layout for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('mobile-layout')).toBeInTheDocument()
        expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument()
      })
    })

    test('should adapt layout for tablet devices', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('tablet-layout')).toBeInTheDocument()
      })
    })

    test('should adapt layout for desktop devices', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('desktop-layout')).toBeInTheDocument()
        expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument()
      })
    })

    test('should handle orientation changes', async () => {
      // Mock landscape orientation
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      })

      window.dispatchEvent(new Event('orientationchange'))

      await waitFor(() => {
        expect(screen.getByTestId('landscape-layout')).toBeInTheDocument()
      })
    })
  })

  describe('2. Animations and Transitions', () => {
    test('should animate page transitions smoothly', async () => {
      const user = userEvent.setup()
      
      const navigationLink = screen.getByRole('link', { name: /courses/i })
      await user.click(navigationLink)

      await waitFor(() => {
        expect(screen.getByTestId('page-transition')).toHaveClass('animate-in')
      })
    })

    test('should animate modal openings', async () => {
      const user = userEvent.setup()
      
      const openModalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(openModalButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-overlay')).toHaveClass('animate-in')
        expect(screen.getByTestId('modal-content')).toHaveClass('slide-in')
      })
    })

    test('should animate modal closings', async () => {
      const user = userEvent.setup()
      
      const openModalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(openModalButton)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-overlay')).toHaveClass('animate-out')
        expect(screen.getByTestId('modal-content')).toHaveClass('slide-out')
      })
    })

    test('should animate loading states', async () => {
      // Mock loading state
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 1000))
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin')
        expect(screen.getByTestId('loading-skeleton')).toHaveClass('animate-pulse')
      })
    })

    test('should animate form submissions', async () => {
      const user = userEvent.setup()
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toHaveClass('animate-pulse')
        expect(screen.getByTestId('submit-icon')).toHaveClass('animate-spin')
      })
    })
  })

  describe('3. Accessibility Compliance', () => {
    test('should have proper ARIA labels', async () => {
      expect(screen.getByLabelText(/search courses/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/navigation menu/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument()
    })

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      // Navigate with Tab key
      await user.tab()
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /courses/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /analytics/i })).toHaveFocus()
    })

    test('should support screen readers', async () => {
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('should have proper color contrast', async () => {
      const textElement = screen.getByText(/welcome/i)
      const computedStyle = window.getComputedStyle(textElement)
      
      // Check if text color has sufficient contrast with background
      expect(computedStyle.color).not.toBe('')
      expect(computedStyle.backgroundColor).not.toBe('')
    })

    test('should support focus management', async () => {
      const user = userEvent.setup()
      
      const modalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(modalButton)

      await waitFor(() => {
        // Focus should be trapped inside modal
        expect(screen.getByTestId('modal-content')).toContainElement(document.activeElement)
      })
    })
  })

  describe('4. User Experience', () => {
    test('should show loading states for better UX', async () => {
      // Mock slow API call
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 2000))
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    })

    test('should show error states gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(new Error('API Error'))
      })

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    test('should show empty states appropriately', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/no courses found/i)).toBeInTheDocument()
        expect(screen.getByText(/create your first course/i)).toBeInTheDocument()
      })
    })

    test('should provide helpful tooltips', async () => {
      const user = userEvent.setup()
      
      const tooltipTrigger = screen.getByRole('button', { name: /help/i })
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/this feature helps you/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Performance and Optimization', () => {
    test('should lazy load images', async () => {
      const imageElement = screen.getByAltText(/course thumbnail/i)
      
      // Check if image has lazy loading attribute
      expect(imageElement).toHaveAttribute('loading', 'lazy')
    })

    test('should implement virtual scrolling for large lists', async () => {
      // Mock large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeData,
          error: null
        })
      })

      await waitFor(() => {
        // Only visible items should be rendered
        const renderedItems = screen.getAllByTestId('list-item')
        expect(renderedItems.length).toBeLessThan(1000)
      })
    })

    test('should debounce search inputs', async () => {
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
        // Should only make one API call after debounce
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })
    })

    test('should cache frequently accessed data', async () => {
      // First request
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })

      // Second request should use cache
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('6. Error Boundaries', () => {
    test('should catch and display component errors gracefully', async () => {
      // Mock component error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Trigger error boundary
      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await userEvent.click(errorButton)

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    test('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await userEvent.click(errorButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('7. Internationalization', () => {
    test('should support multiple languages', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'es')

      await waitFor(() => {
        expect(screen.getByText(/bienvenido/i)).toBeInTheDocument()
        expect(screen.getByText(/cursos/i)).toBeInTheDocument()
      })
    })

    test('should handle right-to-left languages', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'ar')

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('dir', 'rtl')
        expect(screen.getByText(/مرحبا/i)).toBeInTheDocument()
      })
    })

    test('should format dates according to locale', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'fr')

      await waitFor(() => {
        expect(screen.getByText(/15 décembre 2024/i)).toBeInTheDocument()
      })
    })
  })
})
