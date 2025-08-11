import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createAuthError } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; materialId: string } }
) {
  try {
    const { courseId, materialId } = params

    // Mock material data for testing
    const mockMaterial = {
      id: materialId,
      courseId: courseId,
      title: 'Test Material',
      description: 'Test material description',
      type: 'document',
      url: 'https://example.com/test-material.pdf',
      size: 1024,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockMaterial)
  } catch (error) {
    console.error('Material detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; materialId: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const { courseId, materialId } = params
    const body = await request.json()

    // Mock material update for testing
    const mockUpdatedMaterial = {
      id: materialId,
      courseId: courseId,
      ...body,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockUpdatedMaterial)
  } catch (error) {
    console.error('Material update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; materialId: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request)
    if (!user) {
      return createAuthError('Authentication required')
    }

    const { courseId, materialId } = params

    // Mock material deletion for testing
    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Material deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
