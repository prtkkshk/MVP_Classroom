import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Mock course data for testing
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Introduction to Computer Science',
        code: 'CS101',
        professor_id: 'professor-1',
        users: { name: 'Dr. Smith', username: 'drsmith' }
      },
      {
        id: 'course-2',
        title: 'Advanced Mathematics',
        code: 'MATH201',
        professor_id: 'professor-2',
        users: { name: 'Dr. Johnson', username: 'drjohnson' }
      }
    ]

    // If userId is provided, filter courses based on role (for future implementation)
    if (userId) {
      // For now, just return all courses
      // In production, this would filter based on user role and permissions
      return NextResponse.json(mockCourses)
    }

    // Return all courses when no userId is provided (for testing)
    return NextResponse.json(mockCourses)
  } catch (error) {
    console.error('Calendar courses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, subject, level, maxStudents } = body

    // Validate required fields
    if (!title || !description || !subject) {
      return NextResponse.json(
        { error: 'Title, description, and subject are required' },
        { status: 400 }
      )
    }

    // Generate unique course code
    const courseCode = generateCourseCode()

    // Mock course creation for testing
    const mockCourse = {
      id: 'course-' + Date.now(),
      title,
      description,
      subject,
      level: level || 'Beginner',
      max_students: maxStudents || 50,
      professor_id: user.userId,
      code: courseCode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockCourse, { status: 201 })
  } catch (error) {
    console.error('Course creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate unique course code
function generateCourseCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
