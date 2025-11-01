import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { 
  WarningCircle, 
  CheckCircle, 
  XCircle, 
  Database,
  Globe,
  Gauge,
  ArrowClockwise,
  Clock,
  Shield,
  Code,
  Users,
  Storefront,
  Gear as GearIcon,
  Truck as TruckIcon
} from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { PerformanceMonitor } from '../components/PerformanceMonitor'

interface HealthStatus {
  database: 'ok' | 'warning' | 'error'
  api: 'ok' | 'warning' | 'error'
  auth: 'ok' | 'warning' | 'error'
  storage: 'ok' | 'warning' | 'error'
  performance: number
  uptime: number
  lastChecked: Date
}

const HealthCheck = ({ name, status, description, icon }: { 
  name: string
  status: 'ok' | 'warning' | 'error'
  description: string
  icon?: React.ReactNode
}) => {
  const icons = {
    ok: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <WarningCircle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />
  }

  const variants = {
    ok: 'default',
    warning: 'secondary',
    error: 'destructive'
  } as const

  const bgColors = {
    ok: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${bgColors[status]}`}>
      <div className="flex items-center gap-3">
        {icon || icons[status]}
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
    </div>
  )
}

export const Health = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const superAdminEmail = import.meta.env.VITE_DEFAULT_SUPERADMIN_EMAIL
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    runHealthCheck()
  }, [])

  const runHealthCheck = async () => {
    setIsChecking(true)
    try {
      const startTime = performance.now()
      
      // Database connectivity check
      let databaseStatus: HealthStatus['database'] = 'error'
      try {
        const { error } = await supabase.from('tenants').select('count').limit(1)
        databaseStatus = error ? 'error' : 'ok'
      } catch (e) {
        databaseStatus = 'error'
      }

      // API responsiveness check
      let apiStatus: HealthStatus['api'] = 'error'
      try {
        const response = await fetch('/health', { method: 'HEAD' })
        apiStatus = response.ok ? 'ok' : 'warning'
      } catch (e) {
        apiStatus = 'error'
      }

      // Auth service check
      let authStatus: HealthStatus['auth'] = 'error'
      try {
        const { data, error } = await supabase.auth.getSession()
        authStatus = error ? 'warning' : 'ok'
      } catch (e) {
        authStatus = 'error'
      }

      // Storage service check
      let storageStatus: HealthStatus['storage'] = 'error'
      try {
        const { data, error } = await supabase.storage.listBuckets()
        storageStatus = error ? 'warning' : 'ok'
      } catch (e) {
        storageStatus = 'error'
      }

      const endTime = performance.now()
      const responseTime = endTime - startTime

      setHealthStatus({
        database: databaseStatus,
        api: apiStatus,
        auth: authStatus,
        storage: storageStatus,
        performance: responseTime,
        uptime: performance.now(),
        lastChecked: new Date()
      })
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const configChecks = [
    {
      name: 'Supabase URL',
      status: supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' ? 'ok' as const : 'error' as const,
      description: supabaseUrl ? `Connected to ${new URL(supabaseUrl).hostname}` : 'Not configured',
      icon: <Database className="h-5 w-5 text-blue-500" />
    },
    {
      name: 'Supabase Anon Key',
      status: supabaseKey && supabaseKey !== 'placeholder-key' ? 'ok' as const : 'error' as const,
      description: supabaseKey ? `Configured (${supabaseKey.slice(0, 20)}...)` : 'Not configured',
      icon: <Shield className="h-5 w-5 text-purple-500" />
    },
    {
      name: 'Super Admin Email',
      status: superAdminEmail ? 'ok' as const : 'warning' as const,
      description: superAdminEmail || 'Not configured - default super admin access disabled',
      icon: <Users className="h-5 w-5 text-green-500" />
    },
    {
      name: 'Google Maps API',
      status: googleMapsKey ? 'ok' as const : 'warning' as const,
      description: googleMapsKey ? 'Configured - tracking enabled' : 'Not configured - maps tracking disabled',
      icon: <Globe className="h-5 w-5 text-orange-500" />
    }
  ]

  const serviceChecks = healthStatus ? [
    {
      name: 'Database Connection',
      status: healthStatus.database,
      description: healthStatus.database === 'ok' ? 'Connected and responsive' : 'Connection failed or slow',
      icon: <Database className="h-5 w-5 text-blue-500" />
    },
    {
      name: 'API Services',
      status: healthStatus.api,
      description: healthStatus.api === 'ok' ? `Responsive (${healthStatus.performance.toFixed(0)}ms)` : 'API issues detected',
      icon: <Code className="h-5 w-5 text-indigo-500" />
    },
    {
      name: 'Authentication',
      status: healthStatus.auth,
      description: healthStatus.auth === 'ok' ? 'Auth service operational' : 'Auth service issues',
      icon: <Shield className="h-5 w-5 text-purple-500" />
    },
    {
      name: 'File Storage',
      status: healthStatus.storage,
      description: healthStatus.storage === 'ok' ? 'Storage accessible' : 'Storage service issues',
      icon: <Storefront className="h-5 w-5 text-cyan-500" />
    }
  ] : []

  const criticalIssues = [...configChecks, ...serviceChecks].filter(c => c.status === 'error').length
  const warnings = [...configChecks, ...serviceChecks].filter(c => c.status === 'warning').length
  const overallStatus = criticalIssues > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok'

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'ok': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
    }
  }

  const getOverallStatusBg = () => {
    switch (overallStatus) {
      case 'ok': return 'bg-green-100 border-green-300'
      case 'warning': return 'bg-yellow-100 border-yellow-300'
      case 'error': return 'bg-red-100 border-red-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pulss Health Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                System status, performance metrics, and configuration validation
              </p>
            </div>
          </div>
        </div>

        {/* Overall Status Card */}
        <Card className={`mb-8 ${getOverallStatusBg()}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-3 text-2xl ${getOverallStatusColor()}`}>
              {overallStatus === 'ok' && <CheckCircle className="h-8 w-8" />}
              {overallStatus === 'warning' && <WarningCircle className="h-8 w-8" />}
              {overallStatus === 'error' && <XCircle className="h-8 w-8" />}
              <span>
                {overallStatus === 'ok' && 'System Healthy'}
                {overallStatus === 'warning' && 'System Operational with Warnings'}
                {overallStatus === 'error' && 'Critical Issues Detected'}
              </span>
            </CardTitle>
            <CardDescription className="text-lg">
              {criticalIssues === 0 
                ? 'All critical systems are operational' 
                : `${criticalIssues} critical issue${criticalIssues === 1 ? '' : 's'} found`}
              {warnings > 0 && `, ${warnings} warning${warnings === 1 ? '' : 's'}`}
              {healthStatus && (
                <span className="ml-4 text-sm">
                  Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {healthStatus && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {healthStatus.performance.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(healthStatus.uptime / 1000 / 60)}m
                      </div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPerformanceMonitor(true)}
                  className="gap-2"
                >
                  <Gauge className="w-4 h-4" />
                  Performance
                </Button>
                <Button onClick={runHealthCheck} disabled={isChecking} className="gap-2">
                  <ArrowClockwise className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GearIcon className="h-5 w-5" />
                Configuration Status
              </CardTitle>
              <CardDescription>Environment variables and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configChecks.map((check, index) => (
                <HealthCheck key={index} {...check} />
              ))}
            </CardContent>
          </Card>

          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Service Status
              </CardTitle>
              <CardDescription>
                Live status of backend services
                {isChecking && (
                  <div className="inline-flex items-center gap-2 ml-2 text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs">Checking...</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceChecks.length > 0 ? (
                serviceChecks.map((check, index) => (
                  <HealthCheck key={index} {...check} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Run health check to see service status</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {healthStatus && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge variant={healthStatus.performance < 1000 ? 'default' : 'secondary'}>
                      {healthStatus.performance < 500 ? 'Excellent' : 
                       healthStatus.performance < 1000 ? 'Good' : 
                       healthStatus.performance < 2000 ? 'Fair' : 'Slow'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{healthStatus.performance.toFixed(0)}ms</div>
                  <Progress 
                    value={Math.min((healthStatus.performance / 2000) * 100, 100)} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.floor(healthStatus.uptime / 1000 / 60)}m
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Health</span>
                    <Badge variant={overallStatus === 'ok' ? 'default' : 'destructive'}>
                      {overallStatus === 'ok' ? 'Healthy' : 'Issues'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(((configChecks.length + serviceChecks.length - criticalIssues - warnings) / (configChecks.length + serviceChecks.length)) * 100)}%
                  </div>
                  <Progress 
                    value={((configChecks.length + serviceChecks.length - criticalIssues - warnings) / (configChecks.length + serviceChecks.length)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Access */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Navigate to different parts of the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/super" 
                className="group p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-purple-50 to-indigo-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-purple-600" />
                  <div className="font-semibold group-hover:text-primary">Super Admin</div>
                </div>
                <div className="text-sm text-muted-foreground">Manage tenants and global settings</div>
              </a>
              
              <a 
                href="/admin" 
                className="group p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-blue-50 to-cyan-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Storefront className="h-6 w-6 text-blue-600" />
                  <div className="font-semibold group-hover:text-primary">Admin Portal</div>
                </div>
                <div className="text-sm text-muted-foreground">Manage your store and inventory</div>
              </a>
              
              <a 
                href="/" 
                className="group p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Storefront className="h-6 w-6 text-green-600" />
                  <div className="font-semibold group-hover:text-primary">Customer Store</div>
                </div>
                <div className="text-sm text-muted-foreground">Browse and order products</div>
              </a>
              
              <a 
                href="/delivery" 
                className="group p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-orange-50 to-yellow-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TruckIcon className="h-6 w-6 text-orange-600" />
                  <div className="font-semibold group-hover:text-primary">Delivery App</div>
                </div>
                <div className="text-sm text-muted-foreground">Manage order deliveries</div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions for Critical Issues */}
        {criticalIssues > 0 && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Setup Required
              </CardTitle>
              <CardDescription className="text-red-600">
                Critical configuration missing. Follow these steps to complete setup:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-red-800 mb-2">Database Setup</h4>
                  <ol className="list-decimal list-inside space-y-1 text-red-700 text-sm">
                    <li>Create a new Supabase project at <code className="bg-red-100 px-1 rounded">supabase.com</code></li>
                    <li>Copy the Project URL and anon key from Settings → API</li>
                    <li>Update your <code className="bg-red-100 px-1 rounded">.env.local</code> file with these values</li>
                    <li>Run the database schema from <code className="bg-red-100 px-1 rounded">supabase/schema.sql</code></li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-red-800 mb-2">Admin Setup</h4>
                  <p className="text-red-700 text-sm">
                    Set <code className="bg-red-100 px-1 rounded">VITE_DEFAULT_SUPERADMIN_EMAIL</code> to enable super admin access.
                    This should be your email address to access the super admin panel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Footer */}
        <Footer variant="minimal" />
      </div>

      {/* Performance Monitor Modal */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />
    </div>
  )
}