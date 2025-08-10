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

describe('Live Session Tests', () => {
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

  describe('1. Session Creation and Management', () => {
    test('should create a new live session', async () => {
      const user = userEvent.setup()
      
      // Mock session creation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-1',
            course_id: 'course-1',
            title: 'Live Session 1',
            status: 'active',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Mock real-time subscription
      mockSupabaseClient.channel.mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      })

      // Test session creation form
      const createSessionButton = screen.getByRole('button', { name: /create live session/i })
      await user.click(createSessionButton)

      const titleInput = screen.getByLabelText(/session title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const startButton = screen.getByRole('button', { name: /start session/i })

      await user.type(titleInput, 'Live Session 1')
      await user.type(descriptionInput, 'Test session description')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_sessions')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          course_id: 'course-1',
          title: 'Live Session 1',
          description: 'Test session description',
          status: 'active'
        })
      })
    })

    test('should start an existing session', async () => {
      const user = userEvent.setup()
      
      // Mock session data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-1',
            course_id: 'course-1',
            title: 'Live Session 1',
            status: 'pending'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { id: 'session-1', status: 'active' },
          error: null
        })
      })

      const startButton = screen.getByRole('button', { name: /start session/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'active',
          started_at: expect.any(String)
        })
      })
    })

    test('should pause and resume session', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { id: 'session-1', status: 'paused' },
          error: null
        })
      })

      const pauseButton = screen.getByRole('button', { name: /pause session/i })
      await user.click(pauseButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'paused'
        })
      })

      const resumeButton = screen.getByRole('button', { name: /resume session/i })
      await user.click(resumeButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'active'
        })
      })
    })

    test('should end session and archive data', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { id: 'session-1', status: 'ended' },
          error: null
        })
      })

      const endButton = screen.getByRole('button', { name: /end session/i })
      await user.click(endButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          status: 'ended',
          ended_at: expect.any(String)
        })
      })
    })
  })

  describe('2. Session Joining and Participation', () => {
    test('should allow students to join active session', async () => {
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

      // Mock session data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-1',
            course_id: 'course-1',
            title: 'Live Session 1',
            status: 'active'
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: { id: 'participant-1' },
          error: null
        })
      })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('session_participants')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          session_id: 'session-1',
          user_id: 'student-1',
          joined_at: expect.any(String)
        })
      })
    })

    test('should prevent joining inactive session', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-1',
            status: 'ended'
          },
          error: null
        })
      })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      await user.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/session has ended/i)).toBeInTheDocument()
      })
    })

    test('should show participant count in real-time', async () => {
      // Mock participant data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'p1', user_id: 'student-1' },
            { id: 'p2', user_id: 'student-2' },
            { id: 'p3', user_id: 'student-3' }
          ],
          error: null
        })
      })

      // Mock real-time updates
      mockSupabaseClient.channel.mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 participants/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Doubt Submission and Management', () => {
    test('should submit anonymous doubt', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'doubt-1',
            content: 'Test doubt',
            is_anonymous: true,
            session_id: 'session-1'
          },
          error: null
        })
      })

      const doubtInput = screen.getByPlaceholderText(/ask a doubt/i)
      const anonymousCheckbox = screen.getByLabelText(/submit anonymously/i)
      const submitButton = screen.getByRole('button', { name: /submit doubt/i })

      await user.type(doubtInput, 'Test doubt')
      await user.click(anonymousCheckbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('doubts')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          session_id: 'session-1',
          content: 'Test doubt',
          is_anonymous: true,
          user_id: 'student-1'
        })
      })
    })

    test('should submit named doubt', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'doubt-1',
            content: 'Test doubt',
            is_anonymous: false,
            user_id: 'student-1'
          },
          error: null
        })
      })

      const doubtInput = screen.getByPlaceholderText(/ask a doubt/i)
      const submitButton = screen.getByRole('button', { name: /submit doubt/i })

      await user.type(doubtInput, 'Test doubt')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          session_id: 'session-1',
          content: 'Test doubt',
          is_anonymous: false,
          user_id: 'student-1'
        })
      })
    })

    test('should upvote doubt', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'doubt-1',
              content: 'Test doubt',
              upvotes: 5,
              user_id: 'student-1'
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { id: 'doubt-1', upvotes: 6 },
          error: null
        })
      })

      const upvoteButton = screen.getByRole('button', { name: /upvote/i })
      await user.click(upvoteButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          upvotes: 6
        })
      })
    })

    test('should display doubts in order of upvotes', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'doubt-1', content: 'Most upvoted', upvotes: 10 },
            { id: 'doubt-2', content: 'Second most', upvotes: 5 },
            { id: 'doubt-3', content: 'Least upvoted', upvotes: 1 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        const doubts = screen.getAllByTestId('doubt-item')
        expect(doubts[0]).toHaveTextContent('Most upvoted')
        expect(doubts[1]).toHaveTextContent('Second most')
        expect(doubts[2]).toHaveTextContent('Least upvoted')
      })
    })
  })

  describe('4. Real-time Updates', () => {
    test('should receive real-time doubt updates', async () => {
      // Mock real-time subscription
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Simulate new doubt received
      const newDoubt = {
        id: 'doubt-new',
        content: 'New doubt',
        upvotes: 0,
        user_id: 'student-2'
      }

      // Trigger real-time update
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({ new: newDoubt })
      }

      await waitFor(() => {
        expect(screen.getByText('New doubt')).toBeInTheDocument()
      })
    })

    test('should receive real-time upvote updates', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Simulate upvote update
      const updatedDoubt = {
        id: 'doubt-1',
        content: 'Test doubt',
        upvotes: 6
      }

      const updateCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'UPDATE'
      )?.[2]

      if (updateCallback) {
        updateCallback({ new: updatedDoubt })
      }

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument()
      })
    })

    test('should handle network disconnection gracefully', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Simulate network error
      const errorCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'system'
      )?.[2]

      if (errorCallback) {
        errorCallback({ event: 'disconnect' })
      }

      await waitFor(() => {
        expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Session Controls and Moderation', () => {
    test('should allow professor to pin important doubts', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { id: 'doubt-1', is_pinned: true },
          error: null
        })
      })

      const pinButton = screen.getByRole('button', { name: /pin doubt/i })
      await user.click(pinButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_pinned: true
        })
      })
    })

    test('should allow professor to answer doubts', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { 
            id: 'doubt-1', 
            answer: 'This is the answer',
            answered_at: new Date().toISOString()
          },
          error: null
        })
      })

      const answerInput = screen.getByPlaceholderText(/type your answer/i)
      const answerButton = screen.getByRole('button', { name: /answer doubt/i })

      await user.type(answerInput, 'This is the answer')
      await user.click(answerButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          answer: 'This is the answer',
          answered_at: expect.any(String)
        })
      })
    })

    test('should allow professor to remove inappropriate doubts', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const removeButton = screen.getByRole('button', { name: /remove doubt/i })
      await user.click(removeButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      })
    })
  })

  describe('6. Session Analytics', () => {
    test('should track session duration', async () => {
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + 3600000) // 1 hour later

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { 
            id: 'session-1',
            started_at: startTime.toISOString(),
            ended_at: endTime.toISOString(),
            duration: 3600
          },
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/1 hour/i)).toBeInTheDocument()
      })
    })

    test('should display doubt statistics', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'doubt-1', upvotes: 5 },
            { id: 'doubt-2', upvotes: 3 },
            { id: 'doubt-3', upvotes: 1 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/3 doubts/i)).toBeInTheDocument()
        expect(screen.getByText(/9 total upvotes/i)).toBeInTheDocument()
      })
    })

    test('should show participant engagement metrics', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { user_id: 'student-1', doubts_submitted: 3 },
            { user_id: 'student-2', doubts_submitted: 1 },
            { user_id: 'student-3', doubts_submitted: 0 }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/2 active participants/i)).toBeInTheDocument()
        expect(screen.getByText(/4 total doubts/i)).toBeInTheDocument()
      })
    })
  })
})
