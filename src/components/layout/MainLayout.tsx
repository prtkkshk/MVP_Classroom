'use client'

import { ReactNode } from 'react'
import Breadcrumb from './Breadcrumb'

interface MainLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showBreadcrumb?: boolean
  className?: string
}

export default function MainLayout({
  children,
  title,
  description,
  showBreadcrumb = true,
  className
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Section */}
        {(title || showBreadcrumb) && (
          <div className="mb-6">
            {showBreadcrumb && (
              <div className="mb-4">
                <Breadcrumb />
              </div>
            )}
            
            {title && (
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-gray-600 mt-1">{description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className={className}>
          {children}
        </div>
      </div>
    </div>
  )
} 