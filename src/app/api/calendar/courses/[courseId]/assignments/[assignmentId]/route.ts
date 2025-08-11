import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const { courseId, assignmentId } = params

    // Mock assignment data for testing
    const mockAssignment = {
      id: assignmentId,
      courseId: courseId,
      title: 'Test Assignment',
      description: 'Test assignment description',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      points: 100,
      type: 'homework',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockAssignment)
  } catch (error) {
    console.error('Assignment detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
