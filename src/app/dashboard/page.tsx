'use client'

import useAuthStore from '@/store/authStore'
import StudentDashboard from '@/components/dashboard/StudentDashboard'
import ProfessorDashboard from '@/components/dashboard/ProfessorDashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (!user) {
    return <div>Loading...</div>
  }

  switch (user.role) {
    case 'student':
      return <StudentDashboard />
    case 'professor':
      return <ProfessorDashboard />
    default:
      return <StudentDashboard />
  }
} 