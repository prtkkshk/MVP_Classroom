# InfraLearn - Digital Classroom Infrastructure
## Complete Development Plan & Technical Specification

---

## 1. App Overview & Core Concept

### Vision Statement
InfraLearn is a digital infrastructure layer that transforms passive classroom learning into interactive, personalized education experiences by integrating with existing higher education systems.

### Core Value Proposition
- **"Digital Nervous System" for Classrooms**: Creates a smart layer on top of physical classrooms without replacing existing infrastructure
- **Centralized Knowledge Hub**: Consolidates scattered resources (notes, assignments, materials) into organized repositories
- **Anonymous Engagement**: Encourages student participation through fear-free question asking
- **Data-Driven Insights**: Provides professors with actionable analytics on student engagement and comprehension

---

## 2. Target Users & User Roles

### Primary Users

#### Students
- **Pain Points**: Passive learning, fear of asking questions publicly, scattered resources, lack of personalized support
- **Goals**: Access organized materials, get AI assistance, participate anonymously, collaborate with peers

#### Professors
- **Pain Points**: No real-time feedback, scattered teaching materials, limited student engagement data
- **Goals**: Organize course content, understand student confusion, improve teaching effectiveness

#### Institutions (B2B Customers)
- **Pain Points**: Outdated learning infrastructure, poor learning outcomes, need for modernization
- **Goals**: Improve educational quality, retain competitive advantage, align with digital transformation

### User Roles & Permissions

```
 Super Admin (Platform Admin)
    ├─ Professor
    └─ Student
```

**Permission Matrix:**
- **Super Admin**: Full platform access, analytics, can manage professors and courses and students
- **Professor**: Create/manage courses, upload materials, view analytics, moderate discussions, create polls, answer to questions, approve/remove students from his course, announcements
- **Student**: Access enrolled courses, submit questions with their name or anonymously, use AI companion, react to polls and announcements

Super Admin credentials (hard coded in the system): username: "pepper_admin" password: "14627912"

Super admin can create professor account, Name, Username, Email, Password

Students can create new account from the signIN/signUP page Name, Username, Email, Password

Professor can create a new course - a random 8 letters are generated (course code) students can join by entering the code and then professor can see the list and approve

---

## 3. Core Features & Functionality

### MVP Features (Phase 1)

#### 3.1 Course Hub per Subject
**Purpose**: Centralized repository for all course materials and resources

**Acceptance Criteria:**
- ✅ Professors can create dedicated course spaces
- ✅ Upload and organize syllabus, slides, readings, past papers
- ✅ Weekly structure with integrated calendar
- ✅ Tag-based search functionality across materials
- ✅ Student access control based on enrollment
- ✅ Version control for updated materials

#### 3.2 Smart Live Class Companion
**Purpose**: Real-time classroom interaction

**Acceptance Criteria:**
- ✅ Anonymous doubt flagging interface
- ✅ Upvoting mechanism for common doubts
- ✅ Real-time doubt aggregation for professors

### Tech Stack Recommendations

#### Frontend
- **Framework**: Next.js 14 (React) with TypeScript
- **Styling**: Tailwind CSS + ShadCN UI components
- **State Management**: Zustand or React Query
- **Real-time**: Socket.io client for live features

#### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Supabase Auth with custom roles
- **Storage**: Supabase Storage for files, audio recordings
- **Real-time**: Supabase Realtime for live updates

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase      │    │  External APIs  │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│  (AI Services)  │
│                 │    │                 │    │                 │
│ - React UI      │    │ - PostgreSQL    │    │ - OpenAI API    │
│ - Tailwind CSS  │    │ - Auth & RLS    │    │ - Whisper API   │
│ - Socket.io     │    │ - Storage       │    │ - Vector DB     │
│ - ShadCN UI     │    │ - Realtime      │    │ - Pinecone      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 4. UI/UX Design System & Guidelines

