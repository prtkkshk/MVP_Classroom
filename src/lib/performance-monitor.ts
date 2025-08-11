// Comprehensive performance monitoring system for InLearn MVP

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'navigation' | 'resource' | 'user' | 'business' | 'error'
  metadata?: Record<string, any>
}

export interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
  action?: string
}

export interface PerformanceReport {
  timestamp: Date
  metrics: PerformanceMetric[]
  summary: {
    totalMetrics: number
    warnings: number
    critical: number
    averageResponseTime: number
    errorRate: number
  }
  recommendations: string[]
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThreshold[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isEnabled = true
  private maxMetrics = 10000
  private reportInterval = 60000 // 1 minute

  private constructor() {
    this.setupDefaultThresholds()
    this.initializeObservers()
    this.startPeriodicReporting()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (enabled) {
      this.initializeObservers()
    } else {
      this.cleanupObservers()
    }
  }

  // Add custom metric
  addMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return

    const newMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date()
    }

    this.metrics.push(newMetric)
    this.checkThresholds(newMetric)
    this.cleanupOldMetrics()
  }

  // Measure function execution time
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const executionTime = performance.now() - startTime
      
      this.addMetric({
        name: `function_execution_${name}`,
        value: executionTime,
        unit: 'ms',
        category: 'business',
        metadata: { ...metadata, success: true }
      })
      
      return result
    } catch (error) {
      const executionTime = performance.now() - startTime
      
      this.addMetric({
        name: `function_execution_${name}`,
        value: executionTime,
        unit: 'ms',
        category: 'error',
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : String(error) }
      })
      
      throw error
    }
  }

  // Measure API call performance
  async measureAPICall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const responseTime = performance.now() - startTime
      
      this.addMetric({
        name: 'api_response_time',
        value: responseTime,
        unit: 'ms',
        category: 'resource',
        metadata: { endpoint, method, success: true, ...metadata }
      })
      
      return result
    } catch (error) {
      const responseTime = performance.now() - startTime
      
      this.addMetric({
        name: 'api_response_time',
        value: responseTime,
        unit: 'ms',
        category: 'error',
        metadata: { endpoint, method, success: false, error: error instanceof Error ? error.message : String(error), ...metadata }
      })
      
      throw error
    }
  }

  // Measure component render time
  measureComponentRender(componentName: string, renderTime: number): void {
    this.addMetric({
      name: 'component_render_time',
      value: renderTime,
      unit: 'ms',
      category: 'user',
      metadata: { component: componentName }
    })
  }

  // Measure page load time
  measurePageLoad(pageName: string, loadTime: number): void {
    this.addMetric({
      name: 'page_load_time',
      value: loadTime,
      unit: 'ms',
      category: 'navigation',
      metadata: { page: pageName }
    })
  }

  // Measure user interaction time
  measureUserInteraction(action: string, interactionTime: number): void {
    this.addMetric({
      name: 'user_interaction_time',
      value: interactionTime,
      unit: 'ms',
      category: 'user',
      metadata: { action }
    })
  }

  // Get performance metrics
  getMetrics(
    category?: string,
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let filtered = this.metrics

    if (category) {
      filtered = filtered.filter(m => m.category === category)
    }

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime)
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get performance summary
  getSummary(timeRange: number = 24 * 60 * 60 * 1000): PerformanceReport {
    const now = new Date()
    const startTime = new Date(now.getTime() - timeRange)
    const recentMetrics = this.getMetrics(undefined, startTime, now)

    const apiMetrics = recentMetrics.filter(m => m.name === 'api_response_time')
    const errorMetrics = recentMetrics.filter(m => m.category === 'error')
    const warnings = recentMetrics.filter(m => this.checkThresholds(m).hasWarning).length
    const critical = recentMetrics.filter(m => this.checkThresholds(m).hasCritical).length

    const averageResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0

    const errorRate = recentMetrics.length > 0
      ? (errorMetrics.length / recentMetrics.length) * 100
      : 0

    const recommendations = this.generateRecommendations(recentMetrics)

    return {
      timestamp: now,
      metrics: recentMetrics,
      summary: {
        totalMetrics: recentMetrics.length,
        warnings,
        critical,
        averageResponseTime,
        errorRate
      },
      recommendations
    }
  }

  // Set performance thresholds
  setThreshold(threshold: PerformanceThreshold): void {
    const existingIndex = this.thresholds.findIndex(t => t.metric === threshold.metric)
    
    if (existingIndex >= 0) {
      this.thresholds[existingIndex] = threshold
    } else {
      this.thresholds.push(threshold)
    }
  }

  // Check thresholds for a metric
  private checkThresholds(metric: PerformanceMetric): { hasWarning: boolean; hasCritical: boolean } {
    const threshold = this.thresholds.find(t => t.metric === metric.name)
    
    if (!threshold) {
      return { hasWarning: false, hasCritical: false }
    }

    const hasWarning = metric.value >= threshold.warning
    const hasCritical = metric.value >= threshold.critical

    if (hasWarning || hasCritical) {
      this.handleThresholdViolation(metric, threshold, hasWarning, hasCritical)
    }

    return { hasWarning, hasCritical }
  }

  // Handle threshold violations
  private handleThresholdViolation(
    metric: PerformanceMetric,
    threshold: PerformanceThreshold,
    isWarning: boolean,
    isCritical: boolean
  ): void {
    const level = isCritical ? 'CRITICAL' : 'WARNING'
    const message = `Performance ${level}: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${isCritical ? threshold.critical : threshold.warning}${metric.unit})`
    
    console.warn(message, metric)
    
    // Emit custom event for external handling
    const event = new CustomEvent('performance-threshold-violation', {
      detail: { metric, threshold, level, message }
    })
    window.dispatchEvent(event)
  }

  // Generate performance recommendations
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []
    
    // API performance recommendations
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time')
    const slowAPIs = apiMetrics.filter(m => m.value > 1000)
    
    if (slowAPIs.length > 0) {
      recommendations.push(`Consider optimizing ${slowAPIs.length} slow API endpoints`)
    }

    // Component render recommendations
    const renderMetrics = metrics.filter(m => m.name === 'component_render_time')
    const slowRenders = renderMetrics.filter(m => m.value > 100)
    
    if (slowRenders.length > 0) {
      recommendations.push(`Optimize ${slowRenders.length} slow-rendering components`)
    }

    // Error rate recommendations
    const errorMetrics = metrics.filter(m => m.category === 'error')
    const errorRate = metrics.length > 0 ? (errorMetrics.length / metrics.length) * 100 : 0
    
    if (errorRate > 5) {
      recommendations.push(`High error rate (${errorRate.toFixed(1)}%). Investigate error sources`)
    }

    // Memory usage recommendations
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage')
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      if (avgMemory > 100 * 1024 * 1024) { // 100MB
        recommendations.push('High memory usage detected. Consider memory optimization')
      }
    }

    return recommendations
  }

  // Setup default performance thresholds
  private setupDefaultThresholds(): void {
    this.thresholds = [
      { metric: 'api_response_time', warning: 1000, critical: 3000, action: 'Optimize API endpoint' },
      { metric: 'component_render_time', warning: 100, critical: 300, action: 'Optimize component rendering' },
      { metric: 'page_load_time', warning: 2000, critical: 5000, action: 'Optimize page loading' },
      { metric: 'user_interaction_time', warning: 200, critical: 500, action: 'Optimize user interactions' },
      { metric: 'memory_usage', warning: 100 * 1024 * 1024, critical: 500 * 1024 * 1024, action: 'Check for memory leaks' }
    ]
  }

  // Initialize performance observers
  private initializeObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.addMetric({
                name: 'page_load_time',
                value: navEntry.loadEventEnd - navEntry.loadEventStart,
                unit: 'ms',
                category: 'navigation',
                metadata: { url: navEntry.name }
              })
            }
          }
        })
        
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error)
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming
              this.addMetric({
                name: 'resource_load_time',
                value: resourceEntry.duration,
                unit: 'ms',
                category: 'resource',
                metadata: { 
                  name: resourceEntry.name,
                  type: resourceEntry.initiatorType,
                  size: resourceEntry.transferSize
                }
              })
            }
          }
        })
        
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        console.warn('Resource timing observer not supported:', error)
      }

      // Long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              const longTaskEntry = entry as PerformanceEntry
              this.addMetric({
                name: 'long_task_duration',
                value: longTaskEntry.duration,
                unit: 'ms',
                category: 'user',
                metadata: { startTime: longTaskEntry.startTime }
              })
            }
          }
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        console.warn('Long task observer not supported:', error)
      }
    }
  }

  // Cleanup observers
  private cleanupObservers(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }

  // Start periodic reporting
  private startPeriodicReporting(): void {
    setInterval(() => {
      if (this.isEnabled) {
        const report = this.getSummary()
        this.sendReport(report)
      }
    }, this.reportInterval)
  }

  // Send performance report
  private sendReport(report: PerformanceReport): void {
    // Emit custom event for external handling
    const event = new CustomEvent('performance-report', { detail: report })
    window.dispatchEvent(event)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Report:', report)
    }
  }

  // Cleanup old metrics
  private cleanupOldMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime)
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Reset all metrics
  reset(): void {
    this.metrics = []
    console.log('Performance metrics reset')
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  // Import metrics from external source
  importMetrics(metricsJson: string): void {
    try {
      const importedMetrics = JSON.parse(metricsJson) as PerformanceMetric[]
      this.metrics.push(...importedMetrics)
      console.log(`Imported ${importedMetrics.length} metrics`)
    } catch (error) {
      console.error('Failed to import metrics:', error)
    }
  }
}

// Performance monitoring hooks
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    addMetric: monitor.addMetric.bind(monitor),
    measureFunction: monitor.measureFunction.bind(monitor),
    measureAPICall: monitor.measureAPICall.bind(monitor),
    measureComponentRender: monitor.measureComponentRender.bind(monitor),
    measurePageLoad: monitor.measurePageLoad.bind(monitor),
    measureUserInteraction: monitor.measureUserInteraction.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getSummary: monitor.getSummary.bind(monitor),
    setThreshold: monitor.setThreshold.bind(monitor),
    reset: monitor.reset.bind(monitor)
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
