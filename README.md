# InfraLearn - Digital Classroom Infrastructure

A modern, interactive digital learning platform designed to transform passive classroom learning into engaging, personalized education experiences.

## 🚀 Features

### Core Features
- **Role-based Authentication**: Support for Super Admin, Professor, and Student roles
- **Course Management**: Create, manage, and organize courses with materials
- **Real-time Doubt Resolution**: Anonymous question submission with upvoting system
- **Live Sessions**: Interactive classroom sessions with real-time doubt aggregation
- **Material Organization**: Centralized repository for course materials
- **Student Enrollment**: Course enrollment system with approval workflow
- **Analytics Dashboard**: Comprehensive insights for professors and administrators

### Technical Features
- **Modern UI/UX**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Real-time Updates**: Supabase Realtime for live features
- **Secure Authentication**: Supabase Auth with Row Level Security
- **Responsive Design**: Mobile-first approach with beautiful animations
- **Type Safety**: Full TypeScript implementation
- **State Management**: Zustand for efficient state management

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Beautiful, accessible components
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Row Level Security
  - File Storage

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd new_app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables, policies, and sample data

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 👥 User Roles & Demo Accounts

### Super Admin
- **Email**: admin@infralearn.com
- **Password**: password123
- **Capabilities**: Full platform access, user management, course oversight

### Professor
- **Email**: prof.smith@university.edu
- **Password**: password123
- **Capabilities**: Create/manage courses, upload materials, view analytics

### Student
- **Email**: jane.doe@kgpian.iitkgp.ac.in
- **Password**: password123
- **Capabilities**: Enroll in courses, submit doubts, access materials

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # ShadCN UI components
│   ├── layout/          # Layout components
│   └── dashboard/       # Dashboard-specific components
├── store/               # Zustand stores
│   ├── authStore.ts     # Authentication state
│   └── courseStore.ts   # Course management state
├── lib/                 # Utility functions
│   ├── supabase.ts      # Supabase client configuration
│   └── utils.ts         # General utilities
└── hooks/               # Custom React hooks
```

## 🔐 Authentication Flow

1. **User Registration**: Students can sign up with institutional emails
2. **Professor Creation**: Super admins can create professor accounts
3. **Role-based Access**: Different dashboards and permissions based on user role
4. **Session Management**: Automatic session persistence and refresh

## 📚 Course Management

### For Professors
- Create courses with unique codes
- Upload and organize course materials
- Manage student enrollments
- View analytics and engagement metrics
- Conduct live sessions

### For Students
- Join courses using course codes
- Access organized course materials
- Submit anonymous doubts
- Participate in live sessions
- Track learning progress

## 🎯 Key Features Implementation

### Real-time Doubt System
- Anonymous question submission
- Upvoting mechanism for common doubts
- Real-time aggregation for professors
- Integration with live sessions

### Course Materials
- File upload and organization
- Version control for updated materials
- Tag-based search functionality
- Access control based on enrollment

### Live Sessions
- Real-time doubt dashboard
- Student participation tracking
- Session management tools
- Integration with course materials

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration included
- Prettier formatting
- Consistent component structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the Supabase documentation for backend questions

## 🎉 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [ShadCN UI](https://ui.shadcn.com) for the beautiful component library
- [Next.js](https://nextjs.org) for the excellent React framework
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework

---

**InfraLearn** - Transforming education through technology 🚀
