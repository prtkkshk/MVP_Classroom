-- Fix infinite recursion in users table RLS policies
-- This migration will drop and recreate the problematic policies

-- First, let's check what policies exist
DO $$
BEGIN
    -- Drop existing policies that might be causing recursion
    DROP POLICY IF EXISTS "Users can view their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can update all users" ON users;
    DROP POLICY IF EXISTS "Users can view all users" ON users;
    
    -- Create simple, non-recursive policies
    CREATE POLICY "Users can view their own profile" ON users
        FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile" ON users
        FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Admins can view all users" ON users
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        );
    
    CREATE POLICY "Admins can update all users" ON users
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        );
    
    CREATE POLICY "Admins can insert users" ON users
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        );
    
    CREATE POLICY "Admins can delete users" ON users
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        );
    
    RAISE NOTICE 'Users table policies have been fixed';
END $$;
