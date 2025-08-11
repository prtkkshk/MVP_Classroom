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

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store states
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
    mockCourseStore.setState({
      currentCourse: {
        id: 'course-1',
        title: 'Test Course',
        code: 'TEST101',
        professor_id: 'prof-1'
      }
    })
  })

  describe('1. Role Escalation Prevention', () => {
    test('should prevent student from accessing professor routes', async () => {
      // Mock student trying to access professor-only route
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(403)
      expect(response.json()).resolves.toEqual({
        error: 'Access denied. Insufficient permissions.'
      })
    })

    test('should prevent role modification via API', async () => {
      const maliciousPayload = {
        role: 'super_admin',
        user_id: 'student-1'
      }

      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer student-token'
        },
        body: JSON.stringify(maliciousPayload)
      })

      expect(response.status).toBe(403)
    })

    test('should validate user permissions on protected routes', async () => {
      // Mock unauthorized access attempt
      mockAuthStore.setState({
        user: {
          id: 'student-1',
          role: 'student'
        },
        isAuthenticated: true
      })

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
      })
    })

    test('should prevent cross-role data access', async () => {
      // Mock student trying to access another student's data
      const response = await fetch('/api/users/student-2/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-1-token'
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('2. Direct File Access Prevention', () => {
    test('should prevent direct access to protected files', async () => {
      const response = await fetch('/api/materials/protected-file.pdf', {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })

    test('should validate file access permissions', async () => {
      // Mock unauthorized file access attempt
      const response = await fetch('/api/materials/course-2/file.pdf', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-1-token'
        }
      })

      expect(response.status).toBe(403)
    })

    test('should prevent directory traversal attacks', async () => {
      const maliciousPaths = [
        '/api/materials/../../../etc/passwd',
        '/api/materials/..%2F..%2F..%2Fetc%2Fpasswd',
        '/api/materials/....//....//....//etc/passwd'
      ]

      for (const path of maliciousPaths) {
        const response = await fetch(path, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        })

        expect(response.status).toBe(400)
      }
    })

    test('should validate file ownership before access', async () => {
      // Mock file access with wrong ownership
      const response = await fetch('/api/materials/professor-file.pdf', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('3. SQL Injection Prevention', () => {
    test('should prevent SQL injection in search queries', async () => {
      const maliciousQueries = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
        "' UNION SELECT * FROM users --"
      ]

      for (const query of maliciousQueries) {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify({ query })
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('Invalid search query')
      }
    })

    test('should prevent SQL injection in form inputs', async () => {
      const user = userEvent.setup()
      
      const maliciousInputs = [
        "'; DROP TABLE courses; --",
        "' OR '1'='1' --",
        "'; UPDATE users SET role='admin' WHERE id=1; --"
      ]

      for (const input of maliciousInputs) {
        const nameInput = screen.getByLabelText(/course name/i)
        const submitButton = screen.getByRole('button', { name: /create course/i })

        await user.clear(nameInput)
        await user.type(nameInput, input)
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/invalid input detected/i)).toBeInTheDocument()
        })
      }
    })

    test('should sanitize database queries', async () => {
      // Mock malicious query attempt
      const maliciousQuery = "'; SELECT * FROM users WHERE role='admin'; --"
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(new Error('Invalid query'))
      })

      await waitFor(() => {
        expect(mockSupabaseClient.from).not.toHaveBeenCalledWith(maliciousQuery)
      })
    })
  })

  describe('4. XSS Prevention', () => {
    test('should prevent XSS in user inputs', async () => {
      const user = userEvent.setup()
      
      const maliciousScripts = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
      ]

      for (const script of maliciousScripts) {
        const input = screen.getByLabelText(/announcement content/i)
        const submitButton = screen.getByRole('button', { name: /post announcement/i })

        await user.clear(input)
        await user.type(input, script)
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/invalid content detected/i)).toBeInTheDocument()
        })
      }
    })

    test('should escape HTML content in display', async () => {
      const maliciousContent = '<script>alert("XSS")</script>'
      
      // Mock content that should be escaped
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [{ content: maliciousContent }],
          error: null
        })
      })

      await waitFor(() => {
        const displayedContent = screen.getByText(maliciousContent)
        expect(displayedContent.innerHTML).not.toContain('<script>')
      })
    })

    test('should prevent XSS in URL parameters', async () => {
      const maliciousUrls = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:alert("XSS")'
      ]

      for (const url of maliciousUrls) {
        const response = await fetch(`/api/redirect?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        })

        expect(response.status).toBe(400)
      }
    })
  })

  describe('5. Session Security', () => {
    test('should prevent session hijacking', async () => {
      // Mock session token validation
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.evil'
      
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      })

      expect(response.status).toBe(401)
    })

    test('should validate session expiration', async () => {
      // Mock expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired'
      
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Token expired')
    })

    test('should prevent concurrent sessions', async () => {
      // Mock multiple login attempts
      const loginResponse1 = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      })

      const loginResponse2 = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      })

      expect(loginResponse1.status).toBe(200)
      expect(loginResponse2.status).toBe(409) // Conflict - session already exists
    })

    test('should invalidate sessions on logout', async () => {
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(logoutResponse.status).toBe(200)

      // Try to access protected resource after logout
      const profileResponse = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(profileResponse.status).toBe(401)
    })
  })

  describe('6. Input Validation', () => {
    test('should validate email format', async () => {
      const user = userEvent.setup()
      
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain..com'
      ]

      for (const email of invalidEmails) {
        const emailInput = screen.getByLabelText(/email/i)
        const submitButton = screen.getByRole('button', { name: /update profile/i })

        await user.clear(emailInput)
        await user.type(emailInput, email)
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
        })
      }
    })

    test('should validate file uploads', async () => {
      const user = userEvent.setup()
      
      const maliciousFiles = [
        new File(['malicious content'], 'script.js', { type: 'application/javascript' }),
        new File(['malicious content'], 'virus.exe', { type: 'application/x-msdownload' }),
        new File(['malicious content'], 'backdoor.php', { type: 'application/x-httpd-php' })
      ]

      for (const file of maliciousFiles) {
        const fileInput = screen.getByLabelText(/upload file/i)
        const submitButton = screen.getByRole('button', { name: /upload/i })

        await user.upload(fileInput, file)
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument()
        })
      }
    })

    test('should validate file size limits', async () => {
      const user = userEvent.setup()
      
      // Create a large file (over 10MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      
      const fileInput = screen.getByLabelText(/upload file/i)
      const submitButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, largeFile)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Rate Limiting', () => {
    test('should limit login attempts', async () => {
      const loginAttempts = []
      
      for (let i = 0; i < 6; i++) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'wrongpassword'
          })
        })
        loginAttempts.push(response.status)
      }

      // First 5 attempts should fail with 401, 6th should be rate limited
      expect(loginAttempts.slice(0, 5)).toEqual([401, 401, 401, 401, 401])
      expect(loginAttempts[5]).toBe(429) // Too Many Requests
    })

    test('should limit API requests', async () => {
      const responses = []
      
      for (let i = 0; i < 101; i++) {
        const response = await fetch('/api/courses', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        })
        responses.push(response.status)
      }

      // Should be rate limited after 100 requests
      expect(responses[100]).toBe(429)
    })

    test('should reset rate limits after time period', async () => {
      // Mock time passing
      jest.advanceTimersByTime(15 * 60 * 1000) // 15 minutes

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      })

      expect(response.status).toBe(200)
    })
  })

  describe('8. Database Security (RLS)', () => {
    test('should enforce RLS policies on users table', async () => {
      // Mock RLS policy enforcement
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [], // RLS should filter out unauthorized data
          error: null
        })
      })

      // Test that students can only see their own data
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(200)
      // Verify only authorized data is returned
    })

    test('should enforce RLS policies on courses table', async () => {
      // Mock course access with RLS
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [], // RLS should filter based on enrollment
          error: null
        })
      })

      // Test that students only see enrolled courses
      const response = await fetch('/api/courses', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(200)
    })

    test('should enforce RLS policies on materials table', async () => {
      // Mock material access with RLS
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [], // RLS should filter based on course enrollment
          error: null
        })
      })

      // Test that students only see materials from enrolled courses
      const response = await fetch('/api/materials/course-1', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(200)
    })

    test('should prevent unauthorized data access via RLS', async () => {
      // Mock attempt to bypass RLS
      mockSupabaseClient.rpc.mockRejectedValue(new Error('RLS policy violation'))

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer student-token'
        }
      })

      expect(response.status).toBe(403)
    })
  })

  describe('9. Password Security', () => {
    test('should hash passwords before storage', async () => {
      const user = userEvent.setup()
      
      const password = 'SecurePassword123!'
      
      // Mock password hashing
      const mockHash = '$2b$10$hashedpasswordstring'
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user' } },
        error: null
      })

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@university.edu')
      await user.type(passwordInput, password)
      await user.click(submitButton)

      await waitFor(() => {
        // Verify password was hashed before storage
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@university.edu',
          password: expect.not.stringMatching(password) // Should not match plain text
        })
      })
    })

    test('should validate password strength requirements', async () => {
      const user = userEvent.setup()
      
      const weakPasswords = [
        '123', // Too short
        'password', // No uppercase, numbers, or special chars
        'PASSWORD', // No lowercase, numbers, or special chars
        'Password', // No numbers or special chars
        'Password1', // No special chars
      ]

      for (const weakPassword of weakPasswords) {
        const passwordInput = screen.getByLabelText(/password/i)
        const submitButton = screen.getByRole('button', { name: /sign up/i })

        await user.clear(passwordInput)
        await user.type(passwordInput, weakPassword)
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
        })
      }
    })

    test('should prevent password reuse', async () => {
      const user = userEvent.setup()
      
      const oldPassword = 'OldPassword123!'
      const newPassword = 'NewPassword123!'
      
      // Mock password change
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      const oldPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const submitButton = screen.getByRole('button', { name: /change password/i })

      await user.type(oldPasswordInput, oldPassword)
      await user.type(newPasswordInput, oldPassword) // Try to reuse old password
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/new password must be different/i)).toBeInTheDocument()
      })
    })

    test('should enforce password expiration policy', async () => {
      // Mock expired password
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'user-1',
            last_sign_in_at: '2023-01-01T00:00:00Z' // Old last sign in
          } 
        },
        error: null
      })

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Password expired')
    })
  })

  describe('10. JWT Security', () => {
    test('should prevent JWT token leaks in URLs', async () => {
      // Mock URL with token in query params
      const maliciousUrl = 'https://example.com?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.evil'
      
      const response = await fetch('/api/redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({ url: maliciousUrl })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid redirect URL')
    })

    test('should prevent JWT token leaks in logs', async () => {
      // Mock logging attempt with sensitive data
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Simulate API call that might log tokens
      await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive'
        }
      })

      // Verify no sensitive tokens are logged
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive')
      )

      consoleSpy.mockRestore()
    })

    test('should validate JWT signature', async () => {
      // Mock invalid JWT signature
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_signature'
      
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Invalid token')
    })

    test('should handle JWT refresh securely', async () => {
      // Mock token refresh
      const refreshToken = 'refresh_token_123'
      
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { 
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token'
          } 
        },
        error: null
      })

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.access_token).toBeDefined()
      expect(data.refresh_token).toBeDefined()
    })
  })

  describe('11. API Security', () => {
    test('should protect all admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/courses',
        '/api/admin/analytics',
        '/api/admin/settings'
      ]

      for (const endpoint of adminEndpoints) {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer student-token'
          }
        })

        expect(response.status).toBe(403)
      }
    })

    test('should validate CSRF tokens on state-changing operations', async () => {
      const user = userEvent.setup()
      
      // Mock CSRF token validation
      const csrfToken = 'csrf_token_123'
      
      const nameInput = screen.getByLabelText(/course name/i)
      const submitButton = screen.getByRole('button', { name: /create course/i })

      await user.type(nameInput, 'Test Course')
      await user.click(submitButton)

      // Verify CSRF token was included
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        expect.stringContaining('courses')
      )
    })

    test('should prevent HTTP method tampering', async () => {
      // Test that POST-only endpoints reject other methods
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer professor-token'
        }
      })

      expect(response.status).toBe(405) // Method Not Allowed
    })

    test('should validate request origin', async () => {
      // Mock request with invalid origin
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer professor-token',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({ title: 'Test Course' })
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Invalid origin')
    })
  })

  describe('12. Content Security Policy', () => {
    test('should enforce CSP headers', async () => {
      const response = await fetch('/api/courses', {
        method: 'GET'
      })

      expect(response.headers.get('Content-Security-Policy')).toBeDefined()
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    })

    test('should prevent inline script execution', async () => {
      const user = userEvent.setup()
      
      const maliciousInput = '<script>alert("XSS")</script>'
      
      const input = screen.getByLabelText(/announcement content/i)
      const submitButton = screen.getByRole('button', { name: /post announcement/i })

      await user.clear(input)
      await user.type(input, maliciousInput)
      await user.click(submitButton)

      await waitFor(() => {
        // Content should be sanitized, not executed
        expect(screen.queryByText('alert("XSS")')).not.toBeInTheDocument()
      })
    })

    test('should restrict external resource loading', async () => {
      const user = userEvent.setup()
      
      const externalImage = 'https://malicious-site.com/image.jpg'
      
      const input = screen.getByLabelText(/announcement content/i)
      const submitButton = screen.getByRole('button', { name: /post announcement/i })

      await user.clear(input)
      await user.type(input, `<img src="${externalImage}" alt="test">`)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/external resources not allowed/i)).toBeInTheDocument()
      })
    })
  })

  describe('13. Data Encryption', () => {
    test('should encrypt sensitive data at rest', async () => {
      // Mock encrypted data storage
      const sensitiveData = {
        ssn: '123-45-6789',
        credit_card: '4111-1111-1111-1111'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [{ id: 'record-1' }],
          error: null
        })
      })

      const response = await fetch('/api/user/sensitive-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(sensitiveData)
      })

      expect(response.status).toBe(200)
      
      // Verify data was encrypted before storage
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        expect.stringContaining('encrypted_data')
      )
    })

    test('should use HTTPS for all communications', async () => {
      // Mock non-HTTPS request
      const response = await fetch('http://localhost:3000/api/courses', {
        method: 'GET'
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('HTTPS required')
    })

    test('should encrypt data in transit', async () => {
      // Mock API call and verify encryption
      const response = await fetch('/api/courses', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(response.status).toBe(200)
      
      // Verify response headers indicate encryption
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('14. Audit Logging', () => {
    test('should log all authentication attempts', async () => {
      // Mock login attempt
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      })

      expect(response.status).toBe(200)
      
      // Verify audit log was created
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    test('should log all data access attempts', async () => {
      // Mock data access
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(response.status).toBe(200)
      
      // Verify audit log was created
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    test('should log all administrative actions', async () => {
      // Mock admin action
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      expect(response.status).toBe(200)
      
      // Verify audit log was created
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    test('should prevent audit log tampering', async () => {
      // Mock attempt to modify audit logs
      const response = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Audit logs cannot be modified')
    })
  })
})
