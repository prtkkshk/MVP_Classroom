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

describe('Announcements Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Announcement Creation Tests', () => {
    test('should create announcement successfully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'announcement-1',
            title: 'Important Update',
            content: 'This is an important announcement',
            priority: 'high',
            course_id: 'course-1',
            created_by: 'prof-1',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })

      const titleInput = screen.getByLabelText(/announcement title/i)
      const contentInput = screen.getByLabelText(/content/i)
      const prioritySelect = screen.getByLabelText(/priority/i)
      const createButton = screen.getByRole('button', { name: /create announcement/i })

      await user.type(titleInput, 'Important Update')
      await user.type(contentInput, 'This is an important announcement')
      await user.selectOptions(prioritySelect, 'high')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(screen.getByText(/announcement created successfully/i)).toBeInTheDocument()
      })
    })

    test('should validate required fields', async () => {
      const user = userEvent.setup()
      
      const createButton = screen.getByRole('button', { name: /create announcement/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/content is required/i)).toBeInTheDocument()
      })
    })

    test('should validate title length', async () => {
      const user = userEvent.setup()
      
      const titleInput = screen.getByLabelText(/announcement title/i)
      const contentInput = screen.getByLabelText(/content/i)
      const createButton = screen.getByRole('button', { name: /create announcement/i })

      await user.type(titleInput, 'A'.repeat(101)) // 101 characters
      await user.type(contentInput, 'Valid content')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/title must be 100 characters or less/i)).toBeInTheDocument()
      })
    })

    test('should validate content length', async () => {
      const user = userEvent.setup()
      
      const titleInput = screen.getByLabelText(/announcement title/i)
      const contentInput = screen.getByLabelText(/content/i)
      const createButton = screen.getByRole('button', { name: /create announcement/i })

      await user.type(titleInput, 'Valid title')
      await user.type(contentInput, 'A'.repeat(1001)) // 1001 characters
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/content must be 1000 characters or less/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Priority Levels Tests', () => {
    test('should display high priority announcements with red styling', async () => {
      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'Urgent: Class Cancelled',
          content: 'Class is cancelled today',
          priority: 'high',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        const announcementElement = screen.getByText('Urgent: Class Cancelled')
        expect(announcementElement.closest('div')).toHaveClass('border-red-500')
        expect(screen.getByText('HIGH')).toBeInTheDocument()
      })
    })

    test('should display medium priority announcements with yellow styling', async () => {
      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'Assignment Due Date Extended',
          content: 'Assignment deadline extended by 2 days',
          priority: 'medium',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        const announcementElement = screen.getByText('Assignment Due Date Extended')
        expect(announcementElement.closest('div')).toHaveClass('border-yellow-500')
        expect(screen.getByText('MEDIUM')).toBeInTheDocument()
      })
    })

    test('should display low priority announcements with blue styling', async () => {
      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'Office Hours Update',
          content: 'Office hours changed to Tuesday 2-4 PM',
          priority: 'low',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        const announcementElement = screen.getByText('Office Hours Update')
        expect(announcementElement.closest('div')).toHaveClass('border-blue-500')
        expect(screen.getByText('LOW')).toBeInTheDocument()
      })
    })

    test('should sort announcements by priority and date', async () => {
      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'Low Priority',
          priority: 'low',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'announcement-2',
          title: 'High Priority',
          priority: 'high',
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'announcement-3',
          title: 'Medium Priority',
          priority: 'medium',
          created_at: '2024-01-03T00:00:00Z'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        const announcements = screen.getAllByTestId('announcement-item')
        expect(announcements[0]).toHaveTextContent('High Priority')
        expect(announcements[1]).toHaveTextContent('Medium Priority')
        expect(announcements[2]).toHaveTextContent('Low Priority')
      })
    })
  })

  describe('3. Announcement Editing Tests', () => {
    test('should edit announcement successfully', async () => {
      const user = userEvent.setup()
      
      const announcementData = {
        id: 'announcement-1',
        title: 'Original Title',
        content: 'Original content',
        priority: 'low'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements/announcement-1/edit')

      const titleInput = screen.getByDisplayValue('Original Title')
      const contentInput = screen.getByDisplayValue('Original content')
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      await user.clear(contentInput)
      await user.type(contentInput, 'Updated content')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(screen.getByText(/announcement updated successfully/i)).toBeInTheDocument()
      })
    })

    test('should prevent editing by unauthorized users', async () => {
      // Mock student user trying to edit professor's announcement
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

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements/announcement-1/edit')

      await waitFor(() => {
        expect(screen.getByText(/you are not authorized to edit this announcement/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Announcement Deletion Tests', () => {
    test('should delete announcement successfully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete announcement/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(screen.getByText(/announcement deleted successfully/i)).toBeInTheDocument()
      })
    })

    test('should handle deletion cancellation', async () => {
      const user = userEvent.setup()
      
      const deleteButton = screen.getByRole('button', { name: /delete announcement/i })
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('5. Announcement Visibility Tests', () => {
    test('should show announcements only to enrolled students', async () => {
      // Mock enrolled student
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
            { course_id: 'course-1' }
          ],
          error: null
        })
      })

      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'Course Announcement',
          content: 'This is visible to enrolled students',
          priority: 'medium',
          course_id: 'course-1'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        expect(screen.getByText('Course Announcement')).toBeInTheDocument()
      })
    })

    test('should hide announcements from non-enrolled students', async () => {
      // Mock non-enrolled student
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'student-2',
              user_metadata: { role: 'student' }
            }
          }
        },
        error: null
      })

      // Mock no enrolled courses
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        expect(screen.getByText(/you are not enrolled in this course/i)).toBeInTheDocument()
      })
    })

    test('should show all announcements to course professor', async () => {
      // Mock professor
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

      const announcementsData = [
        {
          id: 'announcement-1',
          title: 'My Announcement',
          content: 'This is my announcement',
          priority: 'high',
          course_id: 'course-1',
          created_by: 'prof-1'
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: announcementsData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/announcements')

      await waitFor(() => {
        expect(screen.getByText('My Announcement')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })
  })

  describe('6. Notification Tests', () => {
    test('should send notification to enrolled students on new announcement', async () => {
      const user = userEvent.setup()
      
      // Mock enrolled students
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { student_id: 'student-1' },
            { student_id: 'student-2' }
          ],
          error: null
        })
      })

      // Mock notification creation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: { id: 'notification-1' },
          error: null
        })
      })

      const titleInput = screen.getByLabelText(/announcement title/i)
      const contentInput = screen.getByLabelText(/content/i)
      const createButton = screen.getByRole('button', { name: /create announcement/i })

      await user.type(titleInput, 'New Announcement')
      await user.type(contentInput, 'This will trigger notifications')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
        // Should create notifications for both enrolled students
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledTimes(2)
      })
    })

    test('should include announcement details in notification', async () => {
      const user = userEvent.setup()
      
      const titleInput = screen.getByLabelText(/announcement title/i)
      const contentInput = screen.getByLabelText(/content/i)
      const createButton = screen.getByRole('button', { name: /create announcement/i })

      await user.type(titleInput, 'Important Update')
      await user.type(contentInput, 'Class cancelled tomorrow')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Announcement: Important Update',
            message: 'Class cancelled tomorrow',
            type: 'announcement',
            course_id: 'course-1'
          })
        )
      })
    })
  })

  describe('7. Announcement Search and Filter Tests', () => {
    test('should search announcements by title', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search announcements/i)
      await user.type(searchInput, 'assignment')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%assignment%')
      })
    })

    test('should filter announcements by priority', async () => {
      const user = userEvent.setup()
      
      const priorityFilter = screen.getByLabelText(/filter by priority/i)
      await user.selectOptions(priorityFilter, 'high')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('priority', 'high')
      })
    })

    test('should filter announcements by date range', async () => {
      const user = userEvent.setup()
      
      const dateFromInput = screen.getByLabelText(/from date/i)
      const dateToInput = screen.getByLabelText(/to date/i)

      await user.type(dateFromInput, '2024-01-01')
      await user.type(dateToInput, '2024-01-31')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('announcements')
        expect(mockSupabaseClient.from().gte).toHaveBeenCalledWith('created_at', '2024-01-01')
        expect(mockSupabaseClient.from().lte).toHaveBeenCalledWith('created_at', '2024-01-31')
      })
    })
  })

  describe('8. Real-time Updates Tests', () => {
    test('should update announcements list in real-time', async () => {
      // Mock real-time subscription
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn()
      }

      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      // Simulate new announcement
      const newAnnouncement = {
        id: 'announcement-2',
        title: 'Real-time Announcement',
        content: 'This appeared in real-time',
        priority: 'medium'
      }

      // Trigger real-time update
      const insertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].event === 'INSERT'
      )[1].callback

      insertCallback(newAnnouncement)

      await waitFor(() => {
        expect(screen.getByText('Real-time Announcement')).toBeInTheDocument()
      })
    })
  })
})
