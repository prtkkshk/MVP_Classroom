// Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Validate email format
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true }
}

// Validate institutional email for students
export function validateInstitutionalEmail(email: string): ValidationResult {
  const emailResult = validateEmail(email)
  if (!emailResult.isValid) {
    return emailResult
  }
  
  if (!email.includes('@kgpian.iitkgp.ac.in')) {
    return { isValid: false, error: 'Students must use institutional email addresses' }
  }
  
  return { isValid: true }
}

// Validate password strength
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }
  
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*)' }
  }
  
  return { isValid: true }
}

// Validate username
export function validateUsername(username: string): ValidationResult {
  if (!username || username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  return { isValid: true }
}

// Validate course title
export function validateCourseTitle(title: string): ValidationResult {
  const sanitized = sanitizeInput(title)
  
  if (!sanitized || sanitized.length < 3) {
    return { isValid: false, error: 'Course title must be at least 3 characters long' }
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Course title must be less than 100 characters' }
  }
  
  return { isValid: true }
}

// Validate course description
export function validateCourseDescription(description: string): ValidationResult {
  const sanitized = sanitizeInput(description)
  
  if (!sanitized || sanitized.length < 10) {
    return { isValid: false, error: 'Course description must be at least 10 characters long' }
  }
  
  if (sanitized.length > 1000) {
    return { isValid: false, error: 'Course description must be less than 1000 characters' }
  }
  
  return { isValid: true }
}

// Validate file upload
export function validateFileUpload(file: File, maxSize: number = 50 * 1024 * 1024): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` }
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' }
  }
  
  return { isValid: true }
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now])
      return true
    }
    
    const requests = this.requests.get(identifier)!
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= this.maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests
    }
    
    const requests = this.requests.get(identifier)!
    const recentRequests = requests.filter(time => time > windowStart)
    
    return Math.max(0, this.maxRequests - recentRequests.length)
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken
}

// Input sanitization for different content types
export function sanitizeHTML(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

export function sanitizeSQL(input: string): string {
  // Basic SQL injection prevention - in production, use parameterized queries
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL', 'EXPRESSION'
  ]
  
  const upperInput = input.toUpperCase()
  for (const keyword of sqlKeywords) {
    if (upperInput.includes(keyword)) {
      throw new Error('Invalid input detected')
    }
  }
  
  return input
} 