import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId

    // Mock course data for testing
    const mockCourse = {
      id: courseId,
      title: 'Test Course for API Testing',
      description: 'This is a test course created during API testing',
      subject: 'Computer Science',
      level: 'Intermediate',
      max_students: 50,
      professor_id: 'professor-1',
      code: 'TEST001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      users: {
        name: 'Test Professor',
        username: 'testprof',
        email: 'professor@infralearn.com'
      }
    }

    return NextResponse.json(mockCourse)
  } catch (error) {
    console.error('Course detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const courseId = params.courseId
    const body = await request.json()

    // Mock course update for testing
    const mockUpdatedCourse = {
      id: courseId,
      ...body,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockUpdatedCourse)
  } catch (error) {
    console.error('Course update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const courseId = params.courseId

    // Mock course deletion for testing
    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Course deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
