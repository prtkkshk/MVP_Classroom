import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId

    // Mock announcements data for testing
    const mockAnnouncements = [
      {
        id: 'announcement-1',
        courseId: courseId,
        title: 'Welcome to the Course',
        content: 'Welcome everyone to this exciting course!',
        priority: 'high',
        type: 'general',
        created_at: new Date().toISOString()
      },
      {
        id: 'announcement-2',
        courseId: courseId,
        title: 'First Assignment Due',
        content: 'Remember to submit your first assignment by Friday.',
        priority: 'medium',
        type: 'assignment',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockAnnouncements)
  } catch (error) {
    console.error('Announcements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
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

    const courseId = params.courseId
    const body = await request.json()
    const { title, content, priority, type } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Mock announcement creation for testing
    const mockAnnouncement = {
      id: 'announcement-' + Date.now(),
      courseId,
      title,
      content,
      priority: priority || 'medium',
      type: type || 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockAnnouncement, { status: 201 })
  } catch (error) {
    console.error('Announcement creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
