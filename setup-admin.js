#!/usr/bin/env node

/**
 * InfraLearn Admin Setup Script
 * This script helps you set up the admin user and test the connection
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 InfraLearn Admin Setup Script')
console.log('================================\n')

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local')
const envExamplePath = path.join(__dirname, 'env.example')

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!')
  console.log('📝 Creating .env.local from template...')
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env.local created successfully!')
  } else {
    console.log('❌ env.example not found!')
    console.log('📝 Creating basic .env.local...')
    
    const basicEnv = `# InfraLearn Platform Environment Variables

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Admin Credentials (CHANGE THESE!)
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=admin123

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
`
    
    fs.writeFileSync(envPath, basicEnv)
    console.log('✅ Basic .env.local created!')
  }
} else {
  console.log('✅ .env.local file exists')
}

console.log('\n📋 Next Steps:')
console.log('1. Edit .env.local and add your Supabase credentials')
console.log('2. Set your admin username and password')
console.log('3. Run the database schema: supabase-schema-fixed.sql')
console.log('4. Start the development server: npm run dev')
console.log('5. Login with your admin credentials')

console.log('\n🔧 Environment Variables to Configure:')
console.log('- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key')
console.log('- NEXT_PUBLIC_ADMIN_USERNAME: Admin username (default: admin)')
console.log('- NEXT_PUBLIC_ADMIN_PASSWORD: Admin password (default: admin123)')

console.log('\n⚠️  Important Security Notes:')
console.log('- Change the default admin credentials immediately')
console.log('- Never commit .env.local to version control')
console.log('- Use strong passwords in production')

console.log('\n🎯 Test Admin Login:')
console.log('1. Start the app: npm run dev')
console.log('2. Go to: http://localhost:3000/login')
console.log('3. Use your admin credentials')
console.log('4. You should be redirected to /admin')

console.log('\n🔍 Troubleshooting:')
console.log('- If you get a 500 error, check your Supabase credentials')
console.log('- Make sure the database schema is applied')
console.log('- Check the browser console for detailed error messages')
console.log('- Verify RLS policies are set up correctly')

console.log('\n✅ Setup complete! Happy coding! 🎉') 