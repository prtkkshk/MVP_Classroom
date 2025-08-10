import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Sending message...')
    
    const body = await request.json()
    console.log('Chat API: Request body:', body)
    
    const { senderId, receiverId, content, messageType = 'text' } = body
    
    if (!senderId || !receiverId || !content) {
      console.log('Chat API: Missing required fields')
      return NextResponse.json(
        { error: 'senderId, receiverId, and content are required' },
        { status: 400 }
      )
    }

    // Verify both users exist
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', [senderId, receiverId])

    if (usersError || users.length !== 2) {
      console.error('Chat API: Users not found:', usersError)
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      )
    }

    // Check if there's an approved message request between these users
    const { data: messageRequest, error: requestError } = await supabaseAdmin
      .from('message_requests')
      .select('*')
      .or(`and(requester_id.eq.${senderId},recipient_id.eq.${receiverId}),and(requester_id.eq.${receiverId},recipient_id.eq.${senderId})`)
      .eq('status', 'approved')
      .single()

    if (requestError && requestError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Chat API: Error checking message request:', requestError)
      return NextResponse.json(
        { error: 'Failed to verify chat permission' },
        { status: 500 }
      )
    }

    if (!messageRequest) {
      console.log('Chat API: No approved message request found')
      return NextResponse.json(
        { error: 'You can only send messages to users who have approved your message request' },
        { status: 403 }
      )
    }

    console.log('Chat API: Sending message from', users.find(u => u.id === senderId)?.name, 'to', users.find(u => u.id === receiverId)?.name)

    // Create the chat message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        message_type: messageType,
        is_read: false
      })
      .select()
      .single()

    if (messageError) {
      console.error('Chat API: Error creating message:', messageError)
      return NextResponse.json(
        { error: `Failed to send message: ${messageError.message}` },
        { status: 500 }
      )
    }

    console.log('Chat API: Message sent successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        is_read: message.is_read,
        created_at: message.created_at
      }
    })

  } catch (error) {
    console.error('Chat API: Unexpected error in send message:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
