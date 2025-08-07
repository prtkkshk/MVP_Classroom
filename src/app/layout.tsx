'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initializeAuth = useAuthStore(state => state.initializeAuth)
  
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
