import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return createRoleError(['admin', 'super_admin'])
    }

    // Mock users data for testing
    const mockUsers = [
      {
        id: 'user-1',
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'student',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        role: 'professor',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-3',
        name: 'Bob Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        role: 'student',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-4',
        name: 'Admin User',
        username: 'admin',
        email: 'admin@infralearn.com',
        role: 'super_admin',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockUsers)
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Admin API: PUT request received')
    
    const body = await request.json()
    console.log('Admin API: Request body:', body)
    
    const { userId, userIds, updates } = body
    
    // Handle both single user and bulk user updates
    if (!updates) {
      console.log('Admin API: No updates provided')
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      )
    }

    if (userId) {
      // Single user update
      console.log('Admin API: Updating single user:', userId, updates)
      
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
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Bulk user update
      console.log('Admin API: Updating multiple users:', userIds, updates)
      
      const { error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .in('id', userIds)

      if (error) {
        console.error('Admin API: Error updating users:', error)
        return NextResponse.json(
          { error: `Failed to update users: ${error.message}` },
          { status: 500 }
        )
      }

      console.log(`Admin API: Successfully updated ${userIds.length} users`)
      
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${userIds.length} users`
      })
    } else {
      console.log('Admin API: Invalid request - no userId or userIds provided')
      return NextResponse.json(
        { error: 'Either userId or userIds array is required' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Admin API: Unexpected error in PUT:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
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
