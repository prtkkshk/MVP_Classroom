'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  Settings, 
  LogOut,
  Users,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Shield,
  TrendingUp,
  Bot,
  Calendar,
  MessageSquare,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/authStore'

const sidebarItems = {
  student: [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/courses' },
    { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ],
  professor: [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/courses' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ],
  super_admin: [
    { icon: Home, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'User Management', href: '/admin/users' },
    { icon: BookOpen, label: 'Course Oversight', href: '/admin/courses' },
    { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ]
}

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()

  // Notify parent component when collapsed state changes
  useEffect(() => {
    onCollapsedChange?.(isCollapsed)
  }, [isCollapsed, onCollapsedChange])

  if (!user) return null

  const items = sidebarItems[user.role] || sidebarItems.student

  const handleLogout = async () => {
    console.log('Sidebar logout button clicked')
    if (isLoggingOut) return // Prevent multiple clicks
    
    setIsLoggingOut(true)
    try {
      await signOut()
      console.log('Sign out completed, redirecting to login')
      // The signOut function now handles the redirect
    } catch (error) {
      console.error('Error during logout:', error)
      setIsLoggingOut(false)
    }
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <motion.div 
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200",
        !isMobile && isCollapsed && "w-20",
        !isMobile && !isCollapsed && "w-64",
        isMobile && "w-64"
      )}
      animate={!isMobile ? { width: isCollapsed ? 80 : 256 } : {}}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between w-full">
          <AnimatePresence>
            {(!isCollapsed || isMobile) ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 overflow-hidden flex-1"
              >
                <div className="p-1.5 bg-blue-600 rounded-lg flex items-center justify-center w-8 h-8">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">InfraLearn</h1>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center flex-1"
              >
                <div className="p-1.5 bg-blue-600 rounded-lg flex items-center justify-center w-8 h-8">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isMobile && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8"
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
              </Button>
            </div>
          )}
          
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.href}>
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push(item.href)
                    if (isMobile) setIsMobileOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900",
                    isCollapsed && !isMobile && "justify-center px-0"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-gray-200">
        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-3 p-2 bg-gray-50 rounded-lg overflow-hidden"
            >
              <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors text-red-600 hover:text-red-700 hover:bg-red-50",
            isCollapsed && !isMobile && "justify-center px-0",
            isLoggingOut && "opacity-50 cursor-not-allowed"
          )}
          style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
        >
          {isLoggingOut ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 flex-shrink-0" />
          ) : (
            <LogOut className="h-5 w-5 flex-shrink-0" />
          )}
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium overflow-hidden whitespace-nowrap"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">InfraLearn</h1>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="h-8 w-8"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden fixed left-0 top-0 h-full z-50"
            >
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 