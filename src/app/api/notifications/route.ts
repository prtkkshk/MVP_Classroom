import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Mock notifications data for testing
    const mockNotifications = [
      {
        id: 'notification-1',
        userId: user.userId,
        title: 'New Course Available',
        message: 'A new course has been added to your department',
        type: 'course',
        isRead: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'notification-2',
        userId: user.userId,
        title: 'Assignment Due Soon',
        message: 'Your assignment is due in 24 hours',
        type: 'assignment',
        isRead: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'notification-3',
        userId: user.userId,
        title: 'Live Session Starting',
        message: 'Your live session will begin in 10 minutes',
        type: 'live_session',
        isRead: true,
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockNotifications)
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
