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

describe('Notifications Tests', () => {
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

  describe('1. Notification Types', () => {
    test('should trigger enrollment notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'Enrollment Request',
            message: 'New enrollment request for Test Course',
            type: 'enrollment_request',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate enrollment request
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          title: 'Enrollment Request',
          message: 'New enrollment request for Test Course',
          type: 'enrollment_request',
          created_at: expect.any(String)
        })
      })
    })

    test('should trigger assignment notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'New Assignment',
            message: 'New assignment posted in Test Course',
            type: 'new_assignment',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate new assignment
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'New Assignment',
          message: 'New assignment posted in Test Course',
          type: 'new_assignment',
          created_at: expect.any(String)
        })
      })
    })

    test('should trigger doubt notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'prof-1',
            title: 'New Doubt',
            message: 'New doubt submitted in Test Course',
            type: 'new_doubt',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate new doubt
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          title: 'New Doubt',
          message: 'New doubt submitted in Test Course',
          type: 'new_doubt',
          created_at: expect.any(String)
        })
      })
    })

    test('should trigger announcement notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'New Announcement',
            message: 'New announcement in Test Course',
            type: 'new_announcement',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate new announcement
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'New Announcement',
          message: 'New announcement in Test Course',
          type: 'new_announcement',
          created_at: expect.any(String)
        })
      })
    })
  })

  describe('2. Real-time Delivery', () => {
    test('should receive real-time notifications', async () => {
      // Mock real-time subscription
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial notifications
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'Existing Notification',
              message: 'This is an existing notification',
              type: 'enrollment_request',
              is_read: false,
              created_at: new Date().toISOString()
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Existing Notification')).toBeInTheDocument()
      })

      // Simulate new notification received
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({
          new: {
            id: 'notification-2',
            title: 'New Real-time Notification',
            message: 'This is a new real-time notification',
            type: 'new_assignment',
            is_read: false,
            created_at: new Date().toISOString()
          }
        })
      }

      await waitFor(() => {
        expect(screen.getByText('New Real-time Notification')).toBeInTheDocument()
      })
    })

    test('should handle notification delivery errors', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      await waitFor(() => {
        expect(screen.getByText(/notification service unavailable/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Mark as Read Operations', () => {
    test('should mark single notification as read', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'Test Notification',
              message: 'Test message',
              type: 'enrollment_request',
              is_read: false,
              created_at: new Date().toISOString()
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            is_read: true
          },
          error: null
        })
      })

      const markAsReadButton = screen.getByRole('button', { name: /mark as read/i })
      await user.click(markAsReadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_read: true,
          read_at: expect.any(String)
        })
      })
    })

    test('should mark multiple notifications as read', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'Notification 1',
              is_read: false
            },
            {
              id: 'notification-2',
              title: 'Notification 2',
              is_read: false
            },
            {
              id: 'notification-3',
              title: 'Notification 3',
              is_read: false
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'notification-1', is_read: true },
            { id: 'notification-2', is_read: true },
            { id: 'notification-3', is_read: true }
          ],
          error: null
        })
      })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      const markAllAsReadButton = screen.getByRole('button', { name: /mark all as read/i })
      await user.click(markAllAsReadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_read: true,
          read_at: expect.any(String)
        })
      })
    })

    test('should mark notifications as read by type', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'Enrollment Request 1',
              type: 'enrollment_request',
              is_read: false
            },
            {
              id: 'notification-2',
              title: 'Enrollment Request 2',
              type: 'enrollment_request',
              is_read: false
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'notification-1', is_read: true },
            { id: 'notification-2', is_read: true }
          ],
          error: null
        })
      })

      const markByTypeButton = screen.getByRole('button', { name: /mark enrollment requests as read/i })
      await user.click(markByTypeButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_read: true,
          read_at: expect.any(String)
        })
      })
    })
  })

  describe('4. Unread Badge Count', () => {
    test('should display accurate unread count', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'notification-1', is_read: false },
            { id: 'notification-2', is_read: false },
            { id: 'notification-3', is_read: false },
            { id: 'notification-4', is_read: true },
            { id: 'notification-5', is_read: true }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText(/unread notifications/i)).toBeInTheDocument()
      })
    })

    test('should update unread count in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'notification-1', is_read: false },
            { id: 'notification-2', is_read: false }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })

      // Simulate new notification
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (insertCallback) {
        insertCallback({
          new: {
            id: 'notification-3',
            is_read: false
          }
        })
      }

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    test('should hide badge when no unread notifications', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: 'notification-1', is_read: true },
            { id: 'notification-2', is_read: true }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.queryByText(/unread notifications/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('5. Notification Preferences', () => {
    test('should save notification preferences', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'preferences-1',
            user_id: 'prof-1',
            email_notifications: true,
            push_notifications: false,
            enrollment_notifications: true,
            assignment_notifications: false
          },
          error: null
        }),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'preferences-1',
            email_notifications: true,
            push_notifications: true,
            enrollment_notifications: true,
            assignment_notifications: true
          },
          error: null
        })
      })

      const emailToggle = screen.getByLabelText(/email notifications/i)
      const pushToggle = screen.getByLabelText(/push notifications/i)
      const saveButton = screen.getByRole('button', { name: /save preferences/i })

      await user.click(pushToggle)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          email_notifications: true,
          push_notifications: true,
          enrollment_notifications: true,
          assignment_notifications: true
        })
      })
    })

    test('should respect notification preferences', async () => {
      // Mock user with disabled email notifications
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            email_notifications: false,
            push_notifications: true
          },
          error: null
        })
      })

      // Simulate notification trigger
      await waitFor(() => {
        // Should not send email notification
        expect(mockSupabaseClient.from().insert).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'email_notification'
          })
        )
      })
    })
  })

  describe('6. Notification Actions', () => {
    test('should navigate to related content when clicking notification', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'New Assignment',
              message: 'New assignment posted',
              type: 'new_assignment',
              related_id: 'assignment-1',
              is_read: false
            }
          ],
          error: null
        })
      })

      const notificationItem = screen.getByText('New Assignment')
      await user.click(notificationItem)

      await waitFor(() => {
        // Should navigate to assignment
        expect(window.location.pathname).toBe('/dashboard/courses/course-1/assignments/assignment-1')
      })
    })

    test('should delete notification', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notification-1',
              title: 'Test Notification',
              is_read: false
            }
          ],
          error: null
        }),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete notification/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      })
    })
  })

  describe('7. Notification Performance', () => {
    test('should handle large notification lists efficiently', async () => {
      const startTime = performance.now()
      
      // Mock large notification list
      const largeNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: `notification-${i}`,
        title: `Notification ${i}`,
        is_read: i % 2 === 0,
        created_at: new Date(Date.now() - i * 60000).toISOString()
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: largeNotifications.slice(0, 50), // Paginated results
          error: null
        })
      })

      await waitFor(() => {
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        // Should load within 1 second
        expect(loadTime).toBeLessThan(1000)
        expect(screen.getByText(/showing 50 of 1000 notifications/i)).toBeInTheDocument()
      })
    })

    test('should batch notification operations', async () => {
      const user = userEvent.setup()
      
      // Mock multiple notifications
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: 100 }, (_, i) => ({
            id: `notification-${i}`,
            is_read: false
          })),
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: Array.from({ length: 100 }, (_, i) => ({
            id: `notification-${i}`,
            is_read: true
          })),
          error: null
        })
      })

      const selectAllButton = screen.getByLabelText(/select all/i)
      await user.click(selectAllButton)

      const markAllAsReadButton = screen.getByRole('button', { name: /mark all as read/i })
      await user.click(markAllAsReadButton)

      await waitFor(() => {
        // Should use batch operation
        expect(mockSupabaseClient.from().update).toHaveBeenCalledTimes(1)
      })
    })
  })
})
