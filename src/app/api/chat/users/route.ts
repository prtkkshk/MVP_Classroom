import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('Chat API: Fetching users for messaging...')
    
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get('currentUserId')
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Current user ID is required' },
        { status: 400 }
      )
    }
    
    // Use service role key to bypass RLS
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, username, avatar_url, role')
      .neq('id', currentUserId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Chat API: Error fetching users:', error)
      return NextResponse.json(
        { error: `Failed to fetch users: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Chat API: Successfully fetched ${users?.length || 0} users for messaging`)
    
    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error) {
    console.error('Chat API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