### Design Inspiration & References
Drawing inspiration from leading educational platforms:
- **Notion**: Clean, organized content structure with excellent hierarchy
- **Discord**: Real-time interaction patterns and community features
- **Figma**: Professional workspace feel with intuitive navigation
- **GitHub**: Code organization and collaboration patterns
- **Slack**: Communication and notification systems
- **Canvas/Blackboard**: Academic-focused layouts and workflows

### 4.1 Design Principles

#### Core Principles
1. **Academic Professionalism**: Clean, scholarly appearance that builds trust
2. **Cognitive Load Reduction**: Minimize mental effort required to use the platform
3. **Accessibility First**: WCAG 2.1 AA compliance for inclusive learning
4. **Mobile-First Responsive**: Seamless experience across all devices
5. **Contextual Clarity**: Users always know where they are and what they can do
6. **Efficient Workflows**: Minimize clicks and friction for common tasks

### 4.2 Color Palette & Visual Identity

#### Primary Color Scheme
```css
/* Light Theme */
--primary-50: #f0f9ff;    /* Very light blue background */
--primary-100: #e0f2fe;   /* Light blue accents */
--primary-500: #0ea5e9;   /* Primary brand blue */
--primary-600: #0284c7;   /* Hover states */
--primary-700: #0369a1;   /* Active states */

/* Neutral Colors */
--gray-50: #f9fafb;       /* Page backgrounds */
--gray-100: #f3f4f6;      /* Card backgrounds */
--gray-200: #e5e7eb;      /* Borders */
--gray-500: #6b7280;      /* Secondary text */
--gray-900: #111827;      /* Primary text */

/* Semantic Colors */
--success: #10b981;       /* Success states, completed tasks */
--warning: #f59e0b;       /* Warnings, pending actions */
--error: #ef4444;         /* Errors, destructive actions */
--info: #3b82f6;          /* Info messages, links */
```

#### Dark Theme Support
```css
/* Dark Theme Variables */
--dark-bg-primary: #0f172a;     /* Main background */
--dark-bg-secondary: #1e293b;   /* Card backgrounds */
--dark-bg-tertiary: #334155;    /* Elevated surfaces */
--dark-text-primary: #f8fafc;   /* Primary text */
--dark-text-secondary: #cbd5e1; /* Secondary text */
```

### 4.3 Typography System

#### Font Stack
```css
/* Primary Font - Inter for UI */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary Font - JetBrains Mono for code */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Academic Font - Crimson Pro for formal content */
--font-academic: 'Crimson Pro', Georgia, serif;
```

#### Type Scale
```css
/* Heading Hierarchy */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* Main page titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Section headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; } /* Card titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* Subsection headers */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Emphasized text */
.text-base { font-size: 1rem; line-height: 1.5rem; } /* Body text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Secondary text */
.text-xs { font-size: 0.75rem; line-height: 1rem; } /* Captions, labels */
```

### 4.4 Component Design Specifications

#### 4.4.1 Navigation Components

**Top Navigation Bar**
```tsx
// Specifications:
- Height: 64px (h-16)
- Background: White with subtle shadow
- Logo: Left-aligned, 32px height
- User menu: Right-aligned dropdown
- Search: Center-positioned, expandable
- Notifications: Bell icon with badge
- Course selector: Dropdown for enrolled courses
```

**Sidebar Navigation**
```tsx
// Specifications:
- Width: 280px on desktop, collapsible to 72px
- Background: Gray-50 with subtle border
- Icons: 20px Lucide icons
- Active state: Primary-500 background with white text
- Hover state: Gray-100 background
- Section dividers: Subtle gray lines
- Collapse button: Bottom of sidebar
```

#### 4.4.2 Layout Components

**Main Dashboard Grid**
```tsx
// Layout Structure:
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
  {/* Main Content Area */}
  <div className="lg:col-span-8">
    <WelcomeBanner />
    <RecentCourses />
    <UpcomingDeadlines />
  </div>
  
  {/* Sidebar */}
  <div className="lg:col-span-4">
    <QuickActions />
    <AICompanion />
    <RecentActivity />
  </div>
</div>
```

