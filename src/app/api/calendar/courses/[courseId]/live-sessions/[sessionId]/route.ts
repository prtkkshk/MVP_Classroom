import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const { courseId, sessionId } = params

    // Mock live session data for testing
    const mockLiveSession = {
      id: sessionId,
      courseId: courseId,
      title: 'Test Live Session',
      description: 'Test live session description',
      startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      duration: 60,
      maxParticipants: 30,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockLiveSession)
  } catch (error) {
    console.error('Live session detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
