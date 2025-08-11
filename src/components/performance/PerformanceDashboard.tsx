'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Activity, 
  Zap, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  getPerformanceMetrics, 
  getPerformanceScore, 
  subscribeToPerformance,
  measurePerformance 
} from '@/lib/performance'

interface PerformanceMetrics {
  cls: number | null
  fid: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
  timestamp: number
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [score, setScore] = useState<number>(0)
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    // Get initial metrics
    const initialMetrics = getPerformanceMetrics()
    const initialScore = getPerformanceScore()
    
    setMetrics(initialMetrics)
    setScore(initialScore)

    // Subscribe to performance updates
    const unsubscribe = subscribeToPerformance((newMetrics) => {
      setMetrics(newMetrics)
      setScore(getPerformanceScore())
    })

    return unsubscribe
  }, [])

  // Get metric status
  const getMetricStatus = (name: string, value: number | null) => {
    if (value === null) return { status: 'pending', color: 'bg-gray-100 text-gray-800' }
    
    const thresholds = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    }
    
    const threshold = thresholds[name as keyof typeof thresholds]
    if (value <= threshold.good) return { status: 'good', color: 'bg-green-100 text-green-800' }
    if (value <= threshold.needsImprovement) return { status: 'needsImprovement', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'poor', color: 'bg-red-100 text-red-800' }
  }

  // Get metric icon
  const getMetricIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'needsImprovement': return <AlertTriangle className="w-4 h-4" />
      case 'poor': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  // Refresh metrics
  const refreshMetrics = async () => {
    await measurePerformance('Manual Refresh', async () => {
      const newMetrics = getPerformanceMetrics()
      const newScore = getPerformanceScore()
      setMetrics(newMetrics)
      setScore(newScore)
    })
  }

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Dashboard
          </CardTitle>
          <CardDescription>
            Loading performance metrics...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time performance monitoring and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleMonitoring}
            className={isMonitoring ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            {isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}
          </Button>
          <Button onClick={refreshMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Based on Core Web Vitals and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
              {score}
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {getScoreLabel(score)}
            </div>
            <Progress value={score} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CLS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cumulative Layout Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
                  </span>
                  <Badge className={getMetricStatus('CLS', metrics.cls).color}>
                    {getMetricStatus('CLS', metrics.cls).status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: ≤ 0.1</p>
              </CardContent>
            </Card>

            {/* FID */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">First Input Delay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
                  </span>
                  <Badge className={getMetricStatus('FID', metrics.fid).color}>
                    {getMetricStatus('FID', metrics.fid).status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: ≤ 100ms</p>
              </CardContent>
            </Card>

            {/* FCP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                  <Badge className={getMetricStatus('FCP', metrics.fcp).color}>
                    {getMetricStatus('FCP', metrics.fcp).status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: ≤ 1.8s</p>
              </CardContent>
            </Card>

            {/* LCP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                  <Badge className={getMetricStatus('LCP', metrics.lcp).color}>
                    {getMetricStatus('LCP', metrics.lcp).status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: ≤ 2.5s</p>
              </CardContent>
            </Card>

            {/* TTFB */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time to First Byte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
                  </span>
                  <Badge className={getMetricStatus('TTFB', metrics.ttfb).color}>
                    {getMetricStatus('TTFB', metrics.ttfb).status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: ≤ 800ms</p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">
                    {isMonitoring ? 'Active' : 'Inactive'}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isMonitoring ? 'Real-time tracking enabled' : 'Manual updates only'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>
                Comprehensive breakdown of all performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics).map(([key, value]) => {
                  if (key === 'timestamp') return null
                  
                  const status = getMetricStatus(key, value)
                  const icon = getMetricIcon(status.status)
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {icon}
                        <div>
                          <div className="font-medium">{key.toUpperCase()}</div>
                          <div className="text-sm text-gray-600">
                            {value !== null ? 
                              (key === 'cls' ? value.toFixed(4) : `${value.toFixed(0)}ms`) : 
                              'Not measured'
                            }
                          </div>
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                Actionable suggestions to improve your performance score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {score < 90 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      🚀 Performance Optimization Needed
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {metrics.cls && metrics.cls > 0.1 && (
                        <li>• Reduce layout shifts by fixing dynamic content loading</li>
                      )}
                      {metrics.fcp && metrics.fcp > 1800 && (
                        <li>• Optimize critical rendering path and reduce blocking resources</li>
                      )}
                      {metrics.lcp && metrics.lcp > 2500 && (
                        <li>• Optimize largest content element and improve server response time</li>
                      )}
                      {metrics.ttfb && metrics.ttfb > 800 && (
                        <li>• Improve server response time and optimize database queries</li>
                      )}
                    </ul>
                  </div>
                )}

                {score >= 90 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      🎉 Excellent Performance!
                    </h4>
                    <p className="text-sm text-green-700">
                      Your application is performing exceptionally well. Keep monitoring to maintain these high standards.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    💡 General Tips
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use image optimization and lazy loading</li>
                    <li>• Implement code splitting and tree shaking</li>
                    <li>• Enable compression and caching</li>
                    <li>• Monitor Core Web Vitals regularly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
