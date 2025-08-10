import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { requesterId, recipientId, message } = await request.json()

    if (!requesterId || !recipientId) {
      return NextResponse.json(
        { error: 'Requester ID and recipient ID are required' },
        { status: 400 }
      )
    }

    console.log('Creating message request:', { requesterId, recipientId, message })

    // Check if a request already exists
    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from('message_requests')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('recipient_id', recipientId)
      .single()

    if (existingError) {
      console.error('Error checking existing request:', existingError)
      
      // Check if the error is due to missing table
      if (existingError.code === '42P01' || existingError.message?.includes('relation "message_requests" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the migration: create_message_requests_table.sql',
            details: 'The message_requests table does not exist in the database. Please execute the migration script in your Supabase dashboard.'
          },
          { status: 500 }
        )
      }
      
      // Check if it's a "no rows returned" error (which is expected when no request exists)
      if (existingError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: `Failed to check existing request: ${existingError.message}` },
          { status: 500 }
        )
      }
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A message request already exists between these users' },
        { status: 409 }
      )
    }

    // Create new message request
    const { data, error } = await supabaseAdmin
      .from('message_requests')
      .insert({
        requester_id: requesterId,
        recipient_id: recipientId,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message request:', error)
      
      // Check if the error is due to missing table
      if (error.code === '42P01' || error.message?.includes('relation "message_requests" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the migration: create_message_requests_table.sql',
            details: 'The message_requests table does not exist in the database. Please execute the migration script in your Supabase dashboard.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to create message request: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Message request created successfully:', data)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in message request POST:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'sent' or 'received'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('message_requests')
      .select(`
        *,
        requester:users!message_requests_requester_id_fkey(id, name, username, avatar_url, role),
        recipient:users!message_requests_recipient_id_fkey(id, name, username, avatar_url, role)
      `)

    if (type === 'sent') {
      query = query.eq('requester_id', userId)
    } else if (type === 'received') {
      query = query.eq('recipient_id', userId)
    } else {
      // Get both sent and received requests
      query = query.or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching message requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch message requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in message request GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { requestId, status, userId } = await request.json()

    if (!requestId || !status || !userId) {
      return NextResponse.json(
        { error: 'Request ID, status, and user ID are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Update the message request status
    const { data, error } = await supabaseAdmin
      .from('message_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('recipient_id', userId) // Ensure only the recipient can update
      .select()
      .single()

    if (error) {
      console.error('Error updating message request:', error)
      return NextResponse.json(
        { error: 'Failed to update message request' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Message request not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in message request PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
