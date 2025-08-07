'use client'

import useAuthStore from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import StudentDashboard from '@/components/dashboard/StudentDashboard'
import ProfessorDashboard from '@/components/dashboard/ProfessorDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (!user) {
    return <div>Loading...</div>
  }

  const getDashboardTitle = () => {
    switch (user.role) {
      case 'student':
        return 'Student Dashboard'
      case 'professor':
        return 'Professor Dashboard'
      case 'super_admin':
        return 'Admin Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getDashboardDescription = () => {
    switch (user.role) {
      case 'student':
        return 'Welcome back! Here\'s an overview of your courses and activities.'
      case 'professor':
        return 'Manage your courses and track student engagement.'
      case 'super_admin':
        return 'Platform administration and oversight.'
      default:
        return 'Welcome to InfraLearn'
    }
  }

  return (
    <MainLayout
      title={getDashboardTitle()}
      description={getDashboardDescription()}
      showBreadcrumb={false}
    >
      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'professor' && <ProfessorDashboard />}
      {user.role === 'super_admin' && <AdminDashboard />}
    </MainLayout>
  )
} 