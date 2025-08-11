// Comprehensive security system for InLearn MVP

import { RateLimiter } from './validation'

// Security configuration
export interface SecurityConfig {
  csrfEnabled: boolean
  rateLimitEnabled: boolean
  xssProtectionEnabled: boolean
  contentSecurityPolicyEnabled: boolean
  maxRequestSize: number
  allowedOrigins: string[]
  sessionTimeout: number
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  csrfEnabled: true,
  rateLimitEnabled: true,
  xssProtectionEnabled: true,
  contentSecurityPolicyEnabled: true,
  maxRequestSize: 50 * 1024 * 1024, // 50MB
  allowedOrigins: ['http://localhost:3000', 'https://infralearn.com'],
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
}

// CSRF Token Management
export class CSRFProtection {
  private static instance: CSRFProtection
  private tokens: Map<string, { token: string; expires: number }> = new Map()
  private tokenExpiry = 15 * 60 * 1000 // 15 minutes

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection()
    }
    return CSRFProtection.instance
  }

  // Generate new CSRF token
  generateToken(sessionId: string): string {
    const token = this.generateSecureToken()
    const expires = Date.now() + this.tokenExpiry
    
    this.tokens.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    this.cleanupExpiredTokens()
    
    return token
  }

  // Validate CSRF token
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (!stored) {
      return false
    }
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }

  // Invalidate token
  invalidateToken(sessionId: string): void {
    this.tokens.delete(sessionId)
  }

  // Generate secure random token
  private generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

// Rate Limiting System
export class SecurityRateLimiter {
  private static instance: SecurityRateLimiter
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private config: SecurityConfig

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config
  }

  static getInstance(config?: SecurityConfig): SecurityRateLimiter {
    if (!SecurityRateLimiter.instance) {
      SecurityRateLimiter.instance = new SecurityRateLimiter(config)
    }
    return SecurityRateLimiter.instance
  }

  // Check if request is allowed
  isAllowed(identifier: string, endpoint: string): boolean {
    if (!this.config.rateLimitEnabled) {
      return true
    }

    const key = `${identifier}:${endpoint}`
    
    if (!this.rateLimiters.has(key)) {
      // Different limits for different endpoints
      const limits = this.getEndpointLimits(endpoint)
      this.rateLimiters.set(key, new RateLimiter(limits.windowMs, limits.maxRequests))
    }

    return this.rateLimiters.get(key)!.isAllowed(identifier)
  }

  // Get remaining requests
  getRemainingRequests(identifier: string, endpoint: string): number {
    const key = `${identifier}:${endpoint}`
    const limiter = this.rateLimiters.get(key)
    
    if (!limiter) {
      const limits = this.getEndpointLimits(endpoint)
      return limits.maxRequests
    }

    return limiter.getRemainingRequests(identifier)
  }

  // Get rate limits for different endpoints
  private getEndpointLimits(endpoint: string): { windowMs: number; maxRequests: number } {
    const limits: Record<string, { windowMs: number; maxRequests: number }> = {
      'auth': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
      'api': { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
      'upload': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 uploads per hour
      'search': { windowMs: 15 * 60 * 1000, maxRequests: 50 }, // 50 searches per 15 minutes
      'default': { windowMs: 15 * 60 * 1000, maxRequests: 100 }
    }

    for (const [pattern, limit] of Object.entries(limits)) {
      if (endpoint.includes(pattern)) {
        return limit
      }
    }

    return limits.default
  }
}

// Input Sanitization and Validation
export class SecurityValidator {
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    // Remove dangerous HTML tags and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/<[^>]*>/g, (match) => {
        // Allow only safe HTML tags
        const safeTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        const tagName = match.match(/<(\w+)/)?.[1]?.toLowerCase()
        
        if (tagName && safeTags.includes(tagName)) {
          return match
        }
        
        return ''
      })
  }

  // Sanitize SQL input
  static sanitizeSQL(input: string): string {
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL', 'EXPRESSION',
      'OR', 'AND', 'WHERE', 'FROM', 'JOIN', 'HAVING', 'GROUP BY'
    ]
    
    const upperInput = input.toUpperCase()
    for (const keyword of sqlKeywords) {
      if (upperInput.includes(keyword)) {
        throw new Error('Potentially dangerous input detected')
      }
    }
    
    return input
  }

  // Validate file upload
  static validateFileUpload(file: File, config: SecurityConfig = defaultSecurityConfig): boolean {
    // Check file size
    if (file.size > config.maxRequestSize) {
      return false
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

    return allowedTypes.includes(file.type)
  }

  // Validate URL
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  // Validate email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Security Headers
export class SecurityHeaders {
  // Get security headers for API responses
  static getAPISecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }

  // Get Content Security Policy header
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  }
}

// Session Security
export class SessionSecurity {
  // Validate session
  static validateSession(session: any): boolean {
    if (!session) {
      return false
    }

    // Check if session has expired
    if (session.expires && Date.now() > session.expires) {
      return false
    }

    // Check if session is valid
    if (!session.userId || !session.role) {
      return false
    }

    return true
  }

  // Generate secure session ID
  static generateSessionId(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Hash sensitive data
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Security middleware for API routes
export const securityMiddleware = {
  // Validate request
  validateRequest: (req: any, config: SecurityConfig = defaultSecurityConfig) => {
    const errors: string[] = []

    // Check request size
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > config.maxRequestSize) {
      errors.push('Request too large')
    }

    // Check origin
    const origin = req.headers.origin || req.headers.referer
    if (origin && !config.allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      errors.push('Invalid origin')
    }

    // Check CSRF token for non-GET requests
    if (req.method !== 'GET' && config.csrfEnabled) {
      const csrfToken = req.headers['x-csrf-token']
      if (!csrfToken) {
        errors.push('CSRF token required')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Apply security headers
  applySecurityHeaders: (res: any, config: SecurityConfig = defaultSecurityConfig) => {
    const headers = SecurityHeaders.getAPISecurityHeaders()
    
    if (config.contentSecurityPolicyEnabled) {
      headers['Content-Security-Policy'] = SecurityHeaders.getCSPHeader()
    }

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
  }
}

// Export security instances
export const csrfProtection = CSRFProtection.getInstance()
export const securityRateLimiter = SecurityRateLimiter.getInstance()
export const securityValidator = SecurityValidator
export const sessionSecurity = SessionSecurity
