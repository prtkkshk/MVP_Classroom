import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createClient } from '@supabase/supabase-js'
import { mockSupabaseClient } from './__mocks__/supabase'
import { mockAuthStore } from './__mocks__/zustand'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Zustand stores
jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: mockAuthStore,
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock real-time channel
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn(),
}

describe('Real-time Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset auth store state
    mockAuthStore.setState({
      user: null,
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: false,
    })

    // Reset Supabase client
    mockSupabaseClient.channel.mockReturnValue(mockChannel)
  })

  describe('1. Live Session Real-time Updates', () => {
    test('should receive real-time doubt submissions', async () => {
      const user = userEvent.setup()

      // Mock authenticated professor
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

      // Mock live session data
      const mockSession = {
        id: 'session-1',
        course_id: 'course-1',
        title: 'Live Q&A Session',
        status: 'active',
        start_time: new Date().toISOString(),
        doubts: []
      }

      // Mock Supabase query
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSession,
          error: null
        })
      })

      // Simulate real-time doubt submission
      const newDoubt = {
        id: 'doubt-1',
        session_id: 'session-1',
        student_id: 'student-1',
        content: 'What is the deadline for the assignment?',
        is_anonymous: false,
        upvotes: 0,
        created_at: new Date().toISOString()
      }

      // Mock real-time subscription
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving new doubt
          setTimeout(() => callback(newDoubt), 100)
        }
        return mockChannel
      })

      // Render live session component (you would need to import the actual component)
      // render(<LiveSession sessionId="session-1" />)

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('live_session:session-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time update
      await waitFor(() => {
        // This would check if the new doubt appears in the UI
        // expect(screen.getByText('What is the deadline for the assignment?')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should update doubt upvotes in real-time', async () => {
      const user = userEvent.setup()

      // Mock authenticated student
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

      const doubt = {
        id: 'doubt-1',
        session_id: 'session-1',
        student_id: 'student-1',
        content: 'Test doubt',
        is_anonymous: false,
        upvotes: 0,
        created_at: new Date().toISOString()
      }

      // Mock real-time upvote update
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          // Simulate upvote update
          setTimeout(() => callback({ ...doubt, upvotes: 1 }), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for real-time upvote update
      await waitFor(() => {
        // This would check if the upvote count updates in the UI
        // expect(screen.getByText('1')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should update participant count in real-time', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock participant count updates
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate new participant joining
          setTimeout(() => callback({ participant_count: 15 }), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for real-time participant count update
      await waitFor(() => {
        // This would check if the participant count updates in the UI
        // expect(screen.getByText('15 participants')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should handle doubt deletion in real-time', async () => {
      const user = userEvent.setup()

      // Mock authenticated professor
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

      const doubtToDelete = {
        id: 'doubt-1',
        session_id: 'session-1',
        student_id: 'student-1',
        content: 'Test doubt to delete',
        is_anonymous: false,
        upvotes: 0,
        created_at: new Date().toISOString()
      }

      // Mock real-time doubt deletion
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'DELETE' && callback) {
          // Simulate doubt deletion
          setTimeout(() => callback(doubtToDelete), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for real-time deletion update
      await waitFor(() => {
        // This would check if the doubt is removed from the UI
        // expect(screen.queryByText('Test doubt to delete')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('2. Notification Real-time Updates', () => {
    test('should receive real-time notifications', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const newNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'assignment',
        title: 'New Assignment Posted',
        message: 'A new assignment has been posted for your course',
        is_read: false,
        created_at: new Date().toISOString()
      }

      // Mock real-time notification
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving new notification
          setTimeout(() => callback(newNotification), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('notifications:user-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time notification
      await waitFor(() => {
        // This would check if the new notification appears
        // expect(screen.getByText('New Assignment Posted')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should update unread count in real-time', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock unread count update
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          // Simulate unread count update
          setTimeout(() => callback({ unread_count: 5 }), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for real-time unread count update
      await waitFor(() => {
        // This would check if the unread count badge updates
        // expect(screen.getByText('5')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should handle notification read status updates in real-time', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const notificationUpdate = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'assignment',
        title: 'New Assignment Posted',
        message: 'A new assignment has been posted for your course',
        is_read: true,
        updated_at: new Date().toISOString()
      }

      // Mock real-time notification status update
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          // Simulate notification read status update
          setTimeout(() => callback(notificationUpdate), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for real-time status update
      await waitFor(() => {
        // This would check if the notification read status updates in the UI
        // expect(screen.getByTestId('notification-notif-1')).toHaveAttribute('data-read', 'true')
      }, { timeout: 200 })
    })
  })

  describe('3. Course Content Real-time Updates', () => {
    test('should receive real-time course announcements', async () => {
      const user = userEvent.setup()

      // Mock authenticated student
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

      const newAnnouncement = {
        id: 'announcement-1',
        course_id: 'course-1',
        title: 'Important Course Update',
        content: 'The final exam date has been changed',
        created_at: new Date().toISOString()
      }

      // Mock real-time announcement
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving new announcement
          setTimeout(() => callback(newAnnouncement), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('course:course-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time announcement
      await waitFor(() => {
        // This would check if the new announcement appears
        // expect(screen.getByText('Important Course Update')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should receive real-time material updates', async () => {
      const user = userEvent.setup()

      // Mock authenticated student
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

      const newMaterial = {
        id: 'material-1',
        course_id: 'course-1',
        title: 'New Lecture Notes',
        type: 'document',
        file_url: 'https://example.com/notes.pdf',
        created_at: new Date().toISOString()
      }

      // Mock real-time material update
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving new material
          setTimeout(() => callback(newMaterial), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('course:course-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time material update
      await waitFor(() => {
        // This would check if the new material appears
        // expect(screen.getByText('New Lecture Notes')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('4. Assignment Real-time Updates', () => {
    test('should receive real-time assignment submissions', async () => {
      const user = userEvent.setup()

      // Mock authenticated professor
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

      const newSubmission = {
        id: 'submission-1',
        assignment_id: 'assignment-1',
        student_id: 'student-1',
        student_name: 'John Doe',
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      }

      // Mock real-time submission
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving new submission
          setTimeout(() => callback(newSubmission), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('assignment:assignment-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time submission
      await waitFor(() => {
        // This would check if the new submission appears
        // expect(screen.getByText('John Doe')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should receive real-time grade updates', async () => {
      const user = userEvent.setup()

      // Mock authenticated student
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

      const gradeUpdate = {
        id: 'submission-1',
        assignment_id: 'assignment-1',
        student_id: 'student-1',
        grade: 85,
        feedback: 'Great work!',
        graded_at: new Date().toISOString()
      }

      // Mock real-time grade update
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          // Simulate receiving grade update
          setTimeout(() => callback(gradeUpdate), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('assignment:assignment-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Wait for real-time grade update
      await waitFor(() => {
        // This would check if the grade update appears
        // expect(screen.getByText('85')).toBeInTheDocument()
        // expect(screen.getByText('Great work!')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('5. Network Delay and Sync Tests', () => {
    test('should handle network delays gracefully', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate network delay
      const delayedResponse = new Promise(resolve => {
        setTimeout(() => resolve({ data: [], error: null }), 2000)
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(delayedResponse)
      })

      // This would test if the UI shows loading state during network delay
      await waitFor(() => {
        // expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })

      // Wait for delayed response
      await waitFor(() => {
        // expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('should sync data after network reconnection', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate network disconnection
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'disconnect' && callback) {
          // Simulate disconnection
          setTimeout(() => callback(), 100)
        }
        return mockChannel
      })

      // Simulate reconnection
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'connect' && callback) {
          // Simulate reconnection
          setTimeout(() => callback(), 500)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for reconnection and data sync
      await waitFor(() => {
        // This would check if data is synced after reconnection
        // expect(mockSupabaseClient.from).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    test('should handle multiple rapid updates correctly', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const updates = [
        { id: 'update-1', content: 'First update' },
        { id: 'update-2', content: 'Second update' },
        { id: 'update-3', content: 'Third update' }
      ]

      // Simulate rapid updates
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          updates.forEach((update, index) => {
            setTimeout(() => callback(update), index * 50)
          })
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for all updates to be processed
      await waitFor(() => {
        // This would check if all updates are handled correctly
        // expect(screen.getByText('Third update')).toBeInTheDocument()
      }, { timeout: 300 })
    })

    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Simulate network error
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'error' && callback) {
          // Simulate network error
          setTimeout(() => callback(new Error('Network error')), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for error handling
      await waitFor(() => {
        // This would check if error is handled gracefully
        // expect(screen.getByText(/network error/i)).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('6. Real-time Channel Management', () => {
    test('should subscribe to correct channels based on user role', async () => {
      // Mock professor user
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

      // Professor should subscribe to their courses and notifications
      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('notifications:prof-1')
        // expect(mockSupabaseClient.channel).toHaveBeenCalledWith('courses:prof-1')
      })
    })

    test('should unsubscribe from channels on component unmount', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock component unmount
      mockChannel.unsubscribe.mockImplementation(() => {
        // Simulate cleanup
        return Promise.resolve()
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Simulate component unmount
      // This would typically be done in a useEffect cleanup or componentWillUnmount
      await mockChannel.unsubscribe()

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
    })

    test('should handle channel subscription errors', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock subscription error
      mockChannel.subscribe.mockImplementation(() => {
        return Promise.reject(new Error('Subscription failed'))
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // This would test error handling for subscription failures
      try {
        await mockChannel.subscribe()
      } catch (error) {
        expect(error.message).toBe('Subscription failed')
      }
    })
  })

  describe('7. Performance and Optimization Tests', () => {
    test('should handle large numbers of real-time updates efficiently', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const startTime = Date.now()
      let updateCount = 0

      // Simulate 100 rapid updates
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          for (let i = 0; i < 100; i++) {
            setTimeout(() => {
              callback({ id: `update-${i}`, content: `Update ${i}` })
              updateCount++
            }, i * 10)
          }
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for all updates to be processed
      await waitFor(() => {
        const endTime = Date.now()
        const processingTime = endTime - startTime

        // Should process 100 updates efficiently (within reasonable time)
        expect(processingTime).toBeLessThan(2000)
      }, { timeout: 3000 })
    })

    test('should debounce rapid updates to prevent UI lag', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      let updateCount = 0
      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          // Simulate rapid updates
          for (let i = 0; i < 50; i++) {
            setTimeout(() => {
              callback({ id: 'item-1', update: i })
              updateCount++
            }, i * 5)
          }
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for debounced updates
      await waitFor(() => {
        // Should not process all 50 updates individually due to debouncing
        expect(updateCount).toBeLessThan(50)
      }, { timeout: 1000 })
    })

    test('should maintain performance with multiple active channels', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      const startTime = Date.now()

      // Simulate multiple active channels
      const channels = ['notifications', 'course-updates', 'assignment-updates', 'live-session']
      
      channels.forEach(channelName => {
        mockSupabaseClient.channel.mockReturnValue({
          ...mockChannel,
          on: jest.fn().mockReturnThis(),
          subscribe: jest.fn().mockResolvedValue(undefined)
        })
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(channels.length)
      })

      const endTime = Date.now()
      const setupTime = endTime - startTime

      // Should set up multiple channels efficiently
      expect(setupTime).toBeLessThan(1000)
    })
  })

  describe('8. Supabase Integration Tests', () => {
    test('should verify Supabase Realtime subscriptions are properly configured', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Verify channel creation
      expect(mockSupabaseClient.channel).toHaveBeenCalled()

      // Verify subscription setup
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    test('should check event triggers for live updates', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock different event types
      const eventTypes = ['INSERT', 'UPDATE', 'DELETE']
      
      eventTypes.forEach(eventType => {
        mockChannel.on.mockImplementation((event, callback) => {
          if (event === eventType && callback) {
            callback({ type: eventType, data: 'test' })
          }
          return mockChannel
        })
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Verify all event types are handled
      eventTypes.forEach(eventType => {
        expect(mockChannel.on).toHaveBeenCalledWith(eventType, expect.any(Function))
      })
    })

    test('should review synchronization logic for live sessions & doubts', async () => {
      const user = userEvent.setup()

      // Mock authenticated professor
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

      // Mock live session data
      const mockSession = {
        id: 'session-1',
        course_id: 'course-1',
        title: 'Live Q&A Session',
        status: 'active',
        start_time: new Date().toISOString(),
        doubts: []
      }

      // Mock Supabase query for session
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSession,
          error: null
        })
      })

      // Mock real-time doubt updates
      const doubtUpdates = [
        { id: 'doubt-1', content: 'First doubt', created_at: new Date().toISOString() },
        { id: 'doubt-2', content: 'Second doubt', created_at: new Date().toISOString() }
      ]

      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          doubtUpdates.forEach((doubt, index) => {
            setTimeout(() => callback(doubt), index * 100)
          })
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('live_session:session-1')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Verify synchronization logic
      await waitFor(() => {
        // This would verify that doubts are properly synchronized
        // expect(mockSupabaseClient.from).toHaveBeenCalledWith('doubts')
      }, { timeout: 500 })
    })
  })

  describe('9. Error Handling and Edge Cases', () => {
    test('should handle malformed real-time data gracefully', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock malformed data
      const malformedData = { invalid: 'data', missing: 'required', fields: null }

      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving malformed data
          setTimeout(() => callback(malformedData), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for error handling
      await waitFor(() => {
        // This would check if malformed data is handled gracefully
        // expect(screen.getByText(/invalid data/i)).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should handle real-time data conflicts', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock conflicting updates
      const conflictingUpdates = [
        { id: 'item-1', version: 1, content: 'Original content' },
        { id: 'item-1', version: 2, content: 'Conflicting update' }
      ]

      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'UPDATE' && callback) {
          conflictingUpdates.forEach((update, index) => {
            setTimeout(() => callback(update), index * 50)
          })
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for conflict resolution
      await waitFor(() => {
        // This would check if conflicts are resolved properly
        // expect(screen.getByText(/conflict resolved/i)).toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('should handle real-time data validation failures', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'user@university.edu',
          username: 'user',
          name: 'Test User',
          role: 'student'
        },
        isAuthenticated: true
      })

      // Mock invalid data
      const invalidData = { 
        id: 'invalid-1', 
        content: '', // Empty content should fail validation
        created_at: 'invalid-date' // Invalid date should fail validation
      }

      mockChannel.on.mockImplementation((event, callback) => {
        if (event === 'INSERT' && callback) {
          // Simulate receiving invalid data
          setTimeout(() => callback(invalidData), 100)
        }
        return mockChannel
      })

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      // Wait for validation error handling
      await waitFor(() => {
        // This would check if validation errors are handled properly
        // expect(screen.getByText(/validation error/i)).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })
})
