import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Notification ID and action are required' },
        { status: 400 }
      )
    }

    let result
    let error

    switch (action) {
      case 'markAsRead':
        const { data, error: readError } = await supabaseAdmin
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .select()
          .single()
        
        result = data
        error = readError
        break

      case 'markAllAsRead':
        const { error: allReadError } = await supabaseAdmin
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', notificationId) // In this case, notificationId is actually userId
          .eq('is_read', false)
        
        error = allReadError
        break

      case 'delete':
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', notificationId)
        
        error = deleteError
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: result || null 
    })
  } catch (error) {
    console.error('Error in notifications PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
