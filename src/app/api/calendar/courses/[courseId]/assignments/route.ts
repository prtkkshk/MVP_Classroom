import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId

    // Mock assignments data for testing
    const mockAssignments = [
      {
        id: 'assignment-1',
        courseId: courseId,
        title: 'First Assignment',
        description: 'Complete the first chapter exercises',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        points: 100,
        type: 'homework',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'assignment-2',
        courseId: courseId,
        title: 'Midterm Project',
        description: 'Submit your midterm project report',
        dueDate: new Date(Date.now() + 604800000).toISOString(), // 1 week from now
        points: 200,
        type: 'project',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockAssignments)
  } catch (error) {
    console.error('Assignments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    // Check if user is professor or admin
    if (!isProfessor(user) && !isAdmin(user)) {
      return createRoleError(['professor', 'admin'])
    }

    const courseId = params.courseId
    const body = await request.json()
    const { title, description, dueDate, points, type } = body

    // Validate required fields
    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Title, description, and dueDate are required' },
        { status: 400 }
      )
    }

    // Mock assignment creation for testing
    const mockAssignment = {
      id: 'assignment-' + Date.now(),
      courseId,
      title,
      description,
      dueDate,
      points: points || 100,
      type: type || 'homework',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockAssignment, { status: 201 })
  } catch (error) {
    console.error('Assignment creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
