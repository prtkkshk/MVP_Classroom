import { NextRequest, NextResponse } from 'next/server'
import { generateAccessToken, generateRefreshToken, JWTPayload } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // For testing purposes, accept predefined credentials
    // In production, this would validate against a database
    let user: JWTPayload | null = null

    // Check admin credentials (hardcoded for testing)
    if (username === 'admin' && password === 'admin123') {
      user = {
        userId: 'admin-' + Date.now(),
        username: username,
        role: 'super_admin',
        email: 'admin@infralearn.com'
      }
    }
    
    // Check professor credentials (hardcoded for testing)
    if (!user && username === 'professor' && password === 'professor123') {
      user = {
        userId: 'professor-' + Date.now(),
        username: username,
        role: 'professor',
        email: 'professor@infralearn.com'
      }
    }
    
    // Check student credentials (hardcoded for testing)
    if (!user && username === 'student' && password === 'student123') {
      user = {
        userId: 'student-' + Date.now(),
        username: username,
        role: 'student',
        email: 'student@infralearn.com'
      }
    }

    // If no valid credentials found
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken({
      userId: user.userId,
      tokenVersion: 1
    })

    // Return successful response with tokens
    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role,
        email: user.email
      },
      token: accessToken,
      refreshToken: refreshToken,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Login endpoint only accepts POST requests' }, { status: 405 })
}
