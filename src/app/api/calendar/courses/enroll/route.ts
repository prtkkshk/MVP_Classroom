import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isStudent, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Check if user is student
    if (!isStudent(user)) {
      return createRoleError('student')
    }

    const body = await request.json()
    const { courseCode, message } = body

    // Validate required fields
    if (!courseCode) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      )
    }

    // Mock enrollment request for testing
    const mockEnrollmentRequest = {
      id: 'enrollment-' + Date.now(),
      courseCode,
      studentId: user.userId,
      message: message || 'Please enroll me in this course',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Enrollment request submitted successfully',
      enrollmentRequest: mockEnrollmentRequest
    })
  } catch (error) {
    console.error('Enrollment request API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
