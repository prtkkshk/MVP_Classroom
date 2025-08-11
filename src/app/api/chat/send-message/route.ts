import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const body = await request.json()
    const { recipientId, content, type } = body

    // Validate required fields
    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'Recipient ID and content are required' },
        { status: 400 }
      )
    }

    // Mock message creation for testing
    const mockMessage = {
      id: 'message-' + Date.now(),
      senderId: user.userId,
      recipientId,
      content,
      type: type || 'text',
      status: 'sent',
      created_at: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: mockMessage
    })
  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
