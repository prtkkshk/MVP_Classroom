import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Start a transaction to delete all user data
    const { error: deleteError } = await supabase.rpc('delete_user_completely', {
      user_id: userId
    })

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 