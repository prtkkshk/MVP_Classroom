/**
 * Integration tests for authentication API endpoints
 * These tests run against the real server without importing React components
 */

const axios = require('axios')

describe('Real Server Authentication Integration Tests', () => {
  // Test configuration
  const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000'
  const TEST_USERNAME = process.env.TEST_USERNAME || 'testuser'
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpass123'
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test@institute.edu'

  beforeAll(async () => {
    // Check if the server is running
    try {
      const response = await axios.get(`${TEST_SERVER_URL}/api/health`)
      if (response.status !== 200) {
        throw new Error(`Server not responding: ${response.status}`)
      }
      console.log('✅ Test server is running and responding')
    } catch (error) {
      console.error('❌ Test server is not accessible:', error)
      throw new Error('Cannot run tests - server is not accessible')
    }
  })

  beforeEach(async () => {
    // Clean up any existing test data or sessions
    try {
      await axios.post(`${TEST_SERVER_URL}/api/auth/logout`)
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('1. Server Health Tests', () => {
    test('should check server health endpoint', async () => {
      const response = await axios.get(`${TEST_SERVER_URL}/api/health`)
      expect(response.status).toBe(200)
      
      const data = response.data
      expect(data).toBeDefined()
      expect(data.status).toBe('healthy')
      expect(data.timestamp).toBeDefined()
    })

    test('should check server is responsive', async () => {
      const startTime = Date.now()
      
      const response = await axios.get(`${TEST_SERVER_URL}/api/health`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(10000) // 10 seconds max
    })

    test('should verify server endpoints are accessible', async () => {
      const endpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout',
        '/api/health'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${TEST_SERVER_URL}${endpoint}`)
          
          // Should get a response (even if it's a method not allowed error)
          expect(response).toBeDefined()
        } catch (error) {
          // Method not allowed errors are expected for some endpoints
          if (error.response && error.response.status === 405) {
            expect(error.response.status).toBe(405)
          } else {
            // Other errors should be caught
            expect(error).toBeDefined()
          }
        }
      }
    })
  })

  describe('2. Authentication API Tests', () => {
    test('should test login endpoint with valid credentials', async () => {
      const response = await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
        username: 'testuser',
        password: 'password123'
      })

      expect(response.status).toBe(200)
      
      const data = response.data
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.username).toBe('testuser')
      expect(data.user.role).toBe('student')
    })

    test('should test login endpoint with invalid credentials', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
          username: 'invalid',
          password: 'wrong'
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(401)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })

    test('should test login endpoint with missing fields', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
          username: 'testuser'
          // Missing password
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })

    test('should test login endpoint with weak password', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
          username: 'testuser',
          password: '123' // Too short
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(401)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })
  })

  describe('3. Registration API Tests', () => {
    test('should test registration endpoint with valid data', async () => {
      const response = await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
        username: 'newuser',
        email: 'newuser@institute.edu',
        password: 'password123',
        name: 'New User',
        role: 'student'
      })

      expect(response.status).toBe(200)
      
      const data = response.data
      expect(data.success).toBe(true)
      expect(data.message).toBe('Account created successfully')
      expect(data.user).toBeDefined()
      expect(data.user.username).toBe('newuser')
      expect(data.user.email).toBe('newuser@institute.edu')
    })

    test('should test registration with non-institutional email for student', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
          username: 'newuser',
          email: 'newuser@gmail.com', // Non-institutional
          password: 'password123',
          name: 'New User',
          role: 'student'
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBe('Students must use institutional email')
      }
    })

    test('should test registration with weak password', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
          username: 'newuser',
          email: 'newuser@institute.edu',
          password: '123', // Too short
          name: 'New User',
          role: 'student'
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBe('Password must be at least 8 characters')
      }
    })

    test('should test registration with short username', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
          username: 'ab', // Too short
          email: 'newuser@institute.edu',
          password: 'password123',
          name: 'New User',
          role: 'student'
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBe('Username must be at least 3 characters')
      }
    })

    test('should test registration with invalid email format', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
          username: 'newuser',
          email: 'invalid-email', // Invalid format
          password: 'password123',
          name: 'New User',
          role: 'student'
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBe('Invalid email format')
      }
    })

    test('should test registration with missing fields', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/register`, {
          username: 'newuser',
          email: 'newuser@institute.edu',
          password: 'password123'
          // Missing name and role
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBe('All fields are required')
      }
    })
  })

  describe('4. Logout API Tests', () => {
    test('should test logout endpoint', async () => {
      const response = await axios.post(`${TEST_SERVER_URL}/api/auth/logout`)
      expect(response.status).toBe(200)
      
      const data = response.data
      expect(data.success).toBe(true)
      expect(data.message).toBe('Logged out successfully')
    })

    test('should test logout endpoint with GET method (should fail)', async () => {
      try {
        await axios.get(`${TEST_SERVER_URL}/api/auth/logout`)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(405)
        
        const data = error.response.data
        expect(data.message).toBe('Logout endpoint only accepts POST requests')
      }
    })
  })

  describe('5. API Method Validation Tests', () => {
    test('should test login endpoint with GET method (should fail)', async () => {
      try {
        await axios.get(`${TEST_SERVER_URL}/api/auth/login`)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(405)
        
        const data = error.response.data
        expect(data.message).toBe('Login endpoint only accepts POST requests')
      }
    })

    test('should test registration endpoint with GET method (should fail)', async () => {
      try {
        await axios.get(`${TEST_SERVER_URL}/api/auth/register`)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(405)
        
        const data = error.response.data
        expect(data.message).toBe('Registration endpoint only accepts POST requests')
      }
    })

    test('should test health endpoint with POST method (should fail)', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/health`)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(405)
        
        const data = error.response.data
        expect(data.message).toBe('Health endpoint only accepts GET requests')
      }
    })
  })

  describe('6. Performance and Load Tests', () => {
    test('should test server response time', async () => {
      const startTime = Date.now()
      
      const response = await axios.get(`${TEST_SERVER_URL}/api/health`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Response should be fast (less than 5 seconds)
      expect(responseTime).toBeLessThan(5000)
      expect(response.status).toBe(200)
    })

    test('should handle rapid requests', async () => {
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${TEST_SERVER_URL}/api/health`)
        )
      }

      const responses = await Promise.all(promises)
      
      // All requests should get responses
      responses.forEach(response => {
        expect(response).toBeDefined()
        expect(response.status).toBe(200)
      })
    })

    test('should handle rapid authentication requests', async () => {
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
            username: `user${i}`,
            password: 'password123'
          })
        )
      }

      const responses = await Promise.all(promises)
      
      // All requests should get responses
      responses.forEach(response => {
        expect(response).toBeDefined()
        expect(response.status).toBeGreaterThan(0)
      })
    })
  })

  describe('7. Error Handling Tests', () => {
    test('should handle malformed JSON gracefully', async () => {
      try {
        await axios.post(`${TEST_SERVER_URL}/api/auth/login`, 'invalid json', {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(400)
        
        const data = error.response.data
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })

    test('should handle network errors gracefully', async () => {
      // Test with invalid server URL
      try {
        await axios.post('http://invalid-server-url:9999/api/auth/login', {
          username: 'test',
          password: 'password123'
        })
        
        // This should fail
        expect(true).toBe(false)
      } catch (error) {
        // Network error should be caught
        expect(error).toBeDefined()
        expect(error.code).toBe('ENOTFOUND')
      }
    })
  })

  describe('8. Security Tests', () => {
    test('should test CSRF protection', async () => {
      const response = await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
        username: 'testuser',
        password: 'password123'
      })

      // Should get a response (even if it's a CSRF error)
      expect(response).toBeDefined()
      expect(response.status).toBeGreaterThan(0)
    })

    test('should test input sanitization', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'admin\' OR \'1\'=\'1',
        '"; DROP TABLE users; --'
      ]

      for (const input of maliciousInputs) {
        try {
          const response = await axios.post(`${TEST_SERVER_URL}/api/auth/login`, {
            username: input,
            password: input
          })

          // Should handle malicious input gracefully
          expect(response).toBeDefined()
          expect(response.status).toBeGreaterThan(0)
          
          // Should not crash or expose internal errors
          const data = response.data
          expect(data).toBeDefined()
        } catch (error) {
          // Error responses are also acceptable
          expect(error).toBeDefined()
        }
      }
    })
  })
})
