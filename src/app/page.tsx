'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { motion } from 'framer-motion'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect based on user role
        switch (user.role) {
          case 'super_admin':
            router.push('/admin')
            break
          case 'professor':
          case 'student':
            router.push('/dashboard')
            break
          default:
            router.push('/login')
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }
  }, [isAuthenticated, user, router, isLoading])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-4 bg-blue-600 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900">InfraLearn</h1>
            <p className="text-gray-600">Digital Classroom Infrastructure</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </motion.div>
    </div>
  )
}
