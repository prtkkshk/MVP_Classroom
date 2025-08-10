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

describe('Assignments Tests', () => {
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

  describe('1. Assignment Creation', () => {
    test('should create assignment with points', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            title: 'Test Assignment',
            description: 'Assignment description',
            points: 100,
            due_date: '2024-12-31T23:59:59Z',
            course_id: 'course-1'
          },
          error: null
        })
      })

      const createButton = screen.getByRole('button', { name: /create assignment/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/assignment title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const pointsInput = screen.getByLabelText(/points/i)
      const dueDateInput = screen.getByLabelText(/due date/i)
      const submitButton = screen.getByRole('button', { name: /create assignment/i })

      await user.type(titleInput, 'Test Assignment')
      await user.type(descriptionInput, 'Assignment description')
      await user.type(pointsInput, '100')
      await user.type(dueDateInput, '2024-12-31T23:59:59')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('assignments')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          title: 'Test Assignment',
          description: 'Assignment description',
          points: 100,
          due_date: '2024-12-31T23:59:59Z',
          course_id: 'course-1',
          status: 'active'
        })
      })
    })

    test('should create assignment without points', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            title: 'Test Assignment',
            description: 'Assignment description',
            points: null,
            due_date: '2024-12-31T23:59:59Z',
            course_id: 'course-1'
          },
          error: null
        })
      })

      const createButton = screen.getByRole('button', { name: /create assignment/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/assignment title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const noPointsCheckbox = screen.getByLabelText(/no points/i)
      const submitButton = screen.getByRole('button', { name: /create assignment/i })

      await user.type(titleInput, 'Test Assignment')
      await user.type(descriptionInput, 'Assignment description')
      await user.click(noPointsCheckbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          title: 'Test Assignment',
          description: 'Assignment description',
          points: null,
          due_date: expect.any(String),
          course_id: 'course-1',
          status: 'active'
        })
      })
    })

    test('should validate required fields', async () => {
      const user = userEvent.setup()
      
      const createButton = screen.getByRole('button', { name: /create assignment/i })
      await user.click(createButton)

      const submitButton = screen.getByRole('button', { name: /create assignment/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/description is required/i)).toBeInTheDocument()
      })
    })

    test('should validate due date is in the future', async () => {
      const user = userEvent.setup()
      
      const createButton = screen.getByRole('button', { name: /create assignment/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/assignment title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const dueDateInput = screen.getByLabelText(/due date/i)
      const submitButton = screen.getByRole('button', { name: /create assignment/i })

      await user.type(titleInput, 'Test Assignment')
      await user.type(descriptionInput, 'Assignment description')
      await user.type(dueDateInput, '2020-01-01T00:00:00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Assignment Management', () => {
    test('should edit assignment details', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            title: 'Original Title',
            description: 'Original description',
            points: 50,
            due_date: '2024-12-31T23:59:59Z'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            title: 'Updated Title',
            description: 'Updated description',
            points: 75
          },
          error: null
        })
      })

      const editButton = screen.getByRole('button', { name: /edit assignment/i })
      await user.click(editButton)

      const titleInput = screen.getByLabelText(/assignment title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const pointsInput = screen.getByLabelText(/points/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description')
      await user.clear(pointsInput)
      await user.type(pointsInput, '75')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          title: 'Updated Title',
          description: 'Updated description',
          points: 75
        })
      })
    })

    test('should delete assignment', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete assignment/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      })
    })

    test('should extend assignment due date', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            due_date: '2025-01-15T23:59:59Z'
          },
          error: null
        })
      })

      const extendButton = screen.getByRole('button', { name: /extend due date/i })
      await user.click(extendButton)

      const newDueDateInput = screen.getByLabelText(/new due date/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.type(newDueDateInput, '2025-01-15T23:59:59')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          due_date: '2025-01-15T23:59:59Z'
        })
      })
    })
  })

  describe('3. Assignment Submission', () => {
    test('should allow student to submit assignment', async () => {
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
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'submission-1',
            assignment_id: 'assignment-1',
            student_id: 'student-1',
            content: 'Assignment submission content',
            submitted_at: new Date().toISOString()
          },
          error: null
        })
      })

      const submitButton = screen.getByRole('button', { name: /submit assignment/i })
      await user.click(submitButton)

      const contentInput = screen.getByLabelText(/submission content/i)
      const fileInput = screen.getByLabelText(/upload files/i)
      const submitSubmissionButton = screen.getByRole('button', { name: /submit/i })

      await user.type(contentInput, 'Assignment submission content')
      await user.upload(fileInput, new File(['test content'], 'test.pdf', { type: 'application/pdf' }))
      await user.click(submitSubmissionButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('assignment_submissions')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          assignment_id: 'assignment-1',
          student_id: 'student-1',
          content: 'Assignment submission content',
          submitted_at: expect.any(String)
        })
      })
    })

    test('should prevent late submissions', async () => {
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

      // Mock assignment with past due date
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            due_date: '2020-01-01T00:00:00Z',
            status: 'closed'
          },
          error: null
        })
      })

      const submitButton = screen.getByRole('button', { name: /submit assignment/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/assignment is closed/i)).toBeInTheDocument()
      })
    })

    test('should allow resubmission before due date', async () => {
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
            id: 'submission-1',
            assignment_id: 'assignment-1',
            student_id: 'student-1',
            content: 'Original submission'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'submission-1',
            content: 'Updated submission'
          },
          error: null
        })
      })

      const resubmitButton = screen.getByRole('button', { name: /resubmit/i })
      await user.click(resubmitButton)

      const contentInput = screen.getByLabelText(/submission content/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })

      await user.clear(contentInput)
      await user.type(contentInput, 'Updated submission')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          content: 'Updated submission',
          submitted_at: expect.any(String)
        })
      })
    })
  })

  describe('4. Assignment Grading', () => {
    test('should allow professor to grade assignment', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'submission-1',
              student_id: 'student-1',
              content: 'Assignment submission',
              submitted_at: new Date().toISOString()
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'submission-1',
            grade: 85,
            feedback: 'Good work!'
          },
          error: null
        })
      })

      const gradeButton = screen.getByRole('button', { name: /grade submission/i })
      await user.click(gradeButton)

      const gradeInput = screen.getByLabelText(/grade/i)
      const feedbackInput = screen.getByLabelText(/feedback/i)
      const saveButton = screen.getByRole('button', { name: /save grade/i })

      await user.type(gradeInput, '85')
      await user.type(feedbackInput, 'Good work!')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          grade: 85,
          feedback: 'Good work!',
          graded_at: expect.any(String)
        })
      })
    })

    test('should validate grade is within assignment points', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'assignment-1',
            points: 100
          },
          error: null
        })
      })

      const gradeButton = screen.getByRole('button', { name: /grade submission/i })
      await user.click(gradeButton)

      const gradeInput = screen.getByLabelText(/grade/i)
      const saveButton = screen.getByRole('button', { name: /save grade/i })

      await user.type(gradeInput, '150')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/grade cannot exceed assignment points/i)).toBeInTheDocument()
      })
    })

    test('should bulk grade multiple submissions', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'submission-1', student_id: 'student-1' },
            { id: 'submission-2', student_id: 'student-2' },
            { id: 'submission-3', student_id: 'student-3' }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'submission-1', grade: 85 },
            { id: 'submission-2', grade: 90 },
            { id: 'submission-3', grade: 75 }
          ],
          error: null
        })
      })

      const bulkGradeButton = screen.getByRole('button', { name: /bulk grade/i })
      await user.click(bulkGradeButton)

      const submissions = screen.getAllByTestId('submission-item')
      const gradeInputs = screen.getAllByLabelText(/grade/i)

      await user.type(gradeInputs[0], '85')
      await user.type(gradeInputs[1], '90')
      await user.type(gradeInputs[2], '75')

      const saveAllButton = screen.getByRole('button', { name: /save all grades/i })
      await user.click(saveAllButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalled()
      })
    })
  })

  describe('5. Assignment Status and Visibility', () => {
    test('should show assignment status indicators', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'assignment-1',
              title: 'Active Assignment',
              status: 'active',
              due_date: '2024-12-31T23:59:59Z'
            },
            {
              id: 'assignment-2',
              title: 'Closed Assignment',
              status: 'closed',
              due_date: '2020-01-01T00:00:00Z'
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument()
        expect(screen.getByText(/closed/i)).toBeInTheDocument()
      })
    })

    test('should filter assignments by status', async () => {
      const user = userEvent.setup()
      
      const activeFilter = screen.getByRole('button', { name: /active/i })
      await user.click(activeFilter)

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'active')
      })

      const closedFilter = screen.getByRole('button', { name: /closed/i })
      await user.click(closedFilter)

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'closed')
      })
    })

    test('should show assignment progress for students', async () => {
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
              id: 'assignment-1',
              title: 'Assignment 1',
              status: 'active',
              submitted: true,
              grade: 85
            },
            {
              id: 'assignment-2',
              title: 'Assignment 2',
              status: 'active',
              submitted: false,
              grade: null
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/submitted/i)).toBeInTheDocument()
        expect(screen.getByText(/not submitted/i)).toBeInTheDocument()
        expect(screen.getByText(/85/i)).toBeInTheDocument()
      })
    })
  })

  describe('6. Assignment Analytics', () => {
    test('should display submission statistics', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'submission-1', grade: 85 },
            { id: 'submission-2', grade: 90 },
            { id: 'submission-3', grade: 75 },
            { id: 'submission-4', grade: null } // Not submitted
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 submissions/i)).toBeInTheDocument()
        expect(screen.getByText(/1 pending/i)).toBeInTheDocument()
        expect(screen.getByText(/83.3% average/i)).toBeInTheDocument()
      })
    })

    test('should show grade distribution', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { grade: 95 }, { grade: 92 }, { grade: 88 }, // A grades
            { grade: 85 }, { grade: 82 }, { grade: 78 }, // B grades
            { grade: 75 }, { grade: 72 }, { grade: 68 }, // C grades
            { grade: 65 }, { grade: 62 } // D/F grades
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 A grades/i)).toBeInTheDocument()
        expect(screen.getByText(/3 B grades/i)).toBeInTheDocument()
        expect(screen.getByText(/3 C grades/i)).toBeInTheDocument()
        expect(screen.getByText(/2 D/F grades/i)).toBeInTheDocument()
      })
    })
  })
})
