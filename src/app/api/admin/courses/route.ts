import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return createRoleError(['admin', 'super_admin'])
    }

    // Mock courses data for testing
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Introduction to Computer Science',
        code: 'CS101',
        professor_id: 'professor-1',
        professor_name: 'Dr. Smith',
        subject: 'Computer Science',
        level: 'Beginner',
        max_students: 50,
        current_students: 25,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'course-2',
        title: 'Advanced Mathematics',
        code: 'MATH201',
        professor_id: 'professor-2',
        professor_name: 'Dr. Johnson',
        subject: 'Mathematics',
        level: 'Intermediate',
        max_students: 30,
        current_students: 18,
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'course-3',
        title: 'Physics Fundamentals',
        code: 'PHY101',
        professor_id: 'professor-3',
        professor_name: 'Dr. Brown',
        subject: 'Physics',
        level: 'Beginner',
        max_students: 40,
        current_students: 22,
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockCourses)
  } catch (error) {
    console.error('Admin courses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
