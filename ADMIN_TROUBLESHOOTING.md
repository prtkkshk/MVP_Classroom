# Admin Login & Profile Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. 500 Error on Admin Login

**Error**: `Failed to load resource: the server responded with a status of 500`

**Causes**:
- Missing or incorrect Supabase credentials
- Database not set up properly
- Admin user doesn't exist in database
- RLS policies blocking access

**Solutions**:

#### A. Check Environment Variables
```bash
# Make sure .env.local exists and has correct values
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ADMIN_USERNAME=your-admin-username
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password
```

#### B. Verify Supabase Connection
1. Go to your Supabase dashboard
2. Check if your project is active
3. Copy the correct URL and anon key
4. Update `.env.local` with the correct values

#### C. Set Up Database Schema
1. Go to Supabase SQL Editor
2. Copy and paste the contents of `supabase-schema-fixed.sql`
3. Run the SQL script
4. Verify tables are created

#### D. Create Admin User Manually
```sql
-- Run this in Supabase SQL Editor
INSERT INTO users (id, email, username, name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@infralearn.com',
  'admin',
  'System Administrator',
  'super_admin',
  NOW(),
  NOW()
);
```

### 2. Admin User Not Found

**Error**: `User profile not found`

**Solution**:
The admin user is created automatically when you first login. If this fails:

1. Check the browser console for detailed errors
2. Verify the `getOrCreateAdminUser` function is working
3. Manually create the admin user using the SQL above

### 3. Permission Denied

**Error**: `Access Denied` or `You don't have permission`

**Causes**:
- User role is not `super_admin`
- RLS policies are blocking access
- Session expired

**Solutions**:

#### A. Check User Role
```javascript
// In browser console, check:
console.log(useAuthStore.getState().user)
// Should show: { role: 'super_admin' }
```

#### B. Verify RLS Policies
Make sure these policies exist in your database:

```sql
-- Allow super admins to view all users
CREATE POLICY "Super admins can view all users" ON users
FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');

-- Allow super admins to update all users
CREATE POLICY "Super admins can update all users" ON users
FOR UPDATE USING (auth.jwt() ->> 'role' = 'super_admin');
```

### 4. Environment Variables Not Loading

**Error**: `process.env.NEXT_PUBLIC_ADMIN_USERNAME is undefined`

**Solutions**:

#### A. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

#### B. Check File Location
Make sure `.env.local` is in the root directory (same level as `package.json`)

#### C. Verify Variable Names
Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser

### 5. Database Connection Issues

**Error**: `Network error` or `Connection failed`

**Solutions**:

#### A. Check Internet Connection
Make sure you can access `https://your-project.supabase.co`

#### B. Verify Project Status
1. Go to Supabase dashboard
2. Check if your project is paused or suspended
3. Resume if necessary

#### C. Check API Limits
1. Go to Supabase dashboard
2. Check API usage and limits
3. Upgrade plan if needed

## 🔧 Quick Fix Commands

### 1. Reset Environment
```bash
# Remove and recreate .env.local
rm .env.local
npm run setup-admin
```

### 2. Clear Browser Data
```bash
# Clear localStorage and sessionStorage
# In browser console:
localStorage.clear()
sessionStorage.clear()
```

### 3. Reset Database
```sql
-- In Supabase SQL Editor, reset users table
TRUNCATE TABLE users CASCADE;
-- Then run the schema again
```

## 🧪 Testing Steps

### 1. Test Environment Variables
```javascript
// In browser console
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('ADMIN_USERNAME:', process.env.NEXT_PUBLIC_ADMIN_USERNAME)
```

### 2. Test Database Connection
```javascript
// In browser console
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('users').select('*').limit(1)
console.log('Connection test:', { data, error })
```

### 3. Test Admin Login
1. Go to `/login`
2. Use admin credentials
3. Check if redirected to `/admin`
4. Check browser console for errors

## 📋 Debug Checklist

- [ ] `.env.local` file exists and has correct values
- [ ] Supabase project is active and accessible
- [ ] Database schema is applied
- [ ] Admin user exists in database
- [ ] RLS policies are set up correctly
- [ ] Development server restarted after env changes
- [ ] Browser cache cleared
- [ ] No console errors in browser
- [ ] Network tab shows successful requests

## 🆘 Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Check the Network tab** for failed requests
3. **Verify your Supabase project** is set up correctly
4. **Run the setup script**: `npm run setup-admin`
5. **Check the logs** in Supabase dashboard

## 📞 Support Information

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables
- **Project Issues**: Check the GitHub repository for known issues

---

**Remember**: The admin system is designed to be secure. If you're having trouble, it's likely a configuration issue rather than a bug. Follow the steps above systematically to resolve the issue. 