**Course Hub Layout**
```tsx
// Inspired by Notion's database views
- Header: Course title, description, enrollment stats
- Tabs: Materials, Live Sessions, Analytics, Settings
- Content area: Card-based layout with filtering
- Quick actions: Floating action button for common tasks
```

#### 4.4.3 Interactive Components

**Question/Doubt Submission Interface**
```tsx
// Design inspired by Discord's message input
- Expandable textarea with placeholder text
- Anonymous toggle switch (prominent)
- Attachment button for images/files
- Submit button with loading state
- Character counter (subtle)
- Real-time preview for formatting
```

**Live Session Interface**
```tsx
// Real-time doubt dashboard inspired by live streaming platforms
- Active session indicator (green dot)
- Doubt feed with upvote buttons
- Professor view: Moderation controls
- Student view: Submit doubt button (floating)
- Live participant count
- Session timer/duration
```

### 4.5 Specific Page Layouts

#### 4.5.1 Authentication Pages

**Login/Signup Page**
```tsx
// Layout inspired by GitHub's clean auth flow
<div className="min-h-screen flex">
  {/* Left side - Branding */}
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700">
    <div className="flex items-center justify-center p-12">
      <div className="text-white">
        <h1 className="text-4xl font-bold mb-4">Transform Your Classroom</h1>
        <p className="text-xl opacity-90">Join thousands of educators making learning interactive</p>
        <div className="mt-8 space-y-4">
          {/* Feature highlights with icons */}
        </div>
      </div>
    </div>
  </div>
  
  {/* Right side - Form */}
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="w-full max-w-md">
      <AuthForm />
    </div>
  </div>
</div>
```

**Form Specifications:**
- Input fields: 48px height, rounded borders
- Focus states: Primary color border with subtle shadow
- Error states: Red border with error message below
- Success states: Green checkmark icon
- Institutional email validation with real-time feedback

#### 4.5.2 Dashboard Layout

**Student Dashboard**
```tsx
// Inspired by Canvas LMS with modern touches
<div className="space-y-6">
  {/* Welcome Section */}
  <WelcomeBanner className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-xl">
    <h1>Welcome back, {studentName}!</h1>
    <p>You have {upcomingCount} upcoming deadlines</p>
  </WelcomeBanner>
  
  {/* Quick Stats */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard icon="BookOpen" title="Enrolled Courses" value={courseCount} />
    <StatCard icon="MessageSquare" title="Questions Asked" value={questionCount} />
    <StatCard icon="Clock" title="Hours Studied" value={studyHours} />
    <StatCard icon="Target" title="Assignments Due" value={assignmentCount} />
  </div>
  
  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <EnrolledCourses />
      <RecentActivity />
    </div>
    <div>
      <AICompanion />
      <UpcomingDeadlines />
    </div>
  </div>
</div>
```

**Professor Dashboard**
```tsx
// Inspired by Figma's workspace with educational context
<div className="space-y-6">
  {/* Header with Actions */}
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-3xl font-bold">Teaching Dashboard</h1>
      <p className="text-gray-600">Manage your courses and track student engagement</p>
    </div>
    <Button size="lg" className="bg-primary-500">
      <Plus className="w-4 h-4 mr-2" />
      Create Course
    </Button>
  </div>
  
  {/* Analytics Overview */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <MetricCard title="Total Students" value={totalStudents} trend="+12%" />
    <MetricCard title="Active Courses" value={activeCourses} />
    <MetricCard title="Questions This Week" value={weeklyQuestions} trend="+8%" />
    <MetricCard title="Engagement Rate" value="87%" trend="+5%" />
  </div>
  
  {/* Course Management Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <CourseManagementCard />
    <RecentQuestions />
  </div>
</div>
```

#### 4.5.3 Course Hub Interface

