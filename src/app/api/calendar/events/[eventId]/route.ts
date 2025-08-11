import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId

    // Mock calendar event data for testing
    const mockEvent = {
      id: eventId,
      title: 'Test Calendar Event',
      description: 'Test calendar event description',
      startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      type: 'meeting',
      isAllDay: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockEvent)
  } catch (error) {
    console.error('Calendar event detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
