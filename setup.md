# InfraLearn Setup Guide

## Quick Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings > API to get your project URL and keys
3. Go to SQL Editor and run the contents of `supabase-schema.sql`

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## Admin Access

The system has a hardcoded admin account for initial setup:

- **Username**: pepper_admin
- **Password**: 14627912

This admin account can:
- Create professor accounts
- Access admin dashboard
- Manage platform settings

## Student Registration

Students can create accounts directly through the signup form:
- Must use institutional email addresses (@kgpian.iitkgp.ac.in)
- Username must be unique
- Password confirmation required

## Next Steps

1. Set up authentication in Supabase Auth settings
2. Configure email templates for user registration
3. Set up file storage buckets for course materials
4. Configure real-time subscriptions for live features 