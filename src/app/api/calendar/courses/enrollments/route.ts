import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Check if user is professor or admin
    if (!isProfessor(user) && !isAdmin(user)) {
      return createRoleError(['professor', 'admin'])
    }

    // Mock enrollment requests data for testing
    const mockEnrollmentRequests = [
      {
        id: 'enrollment-1',
        courseCode: 'CS101',
        studentId: 'student-1',
        studentName: 'John Doe',
        studentEmail: 'john@student.edu',
        message: 'Please enroll me in this course',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'enrollment-2',
        courseCode: 'MATH201',
        studentId: 'student-2',
        studentName: 'Jane Smith',
        studentEmail: 'jane@student.edu',
        message: 'I would like to join this course',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockEnrollmentRequests)
  } catch (error) {
    console.error('Enrollments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
