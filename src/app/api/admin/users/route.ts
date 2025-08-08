import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Fetching users...')
    
    // Use service role key to bypass RLS
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin API: Error fetching users:', error)
      return NextResponse.json(
        { error: `Failed to fetch users: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Admin API: Successfully fetched ${users?.length || 0} users`)
    
    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error) {
    console.error('Admin API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()
    
    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    console.log('Admin API: Updating user:', userId, updates)
    
    // Use service role key to bypass RLS
    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Admin API: Error updating user:', error)
      return NextResponse.json(
        { error: `Failed to update user: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Admin API: Successfully updated user')
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Admin API: Unexpected error in PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userIds } = await request.json()
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid user IDs provided' },
        { status: 400 }
      )
    }

    console.log('Admin API: Deleting users:', userIds)
    
    // Use service role key to bypass RLS
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .in('id', userIds)

    if (error) {
      console.error('Admin API: Error deleting users:', error)
      return NextResponse.json(
        { error: `Failed to delete users: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Admin API: Successfully deleted ${userIds.length} users`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${userIds.length} users`
    })

  } catch (error) {
    console.error('Admin API: Unexpected error in DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
