import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Mock calendar events data for testing
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Team Meeting',
        description: 'Weekly team sync meeting',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        type: 'meeting',
        isAllDay: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'event-2',
        title: 'Holiday',
        description: 'Public holiday - office closed',
        startTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        endTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        type: 'holiday',
        isAllDay: true,
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockEvents)
  } catch (error) {
    console.error('Calendar events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const body = await request.json()
    const { title, description, startTime, endTime, type, isAllDay } = body

    // Validate required fields
    if (!title || !startTime) {
      return NextResponse.json(
        { error: 'Title and startTime are required' },
        { status: 400 }
      )
    }

    // Mock event creation for testing
    const mockEvent = {
      id: 'event-' + Date.now(),
      title,
      description: description || '',
      startTime,
      endTime: endTime || startTime,
      type: type || 'general',
      isAllDay: isAllDay || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockEvent, { status: 201 })
  } catch (error) {
    console.error('Calendar event creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
