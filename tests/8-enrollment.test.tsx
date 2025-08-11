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
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Enrollment Tests - Based on info.md Requirements', () => {
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
        professor_id: 'prof-1',
        max_students: 50,
        enrolled_students: 25,
        is_active: true,
        allow_enrollment: true
      }
    })
  })

  describe('1. Enrollment Process - Student Requests Enrollment via Course Code', () => {
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
            professor_id: 'prof-1',
            max_students: 50,
            enrolled_students: 25,
            is_active: true,
            allow_enrollment: true
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
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
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockReturnThis()
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
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockReturnThis()
      }).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'existing-enrollment',
            status: 'pending'
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockReturnThis()
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

    test('should check course capacity before enrollment', async () => {
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

      // Mock course at full capacity
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101',
            max_students: 25,
            enrolled_students: 25,
            is_active: true,
            allow_enrollment: true
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
        expect(screen.getByText(/course is at full capacity/i)).toBeInTheDocument()
      })
    })

    test('should validate course is active and allows enrollment', async () => {
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

      // Mock inactive course
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101',
            is_active: false,
            allow_enrollment: false
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
        expect(screen.getByText(/course is not accepting enrollments/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Enrollment Process - Professor Approves/Rejects Request', () => {
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
  })

  describe('3. Enrollment Process - Bulk Approve/Reject Multiple Requests', () => {
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

  describe('4. Verification - Student Course List Updates Correctly', () => {
    test('should update student course list after approval', async () => {
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

      // Mock approved enrollment
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
              approved_at: new Date().toISOString()
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.getByText('TEST101')).toBeInTheDocument()
        expect(screen.getByText(/approved/i)).toBeInTheDocument()
      })
    })

    test('should show enrollment status indicators', async () => {
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
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              course_id: 'course-1',
              course_title: 'Test Course',
              status: 'pending'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument()
        expect(screen.getByText(/waiting for approval/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Enrollment Management - Approval/Rejection Flow Validation', () => {
    test('should handle enrollment approval with course capacity check', async () => {
      const user = userEvent.setup()
      
      // Mock course near capacity
      mockCourseStore.setState({
        currentCourse: {
          id: 'course-1',
          title: 'Test Course',
          max_students: 26,
          enrolled_students: 25
        }
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              student_id: 'student-1',
              student_name: 'John Doe'
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { status: 'approved' },
          error: null
        })
      })

      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      await waitFor(() => {
        expect(screen.getByText(/enrollment approved/i)).toBeInTheDocument()
        expect(screen.getByText(/course is now at full capacity/i)).toBeInTheDocument()
      })
    })

    test('should handle enrollment rejection workflow with reason', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              student_id: 'student-1',
              student_name: 'Student User',
              student_email: 'student@university.edu',
              requested_at: new Date().toISOString(),
              status: 'pending'
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { status: 'rejected' },
          error: null
        })
      })

      const rejectButton = screen.getByRole('button', { name: /reject/i })
      await user.click(rejectButton)

      const reasonInput = screen.getByLabelText(/rejection reason/i)
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i })

      await user.type(reasonInput, 'Prerequisites not met')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/enrollment rejected/i)).toBeInTheDocument()
        expect(screen.getByText(/prerequisites not met/i)).toBeInTheDocument()
      })
    })
  })

  describe('6. Access Control - Students Only See Enrolled Courses', () => {
    test('should prevent unauthorized access to enrollment management', async () => {
      // Mock student user trying to access professor features
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
        expect(screen.queryByText(/pending enrollments/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
      })
    })

    test('should allow only course professor to manage enrollments', async () => {
      // Mock different professor
      mockAuthStore.setState({
        user: {
          id: 'prof-2',
          email: 'otherprof@university.edu',
          username: 'otherprof',
          name: 'Other Professor',
          role: 'professor'
        },
        isAuthenticated: true
      })

      await waitFor(() => {
        expect(screen.queryByText(/pending enrollments/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
      })
    })

    test('should prevent students from accessing other students enrollment data', async () => {
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
              status: 'approved'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        // Should only show own enrollment
        expect(screen.getByText('Test Course')).toBeInTheDocument()
        expect(screen.queryByText('Other Student Course')).not.toBeInTheDocument()
      })
    })
  })

  describe('7. Complete Enrollment Workflow Validation', () => {
    test('should validate complete enrollment workflow from request to approval', async () => {
      const user = userEvent.setup()
      
      // Start with student requesting enrollment
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
            professor_id: 'prof-1',
            max_students: 50,
            enrolled_students: 25,
            is_active: true,
            allow_enrollment: true
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

      // Student requests enrollment
      const enrollButton = screen.getByRole('button', { name: /enroll in course/i })
      await user.click(enrollButton)

      const courseCodeInput = screen.getByLabelText(/course code/i)
      const submitButton = screen.getByRole('button', { name: /submit enrollment/i })

      await user.type(courseCodeInput, 'TEST101')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/enrollment request submitted/i)).toBeInTheDocument()
      })

      // Switch to professor view for approval
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

      // Mock pending enrollment display
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'enrollment-1',
              student_id: 'student-1',
              student_name: 'Student User',
              student_email: 'student@university.edu',
              requested_at: new Date().toISOString(),
              status: 'pending'
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { status: 'approved' },
          error: null
        })
      })

      // Professor approves enrollment
      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      await waitFor(() => {
        expect(screen.getByText(/enrollment approved/i)).toBeInTheDocument()
      })
    })
  })

  describe('8. Enrollment Data Integrity and Edge Cases', () => {
    test('should maintain data consistency across enrollment operations', async () => {
      const user = userEvent.setup()
      
      // Mock enrollment with validation
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101',
            max_students: 50,
            enrolled_students: 25
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: { id: 'enrollment-1' },
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
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          course_id: 'course-1',
          student_id: 'student-1',
          status: 'pending',
          requested_at: expect.any(String)
        })
      })
    })

    test('should handle concurrent enrollment operations correctly', async () => {
      const user = userEvent.setup()
      
      // Mock concurrent enrollment scenario
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'course-1',
            title: 'Test Course',
            code: 'TEST101',
            max_students: 26,
            enrolled_students: 25
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: { id: 'enrollment-1' },
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
        expect(screen.getByText(/enrollment request submitted/i)).toBeInTheDocument()
      })
    })

    test('should validate enrollment data before processing', async () => {
      const user = userEvent.setup()
      
      // Mock invalid enrollment data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid course data' }
        })
      })

      const enrollButton = screen.getByRole('button', { name: /enroll in course/i })
      await user.click(enrollButton)

      const courseCodeInput = screen.getByLabelText(/course code/i)
      const submitButton = screen.getByRole('button', { name: /submit enrollment/i })

      await user.type(courseCodeInput, 'INVALID')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid course code/i)).toBeInTheDocument()
      })
    })
  })
})
