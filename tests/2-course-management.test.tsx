import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSupabaseClient } from './__mocks__/supabase'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ courseId: 'test-course-id' }),
}))

describe('Course Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Course Creation Tests', () => {
    test('should create a new course with auto-generated code', async () => {
      const user = userEvent.setup()
      
      // Mock course creation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            code: 'CS101-2024',
            title: 'Introduction to Computer Science',
            description: 'Basic programming concepts',
            professor_id: 'prof-1',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Navigate to course creation page
      window.history.pushState({}, '', '/dashboard/courses/create')

      const titleInput = screen.getByLabelText(/course title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const createButton = screen.getByRole('button', { name: /create course/i })

      await user.type(titleInput, 'Introduction to Computer Science')
      await user.type(descriptionInput, 'Basic programming concepts')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(screen.getByText(/course created successfully/i)).toBeInTheDocument()
      })
    })

    test('should validate required fields', async () => {
      const user = userEvent.setup()
      
      const createButton = screen.getByRole('button', { name: /create course/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/course title is required/i)).toBeInTheDocument()
      })
    })

    test('should generate unique course codes', async () => {
      const user = userEvent.setup()
      
      // Mock first course creation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: { code: 'CS101-2024' },
          error: null
        })
      })

      const titleInput = screen.getByLabelText(/course title/i)
      const createButton = screen.getByRole('button', { name: /create course/i })

      await user.type(titleInput, 'Course 1')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/CS101-2024/i)).toBeInTheDocument()
      })

      // Create second course
      await user.type(titleInput, 'Course 2')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/CS102-2024/i)).toBeInTheDocument()
      })
    })

    test('should handle course creation errors', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      const titleInput = screen.getByLabelText(/course title/i)
      const createButton = screen.getByRole('button', { name: /create course/i })

      await user.type(titleInput, 'Test Course')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Course Editing Tests', () => {
    test('should edit course details successfully', async () => {
      const user = userEvent.setup()
      
      // Mock course data
      const courseData = {
        id: 'course-1',
        title: 'Original Title',
        description: 'Original description',
        code: 'CS101-2024'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: courseData,
          error: null
        })
      })

      // Navigate to course edit page
      window.history.pushState({}, '', '/dashboard/courses/course-1/edit')

      const titleInput = screen.getByDisplayValue('Original Title')
      const descriptionInput = screen.getByDisplayValue('Original description')
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(screen.getByText(/course updated successfully/i)).toBeInTheDocument()
      })
    })

    test('should preserve course code during editing', async () => {
      const user = userEvent.setup()
      
      const courseData = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test description',
        code: 'CS101-2024'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: courseData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/edit')

      const codeInput = screen.getByDisplayValue('CS101-2024')
      
      expect(codeInput).toBeDisabled()
      expect(codeInput).toHaveValue('CS101-2024')
    })

    test('should validate edited course data', async () => {
      const user = userEvent.setup()
      
      const titleInput = screen.getByLabelText(/course title/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(titleInput)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/course title is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Course Deletion Tests', () => {
    test('should delete course successfully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete course/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(screen.getByText(/course deleted successfully/i)).toBeInTheDocument()
      })
    })

    test('should handle deletion cancellation', async () => {
      const user = userEvent.setup()
      
      const deleteButton = screen.getByRole('button', { name: /delete course/i })
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument()
      })
    })

    test('should prevent deletion of courses with enrolled students', async () => {
      const user = userEvent.setup()
      
      // Mock enrollment check
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [{ id: 'enrollment-1' }],
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete course/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/cannot delete course with enrolled students/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Course Search and Filter Tests', () => {
    test('should search courses by title', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search courses/i)
      await user.type(searchInput, 'Computer Science')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%Computer Science%')
      })
    })

    test('should filter courses by professor', async () => {
      const user = userEvent.setup()
      
      const filterSelect = screen.getByLabelText(/filter by professor/i)
      await user.selectOptions(filterSelect, 'prof-1')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('professor_id', 'prof-1')
      })
    })

    test('should filter courses by status', async () => {
      const user = userEvent.setup()
      
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.selectOptions(statusFilter, 'active')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'active')
      })
    })

    test('should combine search and filters', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search courses/i)
      const statusFilter = screen.getByLabelText(/filter by status/i)

      await user.type(searchInput, 'Programming')
      await user.selectOptions(statusFilter, 'active')

      await waitFor(() => {
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%Programming%')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'active')
      })
    })

    test('should clear search and filters', async () => {
      const user = userEvent.setup()
      
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search courses/i)
        expect(searchInput).toHaveValue('')
      })
    })
  })

  describe('5. Course Access Control Tests', () => {
    test('should allow professor to access their own courses', async () => {
      // Mock professor user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'prof-1',
              user_metadata: { role: 'professor' }
            }
          }
        },
        error: null
      })

      // Mock professor's courses
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'course-1', title: 'My Course', professor_id: 'prof-1' }
          ],
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses')

      await waitFor(() => {
        expect(screen.getByText('My Course')).toBeInTheDocument()
      })
    })

    test('should prevent professor from accessing other professors courses', async () => {
      // Mock professor user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'prof-1',
              user_metadata: { role: 'professor' }
            }
          }
        },
        error: null
      })

      // Try to access another professor's course
      window.history.pushState({}, '', '/dashboard/courses/course-2')

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })
    })

    test('should allow students to view enrolled courses only', async () => {
      // Mock student user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'student-1',
              user_metadata: { role: 'student' }
            }
          }
        },
        error: null
      })

      // Mock enrolled courses
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { 
              course: { 
                id: 'course-1', 
                title: 'Enrolled Course',
                professor_id: 'prof-1'
              }
            }
          ],
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses')

      await waitFor(() => {
        expect(screen.getByText('Enrolled Course')).toBeInTheDocument()
      })
    })

    test('should prevent students from accessing unenrolled courses', async () => {
      // Mock student user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'student-1',
              user_metadata: { role: 'student' }
            }
          }
        },
        error: null
      })

      // Try to access unenrolled course
      window.history.pushState({}, '', '/dashboard/courses/course-2')

      await waitFor(() => {
        expect(screen.getByText(/you are not enrolled in this course/i)).toBeInTheDocument()
      })
    })
  })

  describe('6. Course Details Tests', () => {
    test('should display course details correctly', async () => {
      const courseData = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test description',
        code: 'CS101-2024',
        professor: {
          name: 'Dr. Smith',
          email: 'smith@university.edu'
        },
        created_at: '2024-01-01T00:00:00Z',
        status: 'active'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: courseData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1')

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Test description')).toBeInTheDocument()
        expect(screen.getByText('CS101-2024')).toBeInTheDocument()
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      })
    })

    test('should display course statistics', async () => {
      const statsData = {
        totalStudents: 25,
        totalMaterials: 15,
        totalAssignments: 8,
        totalAnnouncements: 5
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: statsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1')

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument() // Students
        expect(screen.getByText('15')).toBeInTheDocument() // Materials
        expect(screen.getByText('8')).toBeInTheDocument()  // Assignments
        expect(screen.getByText('5')).toBeInTheDocument()  // Announcements
      })
    })

    test('should handle course not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Course not found' }
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/non-existent')

      await waitFor(() => {
        expect(screen.getByText(/course not found/i)).toBeInTheDocument()
      })
    })
  })
})