**Course Overview Page**
```tsx
// Inspired by Notion's page structure
<div className="max-w-6xl mx-auto p-6 space-y-8">
  {/* Course Header */}
  <div className="bg-white rounded-xl border border-gray-200 p-8">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{courseTitle}</h1>
            <p className="text-gray-600">{courseCode} • {semester}</p>
          </div>
        </div>
        <p className="text-lg text-gray-700 mb-4">{courseDescription}</p>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {studentCount} students
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {scheduleTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {classroom}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">Share Course</Button>
        <Button>Join Live Session</Button>
      </div>
    </div>
  </div>
  
  {/* Navigation Tabs */}
  <TabNavigation activeTab={activeTab} />
  
  {/* Content Area */}
  <div className="bg-white rounded-xl border border-gray-200 min-h-96">
    <TabContent />
  </div>
</div>
```

### 4.6 Interactive Elements & Animations

#### Micro-interactions
```tsx
// Button hover effects
.btn-primary {
  @apply transform transition-all duration-200 ease-in-out;
}
.btn-primary:hover {
  @apply scale-105 shadow-lg;
}

// Card hover effects
.course-card {
  @apply transition-all duration-300 ease-out;
}
.course-card:hover {
  @apply shadow-xl -translate-y-1;
}

// Loading states
.loading-skeleton {
  @apply animate-pulse bg-gray-200;
}
```

#### Real-time Feedback
```tsx
// Live doubt submission with instant feedback
const DoubtSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  return (
    <div className="relative">
      {/* Success animation */}
      {submitted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 bg-green-50 rounded-lg flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>
      )}
      
      {/* Form content */}
    </div>
  );
};
```

### 4.7 Responsive Design Breakpoints

#### Breakpoint System
```css
/* Mobile First Approach */
/* xs: 0px - 475px (mobile) */
/* sm: 476px - 640px (large mobile) */
/* md: 641px - 768px (tablet) */
/* lg: 769px - 1024px (desktop) */
/* xl: 1025px - 1280px (large desktop) */
/* 2xl: 1281px+ (ultra-wide) */
```

#### Mobile Adaptations
- **Navigation**: Convert sidebar to bottom tabs on mobile
- **Cards**: Stack vertically with full width
- **Tables**: Horizontal scroll with fixed first column
- **Modals**: Full-screen on mobile devices
- **Forms**: Larger touch targets (44px minimum)

### 4.8 Accessibility Standards

#### WCAG 2.1 AA Compliance
```tsx
// Color contrast ratios
- Primary text: 7:1 (AAA)
- Secondary text: 4.5:1 (AA)
- Interactive elements: 3:1 (AA)

// Keyboard navigation
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip links for main content

// Screen reader support
- Semantic HTML structure
- ARIA labels and descriptions
- Alt text for images
- Live regions for dynamic content
```

### 4.9 Performance Optimization

#### Loading States
```tsx
// Skeleton loading for course cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {isLoading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))
  ) : (
    courses.map(course => <CourseCard key={course.id} course={course} />)
  )}
</div>
```

#### Image Optimization
```tsx
// Next.js Image component with proper sizing
<Image
  src={courseImage}
  alt={courseTitle}
  width={400}
  height={200}
  className="rounded-lg object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## 5. API Routes & Backend Logic

### Authentication Routes
```typescript
// Supabase handles most auth, custom logic for:
POST /api/auth/signup-with-institution
POST /api/auth/verify-institutional-email
GET  /api/auth/user-profile
PUT  /api/auth/update-profile
```

### Course Management
```typescript
// Course CRUD
GET    /api/courses
POST   /api/courses
GET    /api/courses/[id]
PUT    /api/courses/[id]
DELETE /api/courses/[id]

// Materials
POST   /api/courses/[id]/materials
GET    /api/courses/[id]/materials
DELETE /api/materials/[id]
```

### Live Sessions
```typescript
// Real-time doubt submission
POST   /api/sessions/[id]/doubts
PUT    /api/doubts/[id]/upvote
GET    /api/sessions/[id]/doubts
```

### Analytics & Dashboard
```typescript
// Professor analytics
GET    /api/analytics/course/[id]/engagement
GET    /api/analytics/course/[id]/doubts-summary
GET    /api/analytics/course/[id]/resource-usage

