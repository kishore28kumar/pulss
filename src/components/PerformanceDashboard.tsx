import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Gauge, 
  Lightning, 
  Cpu, 
  HardDrive, 
  WifiHigh, 
  Shield, 
  TrendUp,
  Warning,
  CheckCircle,
  Clock,
  Users,
  Eye,
  Download
} from '@phosphor-icons/react'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  responseTime: number
}

interface UserActivity {
  activeUsers: number
  totalSessions: number
  bounceRate: number
  avgSessionDuration: string
  pageViews: number
}

const MetricCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendUp className="w-4 h-4 text-red-500 transform rotate-180" />
      default: return <span className="w-4 h-4 text-gray-400">—</span>
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{metric.name}</h3>
          {getTrendIcon(metric.trend)}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{metric.value}</span>
          <span className="text-sm text-muted-foreground">{metric.unit}</span>
        </div>
        <Badge className={`text-xs mt-2 ${getStatusColor(metric.status)}`}>
          {metric.status.toUpperCase()}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
      </CardContent>
    </Card>
  )
}

const SystemHealthCard: React.FC<{ health: SystemHealth }> = ({ health }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Cpu className="w-5 h-5" />
        System Health
      </CardTitle>
      <CardDescription>Real-time system resource monitoring</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>CPU Usage</span>
            <span>{health.cpu}%</span>
          </div>
          <Progress 
            value={health.cpu} 
            className={`h-2 ${health.cpu > 80 ? 'bg-red-200' : health.cpu > 60 ? 'bg-yellow-200' : 'bg-green-200'}`}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Memory Usage</span>
            <span>{health.memory}%</span>
          </div>
          <Progress 
            value={health.memory} 
            className={`h-2 ${health.memory > 80 ? 'bg-red-200' : health.memory > 60 ? 'bg-yellow-200' : 'bg-green-200'}`}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Disk Usage</span>
            <span>{health.disk}%</span>
          </div>
          <Progress 
            value={health.disk} 
            className={`h-2 ${health.disk > 80 ? 'bg-red-200' : health.disk > 60 ? 'bg-yellow-200' : 'bg-green-200'}`}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Network Load</span>
            <span>{health.network}%</span>
          </div>
          <Progress 
            value={health.network} 
            className={`h-2 ${health.network > 80 ? 'bg-red-200' : health.network > 60 ? 'bg-yellow-200' : 'bg-green-200'}`}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Uptime</span>
          </div>
          <div className="font-medium">{health.uptime}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lightning className="w-4 h-4" />
            <span>Response Time</span>
          </div>
          <div className="font-medium">{health.responseTime}ms</div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const UserActivityCard: React.FC<{ activity: UserActivity }> = ({ activity }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="w-5 h-5" />
        User Activity
      </CardTitle>
      <CardDescription>Live user engagement metrics</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-green-600">{activity.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{activity.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">{activity.bounceRate}%</div>
            <div className="text-sm text-muted-foreground">Bounce Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{activity.pageViews}</div>
            <div className="text-sm text-muted-foreground">Page Views</div>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Average Session Duration</span>
        </div>
        <div className="text-lg font-semibold">{activity.avgSessionDuration}</div>
      </div>
    </CardContent>
  </Card>
)

export const PerformanceDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Simulated real-time data
  const [systemHealth] = useState<SystemHealth>({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 23,
    uptime: '15 days, 4 hours',
    responseTime: 145
  })

  const [userActivity] = useState<UserActivity>({
    activeUsers: 127,
    totalSessions: 1456,
    bounceRate: 23.5,
    avgSessionDuration: '3m 42s',
    pageViews: 8934
  })

  const performanceMetrics: PerformanceMetric[] = useMemo(() => [
    {
      name: 'Page Load Speed',
      value: 1.8,
      unit: 'sec',
      status: 'good',
      trend: 'stable',
      description: 'Average page load time across all pages'
    },
    {
      name: 'API Response Time',
      value: 145,
      unit: 'ms',
      status: 'good',
      trend: 'down',
      description: 'Average API endpoint response time'
    },
    {
      name: 'Error Rate',
      value: 0.12,
      unit: '%',
      status: 'good',
      trend: 'down',
      description: 'Application error rate in last hour'
    },
    {
      name: 'Database Query Time',
      value: 23,
      unit: 'ms',
      status: 'good',
      trend: 'stable',
      description: 'Average database query execution time'
    },
    {
      name: 'Cache Hit Rate',
      value: 94.2,
      unit: '%',
      status: 'good',
      trend: 'up',
      description: 'Percentage of requests served from cache'
    },
    {
      name: 'CDN Bandwidth',
      value: 2.4,
      unit: 'GB',
      status: 'warning',
      trend: 'up',
      description: 'Content delivery network usage today'
    }
  ], [])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setIsLoading(false)
    }, 1000)
  }

  const getOverallHealth = () => {
    const criticalCount = performanceMetrics.filter(m => m.status === 'critical').length
    const warningCount = performanceMetrics.filter(m => m.status === 'warning').length
    
    if (criticalCount > 0) return { status: 'critical', message: `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}` }
    if (warningCount > 0) return { status: 'warning', message: `${warningCount} warning${warningCount > 1 ? 's' : ''}` }
    return { status: 'good', message: 'All systems operational' }
  }

  const overallHealth = getOverallHealth()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time system performance and user activity monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {overallHealth.status === 'good' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {overallHealth.status === 'warning' && <Warning className="w-5 h-5 text-yellow-500" />}
            {overallHealth.status === 'critical' && <Warning className="w-5 h-5 text-red-500" />}
            <span className="text-sm font-medium">{overallHealth.message}</span>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Last Refresh Info */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh in 30s
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <SystemHealthCard health={systemHealth} />

        {/* User Activity */}
        <UserActivityCard activity={userActivity} />
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Performance Insights
          </CardTitle>
          <CardDescription>Automated recommendations based on current metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Excellent Performance</h4>
                <p className="text-sm text-green-700">
                  Your application is performing well with fast response times and low error rates.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Warning className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">CDN Bandwidth Monitoring</h4>
                <p className="text-sm text-yellow-700">
                  CDN usage is higher than usual. Consider optimizing image sizes or implementing lazy loading.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">User Engagement</h4>
                <p className="text-sm text-blue-700">
                  Active user count is 15% higher than yesterday. Consider scaling resources if needed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common performance optimization tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" size="sm">
              <HardDrive className="w-4 h-4 mr-2" />
              Optimize Database
            </Button>
            <Button variant="outline" size="sm">
              <WifiHigh className="w-4 h-4 mr-2" />
              Test Network Speed
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}