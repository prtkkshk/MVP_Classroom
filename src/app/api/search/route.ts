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

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Mock search results for testing
    const mockSearchResults = [
      {
        id: 'course-1',
        type: 'course',
        title: 'Introduction to Computer Science',
        description: 'Learn the basics of computer science',
        url: '/dashboard/courses/course-1'
      },
      {
        id: 'material-1',
        type: 'material',
        title: 'Programming Fundamentals',
        description: 'Basic programming concepts and examples',
        url: '/dashboard/courses/course-1/materials/material-1'
      },
      {
        id: 'assignment-1',
        type: 'assignment',
        title: 'First Programming Assignment',
        description: 'Complete your first programming task',
        url: '/dashboard/courses/course-1/assignments/assignment-1'
      },
      {
        id: 'user-1',
        type: 'user',
        title: 'Dr. Smith',
        description: 'Computer Science Professor',
        url: '/dashboard/users/user-1'
      }
    ]

    // Filter results based on query
    const filteredResults = mockSearchResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json({
      query,
      results: filteredResults,
      total: filteredResults.length
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
