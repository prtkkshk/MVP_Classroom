'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { AlertTriangle, Home, RefreshCw, Bug, BarChart3, FileText } from 'lucide-react'
import { measurePerformance } from '@/lib/performance'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  enableReporting?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  showDetails: boolean
  isReporting: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      showDetails: props.showDetails || false,
      isReporting: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to analytics/monitoring service
    this.reportError(error, errorInfo)

    // Update state
    this.setState({ error, errorInfo })
  }

  // Report error to monitoring service
  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        performance: {
          memory: (performance as any).memory,
          navigation: performance.getEntriesByType('navigation')[0]
        }
      }

      // Send to error reporting endpoint
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      })
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  // Handle retry with performance monitoring
  handleRetry = async () => {
    await measurePerformance('Error Recovery', async () => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined 
      })
    })
  }

  // Handle going home
  handleGoHome = () => {
    window.location.href = '/'
  }

  // Toggle error details
  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  // Copy error details to clipboard
  copyErrorDetails = async () => {
    if (!this.state.error || !this.state.errorInfo) return

    const errorText = `
Error Details:
Message: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo.componentStack}
Error ID: ${this.state.errorId}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorText)
      // Show success feedback (you could use a toast here)
      console.log('Error details copied to clipboard')
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  // Get error severity level
  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (!this.state.error) return 'low'
    
    const message = this.state.error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) return 'medium'
    if (message.includes('authentication') || message.includes('auth')) return 'high'
    if (message.includes('database') || message.includes('critical')) return 'critical'
    
    return 'low'
  }

  // Get error category
  private getErrorCategory(): string {
    if (!this.state.error) return 'Unknown'
    
    const message = this.state.error.message.toLowerCase()
    
    if (message.includes('network')) return 'Network Error'
    if (message.includes('authentication')) return 'Authentication Error'
    if (message.includes('database')) return 'Database Error'
    if (message.includes('validation')) return 'Validation Error'
    if (message.includes('permission')) return 'Permission Error'
    
    return 'Application Error'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const severity = this.getErrorSeverity()
      const category = this.getErrorCategory()
      const severityColors = {
        low: 'bg-blue-100 text-blue-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800'
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
              
              {/* Error Category Badge */}
              <div className="mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColors[severity]}`}>
                  <Bug className="w-4 h-4 mr-2" />
                  {category}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details */}
              {this.state.showDetails && this.state.error && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Error Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.copyErrorDetails}
                      className="text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Message:</strong> {this.state.error.message}</p>
                    <p><strong>Error ID:</strong> {this.state.errorId}</p>
                    <p><strong>URL:</strong> {window.location.href}</p>
                    <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                  </div>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.toggleDetails} 
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {this.state.showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome} 
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Home
                  </Button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Performance monitoring active
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
} 