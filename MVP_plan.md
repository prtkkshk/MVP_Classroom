# InLearn - Digital Classroom Infrastructure
## Complete Development Plan & Technical Specification


## 1. App Overview & Core Concept

### Vision Statement
InLearn is a digital infrastructure layer that transforms passive classroom learning into interactive, personalized education experiences by integrating with existing higher education systems.

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

Professor can create a new course - make a course code (unique) students can join by entering the code and then professor can see the list and approve

---

## 3. Core Features & Functionality

### Features

#### 3.1 Course Hub per Subject
**Purpose**: Centralized repository for all course materials and resources

**Acceptance Criteria:**
- ✅ Professors can create dedicated course spaces
- ✅ Upload and organize syllabus, slides, readings, past papers
- ✅ Weekly structure with integrated calendar
- ✅ Tag-based search functionality across materials
- ✅ Student access control based on enrollment, approve students to a course and remove, 
- ✅ Version control for updated materials

#### 3.2 Smart Live Class Companion
**Purpose**: Real-time classroom interaction

**Acceptance Criteria:**
- ✅ Anonymous doubt flagging interface
- ✅ Upvoting mechanism for common doubts
- ✅ Real-time doubt aggregation for professors
- live polling feature, professor creates a poll and students respond,

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
┌─────────────────┐   
│   Next.js App   │    │   Supabase      │   
│   (Frontend)    │◄──► │   (Backend)   |
│                 │    │                 │    │
│ - Tailwind CSS  │    │ - Auth & RLS    │    │
│ - Socket.io     │    │ - Storage       │    │
│ - ShadCN UI     │    │ - Realtime      │    │

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

## 6. Authentication & Security

### Authentication Flow
1. **Institutional Email Verification**: Students must use institutional email domains example institute email is "name@kgpian.iitkgp.ac.in"
2. **Role-Based Access Control**: Supabase RLS policies based on user roles
3. **Session Management**: JWT tokens with automatic refresh


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
- [ ] Cross-browser compatibility tested

---

*This comprehensive plan provides detailed UI/UX specifications inspired by industry-leading platforms while maintaining academic professionalism. Each component and layout has been designed with user experience and accessibility as top priorities.*