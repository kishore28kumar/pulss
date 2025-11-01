import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChartLine, 
  Clock, 
  Database, 
  Globe,
  Warning,
  CheckCircle,
  Info,
  Gauge
} from '@phosphor-icons/react'

interface PerformanceMetrics {
  pageLoadTime: number
  coreWebVitals: {
    lcp: number // Largest Contentful Paint
    fid: number // First Input Delay
    cls: number // Cumulative Layout Shift
  }
  networkSpeed: 'slow' | 'fast' | 'unknown'
  memoryUsage: number
  apiResponseTime: number
  errorRate: number
  uptime: number
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  onClose?: () => void
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)

  useEffect(() => {
    if (isVisible) {
      collectMetrics()
    }
  }, [isVisible])

  const collectMetrics = async () => {
    setIsCollecting(true)
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      // Core Web Vitals collection
      const vitals = await getCoreWebVitals()
      
      const performanceMetrics: PerformanceMetrics = {
        pageLoadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
        coreWebVitals: vitals,
        networkSpeed: getNetworkSpeed(connection),
        memoryUsage: getMemoryUsage(),
        apiResponseTime: await measureApiResponseTime(),
        errorRate: calculateErrorRate(),
        uptime: performance.now()
      }
      
      setMetrics(performanceMetrics)
    } catch (error) {
      console.error('Failed to collect performance metrics:', error)
    } finally {
      setIsCollecting(false)
    }
  }

  const getCoreWebVitals = async (): Promise<PerformanceMetrics['coreWebVitals']> => {
    return new Promise((resolve) => {
      // Simulate Core Web Vitals collection
      // In a real app, you'd use web-vitals library
      setTimeout(() => {
        resolve({
          lcp: Math.random() * 2000 + 1000, // 1-3 seconds
          fid: Math.random() * 100 + 50,    // 50-150ms
          cls: Math.random() * 0.1          // 0-0.1
        })
      }, 100)
    })
  }

  const getNetworkSpeed = (connection: any): 'slow' | 'fast' | 'unknown' => {
    if (!connection) return 'unknown'
    
    const effectiveType = connection.effectiveType || connection.type
    
    if (effectiveType === '4g' || effectiveType === '5g') return 'fast'
    if (effectiveType === '3g' || effectiveType === '2g') return 'slow'
    return 'unknown'
  }

  const getMemoryUsage = (): number => {
    // @ts-ignore
    const memory = (performance as any).memory
    if (!memory) return 0
    
    return Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  }

  const measureApiResponseTime = async (): Promise<number> => {
    try {
      const start = performance.now()
      await fetch('/health', { method: 'HEAD' })
      const end = performance.now()
      return Math.round(end - start)
    } catch {
      return -1
    }
  }

  const calculateErrorRate = (): number => {
    // In a real app, this would track actual errors
    return Math.random() * 5 // 0-5% error rate
  }

  const getScoreColor = (score: number, thresholds: { good: number; needs_improvement: number }) => {
    if (score <= thresholds.good) return 'text-green-600'
    if (score <= thresholds.needs_improvement) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number, thresholds: { good: number; needs_improvement: number }) => {
    if (score <= thresholds.good) return <Badge className="bg-green-100 text-green-800">Good</Badge>
    if (score <= thresholds.needs_improvement) return <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gauge className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Performance Monitor</h2>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {isCollecting && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Collecting performance metrics...</p>
            </div>
          )}

          {metrics && (
            <div className="space-y-6">
              {/* Core Web Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine className="w-5 h-5" />
                    Core Web Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Largest Contentful Paint</span>
                        {getScoreBadge(metrics.coreWebVitals.lcp, { good: 2500, needs_improvement: 4000 })}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.lcp, { good: 2500, needs_improvement: 4000 })}`}>
                        {Math.round(metrics.coreWebVitals.lcp)}ms
                      </div>
                      <Progress 
                        value={Math.min((metrics.coreWebVitals.lcp / 4000) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">First Input Delay</span>
                        {getScoreBadge(metrics.coreWebVitals.fid, { good: 100, needs_improvement: 300 })}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.fid, { good: 100, needs_improvement: 300 })}`}>
                        {Math.round(metrics.coreWebVitals.fid)}ms
                      </div>
                      <Progress 
                        value={Math.min((metrics.coreWebVitals.fid / 300) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cumulative Layout Shift</span>
                        {getScoreBadge(metrics.coreWebVitals.cls, { good: 0.1, needs_improvement: 0.25 })}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.cls, { good: 0.1, needs_improvement: 0.25 })}`}>
                        {metrics.coreWebVitals.cls.toFixed(3)}
                      </div>
                      <Progress 
                        value={Math.min((metrics.coreWebVitals.cls / 0.25) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Page Load Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.pageLoadTime}ms
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.pageLoadTime < 1000 ? 'Excellent' : 
                       metrics.pageLoadTime < 3000 ? 'Good' : 'Needs improvement'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      API Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.apiResponseTime === -1 ? 'N/A' : `${metrics.apiResponseTime}ms`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.apiResponseTime < 200 ? 'Fast' : 
                       metrics.apiResponseTime < 500 ? 'Moderate' : 'Slow'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Network Speed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize text-purple-600">
                      {metrics.networkSpeed}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connection type
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.memoryUsage}%
                    </div>
                    <Progress value={metrics.memoryUsage} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Performance Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.coreWebVitals.lcp > 2500 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Warning className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Improve Largest Contentful Paint
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Consider optimizing images, using CDN, or improving server response times.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {metrics.memoryUsage > 80 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <Warning className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            High Memory Usage
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            Memory usage is above 80%. Consider closing unused tabs or refreshing the page.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {metrics.apiResponseTime > 500 && (
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <Warning className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">
                            Slow API Response
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            API responses are slower than expected. Check network connection.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {metrics.coreWebVitals.lcp <= 2500 && metrics.memoryUsage <= 80 && metrics.apiResponseTime <= 500 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Excellent Performance
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            All performance metrics are within optimal ranges.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={collectMetrics} disabled={isCollecting}>
                  Refresh Metrics
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}