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
})
