'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import Sidebar from '@/components/layout/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && user?.role !== 'super_admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, user, router])

  // Debug logging
  useEffect(() => {
    console.log('Admin layout auth state:', { isAuthenticated, isLoading, user: user?.role })
  }, [isAuthenticated, isLoading, user])

  // Add error boundary for admin pages
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Admin layout error:', error)
      // Redirect to login if there's a critical error
      if (error.error?.message?.includes('500') || error.error?.message?.includes('database')) {
        router.push('/login')
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />
      <main className={`min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  )
} 