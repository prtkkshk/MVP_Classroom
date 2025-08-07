'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  isCurrent?: boolean
}

const pathToBreadcrumb = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Home', href: '/', isCurrent: true }]
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ]

  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Convert segment to readable label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    // Special cases for better labels
    const labelMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'admin': 'Admin',
      'courses': 'Courses',
      'settings': 'Settings',
      'users': 'User Management',
      'course': 'Course',
      'materials': 'Materials',
      'live': 'Live Sessions',
      'analytics': 'Analytics'
    }
    
    if (labelMap[segment]) {
      label = labelMap[segment]
    }

    const isLast = index === segments.length - 1
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      isCurrent: isLast
    })
  })

  return breadcrumbs
}

interface BreadcrumbProps {
  className?: string
}

export default function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname()
  const breadcrumbs = pathToBreadcrumb(pathname)

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-500", className)}>
      {breadcrumbs.map((item, index) => (
        <div key={item.href || index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          )}
          
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "hover:text-gray-700 transition-colors",
                item.label === 'Home' && "flex items-center gap-1"
              )}
            >
              {item.label === 'Home' && <Home className="h-4 w-4" />}
              {item.label !== 'Home' && item.label}
            </Link>
          ) : (
            <span className={cn(
              "text-gray-900 font-medium",
              item.label === 'Home' && "flex items-center gap-1"
            )}>
              {item.label === 'Home' && <Home className="h-4 w-4" />}
              {item.label !== 'Home' && item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
} 