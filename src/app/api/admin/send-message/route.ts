import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Sending message...')
    
    const body = await request.json()
    console.log('Admin API: Request body:', body)
    
    const { userId, subject, message } = body
    
    if (!userId || !subject || !message) {
      console.log('Admin API: Missing required fields')
      return NextResponse.json(
        { error: 'userId, subject, and message are required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Admin API: User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Admin API: Sending message to user:', user.name)

    // Create the notification/message
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: subject,
        message: message,
        type: 'system', // Using 'system' type temporarily until database is updated
        is_read: false,
        related_id: null,
        related_type: null
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Admin API: Error creating notification:', notificationError)
      return NextResponse.json(
        { error: `Failed to send message: ${notificationError.message}` },
        { status: 500 }
      )
    }

    console.log('Admin API: Message sent successfully to:', user.name)
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      notification: {
        id: notification.id,
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at
      }
    })

  } catch (error) {
    console.error('Admin API: Unexpected error in send message:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
