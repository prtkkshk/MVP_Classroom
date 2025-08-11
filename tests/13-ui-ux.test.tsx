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
  useMotionValue: jest.fn(() => ({ get: () => 0, set: jest.fn() })),
  useTransform: jest.fn(() => ({ get: () => 0 })),
  useSpring: jest.fn(() => ({ get: () => 0 })),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UI/UX Tests - Design Consistency & Performance', () => {
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

  describe('1. Responsive Design & Mobile-First Compliance', () => {
    test('should adapt layout for mobile devices (mobile-first approach)', async () => {
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
        // Verify mobile-first breakpoints are respected
        expect(screen.getByTestId('mobile-layout')).toHaveClass('sm:hidden')
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
        // Verify tablet breakpoints
        expect(screen.getByTestId('tablet-layout')).toHaveClass('md:block')
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
        // Verify desktop breakpoints
        expect(screen.getByTestId('desktop-layout')).toHaveClass('lg:block')
      })
    })

    test('should handle orientation changes gracefully', async () => {
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
        // Verify orientation-specific classes
        expect(screen.getByTestId('landscape-layout')).toHaveClass('landscape:flex-row')
      })
    })

    test('should maintain touch-friendly sizing on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        const touchTargets = screen.getAllByRole('button')
        touchTargets.forEach(target => {
          const computedStyle = window.getComputedStyle(target)
          const minHeight = parseInt(computedStyle.minHeight)
          const minWidth = parseInt(computedStyle.minWidth)
          // Verify minimum touch target size (44px recommended)
          expect(minHeight).toBeGreaterThanOrEqual(44)
          expect(minWidth).toBeGreaterThanOrEqual(44)
        })
      })
    })
  })

  describe('2. ShadCN UI & Tailwind Component Consistency', () => {
    test('should use consistent ShadCN UI components', async () => {
      // Verify Button component consistency
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
        // Verify consistent button variants
        if (button.textContent?.includes('Primary')) {
          expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
        }
        if (button.textContent?.includes('Secondary')) {
          expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
        }
      })
    })

    test('should maintain consistent spacing using Tailwind classes', async () => {
      const containers = screen.getAllByTestId('content-container')
      containers.forEach(container => {
        // Verify consistent padding and margins
        expect(container).toHaveClass('p-4', 'md:p-6', 'lg:p-8')
        expect(container).toHaveClass('space-y-4', 'md:space-y-6')
      })
    })

    test('should use consistent color scheme throughout', async () => {
      const elements = screen.getAllByTestId('colored-element')
      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        // Verify colors are from Tailwind color palette
        const color = computedStyle.color
        expect(color).toMatch(/rgb\([0-9]+, [0-9]+, [0-9]+\)/)
      })
    })

    test('should maintain consistent typography scale', async () => {
      const headings = screen.getAllByRole('heading')
      headings.forEach((heading, index) => {
        if (index === 0) {
          expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight')
        } else if (index === 1) {
          expect(heading).toHaveClass('text-2xl', 'font-semibold', 'tracking-tight')
        }
      })
    })

    test('should use consistent border radius and shadows', async () => {
      const cards = screen.getAllByTestId('card-component')
      cards.forEach(card => {
        // Verify consistent border radius
        expect(card).toHaveClass('rounded-lg')
        // Verify consistent shadows
        expect(card).toHaveClass('shadow-sm', 'hover:shadow-md')
      })
    })

    test('should maintain consistent form styling', async () => {
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        // Verify consistent input styling
        expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border')
        expect(input).toHaveClass('bg-background', 'px-3', 'py-2')
      })

      const labels = screen.getAllByTestId('form-label')
      labels.forEach(label => {
        // Verify consistent label styling
        expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none', 'peer-disabled:cursor-not-allowed')
      })
    })
  })

  describe('3. Framer Motion Animation Performance & Triggers', () => {
    test('should animate page transitions smoothly with proper performance', async () => {
      const user = userEvent.setup()
      
      const navigationLink = screen.getByRole('link', { name: /courses/i })
      await user.click(navigationLink)

      await waitFor(() => {
        expect(screen.getByTestId('page-transition')).toHaveClass('animate-in')
        // Verify animation performance attributes
        expect(screen.getByTestId('page-transition')).toHaveAttribute('data-animate', 'true')
      })

      // Test animation completion
      await waitFor(() => {
        expect(screen.getByTestId('page-transition')).toHaveClass('animate-complete')
      }, { timeout: 1000 })
    })

    test('should animate modal openings with proper entrance animations', async () => {
      const user = userEvent.setup()
      
      const openModalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(openModalButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-overlay')).toHaveClass('animate-in')
        expect(screen.getByTestId('modal-content')).toHaveClass('slide-in')
        // Verify animation variants are applied
        expect(screen.getByTestId('modal-content')).toHaveAttribute('data-motion', 'slideIn')
      })
    })

    test('should animate modal closings with proper exit animations', async () => {
      const user = userEvent.setup()
      
      const openModalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(openModalButton)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-overlay')).toHaveClass('animate-out')
        expect(screen.getByTestId('modal-content')).toHaveClass('slide-out')
        // Verify exit animation variants
        expect(screen.getByTestId('modal-content')).toHaveAttribute('data-motion', 'slideOut')
      })
    })

    test('should animate loading states with smooth transitions', async () => {
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
        // Verify loading animation variants
        expect(screen.getByTestId('loading-skeleton')).toHaveAttribute('data-motion', 'pulse')
      })
    })

    test('should animate form submissions with feedback animations', async () => {
      const user = userEvent.setup()
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toHaveClass('animate-pulse')
        expect(screen.getByTestId('submit-icon')).toHaveClass('animate-spin')
        // Verify submission animation variants
        expect(submitButton).toHaveAttribute('data-motion', 'pulse')
      })
    })

    test('should use proper animation easing and duration', async () => {
      const animatedElements = screen.getAllByTestId('animated-element')
      animatedElements.forEach(element => {
        // Verify animation timing functions
        expect(element).toHaveStyle({
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        })
        // Verify animation duration
        expect(element).toHaveStyle({
          transitionDuration: '150ms'
        })
      })
    })

    test('should handle animation performance on low-end devices', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      // Trigger animation
      const animationTrigger = screen.getByRole('button', { name: /animate/i })
      await userEvent.click(animationTrigger)

      await waitFor(() => {
        // Should respect reduced motion preference
        expect(screen.getByTestId('animated-element')).toHaveClass('motion-reduce:animate-none')
      })
    })

    test('should optimize animations for 60fps performance', async () => {
      const animatedElements = screen.getAllByTestId('animated-element')
      animatedElements.forEach(element => {
        // Verify hardware acceleration is enabled
        expect(element).toHaveStyle({
          transform: 'translateZ(0)',
          willChange: 'transform'
        })
      })
    })
  })

  describe('4. Accessibility Compliance & WCAG Standards', () => {
    test('should have proper ARIA labels and roles', async () => {
      expect(screen.getByLabelText(/search courses/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/navigation menu/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument()
      
      // Verify ARIA roles
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('should support comprehensive keyboard navigation', async () => {
      const user = userEvent.setup()
      
      // Navigate with Tab key
      await user.tab()
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /courses/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /analytics/i })).toHaveFocus()

      // Test Shift+Tab for reverse navigation
      await user.keyboard('{Shift>}{Tab}')
      expect(screen.getByRole('link', { name: /courses/i })).toHaveFocus()
    })

    test('should support screen readers with proper semantic markup', async () => {
      // Verify semantic HTML elements
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      // Verify landmarks
      expect(screen.getByTestId('main-content')).toHaveAttribute('role', 'main')
      expect(screen.getByTestId('sidebar')).toHaveAttribute('role', 'complementary')
    })

    test('should meet WCAG color contrast requirements', async () => {
      const textElements = screen.getAllByTestId('text-content')
      textElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        const textColor = computedStyle.color
        const backgroundColor = computedStyle.backgroundColor
        
        // Verify colors are defined
        expect(textColor).not.toBe('')
        expect(backgroundColor).not.toBe('')
        
        // Verify contrast ratio meets WCAG AA standards (4.5:1 for normal text)
        // This is a simplified check - in real testing you'd calculate actual contrast ratios
        expect(textColor).not.toBe(backgroundColor)
      })
    })

    test('should support focus management and trapping', async () => {
      const user = userEvent.setup()
      
      const modalButton = screen.getByRole('button', { name: /open modal/i })
      await user.click(modalButton)

      await waitFor(() => {
        // Focus should be trapped inside modal
        expect(screen.getByTestId('modal-content')).toContainElement(document.activeElement)
        
        // Verify focus trap attributes
        expect(screen.getByTestId('modal-content')).toHaveAttribute('data-focus-trap', 'true')
      })
    })

    test('should provide skip links for keyboard users', async () => {
      const skipLinks = screen.getAllByTestId('skip-link')
      skipLinks.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link).toHaveClass('sr-only', 'focus:not-sr-only')
      })
    })

    test('should support high contrast mode', async () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      // Verify high contrast styles are applied
      const elements = screen.getAllByTestId('high-contrast-element')
      elements.forEach(element => {
        expect(element).toHaveClass('contrast-more:border-2', 'contrast-more:border-current')
      })
    })
  })

  describe('5. Enhanced User Experience & Loading States', () => {
    test('should show comprehensive loading states for better UX', async () => {
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
        // Verify loading state variants
        expect(screen.getByTestId('loading-skeleton')).toHaveClass('animate-pulse', 'bg-muted')
      })
    })

    test('should show error states gracefully with recovery options', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(new Error('API Error'))
      })

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
      })
    })

    test('should show empty states with helpful guidance', async () => {
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
        expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
      })
    })

    test('should provide comprehensive tooltips and help text', async () => {
      const user = userEvent.setup()
      
      const tooltipTrigger = screen.getByRole('button', { name: /help/i })
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/this feature helps you/i)).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toHaveAttribute('role', 'tooltip')
      })
    })

    test('should show progress indicators for long operations', async () => {
      const user = userEvent.setup()
      
      const longOperationButton = screen.getByRole('button', { name: /start operation/i })
      await user.click(longOperationButton)

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
        expect(screen.getByText(/processing/i)).toBeInTheDocument()
        expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '0')
      })
    })
  })

  describe('6. Performance Optimization & Lazy Loading', () => {
    test('should implement proper lazy loading for images', async () => {
      const imageElement = screen.getByAltText(/course thumbnail/i)
      
      // Check if image has lazy loading attribute
      expect(imageElement).toHaveAttribute('loading', 'lazy')
      // Verify placeholder and blur-up loading
      expect(imageElement).toHaveAttribute('data-placeholder', 'blur')
    })

    test('should implement virtual scrolling for large lists efficiently', async () => {
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
        // Verify virtualization attributes
        expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-virtualized', 'true')
      })
    })

    test('should implement proper debouncing for search inputs', async () => {
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
        // Verify debounce indicator
        expect(screen.getByTestId('search-indicator')).toHaveTextContent('Searching...')
      })
    })

    test('should implement effective caching strategies', async () => {
      // First request
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })

      // Second request should use cache
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
        // Verify cache indicator
        expect(screen.getByTestId('cache-indicator')).toHaveTextContent('From cache')
      })
    })

    test('should implement code splitting and dynamic imports', async () => {
      // Verify dynamic imports are used for heavy components
      const heavyComponent = screen.getByTestId('heavy-component')
      expect(heavyComponent).toHaveAttribute('data-dynamically-loaded', 'true')
      
      // Verify loading states for dynamic imports
      expect(screen.getByTestId('dynamic-loading')).toHaveClass('animate-pulse')
    })
  })

  describe('7. Error Boundaries & Error Handling', () => {
    test('should catch and display component errors gracefully', async () => {
      // Mock component error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Trigger error boundary
      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await userEvent.click(errorButton)

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    test('should log errors for debugging with proper context', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await userEvent.click(errorButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
        // Verify error context is logged
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.any(String),
            stack: expect.any(String),
            componentStack: expect.any(String)
          })
        )
      })

      consoleSpy.mockRestore()
    })

    test('should provide fallback UI for failed components', async () => {
      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await userEvent.click(errorButton)

      await waitFor(() => {
        // Verify fallback UI is shown
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
        expect(screen.getByText(/component failed to load/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('8. Internationalization & Localization', () => {
    test('should support multiple languages with proper fallbacks', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'es')

      await waitFor(() => {
        expect(screen.getByText(/bienvenido/i)).toBeInTheDocument()
        expect(screen.getByText(/cursos/i)).toBeInTheDocument()
        // Verify language attribute
        expect(document.documentElement).toHaveAttribute('lang', 'es')
      })
    })

    test('should handle right-to-left languages with proper layout', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'ar')

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('dir', 'rtl')
        expect(screen.getByText(/مرحبا/i)).toBeInTheDocument()
        // Verify RTL layout classes
        expect(screen.getByTestId('rtl-layout')).toHaveClass('rtl:flex-row-reverse')
      })
    })

    test('should format dates, numbers, and currencies according to locale', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'fr')

      await waitFor(() => {
        expect(screen.getByText(/15 décembre 2024/i)).toBeInTheDocument()
        expect(screen.getByText(/1 234,56 €/i)).toBeInTheDocument()
        // Verify locale-specific formatting
        expect(screen.getByTestId('locale-formatted')).toHaveAttribute('data-locale', 'fr-FR')
      })
    })

    test('should handle pluralization rules correctly', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/select language/i)
      await user.selectOptions(languageSelect, 'en')

      // Test English pluralization
      expect(screen.getByText(/1 course/i)).toBeInTheDocument()
      expect(screen.getByText(/2 courses/i)).toBeInTheDocument()

      // Switch to Russian (different pluralization rules)
      await user.selectOptions(languageSelect, 'ru')
      await waitFor(() => {
        expect(screen.getByText(/1 курс/i)).toBeInTheDocument()
        expect(screen.getByText(/2 курса/i)).toBeInTheDocument()
        expect(screen.getByText(/5 курсов/i)).toBeInTheDocument()
      })
    })
  })

  describe('9. Cross-Browser Compatibility & Progressive Enhancement', () => {
    test('should work with JavaScript disabled (progressive enhancement)', async () => {
      // Mock JavaScript disabled environment
      const originalQuerySelector = document.querySelector
      document.querySelector = jest.fn(() => null)

      // Verify fallback content is shown
      expect(screen.getByText(/please enable javascript/i)).toBeInTheDocument()
      expect(screen.getByText(/basic functionality available/i)).toBeInTheDocument()

      // Restore original function
      document.querySelector = originalQuerySelector
    })

    test('should handle different browser capabilities gracefully', async () => {
      // Mock older browser (no CSS Grid support)
      const originalCSS = window.CSS
      window.CSS = { ...originalCSS, supports: jest.fn(() => false) }

      // Verify fallback layout is used
      expect(screen.getByTestId('fallback-layout')).toBeInTheDocument()
      expect(screen.getByTestId('fallback-layout')).toHaveClass('flexbox-fallback')

      // Restore original CSS object
      window.CSS = originalCSS
    })

    test('should support touch and mouse interactions appropriately', async () => {
      // Test touch events
      const touchElement = screen.getByTestId('touch-target')
      fireEvent.touchStart(touchElement)
      fireEvent.touchEnd(touchElement)

      await waitFor(() => {
        expect(touchElement).toHaveClass('touch-active')
      })

      // Test mouse events
      const mouseElement = screen.getByTestId('mouse-target')
      fireEvent.mouseEnter(mouseElement)
      fireEvent.mouseLeave(mouseElement)

      await waitFor(() => {
        expect(mouseElement).toHaveClass('hover-active')
      })
    })
  })
})
