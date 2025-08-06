-- Fix RLS policies to allow username availability checking
-- This script should be run in your Supabase SQL editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create new policies that allow username checking for registration
CREATE POLICY "Allow username checking for registration" ON users
    FOR SELECT USING (
        -- Allow checking usernames for registration purposes
        -- This allows the username availability feature to work
        true
    );

-- Keep the update policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Add policy for super admins to manage all users
CREATE POLICY "Super admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add policy for inserting new users (for registration)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true); 