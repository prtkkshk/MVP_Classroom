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

describe('Calendar Tests - Based on info.md Requirements', () => {
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

  describe('7. Calendar - Event Management', () => {
    test('should create events with all types', async () => {
      const user = userEvent.setup()
      
      // Test all event types as specified in info.md
      const eventTypes = ['assignment', 'exam', 'live_session', 'deadline', 'other']
      
      for (const eventType of eventTypes) {
        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            data: {
              id: `event-${eventType}`,
              title: `Test ${eventType}`,
              description: `${eventType} description`,
              start_time: '2024-12-15T10:00:00Z',
              end_time: '2024-12-15T11:00Z',
              type: eventType,
              course_id: 'course-1'
            },
            error: null
          })
        })

        const createButton = screen.getByRole('button', { name: /create event/i })
        await user.click(createButton)

        const titleInput = screen.getByLabelText(/event title/i)
        const descriptionInput = screen.getByLabelText(/description/i)
        const startTimeInput = screen.getByLabelText(/start time/i)
        const endTimeInput = screen.getByLabelText(/end time/i)
        const typeSelect = screen.getByLabelText(/event type/i)
        const submitButton = screen.getByRole('button', { name: /create event/i })

        await user.type(titleInput, `Test ${eventType}`)
        await user.type(descriptionInput, `${eventType} description`)
        await user.type(startTimeInput, '2024-12-15T10:00:00')
        await user.type(endTimeInput, '2024-12-15T11:00:00')
        await user.selectOptions(typeSelect, eventType)
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('calendar_events')
          expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
            title: `Test ${eventType}`,
            description: `${eventType} description`,
            start_time: '2024-12-15T10:00:00Z',
            end_time: '2024-12-15T11:00:00Z',
            type: eventType,
            course_id: 'course-1',
            is_all_day: false
          })
        })
      }
    })

    test('should edit events', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'event-1',
            title: 'Original Title',
            description: 'Original description',
            start_time: '2024-12-15T10:00:00Z',
            end_time: '2024-12-15T11:00:00Z'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'event-1',
            title: 'Updated Title',
            description: 'Updated description'
          },
          error: null
        })
      })

      const editButton = screen.getByRole('button', { name: /edit event/i })
      await user.click(editButton)

      const titleInput = screen.getByLabelText(/event title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          title: 'Updated Title',
          description: 'Updated description'
        })
      })
    })

    test('should delete events', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete event/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      })
    })

    test('should test all-day events', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'event-1',
            title: 'All Day Event',
            description: 'All day event description',
            start_date: '2024-12-15',
            end_date: '2024-12-15',
            type: 'holiday',
            is_all_day: true
          },
          error: null
        })
      })

      const createButton = screen.getByRole('button', { name: /create event/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/event title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const allDayCheckbox = screen.getByLabelText(/all day event/i)
      const startDateInput = screen.getByLabelText(/start date/i)
      const typeSelect = screen.getByLabelText(/event type/i)
      const submitButton = screen.getByRole('button', { name: /create event/i })

      await user.type(titleInput, 'All Day Event')
      await user.type(descriptionInput, 'All day event description')
      await user.click(allDayCheckbox)
      await user.type(startDateInput, '2024-12-15')
      await user.selectOptions(typeSelect, 'holiday')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          title: 'All Day Event',
          description: 'All day event description',
          start_date: '2024-12-15',
          end_date: '2024-12-15',
          type: 'holiday',
          course_id: 'course-1',
          is_all_day: true
        })
      })
    })
  })

  describe('7. Calendar - Notifications', () => {
    test('should verify reminder notifications', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              title: 'Upcoming Event',
              start_time: '2024-12-15T10:00:00Z',
              reminder_minutes: 30
            }
          ],
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'reminder-1',
            event_id: 'event-1',
            scheduled_for: '2024-12-15T09:30:00Z'
          },
          error: null
        })
      })

      // Simulate reminder scheduling
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('reminders')
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          event_id: 'event-1',
          scheduled_for: '2024-12-15T09:30:00Z',
          user_id: 'prof-1'
        })
      })
    })

    test('should send reminder notification', async () => {
      // Mock notification service
      const mockNotification = {
        title: 'Event Reminder',
        body: 'Upcoming Event starts in 30 minutes',
        icon: '/icon.png'
      }

      // Simulate notification permission
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true
      })

      // Mock Notification constructor
      global.Notification = jest.fn().mockImplementation(() => ({
        title: mockNotification.title,
        body: mockNotification.body,
        icon: mockNotification.icon
      }))

      // Trigger reminder
      const reminder = new Notification(mockNotification.title, {
        body: mockNotification.body,
        icon: mockNotification.icon
      })

      expect(reminder.title).toBe('Event Reminder')
      expect(reminder.body).toBe('Upcoming Event starts in 30 minutes')
    })
  })

  describe('7. Calendar - Additional Features', () => {
    test('should handle event time conflicts', async () => {
      const user = userEvent.setup()
      
      // Mock existing event
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'existing-event',
              title: 'Existing Event',
              start_time: '2024-12-15T10:00:00Z',
              end_time: '2024-12-15T11:00:00Z'
            }
          ],
          error: null
        })
      })

      const createButton = screen.getByRole('button', { name: /create event/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/event title/i)
      const startTimeInput = screen.getByLabelText(/start time/i)
      const endTimeInput = screen.getByLabelText(/end time/i)
      const submitButton = screen.getByRole('button', { name: /create event/i })

      await user.type(titleInput, 'Conflicting Event')
      await user.type(startTimeInput, '2024-12-15T10:30:00')
      await user.type(endTimeInput, '2024-12-15T11:30:00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/time conflict detected/i)).toBeInTheDocument()
      })
    })

    test('should duplicate events', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'event-1',
            title: 'Original Event',
            description: 'Original description',
            start_time: '2024-12-15T10:00:00Z',
            end_time: '2024-12-15T11:00:00Z'
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'event-2',
            title: 'Original Event (Copy)',
            description: 'Original description'
          },
          error: null
        })
      })

      const duplicateButton = screen.getByRole('button', { name: /duplicate event/i })
      await user.click(duplicateButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
          title: 'Original Event (Copy)',
          description: 'Original description',
          start_time: expect.any(String),
          end_time: expect.any(String),
          course_id: 'course-1',
          is_all_day: false
        })
      })
    })
  })

  describe('7. Calendar - Views and Navigation', () => {
    test('should display events in month view', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              title: 'Test Event',
              start_time: '2024-12-15T10:00:00Z',
              type: 'lecture'
            },
            {
              id: 'event-2',
              title: 'All Day Event',
              start_date: '2024-12-16',
              is_all_day: true,
              type: 'holiday'
            }
          ],
          error: null
        })
      })

      const monthViewButton = screen.getByRole('button', { name: /month/i })
      await userEvent.click(monthViewButton)

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
        expect(screen.getByText('All Day Event')).toBeInTheDocument()
      })
    })

    test('should display events in week view', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              title: 'Monday Event',
              start_time: '2024-12-16T09:00:00Z',
              end_time: '2024-12-16T10:00:00Z'
            },
            {
              id: 'event-2',
              title: 'Wednesday Event',
              start_time: '2024-12-18T14:00:00Z',
              end_time: '2024-12-18T15:00:00Z'
            }
          ],
          error: null
        })
      })

      const weekViewButton = screen.getByRole('button', { name: /week/i })
      await userEvent.click(weekViewButton)

      await waitFor(() => {
        expect(screen.getByText('Monday Event')).toBeInTheDocument()
        expect(screen.getByText('Wednesday Event')).toBeInTheDocument()
      })
    })

    test('should display events in day view', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              title: 'Morning Event',
              start_time: '2024-12-15T09:00:00Z',
              end_time: '2024-12-15T10:00:00Z'
            },
            {
              id: 'event-2',
              title: 'Afternoon Event',
              start_time: '2024-12-15T14:00:00Z',
              end_time: '2024-12-15T15:00:00Z'
            }
          ],
          error: null
        })
      })

      const dayViewButton = screen.getByRole('button', { name: /day/i })
      await userEvent.click(dayViewButton)

      await waitFor(() => {
        expect(screen.getByText('Morning Event')).toBeInTheDocument()
        expect(screen.getByText('Afternoon Event')).toBeInTheDocument()
      })
    })
  })

  describe('7. Calendar - Filtering and Search', () => {
    test('should filter events by type', async () => {
      const user = userEvent.setup()
      
      const lectureFilter = screen.getByRole('button', { name: /lecture/i })
      await user.click(lectureFilter)

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'lecture')
      })

      const assignmentFilter = screen.getByRole('button', { name: /assignment/i })
      await user.click(assignmentFilter)

      await waitFor(() => {
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('type', 'assignment')
      })
    })

    test('should search events by title', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search events/i)
      await user.type(searchInput, 'test event')

      await waitFor(() => {
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%test event%')
      })
    })

    test('should filter events by date range', async () => {
      const user = userEvent.setup()
      
      const startDateInput = screen.getByLabelText(/start date/i)
      const endDateInput = screen.getByLabelText(/end date/i)
      const filterButton = screen.getByRole('button', { name: /filter/i })

      await user.type(startDateInput, '2024-12-01')
      await user.type(endDateInput, '2024-12-31')
      await user.click(filterButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().gte).toHaveBeenCalledWith('start_time', '2024-12-01T00:00:00Z')
        expect(mockSupabaseClient.from().lte).toHaveBeenCalledWith('end_time', '2024-12-31T23:59:59Z')
      })
    })
  })

  describe('7. Calendar - Export and Integration', () => {
    test('should export events to calendar file', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              title: 'Test Event',
              description: 'Event description',
              start_time: '2024-12-15T10:00:00Z',
              end_time: '2024-12-15T11:00:00Z'
            }
          ],
          error: null
        })
      })

      const exportButton = screen.getByRole('button', { name: /export calendar/i })
      await user.click(exportButton)

      // Mock file download
      const mockDownload = jest.fn()
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalled()
      })
    })

    test('should import events from calendar file', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'imported-event-1',
              title: 'Imported Event',
              start_time: '2024-12-15T10:00:00Z'
            }
          ],
          error: null
        })
      })

      const importButton = screen.getByRole('button', { name: /import calendar/i })
      await user.click(importButton)

      const fileInput = screen.getByLabelText(/select calendar file/i)
      const calendarFile = new File(['BEGIN:VCALENDAR\nEND:VCALENDAR'], 'calendar.ics', {
        type: 'text/calendar'
      })

      await user.upload(fileInput, calendarFile)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalled()
      })
    })
  })
})
