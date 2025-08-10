import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const view = searchParams.get('view') || 'all' // all, personal, course

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user role and permissions
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        courses!calendar_events_course_id_fkey(
          id,
          title,
          code,
          professor_id
        ),
        users!calendar_events_created_by_fkey(
          id,
          name,
          username,
          role
        )
      `)
      .order('start_date', { ascending: true })

    // Apply filters based on user role and permissions
    if (user.role === 'super_admin') {
      // Super admin can see all events
      if (courseId) {
        query = query.eq('course_id', courseId)
      }
    } else if (user.role === 'professor') {
      // Professor can see their own course events and personal events
      if (view === 'personal') {
        query = query.eq('created_by', userId).is('course_id', null)
      } else if (view === 'course') {
        query = query.eq('created_by', userId).not('course_id', 'is', null)
      } else {
        // Get courses where user is professor
        const { data: professorCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('professor_id', userId)

        const courseIds = professorCourses?.map(c => c.id) || []
        query = query.or(`course_id.in.(${courseIds.join(',')}),created_by.eq.${userId}`)
      }
    } else if (user.role === 'student') {
      // Student can see events from enrolled courses and personal events
      if (view === 'personal') {
        query = query.eq('created_by', userId).is('course_id', null)
      } else if (view === 'course') {
        // Get enrolled courses
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', userId)
          .eq('status', 'approved')

        const courseIds = enrollments?.map(e => e.course_id) || []
        if (courseIds.length > 0) {
          query = query.in('course_id', courseIds)
        } else {
          query = query.eq('course_id', 'no-courses')
        }
      } else {
        // Get enrolled courses
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', userId)
          .eq('status', 'approved')

        const courseIds = enrollments?.map(e => e.course_id) || []
        if (courseIds.length > 0) {
          query = query.or(`course_id.in.(${courseIds.join(',')}),created_by.eq.${userId}`)
        } else {
          query = query.eq('created_by', userId)
        }
      }
    }

    // Apply additional filters
    if (courseId && courseId !== 'all') {
      query = query.eq('course_id', courseId)
    }

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Calendar events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received event data:', body)
    const { 
      title, 
      description, 
      event_type, 
      start_date, 
      end_date, 
      all_day, 
      course_id, 
      created_by
    } = body

    // Validate required fields
    if (!title || !event_type || !start_date || !created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user role for permission check
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', created_by)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Permission checks
    if (course_id) {
      if (user.role === 'student') {
        // Check if student is enrolled in the course
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', course_id)
          .eq('student_id', created_by)
          .eq('status', 'approved')
          .single()

        if (!enrollment) {
          return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
        }
      } else if (user.role === 'professor') {
        // Check if professor owns the course
        const { data: course } = await supabase
          .from('courses')
          .select('id')
          .eq('id', course_id)
          .eq('professor_id', created_by)
          .single()

        if (!course) {
          return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 })
        }
      }
    }

    const eventData = {
      title,
      description,
      event_type,
      start_date,
      end_date,
      all_day: all_day || false,
      course_id,
      created_by
    }

    console.log('Attempting to insert event data:', eventData)

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert(eventData)
      .select(`
        *,
        courses!calendar_events_course_id_fkey(
          id,
          title,
          code
        ),
        users!calendar_events_created_by_fkey(
          id,
          name,
          username
        )
      `)
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      console.error('Event data that failed:', eventData)
      return NextResponse.json({ error: `Failed to create calendar event: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Create calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get the event to check permissions
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('created_by, course_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get user role for permission check
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', existingEvent.created_by)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Permission check - only creator or course professor can edit
    const canEdit = existingEvent.created_by === body.updated_by || 
                   (user.role === 'professor' && existingEvent.course_id && 
                    await checkProfessorOwnsCourse(existingEvent.course_id, body.updated_by))

    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this event' }, { status: 403 })
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        courses!calendar_events_course_id_fkey(
          id,
          title,
          code
        ),
        users!calendar_events_created_by_fkey(
          id,
          name,
          username
        )
      `)
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'Event ID and User ID are required' }, { status: 400 })
    }

    // Get the event to check permissions
    const { data: existingEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('created_by, course_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get user role for permission check
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Permission check - only creator or course professor can delete
    const canDelete = existingEvent.created_by === userId || 
                     (user.role === 'professor' && existingEvent.course_id && 
                      await checkProfessorOwnsCourse(existingEvent.course_id, userId))

    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this event' }, { status: 403 })
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check if professor owns a course
async function checkProfessorOwnsCourse(courseId: string, professorId: string): Promise<boolean> {
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('professor_id', professorId)
    .single()

  return !!course
}
