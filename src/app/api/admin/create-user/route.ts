import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('Create user API: Starting...')
    console.log('Environment check:')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')
    
    // Test database connection
    console.log('Create user API: Testing database connection...')
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    
    console.log('Create user API: Database connection test:', { testData, testError })
    
    if (testError) {
      console.error('Create user API: Database connection failed:', testError)
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      )
    }
    
    const { name, username, email, password, role } = await request.json()
    console.log('Create user API: Received data:', { name, username, email, role })

    // Validate input
    if (!name || !username || !email || !password || !role) {
      console.log('Create user API: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (role !== 'professor' && role !== 'student') {
      return NextResponse.json(
        { error: 'Invalid role. Must be professor or student' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (checkError) {
      console.error('Error checking username:', checkError)
      return NextResponse.json(
        { error: 'Error checking username availability' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (emailCheckError) {
      console.error('Error checking email:', emailCheckError)
      return NextResponse.json(
        { error: 'Error checking email availability' },
        { status: 500 }
      )
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 400 }
      )
    }

    // Create user account using Supabase Auth
    console.log('Create user API: Creating auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // Don't auto-confirm email - let user verify
      user_metadata: {
        name: name,
        username: username.toLowerCase(),
        role: role
      }
    })

    console.log('Create user API: Auth creation result:', { authData, authError })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 500 }
      )
    }

    // Create user profile in the users table
    console.log('Create user API: Creating user profile...')
    const newUser = {
      id: authData.user.id,
      name: name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      role: role,
      status: 'pending', // Set initial status as pending
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Create user API: User profile data:', newUser)

    const { data: createdUser, error } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single()

    console.log('Create user API: Profile creation result:', { createdUser, error })

    if (error) {
      console.error('Error creating user profile:', error)
      // If profile creation fails, we should clean up the auth user
      console.log('Create user API: Cleaning up auth user due to profile creation failure')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user profile: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Create user API: Successfully created user with pending status')
    return NextResponse.json({
      success: true,
      user: createdUser,
      message: 'User created successfully. They will receive an email verification link.'
    })

  } catch (error) {
    console.error('Error in create-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
