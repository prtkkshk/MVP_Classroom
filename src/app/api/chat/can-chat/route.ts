import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId1 = searchParams.get('userId1')
    const userId2 = searchParams.get('userId2')

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: 'Both user IDs are required' },
        { status: 400 }
      )
    }

    // Check if there's an approved message request between these users
    const { data, error } = await supabaseAdmin
      .from('message_requests')
      .select('*')
      .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .eq('status', 'approved')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking chat permission:', error)
      return NextResponse.json(
        { error: 'Failed to check chat permission' },
        { status: 500 }
      )
    }

    const canChat = !!data

    return NextResponse.json({ 
      canChat,
      messageRequest: data || null
    })
  } catch (error) {
    console.error('Error in can-chat GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
