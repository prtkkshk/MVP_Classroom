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

// Mock chart libraries
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}))

describe('Analytics Tests', () => {
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

  describe('1. Data Counts and Statistics', () => {
    test('should display accurate student count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'student-1', name: 'John Doe' },
            { id: 'student-2', name: 'Jane Smith' },
            { id: 'student-3', name: 'Bob Johnson' },
            { id: 'student-4', name: 'Alice Brown' },
            { id: 'student-5', name: 'Charlie Wilson' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/5 students/i)).toBeInTheDocument()
      })
    })

    test('should display accurate course count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'Course 1' },
            { id: 'course-2', title: 'Course 2' },
            { id: 'course-3', title: 'Course 3' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 courses/i)).toBeInTheDocument()
      })
    })

    test('should display accurate doubt count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'doubt-1', content: 'Doubt 1' },
            { id: 'doubt-2', content: 'Doubt 2' },
            { id: 'doubt-3', content: 'Doubt 3' },
            { id: 'doubt-4', content: 'Doubt 4' },
            { id: 'doubt-5', content: 'Doubt 5' },
            { id: 'doubt-6', content: 'Doubt 6' },
            { id: 'doubt-7', content: 'Doubt 7' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/7 doubts/i)).toBeInTheDocument()
      })
    })

    test('should display accurate assignment count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'assignment-1', title: 'Assignment 1' },
            { id: 'assignment-2', title: 'Assignment 2' },
            { id: 'assignment-3', title: 'Assignment 3' },
            { id: 'assignment-4', title: 'Assignment 4' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/4 assignments/i)).toBeInTheDocument()
      })
    })

    test('should display accurate material count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'material-1', title: 'Material 1' },
            { id: 'material-2', title: 'Material 2' },
            { id: 'material-3', title: 'Material 3' },
            { id: 'material-4', title: 'Material 4' },
            { id: 'material-5', title: 'Material 5' },
            { id: 'material-6', title: 'Material 6' },
            { id: 'material-7', title: 'Material 7' },
            { id: 'material-8', title: 'Material 8' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/8 materials/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Chart Data Accuracy', () => {
    test('should display accurate enrollment trends chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { date: '2024-01-01', enrollments: 5 },
            { date: '2024-01-02', enrollments: 8 },
            { date: '2024-01-03', enrollments: 12 },
            { date: '2024-01-04', enrollments: 15 },
            { date: '2024-01-05', enrollments: 18 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByText(/enrollment trends/i)).toBeInTheDocument()
      })
    })

    test('should display accurate doubt activity chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { date: '2024-01-01', doubts: 3 },
            { date: '2024-01-02', doubts: 7 },
            { date: '2024-01-03', doubts: 5 },
            { date: '2024-01-04', doubts: 9 },
            { date: '2024-01-05', doubts: 6 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText(/doubt activity/i)).toBeInTheDocument()
      })
    })

    test('should display accurate assignment completion chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { assignment: 'Assignment 1', completed: 15, total: 20 },
            { assignment: 'Assignment 2', completed: 18, total: 20 },
            { assignment: 'Assignment 3', completed: 12, total: 20 },
            { assignment: 'Assignment 4', completed: 20, total: 20 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText(/assignment completion/i)).toBeInTheDocument()
      })
    })

    test('should display accurate grade distribution chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { grade_range: '90-100', count: 5 },
            { grade_range: '80-89', count: 8 },
            { grade_range: '70-79', count: 12 },
            { grade_range: '60-69', count: 6 },
            { grade_range: '0-59', count: 2 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
        expect(screen.getByText(/grade distribution/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Large Dataset Handling', () => {
    test('should handle large student datasets efficiently', async () => {
      // Mock large dataset
      const largeStudentData = Array.from({ length: 1000 }, (_, i) => ({
        id: `student-${i}`,
        name: `Student ${i}`,
        email: `student${i}@university.edu`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeStudentData.slice(0, 100), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/1000 students/i)).toBeInTheDocument()
        expect(screen.getByText(/showing 100 of 1000/i)).toBeInTheDocument()
      })
    })

    test('should handle large doubt datasets efficiently', async () => {
      // Mock large dataset
      const largeDoubtData = Array.from({ length: 5000 }, (_, i) => ({
        id: `doubt-${i}`,
        content: `Doubt ${i}`,
        created_at: new Date(Date.now() - i * 60000).toISOString()
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeDoubtData.slice(0, 50), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/5000 doubts/i)).toBeInTheDocument()
        expect(screen.getByText(/showing 50 of 5000/i)).toBeInTheDocument()
      })
    })

    test('should handle large assignment datasets efficiently', async () => {
      // Mock large dataset
      const largeAssignmentData = Array.from({ length: 2000 }, (_, i) => ({
        id: `assignment-${i}`,
        title: `Assignment ${i}`,
        due_date: new Date(Date.now() + i * 86400000).toISOString()
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeAssignmentData.slice(0, 25), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2000 assignments/i)).toBeInTheDocument()
        expect(screen.getByText(/showing 25 of 2000/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Real-time Analytics Updates', () => {
    test('should update analytics in real-time when new data is added', async () => {
      // Mock real-time subscription
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'student-1', name: 'John Doe' },
            { id: 'student-2', name: 'Jane Smith' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 students/i)).toBeInTheDocument()
      })

      // Simulate new student enrollment
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({ 
          new: { 
            id: 'student-3', 
            name: 'Bob Johnson',
            table: 'users',
            schema: 'public'
          } 
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/3 students/i)).toBeInTheDocument()
      })
    })

    test('should update doubt analytics in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial doubt count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'doubt-1', content: 'Doubt 1' },
            { id: 'doubt-2', content: 'Doubt 2' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 doubts/i)).toBeInTheDocument()
      })

      // Simulate new doubt submission
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({ 
          new: { 
            id: 'doubt-3', 
            content: 'New doubt',
            table: 'doubts',
            schema: 'public'
          } 
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/3 doubts/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Analytics Filters and Date Ranges', () => {
    test('should filter analytics by date range', async () => {
      const user = userEvent.setup()
      
      const startDateInput = screen.getByLabelText(/start date/i)
      const endDateInput = screen.getByLabelText(/end date/i)
      const applyFilterButton = screen.getByRole('button', { name: /apply filter/i })

      await user.type(startDateInput, '2024-01-01')
      await user.type(endDateInput, '2024-01-31')
      await user.click(applyFilterButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z')
        expect(mockSupabaseClient.from().lte).toHaveBeenCalledWith('created_at', '2024-01-31T23:59:59Z')
      })
    })

    test('should filter analytics by course', async () => {
      const user = userEvent.setup()
      
      const courseSelect = screen.getByLabelText(/select course/i)
      await user.selectOptions(courseSelect, 'course-1')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('course_id', 'course-1')
      })
    })

    test('should filter analytics by user role', async () => {
      const user = userEvent.setup()
      
      const roleSelect = screen.getByLabelText(/select role/i)
      await user.selectOptions(roleSelect, 'student')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('role', 'student')
      })
    })
  })

  describe('6. Analytics Export and Reporting', () => {
    test('should export analytics data to CSV', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'student-1', name: 'John Doe', email: 'john@university.edu' },
            { id: 'student-2', name: 'Jane Smith', email: 'jane@university.edu' }
          ],
          error: null
        })
      })

      const exportButton = screen.getByRole('button', { name: /export to csv/i })
      await user.click(exportButton)

      // Mock file download
      const mockDownload = jest.fn()
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalled()
      })
    })

    test('should generate analytics report', async () => {
      const user = userEvent.setup()
      
      const generateReportButton = screen.getByRole('button', { name: /generate report/i })
      await user.click(generateReportButton)

      await waitFor(() => {
        expect(screen.getByText(/analytics report/i)).toBeInTheDocument()
        expect(screen.getByText(/summary/i)).toBeInTheDocument()
        expect(screen.getByText(/recommendations/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Analytics Performance', () => {
    test('should load analytics data efficiently', async () => {
      const startTime = performance.now()

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: 100 }, (_, i) => ({ id: `item-${i}` })),
          error: null
        })
      })

      await waitFor(() => {
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        // Analytics should load within 1 second
        expect(loadTime).toBeLessThan(1000)
      })
    })

    test('should cache analytics data for performance', async () => {
      // First load
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [{ id: 'test-data' }],
          error: null
        })
      })

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })

      // Second load should use cache
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await userEvent.click(refreshButton)

      await waitFor(() => {
        // Should not make additional database calls if cached
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
      })
    })
  })
})
