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

describe('Settings Tests - Profile Management & Security', () => {
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

    test('should handle profile update errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'prof-1',
            name: 'Professor User',
            email: 'professor@university.edu'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      })

      const nameInput = screen.getByLabelText(/full name/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. Password Changes with Enhanced Security Validation', () => {
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

    test('should validate password strength requirements', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      // Test weak password
      await user.type(newPasswordInput, 'weak')
      await user.type(confirmPasswordInput, 'weak')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })

      // Test password without numbers
      await user.clear(newPasswordInput)
      await user.clear(confirmPasswordInput)
      await user.type(newPasswordInput, 'weakpassword')
      await user.type(confirmPasswordInput, 'weakpassword')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument()
      })

      // Test password without special characters
      await user.clear(newPasswordInput)
      await user.clear(confirmPasswordInput)
      await user.type(newPasswordInput, 'weakpass123')
      await user.type(confirmPasswordInput, 'weakpass123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument()
      })
    })

    test('should validate password confirmation', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      await user.type(newPasswordInput, 'newpass123!')
      await user.type(confirmPasswordInput, 'differentpass123!')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    test('should prevent common weak passwords', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
      const changePasswordButton = screen.getByRole('button', { name: /change password/i })

      const weakPasswords = ['password123!', '123456789!', 'qwerty123!', 'admin123!']
      
      for (const weakPassword of weakPasswords) {
        await user.clear(newPasswordInput)
        await user.clear(confirmPasswordInput)
        await user.type(newPasswordInput, weakPassword)
        await user.type(confirmPasswordInput, weakPassword)
        await user.click(changePasswordButton)

        await waitFor(() => {
          expect(screen.getByText(/password is too common/i)).toBeInTheDocument()
        })
      }
    })

    test('should show password strength indicator', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      
      // Weak password
      await user.type(newPasswordInput, 'weak')
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
      
      // Medium password
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'mediumpass123')
      expect(screen.getByText(/medium/i)).toBeInTheDocument()
      
      // Strong password
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'StrongPass123!@#')
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })
  })

  describe('3. Learning Preferences with Storage & Retrieval Logic', () => {
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

    test('should retrieve and display saved preferences on load', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'preferences-1',
            user_id: 'prof-1',
            preferred_language: 'fr',
            timezone: 'CET',
            theme: 'dark',
            notifications_enabled: true,
            font_size: 'large',
            reading_mode: 'night'
          },
          error: null
        })
      })

      // Re-render component to trigger preference loading
      render(<div>Preferences loaded</div>)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_preferences')
      })
    })

    test('should handle preference loading errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to load preferences' }
        })
      })

      // Re-render component to trigger preference loading
      render(<div>Preferences error</div>)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_preferences')
      })
    })

    test('should validate preference values before saving', async () => {
      const user = userEvent.setup()
      
      const languageSelect = screen.getByLabelText(/preferred language/i)
      const saveButton = screen.getByRole('button', { name: /save preferences/i })

      // Try to save with invalid language
      await user.selectOptions(languageSelect, 'invalid-language')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid language selection/i)).toBeInTheDocument()
      })
    })
  })

  describe('4. Notification Preferences with Real-time Updates', () => {
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

    test('should sync notification preferences across devices', async () => {
      const user = userEvent.setup()
      
      // Mock real-time subscription
      const mockChannel = {
        on: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
      
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      const emailToggle = screen.getByLabelText(/email notifications/i)
      await user.click(emailToggle)

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('notification_preferences')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })
    })

    test('should handle notification preference conflicts', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'notification-preferences-1',
            user_id: 'prof-1',
            email_notifications: true,
            push_notifications: true
          },
          error: null
        }),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Conflicting preferences detected' }
        })
      })

      const emailToggle = screen.getByLabelText(/email notifications/i)
      const saveButton = screen.getByRole('button', { name: /save notification preferences/i })

      await user.click(emailToggle)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/conflicting preferences detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Privacy Settings with Enhanced Security', () => {
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

    test('should enforce privacy settings in real-time', async () => {
      const user = userEvent.setup()
      
      const profileVisibilitySelect = screen.getByLabelText(/profile visibility/i)
      await user.selectOptions(profileVisibilitySelect, 'private')

      // Mock real-time privacy update
      const mockChannel = {
        on: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
      
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('privacy_settings')
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })
    })

    test('should validate privacy setting combinations', async () => {
      const user = userEvent.setup()
      
      const profileVisibilitySelect = screen.getByLabelText(/profile visibility/i)
      const showEmailToggle = screen.getByLabelText(/show email/i)
      const saveButton = screen.getByRole('button', { name: /save privacy settings/i })

      // Try to set private profile but show email
      await user.selectOptions(profileVisibilitySelect, 'private')
      await user.click(showEmailToggle) // This should be disabled for private profiles
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/private profiles cannot show email/i)).toBeInTheDocument()
      })
    })
  })

  describe('6. Account Management with Enhanced Security', () => {
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

    test('should require password confirmation for account deletion', async () => {
      const user = userEvent.setup()
      
      const deleteAccountButton = screen.getByRole('button', { name: /delete account/i })
      await user.click(deleteAccountButton)

      const passwordInput = screen.getByLabelText(/enter your password/i)
      const confirmInput = screen.getByLabelText(/type delete to confirm/i)
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i })

      await user.type(passwordInput, 'wrongpassword')
      await user.type(confirmInput, 'delete')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
      })
    })

    test('should handle account deletion errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.auth = {
        admin: {
          deleteUser: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Cannot delete account with active courses' }
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
        expect(screen.getByText(/cannot delete account with active courses/i)).toBeInTheDocument()
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

    test('should handle concurrent settings updates', async () => {
      const user = userEvent.setup()
      
      // Mock optimistic locking
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Settings were modified by another user' }
        })
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/settings were modified by another user/i)).toBeInTheDocument()
        expect(screen.getByText(/please refresh and try again/i)).toBeInTheDocument()
      })
    })

    test('should validate settings before saving to prevent invalid states', async () => {
      const user = userEvent.setup()
      
      const themeSelect = screen.getByLabelText(/theme/i)
      const languageSelect = screen.getByLabelText(/preferred language/i)
      const saveButton = screen.getByRole('button', { name: /save preferences/i })

      // Try to save with conflicting theme and language
      await user.selectOptions(themeSelect, 'dark')
      await user.selectOptions(languageSelect, 'ar') // Arabic - RTL language
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/dark theme is not supported for rtl languages/i)).toBeInTheDocument()
      })
    })
  })

  describe('8. Security and Access Control Tests', () => {
    test('should prevent unauthorized access to settings', async () => {
      // Mock unauthenticated user
      mockAuthStore.setState({
        user: null,
        isAuthenticated: false
      })

      // Re-render component
      render(<div>Unauthorized access</div>)

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })
    })

    test('should validate user permissions for sensitive operations', async () => {
      const user = userEvent.setup()
      
      // Mock user without admin privileges trying to access admin settings
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          role: 'student'
        },
        isAuthenticated: true
      })

      const adminSettingsButton = screen.getByRole('button', { name: /admin settings/i })
      await user.click(adminSettingsButton)

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
      })
    })

    test('should sanitize user inputs to prevent XSS', async () => {
      const user = userEvent.setup()
      
      const bioInput = screen.getByLabelText(/bio/i)
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      const maliciousInput = '<script>alert("xss")</script>'
      await user.type(bioInput, maliciousInput)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid input detected/i)).toBeInTheDocument()
      })
    })

    test('should rate limit settings updates', async () => {
      const user = userEvent.setup()
      
      const saveButton = screen.getByRole('button', { name: /save changes/i })

      // Try to save multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await user.click(saveButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
        expect(saveButton).toBeDisabled()
      })
    })
  })
})
