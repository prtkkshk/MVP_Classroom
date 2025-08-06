'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
