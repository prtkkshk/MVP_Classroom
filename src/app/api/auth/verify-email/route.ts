import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { token_hash, type } = await request.json()
    
    if (type === 'email_confirmation') {
      // Verify the email confirmation
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash,
        type: 'email_confirmation'
      })

      if (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
          { error: 'Email verification failed' },
          { status: 400 }
        )
      }

      if (data.user) {
        // Update user status from pending to active
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Error updating user status:', updateError)
          return NextResponse.json(
            { error: 'Failed to update user status' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully. Your account is now active.'
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid verification type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in email verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
