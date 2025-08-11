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

// Helper function to create comprehensive mock query builders
const createMockQueryBuilder = (data: any) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  then: jest.fn().mockResolvedValue({ data, error: null })
})

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

  describe('1. Data Accuracy Tests', () => {
    test('should display accurate student count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'student-1', name: 'John Doe' },
        { id: 'student-2', name: 'Jane Smith' },
        { id: 'student-3', name: 'Bob Johnson' },
        { id: 'student-4', name: 'Alice Brown' },
        { id: 'student-5', name: 'Charlie Wilson' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/5 students/i)).toBeInTheDocument()
      })
    })

    test('should display accurate course count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'course-1', title: 'Course 1' },
        { id: 'course-2', title: 'Course 2' },
        { id: 'course-3', title: 'Course 3' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/3 courses/i)).toBeInTheDocument()
      })
    })

    test('should display accurate doubt count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'doubt-1', content: 'Doubt 1' },
        { id: 'doubt-2', content: 'Doubt 2' },
        { id: 'doubt-3', content: 'Doubt 3' },
        { id: 'doubt-4', content: 'Doubt 4' },
        { id: 'doubt-5', content: 'Doubt 5' },
        { id: 'doubt-6', content: 'Doubt 6' },
        { id: 'doubt-7', content: 'Doubt 7' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/7 doubts/i)).toBeInTheDocument()
      })
    })

    test('should display accurate assignment count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'assignment-1', title: 'Assignment 1' },
        { id: 'assignment-2', title: 'Assignment 2' },
        { id: 'assignment-3', title: 'Assignment 3' },
        { id: 'assignment-4', title: 'Assignment 4' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/4 assignments/i)).toBeInTheDocument()
      })
    })

    test('should display accurate material count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'material-1', title: 'Material 1' },
        { id: 'material-2', title: 'Material 2' },
        { id: 'material-3', title: 'Material 3' },
        { id: 'material-4', title: 'Material 4' },
        { id: 'material-5', title: 'Material 5' },
        { id: 'material-6', title: 'Material 6' },
        { id: 'material-7', title: 'Material 7' },
        { id: 'material-8', title: 'Material 8' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/8 materials/i)).toBeInTheDocument()
      })
    })

    test('should display accurate announcement count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'announcement-1', title: 'Announcement 1', priority: 'high' },
        { id: 'announcement-2', title: 'Announcement 2', priority: 'medium' },
        { id: 'announcement-3', title: 'Announcement 3', priority: 'low' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/3 announcements/i)).toBeInTheDocument()
      })
    })

    test('should display accurate live session count', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'session-1', title: 'Session 1', status: 'active' },
        { id: 'session-2', title: 'Session 2', status: 'completed' },
        { id: 'session-3', title: 'Session 3', status: 'scheduled' }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/3 live sessions/i)).toBeInTheDocument()
      })
    })

    test('should validate data accuracy for mixed content types', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { id: 'item-1', type: 'pdf', size: 1024, downloads: 15 },
        { id: 'item-2', type: 'video', size: 51200, views: 45 },
        { id: 'item-3', type: 'document', size: 256, edits: 8 }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByText(/1 pdf files/i)).toBeInTheDocument()
        expect(screen.getByText(/1 video files/i)).toBeInTheDocument()
        expect(screen.getByText(/1 document files/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Chart Data Accuracy Tests', () => {
    test('should display accurate enrollment trends chart', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { date: '2024-01-01', enrollments: 5 },
        { date: '2024-01-02', enrollments: 8 },
        { date: '2024-01-03', enrollments: 12 },
        { date: '2024-01-04', enrollments: 15 },
        { date: '2024-01-05', enrollments: 18 }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByText(/enrollment trends/i)).toBeInTheDocument()
      })
    })

    test('should display accurate doubt activity chart', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { date: '2024-01-01', doubts: 3 },
        { date: '2024-01-02', doubts: 7 },
        { date: '2024-01-03', doubts: 5 },
        { date: '2024-01-04', doubts: 9 },
        { date: '2024-01-05', doubts: 6 }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText(/doubt activity/i)).toBeInTheDocument()
      })
    })

    test('should display accurate assignment completion chart', async () => {
      const mockQueryBuilder = createMockQueryBuilder([
        { assignment: 'Assignment 1', completed: 15, total: 20 },
        { assignment: 'Assignment 2', completed: 18, total: 20 },
        { assignment: 'Assignment 3', completed: 12, total: 20 },
        { assignment: 'Assignment 4', completed: 20, total: 20 }
      ])
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder)

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

    test('should display accurate course popularity chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { course: 'Mathematics 101', students: 45 },
            { course: 'Physics 101', students: 38 },
            { course: 'Chemistry 101', students: 32 },
            { course: 'Biology 101', students: 28 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText(/course popularity/i)).toBeInTheDocument()
      })
    })

    test('should display accurate time spent chart', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { student: 'John Doe', time_spent: 120 },
            { student: 'Jane Smith', time_spent: 95 },
            { student: 'Bob Johnson', time_spent: 150 },
            { student: 'Alice Brown', time_spent: 88 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
        expect(screen.getByText(/time spent/i)).toBeInTheDocument()
      })
    })

    test('should validate chart data accuracy for large datasets', async () => {
      const largeChartData = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 1
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeChartData.slice(0, 100), // Show last 100 data points
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByText(/100 data points/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Large Dataset Handling Tests', () => {
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

    test('should handle large course datasets efficiently', async () => {
      // Mock large dataset
      const largeCourseData = Array.from({ length: 500 }, (_, i) => ({
        id: `course-${i}`,
        title: `Course ${i}`,
        code: `COURSE${i.toString().padStart(3, '0')}`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeCourseData.slice(0, 20), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/500 courses/i)).toBeInTheDocument()
        expect(screen.getByText(/showing 20 of 500/i)).toBeInTheDocument()
      })
    })

    test('should handle large material datasets efficiently', async () => {
      // Mock large dataset
      const largeMaterialData = Array.from({ length: 3000 }, (_, i) => ({
        id: `material-${i}`,
        title: `Material ${i}`,
        type: i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'video' : 'document'
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeMaterialData.slice(0, 30), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3000 materials/i)).toBeInTheDocument()
        expect(screen.getByText(/showing 30 of 3000/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Real-time Analytics Updates Tests', () => {
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

    test('should update assignment analytics in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial assignment count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'assignment-1', title: 'Assignment 1' },
            { id: 'assignment-2', title: 'Assignment 2' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 assignments/i)).toBeInTheDocument()
      })

      // Simulate new assignment creation
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({ 
          new: { 
            id: 'assignment-3', 
            title: 'New Assignment',
            table: 'assignments',
            schema: 'public'
          } 
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/3 assignments/i)).toBeInTheDocument()
      })
    })

    test('should update course analytics in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial course count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'Course 1' },
            { id: 'course-2', title: 'Course 2' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 courses/i)).toBeInTheDocument()
      })

      // Simulate new course creation
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({ 
          new: { 
            id: 'course-3', 
            title: 'New Course',
            table: 'courses',
            schema: 'public'
          } 
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/3 courses/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Analytics Filters and Date Ranges Tests', () => {
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

    test('should filter analytics by priority level', async () => {
      const user = userEvent.setup()
      
      const prioritySelect = screen.getByLabelText(/select priority/i)
      await user.selectOptions(prioritySelect, 'high')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('priority', 'high')
      })
    })

    test('should filter analytics by status', async () => {
      const user = userEvent.setup()
      
      const statusSelect = screen.getByLabelText(/select status/i)
      await user.selectOptions(statusSelect, 'active')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'active')
      })
    })

    test('should filter analytics by material type', async () => {
      const user = userEvent.setup()
      
      const typeSelect = screen.getByLabelText(/select type/i)
      await user.selectOptions(typeSelect, 'pdf')

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'pdf')
      })
    })

    test('should clear all filters', async () => {
      const user = userEvent.setup()
      
      const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearFiltersButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().select).toHaveBeenCalled()
      })
    })
  })

  describe('6. Analytics Export and Reporting Tests', () => {
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

    test('should export analytics data to PDF', async () => {
      const user = userEvent.setup()
      
      const exportButton = screen.getByRole('button', { name: /export to pdf/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/generating pdf/i)).toBeInTheDocument()
      })
    })

    test('should export analytics data to Excel', async () => {
      const user = userEvent.setup()
      
      const exportButton = screen.getByRole('button', { name: /export to excel/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/generating excel/i)).toBeInTheDocument()
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

    test('should schedule automated reports', async () => {
      const user = userEvent.setup()
      
      const scheduleButton = screen.getByRole('button', { name: /schedule report/i })
      await user.click(scheduleButton)

      const frequencySelect = screen.getByLabelText(/report frequency/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const saveButton = screen.getByRole('button', { name: /save schedule/i })

      await user.selectOptions(frequencySelect, 'weekly')
      await user.type(emailInput, 'admin@university.edu')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/report scheduled/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Analytics Performance Tests', () => {
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

    test('should handle concurrent analytics requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () => 
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: [{ id: 'concurrent-data' }],
            error: null
          })
        })
      )

      await Promise.all(concurrentRequests.map(() => 
        waitFor(() => {
          expect(screen.getByText(/concurrent-data/i)).toBeInTheDocument()
        })
      ))
    })

    test('should handle analytics data pagination efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeDataset.slice(0, 100),
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/showing 100 of 10000/i)).toBeInTheDocument()
      })

      // Test next page
      const nextPageButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextPageButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().offset).toHaveBeenCalledWith(100)
      })
    })
  })

  describe('8. Role-based Analytics Tests', () => {
    test('should show professor-specific analytics', async () => {
      mockAuthStore.setState({
        user: { role: 'professor' },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { course: 'My Course', students: 25, assignments: 8 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/my courses/i)).toBeInTheDocument()
        expect(screen.getByText(/25 students/i)).toBeInTheDocument()
        expect(screen.getByText(/8 assignments/i)).toBeInTheDocument()
      })
    })

    test('should show student-specific analytics', async () => {
      mockAuthStore.setState({
        user: { role: 'student' },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { course: 'Enrolled Course', progress: 75, grade: 'A-' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/my progress/i)).toBeInTheDocument()
        expect(screen.getByText(/75%/i)).toBeInTheDocument()
        expect(screen.getByText(/grade: a-/i)).toBeInTheDocument()
      })
    })

    test('should show admin-specific analytics', async () => {
      mockAuthStore.setState({
        user: { role: 'super_admin' },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { total_users: 1500, total_courses: 45, total_revenue: 50000 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/platform overview/i)).toBeInTheDocument()
        expect(screen.getByText(/1500 users/i)).toBeInTheDocument()
        expect(screen.getByText(/45 courses/i)).toBeInTheDocument()
        expect(screen.getByText(/\$50,000/i)).toBeInTheDocument()
      })
    })
  })

  describe('9. Analytics Error Handling Tests', () => {
    test('should handle database connection errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      })

      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument()
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument()
      })
    })

    test('should handle empty data sets gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
        expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument()
      })
    })

    test('should handle malformed data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'valid-1', name: 'Valid Item' },
            { id: null, name: null }, // Malformed data
            { id: 'valid-2', name: 'Another Valid Item' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 valid items/i)).toBeInTheDocument()
        expect(screen.getByText(/1 item with errors/i)).toBeInTheDocument()
      })
    })

    test('should retry failed analytics requests', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce({
            data: [{ id: 'retry-success' }],
            error: null
          })
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/retry-success/i)).toBeInTheDocument()
      })
    })
  })

  describe('10. Analytics Data Validation Tests', () => {
    test('should validate student count accuracy', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'student-1', name: 'John Doe', status: 'active' },
            { id: 'student-2', name: 'Jane Smith', status: 'active' },
            { id: 'student-3', name: 'Bob Johnson', status: 'inactive' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 active students/i)).toBeInTheDocument()
        expect(screen.getByText(/1 inactive student/i)).toBeInTheDocument()
      })
    })

    test('should validate course enrollment accuracy', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { course_id: 'course-1', student_id: 'student-1', status: 'enrolled' },
            { course_id: 'course-1', student_id: 'student-2', status: 'enrolled' },
            { course_id: 'course-1', student_id: 'student-3', status: 'pending' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 enrolled students/i)).toBeInTheDocument()
        expect(screen.getByText(/1 pending enrollment/i)).toBeInTheDocument()
      })
    })

    test('should validate assignment submission accuracy', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { assignment_id: 'assignment-1', student_id: 'student-1', submitted: true, grade: 85 },
            { assignment_id: 'assignment-1', student_id: 'student-2', submitted: true, grade: 92 },
            { assignment_id: 'assignment-1', student_id: 'student-3', submitted: false, grade: null }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 submissions/i)).toBeInTheDocument()
        expect(screen.getByText(/1 pending/i)).toBeInTheDocument()
        expect(screen.getByText(/average grade: 88.5/i)).toBeInTheDocument()
      })
    })
  })
})
