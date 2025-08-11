import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Mock user search results for testing
    const mockUsers = [
      {
        id: 'user-1',
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'student',
        avatar: 'https://example.com/avatar1.jpg'
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        role: 'professor',
        avatar: 'https://example.com/avatar2.jpg'
      },
      {
        id: 'user-3',
        name: 'Bob Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        role: 'student',
        avatar: 'https://example.com/avatar3.jpg'
      }
    ]

    // Filter users based on query if provided
    let filteredUsers = mockUsers
    if (query) {
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )
    }

    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error('User search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
