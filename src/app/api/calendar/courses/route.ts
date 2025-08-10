import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let courses: Array<{
      id: string
      title: string
      code: string
      professor_id: string
      users: { name: string; username: string }
    }> = []

    if (user.role === 'super_admin') {
      // Super admin can see all courses
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          code,
          professor_id,
          users!courses_professor_id_fkey(name, username)
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) throw error
      courses = data || []
    } else if (user.role === 'professor') {
      // Professor can see their own courses
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          code,
          professor_id,
          users!courses_professor_id_fkey(name, username)
        `)
        .eq('professor_id', userId)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) throw error
      courses = data || []
    } else if (user.role === 'student') {
      // Student can see enrolled courses
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          courses!course_enrollments_course_id_fkey(
            id,
            title,
            code,
            professor_id,
            users!courses_professor_id_fkey(name, username)
          )
        `)
        .eq('student_id', userId)
        .eq('status', 'approved')

      if (error) throw error
      courses = data?.map(e => e.courses).filter(Boolean) || []
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Calendar courses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
