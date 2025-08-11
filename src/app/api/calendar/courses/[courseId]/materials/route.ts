import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isProfessor, isAdmin, createAuthError, createRoleError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId

    // Mock materials data for testing
    const mockMaterials = [
      {
        id: 'material-1',
        courseId: courseId,
        title: 'Introduction Slides',
        description: 'PowerPoint presentation for the first lecture',
        type: 'presentation',
        url: 'https://example.com/intro-slides.pptx',
        size: 2048,
        created_at: new Date().toISOString()
      },
      {
        id: 'material-2',
        courseId: courseId,
        title: 'Course Syllabus',
        description: 'Complete course outline and schedule',
        type: 'document',
        url: 'https://example.com/syllabus.pdf',
        size: 512,
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockMaterials)
  } catch (error) {
    console.error('Materials API error:', error)
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
    const { title, description, type, url, size } = body

    // Validate required fields
    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Title, description, and type are required' },
        { status: 400 }
      )
    }

    // Mock material creation for testing
    const mockMaterial = {
      id: 'material-' + Date.now(),
      courseId,
      title,
      description,
      type,
      url: url || 'https://example.com/placeholder',
      size: size || 1024,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockMaterial, { status: 201 })
  } catch (error) {
    console.error('Material creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
