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

  describe('1. Notification Types - Trigger each notification type', () => {
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

    test('should trigger live session notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'Live Session Started',
            message: 'Live session has started in Test Course',
            type: 'live_session_started',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate live session start
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'Live Session Started',
          message: 'Live session has started in Test Course',
          type: 'live_session_started',
          created_at: expect.any(String)
        })
      })
    })

    test('should trigger calendar event notification', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            user_id: 'student-1',
            title: 'Upcoming Event',
            message: 'You have an upcoming event in Test Course',
            type: 'calendar_event_reminder',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      // Simulate calendar event reminder
      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          user_id: 'student-1',
          title: 'Upcoming Event',
          message: 'You have an upcoming event in Test Course',
          type: 'calendar_event_reminder',
          created_at: expect.any(String)
        })
      })
    })
  })

  describe('2. Real-time Delivery - Check real-time delivery', () => {
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

    test('should handle network delays and verify sync', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Simulate network delay
      const delayedNotification = {
        id: 'delayed-notification',
        title: 'Delayed Notification',
        message: 'This notification was delayed due to network issues',
        type: 'new_assignment',
        is_read: false,
        created_at: new Date().toISOString()
      }

      // Simulate network delay with setTimeout
      setTimeout(() => {
        const insertCallback = mockChannel.on.mock.calls.find(
          call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
        )?.[2]

        if (insertCallback) {
          insertCallback({ new: delayedNotification })
        }
      }, 2000) // 2 second delay

      await waitFor(() => {
        expect(screen.getByText('Delayed Notification')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    test('should test reconnection after network loss', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null }),
        unsubscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial connection
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Simulate network loss
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Network lost'))

      // Attempt reconnection
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(2)
      })

      // Verify successful reconnection
      mockChannel.subscribe.mockResolvedValueOnce({ error: null })
      
      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('3. Mark as Read Operations - Test mark-as-read (single + bulk)', () => {
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

    test('should mark all notifications as read with confirmation', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: 50 }, (_, i) => ({
            id: `notification-${i}`,
            title: `Notification ${i}`,
            is_read: false
          })),
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: Array.from({ length: 50 }, (_, i) => ({
            id: `notification-${i}`,
            is_read: true
          })),
          error: null
        })
      })

      const markAllAsReadButton = screen.getByRole('button', { name: /mark all as read/i })
      await user.click(markAllAsReadButton)

      // Should show confirmation dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_read: true,
          read_at: expect.any(String)
        })
      })
    })
  })

  describe('4. Unread Badge Count - Verify unread badge count', () => {
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

    test('should show badge with large unread counts', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: 150 }, (_, i) => ({
            id: `notification-${i}`,
            is_read: false
          })),
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText(/unread notifications/i)).toBeInTheDocument()
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

    test('should archive notification instead of deleting', async () => {
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
              is_read: false,
              is_archived: false
            }
          ],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-1',
            is_archived: true
          },
          error: null
        })
      })

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      await user.click(archiveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          is_archived: true,
          archived_at: expect.any(String)
        })
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

    test('should implement virtual scrolling for large lists', async () => {
      // Mock very large notification list
      const veryLargeNotifications = Array.from({ length: 10000 }, (_, i) => ({
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
          data: veryLargeNotifications.slice(0, 100), // Initial chunk
          error: null
        })
      })

      await waitFor(() => {
        // Should only render visible notifications
        const renderedNotifications = screen.getAllByText(/notification \d+/)
        expect(renderedNotifications.length).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('8. Live Updates for Doubts and Participant Counts', () => {
    test('should update doubt notifications in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial doubt notifications
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'doubt-1',
              title: 'Existing Doubt',
              type: 'new_doubt',
              is_read: false
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Existing Doubt')).toBeInTheDocument()
      })

      // Simulate new doubt in real-time
      const doubtCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'INSERT'
      )?.[2]

      if (doubtCallback) {
        doubtCallback({
          new: {
            id: 'doubt-2',
            title: 'New Real-time Doubt',
            type: 'new_doubt',
            is_read: false
          }
        })
      }

      await waitFor(() => {
        expect(screen.getByText('New Real-time Doubt')).toBeInTheDocument()
      })
    })

    test('should update participant counts in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Initial participant count
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue({
          data: 15,
          error: null
        })
      })

      await waitFor(() => {
        expect(screen.getByText('15 participants')).toBeInTheDocument()
      })

      // Simulate participant count change
      const participantCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1]?.event === 'UPDATE'
      )?.[2]

      if (participantCallback) {
        participantCallback({
          new: { participant_count: 18 }
        })
      }

      await waitFor(() => {
        expect(screen.getByText('18 participants')).toBeInTheDocument()
      })
    })
  })

  describe('9. Network Resilience and Error Handling', () => {
    test('should handle connection timeouts gracefully', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockRejectedValue(new Error('Connection timeout'))
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      await waitFor(() => {
        expect(screen.getByText(/connection timeout/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument()
      })
    })

    test('should implement exponential backoff for reconnection', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockResolvedValueOnce({ error: null })
      }
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(2)
      })

      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(3)
      })
    })

    test('should show offline indicator when network is unavailable', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      await waitFor(() => {
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument()
        expect(screen.getByText(/notifications will sync when connection is restored/i)).toBeInTheDocument()
      })

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
    })
  })

  describe('10. Notification Priority and Filtering', () => {
    test('should display high priority notifications prominently', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'urgent-1',
              title: 'Urgent: System Maintenance',
              priority: 'high',
              type: 'system_alert',
              is_read: false
            },
            {
              id: 'normal-1',
              title: 'Regular Update',
              priority: 'normal',
              type: 'course_update',
              is_read: false
            }
          ],
          error: null
        })
      })

      await waitFor(() => {
        const urgentNotification = screen.getByText('Urgent: System Maintenance')
        expect(urgentNotification.closest('div')).toHaveClass('high-priority')
        expect(screen.getByText('Regular Update')).toBeInTheDocument()
      })
    })

    test('should filter notifications by type and priority', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: '1', title: 'Enrollment Request', type: 'enrollment_request', priority: 'normal' },
            { id: '2', title: 'New Assignment', type: 'new_assignment', priority: 'high' },
            { id: '3', title: 'Course Update', type: 'course_update', priority: 'low' }
          ],
          error: null
        })
      })

      // Filter by type
      const typeFilter = screen.getByLabelText(/filter by type/i)
      await user.selectOptions(typeFilter, 'enrollment_request')

      await waitFor(() => {
        expect(screen.getByText('Enrollment Request')).toBeInTheDocument()
        expect(screen.queryByText('New Assignment')).not.toBeInTheDocument()
      })

      // Filter by priority
      const priorityFilter = screen.getByLabelText(/filter by priority/i)
      await user.selectOptions(priorityFilter, 'high')

      await waitFor(() => {
        expect(screen.getByText('New Assignment')).toBeInTheDocument()
        expect(screen.queryByText('Enrollment Request')).not.toBeInTheDocument()
      })
    })

    test('should search within notification content', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: '1', title: 'Assignment Due Tomorrow', message: 'Complete the final project' },
            { id: '2', title: 'Course Schedule Update', message: 'Class moved to different time' },
            { id: '3', title: 'New Material Available', message: 'Lecture slides uploaded' }
          ],
          error: null
        })
      })

      const searchInput = screen.getByPlaceholderText(/search notifications/i)
      await user.type(searchInput, 'assignment')

      await waitFor(() => {
        expect(screen.getByText('Assignment Due Tomorrow')).toBeInTheDocument()
        expect(screen.queryByText('Course Schedule Update')).not.toBeInTheDocument()
      })
    })
  })

  describe('11. Notification Persistence and History', () => {
    test('should maintain notification history across sessions', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { id: '1', title: 'Previous Notification', timestamp: Date.now() - 86400000 }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      })

      await waitFor(() => {
        expect(screen.getByText('Previous Notification')).toBeInTheDocument()
      })
    })

    test('should implement notification retention policies', async () => {
      const oldNotification = {
        id: 'old-1',
        title: 'Old Notification',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        is_read: true
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [oldNotification],
          error: null
        }),
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: null, error: null })
      })

      // Trigger cleanup of old notifications
      const cleanupButton = screen.getByRole('button', { name: /cleanup old notifications/i })
      await userEvent.click(cleanupButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      })
    })
  })

  describe('12. Accessibility and Internationalization', () => {
    test('should support screen readers with proper ARIA labels', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/notification center/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/unread notifications count/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/mark all as read/i)).toBeInTheDocument()
      })
    })

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      // Focus on notification center
      const notificationCenter = screen.getByLabelText(/notification center/i)
      await user.tab()
      expect(notificationCenter).toHaveFocus()

      // Navigate through notifications with arrow keys
      await user.keyboard('{ArrowDown}')
      const firstNotification = screen.getByText(/notification/i)
      expect(firstNotification).toHaveFocus()

      await user.keyboard('{Enter}')
      // Should mark as read or open notification
      expect(mockSupabaseClient.from().update).toHaveBeenCalled()
    })

    test('should support multiple languages', async () => {
      // Mock i18n
      const mockI18n = {
        t: (key: string) => ({
          'notifications.title': 'Notificaciones',
          'notifications.unread': 'No leídas',
          'notifications.markAllRead': 'Marcar todas como leídas'
        }[key] || key)
      }

      // Simulate language change
      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeInTheDocument()
        expect(screen.getByText('No leídas')).toBeInTheDocument()
        expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument()
      })
    })
  })

  describe('13. Performance and Scalability', () => {
    test('should implement lazy loading for notification images', async () => {
      const notificationsWithImages = [
        {
          id: '1',
          title: 'Notification with Image',
          image_url: 'https://example.com/image.jpg',
          is_read: false
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: notificationsWithImages,
          error: null
        })
      })

      await waitFor(() => {
        const image = screen.getByAltText('Notification with Image')
        expect(image).toHaveAttribute('loading', 'lazy')
      })
    })

    test('should implement notification batching for bulk operations', async () => {
      const user = userEvent.setup()
      
      const manyNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: `notification-${i}`,
        title: `Notification ${i}`,
        is_read: false
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: manyNotifications.slice(0, 100), // Show first 100
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: null, error: null })
      })

      // Select all and mark as read
      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      const markAllAsReadButton = screen.getByRole('button', { name: /mark all as read/i })
      await user.click(markAllAsReadButton)

      await waitFor(() => {
        // Should use batch operation instead of individual updates
        expect(mockSupabaseClient.from().update).toHaveBeenCalledTimes(1)
        expect(mockSupabaseClient.from().in).toHaveBeenCalledWith('id', 
          manyNotifications.map(n => n.id)
        )
      })
    })

    test('should implement notification deduplication', async () => {
      const duplicateNotifications = [
        { id: '1', title: 'Duplicate', type: 'new_assignment', created_at: new Date().toISOString() },
        { id: '2', title: 'Duplicate', type: 'new_assignment', created_at: new Date().toISOString() }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: duplicateNotifications,
          error: null
        })
      })

      await waitFor(() => {
        // Should only show one notification
        const duplicateElements = screen.getAllByText('Duplicate')
        expect(duplicateElements).toHaveLength(1)
      })
    })
  })

  describe('14. Integration with Other Systems', () => {
    test('should integrate with email notification system', async () => {
      const user = userEvent.setup()
      
      // Mock email service
      const mockEmailService = {
        sendNotification: jest.fn().mockResolvedValue({ success: true })
      }

      // Enable email notifications
      const emailToggle = screen.getByLabelText(/email notifications/i)
      await user.click(emailToggle)

      // Trigger notification that should send email
      await waitFor(() => {
        expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'professor@university.edu',
            subject: expect.any(String),
            body: expect.any(String)
          })
        )
      })
    })

    test('should integrate with push notification service', async () => {
      // Mock push notification service
      const mockPushService = {
        subscribe: jest.fn().mockResolvedValue({ success: true }),
        sendNotification: jest.fn().mockResolvedValue({ success: true })
      }

      // Enable push notifications
      const pushToggle = screen.getByLabelText(/push notifications/i)
      await userEvent.click(pushToggle)

      await waitFor(() => {
        expect(mockPushService.subscribe).toHaveBeenCalled()
      })
    })

    test('should integrate with calendar system for event reminders', async () => {
      // Mock calendar service
      const mockCalendarService = {
        scheduleReminder: jest.fn().mockResolvedValue({ success: true })
      }

      // Create calendar event notification
      const calendarNotification = {
        id: 'calendar-1',
        title: 'Upcoming Event',
        type: 'calendar_event_reminder',
        event_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        is_read: false
      }

      await waitFor(() => {
        expect(mockCalendarService.scheduleReminder).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'calendar-1',
            reminderTime: expect.any(Date)
          })
        )
      })
    })
  })
})
