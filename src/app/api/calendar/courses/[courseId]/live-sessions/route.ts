import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId

    // Mock live sessions data for testing
    const mockLiveSessions = [
      {
        id: 'session-1',
        courseId: courseId,
        title: 'Introduction to Course',
        description: 'First live session introducing the course content',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        duration: 60,
        maxParticipants: 30,
        status: 'scheduled',
        created_at: new Date().toISOString()
      },
      {
        id: 'session-2',
        courseId: courseId,
        title: 'Q&A Session',
        description: 'Question and answer session for students',
        startTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        duration: 45,
        maxParticipants: 25,
        status: 'scheduled',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockLiveSessions)
  } catch (error) {
    console.error('Live sessions API error:', error)
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
    const { title, description, startTime, duration, maxParticipants } = body

    // Validate required fields
    if (!title || !description || !startTime) {
      return NextResponse.json(
        { error: 'Title, description, and startTime are required' },
        { status: 400 }
      )
    }

    // Mock live session creation for testing
    const mockLiveSession = {
      id: 'session-' + Date.now(),
      courseId,
      title,
      description,
      startTime,
      duration: duration || 60,
      maxParticipants: maxParticipants || 30,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockLiveSession, { status: 201 })
  } catch (error) {
    console.error('Live session creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
