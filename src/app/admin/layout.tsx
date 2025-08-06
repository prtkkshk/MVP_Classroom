'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && user?.role !== 'super_admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, user, router])

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
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  )
} 