import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Performance metrics interface
export interface PerformanceMetrics {
  cls: number | null
  fid: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
  timestamp: number
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
    timestamp: Date.now()
  }

  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set()

  constructor() {
    this.initializeWebVitals()
    this.initializePerformanceObserver()
  }

  // Initialize web vitals tracking
  private initializeWebVitals() {
    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.metrics.cls = metric.value
      this.notifyObservers()
      this.logMetric('CLS', metric.value)
    })

    // First Input Delay (FID)
    getFID((metric) => {
      this.metrics.fid = metric.value
      this.notifyObservers()
      this.logMetric('FID', metric.value)
    })

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.metrics.fcp = metric.value
      this.notifyObservers()
      this.logMetric('FCP', metric.value)
    })

    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.metrics.lcp = metric.value
      this.notifyObservers()
      this.logMetric('LCP', metric.value)
    })

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.metrics.ttfb = metric.value
      this.notifyObservers()
      this.logMetric('TTFB', metric.value)
    })
  }

  // Initialize Performance Observer for custom metrics
  private initializePerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.logNavigationTiming(navEntry)
          }
        }
      })

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] })
      } catch (e) {
        console.warn('Navigation timing observation not supported')
      }

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.logResourceTiming(resourceEntry)
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (e) {
        console.warn('Resource timing observation not supported')
      }
    }
  }

  // Log performance metric
  private logMetric(name: string, value: number) {
    const isGood = this.isMetricGood(name, value)
    const isNeedsImprovement = this.isMetricNeedsImprovement(name, value)
    const isPoor = this.isMetricPoor(name, value)

    console.log(`📊 ${name}: ${value.toFixed(2)}`, {
      status: isGood ? '🟢 Good' : isNeedsImprovement ? '🟡 Needs Improvement' : '🔴 Poor',
      threshold: this.getMetricThreshold(name)
    })

    // Send to analytics if poor performance
    if (isPoor) {
      this.reportPoorPerformance(name, value)
    }
  }

  // Check if metric is good
  private isMetricGood(name: string, value: number): boolean {
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 800
    }
    return value <= thresholds[name as keyof typeof thresholds]
  }

  // Check if metric needs improvement
  private isMetricNeedsImprovement(name: string, value: number): boolean {
    const thresholds = {
      CLS: 0.25,
      FID: 300,
      FCP: 3000,
      LCP: 4000,
      TTFB: 1800
    }
    return value <= thresholds[name as keyof typeof thresholds]
  }

  // Check if metric is poor
  private isMetricPoor(name: string, value: number): boolean {
    return !this.isMetricGood(name, value) && !this.isMetricNeedsImprovement(name, value)
  }

  // Get metric threshold
  private getMetricThreshold(name: string): number {
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 800
    }
    return thresholds[name as keyof typeof thresholds]
  }

  // Log navigation timing
  private logNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'Server Response': entry.responseEnd - entry.requestStart,
      'DOM Processing': entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      'Page Load': entry.loadEventEnd - entry.loadEventStart
    }

    console.log('🌐 Navigation Timing:', metrics)
  }

  // Log resource timing
  private logResourceTiming(entry: PerformanceResourceTiming) {
    const duration = entry.duration
    const size = entry.transferSize || 0

    if (duration > 1000) { // Log slow resources (>1s)
      console.log('🐌 Slow Resource:', {
        name: entry.name,
        duration: `${duration.toFixed(0)}ms`,
        size: `${(size / 1024).toFixed(1)}KB`,
        type: entry.initiatorType
      })
    }
  }

  // Report poor performance
  private reportPoorPerformance(name: string, value: number) {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'poor_performance', {
        metric_name: name,
        metric_value: value,
        page_url: window.location.href,
        timestamp: Date.now()
      })
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value: value,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(console.error)
  }

  // Subscribe to performance updates
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  // Notify observers of metric updates
  private notifyObservers() {
    this.observers.forEach(callback => callback(this.metrics))
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Measure custom performance
  measure(name: string, fn: () => void | Promise<void>) {
    const start = performance.now()
    
    if (fn.constructor.name === 'AsyncFunction') {
      return (fn as () => Promise<void>)().finally(() => {
        const duration = performance.now() - start
        this.logCustomMetric(name, duration)
      })
    } else {
      fn()
      const duration = performance.now() - start
      this.logCustomMetric(name, duration)
    }
  }

  // Log custom metric
  private logCustomMetric(name: string, duration: number) {
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    
    if (duration > 100) { // Log slow operations
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const scores = {
      cls: this.getMetricScore('CLS', this.metrics.cls || 0),
      fid: this.getMetricScore('FID', this.metrics.fid || 0),
      fcp: this.getMetricScore('FCP', this.metrics.fcp || 0),
      lcp: this.getMetricScore('LCP', this.metrics.lcp || 0),
      ttfb: this.getMetricScore('TTFB', this.metrics.ttfb || 0)
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    return Math.round(totalScore / Object.keys(scores).length)
  }

  // Get individual metric score
  private getMetricScore(name: string, value: number): number {
    if (this.isMetricGood(name, value)) return 100
    if (this.isMetricNeedsImprovement(name, value)) return 50
    return 0
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Export convenience functions
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return performanceMonitor.measure(name, fn)
}

export const getPerformanceMetrics = () => performanceMonitor.getMetrics()
export const getPerformanceScore = () => performanceMonitor.getPerformanceScore()
export const subscribeToPerformance = (callback: (metrics: PerformanceMetrics) => void) => {
  return performanceMonitor.subscribe(callback)
}

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  return {
    metrics: getPerformanceMetrics(),
    score: getPerformanceScore(),
    measure: measurePerformance
  }
}