// Student progress
GET    /api/analytics/student/progress
GET    /api/analytics/student/ai-interactions
```

---

## 6. Authentication & Security

### Authentication Flow
1. **Institutional Email Verification**: Students must use institutional email domains example institute email is "name@kgpian.iitkgp.ac.in"
2. **Role-Based Access Control**: Supabase RLS policies based on user roles
3. **Session Management**: JWT tokens with automatic refresh

### RLS Policies Examples
```sql
-- Students can only see their own doubts and course materials for enrolled courses
CREATE POLICY "Students can view own doubts" ON doubts
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() IN (
      SELECT professor_id FROM courses WHERE id = course_id
    )
  );

-- Professors can manage their own courses
CREATE POLICY "Professors can manage own courses" ON courses
  FOR ALL USING (auth.uid() = professor_id);
```

---

## 7. Component Library & Implementation

### ShadCN UI Components to Use
```bash
# Essential components
npx shadcn-ui@latest add button input card dialog dropdown-menu
npx shadcn-ui@latest add tabs table badge avatar
npx shadcn-ui@latest add form select textarea checkbox
npx shadcn-ui@latest add alert toast progress
npx shadcn-ui@latest add sheet sidebar navigation-menu
```

### Custom Component Specifications

#### CourseCard Component
```tsx
interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
  showActions?: boolean;
}

// Design specifications:
- Rounded corners: rounded-xl (12px)
- Subtle shadow: shadow-sm with hover:shadow-lg
- Border: 1px solid gray-200
- Padding: p-6 for default variant
- Image aspect ratio: 16:9 for course thumbnails
- Action buttons: Top-right corner with dropdown menu
```

#### QuestionSubmissionForm Component
```tsx
// Real-time features:
- Character counter with color coding
- Anonymous toggle with clear visual feedback
- File attachment with drag-and-drop
- Submit button with loading spinner
- Success animation on submission
- Error handling with clear messaging
```

### Design Tokens Configuration
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        academic: ['Crimson Pro', 'serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // ... complete color palette
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
    },
  },
};
```

---

## 8. Getting Started & Implementation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- OpenAI API key (for future AI features)
- Vercel account for deployment

### Initial Setup Commands
```bash
# Clone and setup
npx create-next-app@latest infralearn --typescript --tailwind --eslint
cd infralearn

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-ui-react
npm install lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install recharts zustand @tanstack/react-query
npm install framer-motion class-variance-authority
npm install @types/node @types/react @types/react-dom

# Setup ShadCN UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog dropdown-menu tabs table badge avatar form select textarea checkbox alert toast progress sheet

# Environment setup
cp .env.example .env.local
# Add your Supabase and OpenAI credentials
```

### Development Phases

#### Phase 1: Foundation
1. Set up project structure and basic layouts
2. Implement authentication system with institutional email validation
3. Create basic dashboard layouts for all user types
4. Set up Supabase schema and RLS policies

#### Phase 2: Core Features 
1. Build course creation and management system
2. Implement file upload and material organization
3. Create student enrollment workflow
4. Add basic real-time doubt submission

#### Phase 3: Polish & Enhancement
1. Add animations and micro-interactions
2. Implement comprehensive search functionality
3. Add analytics dashboards
4. Performance optimization and testing

### Quality Checklist
- [ ] All components are responsive (mobile-first)
- [ ] Dark mode support implemented
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Loading states for all async operations
- [ ] Error boundaries and proper error handling
- [ ] Performance optimized (Core Web Vitals)
- [ ] SEO optimized with proper meta tags
- [ ] Cross-browser compatibility tested

---

*This comprehensive plan provides detailed UI/UX specifications inspired by industry-leading platforms while maintaining academic professionalism. Each component and layout has been designed with user experience and accessibility as top priorities.*