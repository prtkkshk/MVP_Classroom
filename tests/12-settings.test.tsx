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

describe('Settings Tests', () => {
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

  describe('1. Profile Information Updates', () => {
    test('should update user profile information', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'prof-1',
            name: 'Professor User',
            email: 'professor@university.edu',
            username: 'professor',
            bio: 'Current bio',
            avatar_url: 'current-avatar.jpg'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'prof-1',
            name: 'Updated Professor Name',
            bio: 'Updated bio',
            avatar_url: 'new-avatar.jpg'
          },
          error: null
        })
      })

      const nameInput = screen.getByLabelText(/full name/i)
      const bioInput = screen.getByLabelText(/bio/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Professor Name')
      await user.clear(bioInput)
      await user.type(bioInput, 'Updated bio')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          name: 'Updated Professor Name',
          bio: 'Updated bio'
        })
      })
    })

    test('should validate required profile fields', async () => {
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText(/full name/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(nameInput)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    test('should validate email format', async () => {
      const user = userEvent.setup()
      
      const emailInput = screen.getByLabelText(/email/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    test('should upload and update avatar', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'avatars/new-avatar.jpg' },
            error: null
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/avatars/new-avatar.jpg' }
          })
        })
      }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'prof-1',
            avatar_url: 'https://example.com/avatars/new-avatar.jpg'
          },
          error: null
        })
      })

      const avatarInput = screen.getByLabelText(/upload avatar/i)
      const avatarFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

      await user.upload(avatarInput, avatarFile)

      await waitFor(() => {
        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('avatars')
        expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
          expect.any(String),
          avatarFile
        )
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          avatar_url: 'https://example.com/avatars/new-avatar.jpg'
        })
      })
    })
  })

  describe('2. Password Changes', () => {
    test('should change password with validation', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.auth = {
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'prof-1' } },
          error: null
        })
      }

      const currentPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      await user.type(currentPasswordInput, 'currentpass123')
      await user.type(newPasswordInput, 'newpass123')
      await user.type(confirmPasswordInput, 'newpass123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpass123'
        })
      })
    })

    test('should validate current password', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.auth = {
        updateUser: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid current password' }
        })
      }

      const currentPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      await user.type(currentPasswordInput, 'wrongpassword')
      await user.type(newPasswordInput, 'newpass123')
      await user.type(confirmPasswordInput, 'newpass123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid current password/i)).toBeInTheDocument()
      })
    })

    test('should validate password strength', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      await user.type(newPasswordInput, 'weak')
      await user.type(confirmPasswordInput, 'weak')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    test('should validate password confirmation', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      await user.type(newPasswordInput, 'newpass123')
      await user.type(confirmPasswordInput, 'differentpass123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('3. Learning Preferences', () => {
    test('should update learning preferences', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'preferences-1',
            user_id: 'prof-1',
            preferred_language: 'en',
            timezone: 'UTC',
            theme: 'light',
            notifications_enabled: true
          },
          error: null
        }),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'preferences-1',
            preferred_language: 'es',
            timezone: 'EST',
            theme: 'dark',
            notifications_enabled: false
          },
          error: null
        })
      })

      const languageSelect = screen.getByLabelText(/preferred language/i)
      const timezoneSelect = screen.getByLabelText(/timezone/i)
      const themeSelect = screen.getByLabelText(/theme/i)
      const notificationsToggle = screen.getByLabelText(/enable notifications/i)
      const saveButton = screen.getByRole('button', { name: /save preferences/i })

      await user.selectOptions(languageSelect, 'es')
      await user.selectOptions(timezoneSelect, 'EST')
      await user.selectOptions(themeSelect, 'dark')
      await user.click(notificationsToggle)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          preferred_language: 'es',
          timezone: 'EST',
          theme: 'dark',
          notifications_enabled: false
        })
      })
    })

    test('should apply theme changes immediately', async () => {
      const user = userEvent.setup()
      
      const themeSelect = screen.getByLabelText(/theme/i)
      await user.selectOptions(themeSelect, 'dark')

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark')
      })
    })

    test('should save timezone preference', async () => {
      const user = userEvent.setup()
      
      const timezoneSelect = screen.getByLabelText(/timezone/i)
      await user.selectOptions(timezoneSelect, 'PST')

      await waitFor(() => {
        expect(localStorage.getItem('user_timezone')).toBe('PST')
      })
    })
  })

  describe('4. Notification Preferences', () => {
    test('should update notification preferences', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-preferences-1',
            user_id: 'prof-1',
            email_notifications: true,
            push_notifications: true,
            enrollment_notifications: true,
            assignment_notifications: true,
            doubt_notifications: false,
            announcement_notifications: true
          },
          error: null
        }),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-preferences-1',
            email_notifications: false,
            push_notifications: true,
            enrollment_notifications: false,
            assignment_notifications: true,
            doubt_notifications: true,
            announcement_notifications: false
          },
          error: null
        })
      })

      const emailToggle = screen.getByLabelText(/email notifications/i)
      const enrollmentToggle = screen.getByLabelText(/enrollment notifications/i)
      const doubtToggle = screen.getByLabelText(/doubt notifications/i)
      const announcementToggle = screen.getByLabelText(/announcement notifications/i)
      const saveButton = screen.getByRole('button', { name: /save notification preferences/i })

      await user.click(emailToggle)
      await user.click(enrollmentToggle)
      await user.click(doubtToggle)
      await user.click(announcementToggle)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          email_notifications: false,
          push_notifications: true,
          enrollment_notifications: false,
          assignment_notifications: true,
          doubt_notifications: true,
          announcement_notifications: false
        })
      })
    })

    test('should test notification preferences', async () => {
      const user = userEvent.setup()
      
      const testButton = screen.getByRole('button', { name: /test notifications/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(screen.getByText(/test notification sent/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Privacy Settings', () => {
    test('should update privacy settings', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'privacy-settings-1',
            user_id: 'prof-1',
            profile_visibility: 'public',
            show_email: true,
            show_online_status: true,
            allow_messages: true
          },
          error: null
        }),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: {
            id: 'privacy-settings-1',
            profile_visibility: 'private',
            show_email: false,
            show_online_status: false,
            allow_messages: false
          },
          error: null
        })
      })

      const profileVisibilitySelect = screen.getByLabelText(/profile visibility/i)
      const showEmailToggle = screen.getByLabelText(/show email/i)
      const showOnlineStatusToggle = screen.getByLabelText(/show online status/i)
      const allowMessagesToggle = screen.getByLabelText(/allow messages/i)
      const saveButton = screen.getByRole('button', { name: /save privacy settings/i })

      await user.selectOptions(profileVisibilitySelect, 'private')
      await user.click(showEmailToggle)
      await user.click(showOnlineStatusToggle)
      await user.click(allowMessagesToggle)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith({
          user_id: 'prof-1',
          profile_visibility: 'private',
          show_email: false,
          show_online_status: false,
          allow_messages: false
        })
      })
    })
  })

  describe('6. Account Management', () => {
    test('should export user data', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            profile: {
              id: 'prof-1',
              name: 'Professor User',
              email: 'professor@university.edu'
            },
            courses: [
              { id: 'course-1', title: 'Test Course' }
            ],
            activities: [
              { id: 'activity-1', type: 'login', created_at: '2024-01-01T00:00:00Z' }
            ]
          },
          error: null
        })
      })

      const exportButton = screen.getByRole('button', { name: /export data/i })
      await user.click(exportButton)

      // Mock file download
      const mockDownload = jest.fn()
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalled()
      })
    })

    test('should delete account with confirmation', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.auth = {
        admin: {
          deleteUser: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }
      }

      const deleteAccountButton = screen.getByRole('button', { name: /delete account/i })
      await user.click(deleteAccountButton)

      const confirmInput = screen.getByLabelText(/type delete to confirm/i)
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i })

      await user.type(confirmInput, 'delete')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('prof-1')
      })
    })

    test('should require correct confirmation text for account deletion', async () => {
      const user = userEvent.setup()
      
      const deleteAccountButton = screen.getByRole('button', { name: /delete account/i })
      await user.click(deleteAccountButton)

      const confirmInput = screen.getByLabelText(/type delete to confirm/i)
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i })

      await user.type(confirmInput, 'wrong text')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/please type 'delete' to confirm/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Settings Validation and Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Network error'))
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument()
      })
    })

    test('should validate form before submission', async () => {
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.clear(nameInput)
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    test('should show loading states during operations', async () => {
      const user = userEvent.setup()
      
      // Mock slow operation
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 1000))
        )
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(saveButton).toBeDisabled()
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
      })
    })
  })
})
