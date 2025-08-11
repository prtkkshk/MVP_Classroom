import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; announcementId: string } }
) {
  try {
    const { courseId, announcementId } = params

    // Mock announcement data for testing
    const mockAnnouncement = {
      id: announcementId,
      courseId: courseId,
      title: 'Test Announcement',
      content: 'This is a test announcement',
      priority: 'medium',
      type: 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockAnnouncement)
  } catch (error) {
    console.error('Announcement detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
