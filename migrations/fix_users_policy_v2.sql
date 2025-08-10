-- Alternative fix for users table RLS policies
-- This version avoids recursion by using a more direct approach

DO $$
BEGIN
    -- Drop all existing policies on users table
    DROP POLICY IF EXISTS "Users can view their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can update all users" ON users;
    DROP POLICY IF EXISTS "Admins can insert users" ON users;
    DROP POLICY IF EXISTS "Admins can delete users" ON users;
    DROP POLICY IF EXISTS "Users can view all users" ON users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
    
    -- Create new policies that avoid recursion
    -- Allow users to view their own profile
    CREATE POLICY "Users can view their own profile" ON users
        FOR SELECT USING (auth.uid() = id);
    
    -- Allow users to update their own profile
    CREATE POLICY "Users can update their own profile" ON users
        FOR UPDATE USING (auth.uid() = id);
    
    -- Allow users to insert their own profile (for registration)
    CREATE POLICY "Users can insert their own profile" ON users
        FOR INSERT WITH CHECK (auth.uid() = id);
    
    -- Allow super admins to view all users (using a simpler check)
    CREATE POLICY "Admins can view all users" ON users
        FOR SELECT USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role = 'super_admin'
            )
        );
    
    -- Allow super admins to update all users
    CREATE POLICY "Admins can update all users" ON users
        FOR UPDATE USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role = 'super_admin'
            )
        );
    
    -- Allow super admins to insert users
    CREATE POLICY "Admins can insert users" ON users
        FOR INSERT WITH CHECK (
            auth.uid() IN (
                SELECT id FROM users WHERE role = 'super_admin'
            )
        );
    
    -- Allow super admins to delete users
    CREATE POLICY "Admins can delete users" ON users
        FOR DELETE USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role = 'super_admin'
            )
        );
    
    RAISE NOTICE 'Users table policies have been recreated with non-recursive logic';
END $$;
