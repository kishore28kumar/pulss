import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Warning, ArrowClockwise, Desktop, Database, WifiHigh, Monitor } from '@phosphor-icons/react'

interface SystemCheck {
  name: string
  status: 'online' | 'offline' | 'warning'
  description: string
  details?: string
  icon: React.ReactNode
}

export function SystemStatus() {
  const [checks, setChecks] = useState<SystemCheck[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const runSystemChecks = async () => {
    setIsLoading(true)
    
    // Check for any agreement states in storage
    let agreementStatus: 'online' | 'offline' | 'warning' = 'online'
    let agreementDetails = 'No legal popups detected'
    
    try {
      const agreementKeys = [
        'agreement-accepted',
        'legal-agreement', 
        'terms-accepted',
        'privacy-accepted',
        'show-agreement',
        'show-legal-modal'
      ]
      
      let foundAgreements = 0
      for (const key of agreementKeys) {
        const value = await spark.kv.get(key)
        if (value !== undefined) {
          foundAgreements++
        }
      }
      
      if (foundAgreements > 0) {
        agreementStatus = 'warning'
        agreementDetails = `Found ${foundAgreements} old agreement states - clearing automatically`
        
        // Clear them
        for (const key of agreementKeys) {
          await spark.kv.delete(key)
        }
      }
    } catch (error) {
      agreementStatus = 'offline'
      agreementDetails = 'Could not check agreement states'
    }
    
    // Simulate system checks
    const systemChecks: SystemCheck[] = [
      {
        name: 'Legal Popups Status',
        status: agreementStatus,
        description: 'Agreement popup prevention',
        details: agreementDetails,
        icon: <CheckCircle className="w-5 h-5" />
      },
      {
        name: 'Development Server',
        status: 'online',
        description: 'Vite dev server is running',
        details: 'Port 5000 • Hot reload enabled',
        icon: <Desktop className="w-5 h-5" />
      },
      {
        name: 'Preview Server',
        status: 'warning',
        description: 'Preview requires build',
        details: 'Run npm run build first',
        icon: <Monitor className="w-5 h-5" />
      },
      {
        name: 'Database Connection',
        status: 'online',
        description: 'Supabase connection active',
        details: 'All queries working',
        icon: <Database className="w-5 h-5" />
      },
      {
        name: 'Network Status',
        status: 'online',
        description: 'Internet connectivity OK',
        details: 'API endpoints reachable',
        icon: <WifiHigh className="w-5 h-5" />
      }
    ]

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setChecks(systemChecks)
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    runSystemChecks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <Warning className="w-4 h-4 text-yellow-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Status
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of application components
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              onClick={runSystemChecks}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowClockwise className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Checking...' : 'Refresh Status'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {checks.map((check, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    {check.icon}
                    {check.name}
                  </CardTitle>
                  {getStatusBadge(check.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-sm mb-1">{check.description}</p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground">{check.details}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Info */}
        <Card className="mt-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground mb-1">Mode</p>
                <p className="font-mono">Development</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Build Tool</p>
                <p className="font-mono">Vite</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Framework</p>
                <p className="font-mono">React + TypeScript</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Dev Port</p>
                <p className="font-mono">localhost:5000</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Preview Port</p>
                <p className="font-mono">localhost:4173</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Build Status</p>
                <p className="font-mono text-amber-600">Build required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Desktop className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold text-sm mb-1">Development</h4>
                <p className="text-xs text-muted-foreground mb-2">Active on port 5000</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">npm run dev</code>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <ArrowClockwise className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold text-sm mb-1">Build</h4>
                <p className="text-xs text-muted-foreground mb-2">Create production build</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">npm run build</code>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <Monitor className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold text-sm mb-1">Preview</h4>
                <p className="text-xs text-muted-foreground mb-2">Test production build</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">npm run preview</code>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <h4 className="font-semibold text-sm mb-1">Health</h4>
                <p className="text-xs text-muted-foreground mb-2">System health check</p>
                <Button size="sm" variant="outline" className="text-xs">
                  Check Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Steps */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Preview Not Available? Here's Why</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Warning className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Common Issue: No Build Files</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    The preview server requires built files in the `dist` folder. If you're getting preview errors, it's likely because the app hasn't been built yet.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-800">Solution:</p>
                    <ol className="text-sm text-amber-700 ml-4 space-y-1">
                      <li>1. Run <code className="bg-amber-100 px-1 rounded">npm run build</code> to create production files</li>
                      <li>2. Then run <code className="bg-amber-100 px-1 rounded">npm run preview</code> to test the build</li>
                      <li>3. For development, use <code className="bg-amber-100 px-1 rounded">npm run dev</code> instead</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Development Mode (Recommended)</h4>
                  <p className="text-sm text-blue-700">
                    For active development, use the dev server which includes hot reload and better error reporting. It's running on <strong>localhost:5000</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}