import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const currentUserId = searchParams.get('currentUserId')

    console.log('Search params:', { query, currentUserId })

    if (!query || !currentUserId) {
      return NextResponse.json(
        { error: 'Search query and current user ID are required' },
        { status: 400 }
      )
    }

    // Search for users by username or email
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, username, email, avatar_url, role')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,name.ilike.%${query}%`)
      .neq('id', currentUserId) // Exclude current user
      .limit(10)

    if (error) {
      console.error('Supabase error searching users:', error)
      return NextResponse.json(
        { error: 'Failed to search users', details: error.message },
        { status: 500 }
      )
    }

    console.log('Search results:', data?.length || 0, 'users found')
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in search-users GET:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
