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

describe('Enrollment Tests', () => {
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

  describe('1. Student Enrollment Requests', () => {
    test('should allow student to request enrollment via course code', async () => {
      const user = userEvent.setup()
      
      // Mock student user
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101',
            professor_id: 'prof-1'
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'enrollment-1',
            course_id: 'course-1',
            student_id: 'student-1',
            status: 'pending'
          },
          error: null
        })
      })

      const enrollButton = screen.getByRole('button', { name: /enroll in course/i })
      await user.click(enrollButton)

      const courseCodeInput = screen.getByLabelText(/course code/i)
      const submitButton = screen.getByRole('button', { name: /submit enrollment/i })

      await user.type(courseCodeInput, 'TEST101')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('enrollments')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          course_id: 'course-1',
          student_id: 'student-1',
          status: 'pending',
          requested_at: expect.any(String)
        })
      })
    })

    test('should validate course code exists', async () => {
      const user = userEvent.setup()
      
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Course not found' }
        })
      })

      const enrollButton = screen.getByRole('button', { name: /enroll in course/i })
      await user.click(enrollButton)

      const courseCodeInput = screen.getByLabelText(/course code/i)
      const submitButton = screen.getByRole('button', { name: /submit enrollment/i })

      await user.type(courseCodeInput, 'INVALID101')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid course code/i)).toBeInTheDocument()
      })
    })

    test('should prevent duplicate enrollment requests', async () => {
      const user = userEvent.setup()
      
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101'
          },
          error: null
        }),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'existing-enrollment',
            status: 'pending'
          },
          error: null
        })
      })

      const enrollButton = screen.getByRole('button', { name: /enroll in course/i })
      await user.click(enrollButton)

      const courseCodeInput = screen.getByLabelText(/course code/i)
      const submitButton = screen.getByRole('button', { name: /submit enrollment/i })

      await user.type(courseCodeInput, 'TEST101')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/enrollment request already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Professor Enrollment Management', () => {
    test('should display pending enrollment requests', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              student_id: 'student-1',
              student_name: 'John Doe',
              student_email: 'john@university.edu',
              requested_at: '2024-12-01T10:00:00Z',
              status: 'pending'
            },
            {
              id: 'enrollment-2',
              student_id: 'student-2',
              student_name: 'Jane Smith',
              student_email: 'jane@university.edu',
              requested_at: '2024-12-01T11:00:00Z',
              status: 'pending'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('john@university.edu')).toBeInTheDocument()
        expect(screen.getByText('jane@university.edu')).toBeInTheDocument()
      })
    })

    test('should approve individual enrollment request', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'enrollment-1',
            status: 'approved',
            approved_at: new Date().toISOString()
          },
          error: null
        })
      })

      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'approved',
          approved_at: expect.any(String)
        })
      })
    })

    test('should reject individual enrollment request', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'enrollment-1',
            status: 'rejected',
            rejected_at: new Date().toISOString()
          },
          error: null
        })
      })

      const rejectButton = screen.getByRole('button', { name: /reject/i })
      await user.click(rejectButton)

      const reasonInput = screen.getByLabelText(/rejection reason/i)
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i })

      await user.type(reasonInput, 'Course is full')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'rejected',
          rejection_reason: 'Course is full',
          rejected_at: expect.any(String)
        })
      })
    })

    test('should bulk approve multiple enrollment requests', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'enrollment-1', student_id: 'student-1' },
            { id: 'enrollment-2', student_id: 'student-2' },
            { id: 'enrollment-3', student_id: 'student-3' }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'enrollment-1', status: 'approved' },
            { id: 'enrollment-2', status: 'approved' },
            { id: 'enrollment-3', status: 'approved' }
          ],
          error: null
        })
      })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      const bulkApproveButton = screen.getByRole('button', { name: /bulk approve/i })
      await user.click(bulkApproveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'approved',
          approved_at: expect.any(String)
        })
      })
    })

    test('should bulk reject multiple enrollment requests', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'enrollment-1', student_id: 'student-1' },
            { id: 'enrollment-2', student_id: 'student-2' }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'enrollment-1', status: 'rejected' },
            { id: 'enrollment-2', status: 'rejected' }
          ],
          error: null
        })
      })

      const enrollmentCheckboxes = screen.getAllByRole('checkbox')
      await user.click(enrollmentCheckboxes[1]) // Select first enrollment
      await user.click(enrollmentCheckboxes[2]) // Select second enrollment

      const bulkRejectButton = screen.getByRole('button', { name: /bulk reject/i })
      await user.click(bulkRejectButton)

      const reasonInput = screen.getByLabelText(/rejection reason/i)
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i })

      await user.type(reasonInput, 'Course capacity reached')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'rejected',
          rejection_reason: 'Course capacity reached',
          rejected_at: expect.any(String)
        })
      })
    })
  })

  describe('3. Student Course List Updates', () => {
    test('should update student course list after approval', async () => {
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              course_id: 'course-1',
              course_title: 'Test Course',
              course_code: 'TEST101',
              status: 'approved',
              enrolled_at: '2024-12-01T12:00:00Z'
            },
            {
              id: 'enrollment-2',
              course_id: 'course-2',
              course_title: 'Another Course',
              course_code: 'ANOTHER102',
              status: 'approved',
              enrolled_at: '2024-12-01T13:00:00Z'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('Another Course')).toBeInTheDocument()
        expect(screen.getByText('TEST101')).toBeInTheDocument()
        expect(screen.getByText('ANOTHER102')).toBeInTheDocument()
      })
    })

    test('should show enrollment status indicators', async () => {
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              course_title: 'Approved Course',
              status: 'approved'
            },
            {
              id: 'enrollment-2',
              course_title: 'Pending Course',
              status: 'pending'
            },
            {
              id: 'enrollment-3',
              course_title: 'Rejected Course',
              status: 'rejected',
              rejection_reason: 'Course is full'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/approved/i)).toBeInTheDocument()
        expect(screen.getByText(/pending/i)).toBeInTheDocument()
        expect(screen.getByText(/rejected/i)).toBeInTheDocument()
        expect(screen.getByText(/course is full/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Enrollment Notifications', () => {
    test('should send notification on enrollment approval', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'Enrollment Approved',
            message: 'Your enrollment in Test Course has been approved',
            type: 'enrollment_approved'
          },
          error: null
        })
      })

      // Simulate enrollment approval
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'Enrollment Approved',
          message: 'Your enrollment in Test Course has been approved',
          type: 'enrollment_approved',
          created_at: expect.any(String)
        })
      })
    })

    test('should send notification on enrollment rejection', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'Enrollment Rejected',
            message: 'Your enrollment in Test Course has been rejected: Course is full',
            type: 'enrollment_rejected'
          },
          error: null
        })
      })

      // Simulate enrollment rejection
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'Enrollment Rejected',
          message: 'Your enrollment in Test Course has been rejected: Course is full',
          type: 'enrollment_rejected',
          created_at: expect.any(String)
        })
      })
    })
  })

  describe('5. Enrollment Analytics', () => {
    test('should display enrollment statistics', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { status: 'approved' },
            { status: 'approved' },
            { status: 'approved' },
            { status: 'pending' },
            { status: 'pending' },
            { status: 'rejected' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 approved/i)).toBeInTheDocument()
        expect(screen.getByText(/2 pending/i)).toBeInTheDocument()
        expect(screen.getByText(/1 rejected/i)).toBeInTheDocument()
        expect(screen.getByText(/50% approval rate/i)).toBeInTheDocument()
      })
    })

    test('should show enrollment trends over time', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { requested_at: '2024-12-01T10:00:00Z', status: 'approved' },
            { requested_at: '2024-12-02T10:00:00Z', status: 'approved' },
            { requested_at: '2024-12-03T10:00:00Z', status: 'pending' },
            { requested_at: '2024-12-04T10:00:00Z', status: 'rejected' }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/4 total requests/i)).toBeInTheDocument()
        expect(screen.getByText(/2 approved this week/i)).toBeInTheDocument()
        expect(screen.getByText(/1 pending/i)).toBeInTheDocument()
        expect(screen.getByText(/1 rejected/i)).toBeInTheDocument()
      })
    })
  })

  describe('6. Enrollment Access Control', () => {
    test('should prevent unauthorized access to enrollment management', async () => {
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          email: 'student@university.edu',
          username: 'student',
          name: 'Student User',
          role: 'student'
        },
        isAuthenticated: true
      })

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })
    })

    test('should allow only course professor to manage enrollments', async () => {
      mockAuthStore.setState({
        user: {
          id: 'prof-2',
          email: 'other-prof@university.edu',
          username: 'other-prof',
          name: 'Other Professor',
          role: 'professor'
        },
        isAuthenticated: true
      })

      await waitFor(() => {
        expect(screen.getByText(/you can only manage enrollments for your own courses/i)).toBeInTheDocument()
      })
    })
  })
})
