import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Play,
  User,
  Crown,
  Truck,
  ShieldCheck,
  Eye,
  UserCircle,
  Info,
  Sparkle
} from '@phosphor-icons/react'

interface DemoModeToggleProps {
  className?: string
}

interface DemoCredentials {
  role: string
  email: string
  password: string
  description: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
}

const DEMO_CREDENTIALS: DemoCredentials[] = [
  {
    role: 'Super Admin',
    email: 'demo.superadmin@pulss.com',
    password: 'demo123',
    description: 'Full platform access with all tenant management capabilities',
    features: [
      'Manage all tenants',
      'Global analytics',
      'Feature flag controls',
      'Demo data seeding',
      'System-wide settings'
    ],
    icon: Crown
  },
  {
    role: 'Tenant Admin',
    email: 'demo.admin@pulss.com',
    password: 'demo123',
    description: 'Complete pharmacy management for a single tenant',
    features: [
      'Inventory management',
      'Order processing',
      'Customer management',
      'Analytics dashboard',
      'Store settings'
    ],
    icon: ShieldCheck
  },
  {
    role: 'Customer',
    email: 'demo.customer@pulss.com',
    password: 'demo123',
    description: 'Customer shopping experience with full e-commerce features',
    features: [
      'Browse products',
      'Place orders',
      'Upload prescriptions',
      'Track deliveries',
      'Loyalty rewards'
    ],
    icon: User
  },
  {
    role: 'Delivery Partner',
    email: 'demo.delivery@pulss.com',
    password: 'demo123',
    description: 'Delivery partner interface for order fulfillment',
    features: [
      'View assigned orders',
      'Update delivery status',
      'GPS tracking',
      'Customer communication',
      'Earnings dashboard'
    ],
    icon: Truck
  }
]

export const DemoModeToggle: React.FC<DemoModeToggleProps> = ({ className }) => {
  const { user, profile } = useAuth()
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<DemoCredentials | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Check if we're in demo mode
  useEffect(() => {
    const checkDemoMode = () => {
      const demoEmails = DEMO_CREDENTIALS.map(cred => cred.email)
      setIsDemoMode(user?.email ? demoEmails.includes(user.email) : false)
    }
    
    checkDemoMode()
  }, [user])

  const handleDemoLogin = async (credentials: DemoCredentials) => {
    setIsLoggingIn(true)
    
    try {
      // First, try to sign out current user
      await supabase.auth.signOut()
      
      // Sign in with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
      
      if (error) {
        // If user doesn't exist, we could create demo users here
        // For now, just show a helpful error
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Demo user not found', {
            description: 'Demo users need to be created in the database first. Please contact your administrator.'
          })
        } else {
          throw error
        }
        return
      }

      toast.success(`Logged in as ${credentials.role}`, {
        description: 'You can now explore the demo features and workflows.'
      })

      // Close dialog and refresh page to ensure proper state
      setIsDialogOpen(false)
      window.location.reload()
      
    } catch (error: any) {
      console.error('Demo login error:', error)
      toast.error('Failed to login as demo user', {
        description: error.message
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleExitDemo = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Exited demo mode', {
        description: 'You have been logged out from the demo account.'
      })
      window.location.href = '/signin'
    } catch (error: any) {
      toast.error('Failed to exit demo mode', {
        description: error.message
      })
    }
  }

  const openDemoSelection = () => {
    setIsDialogOpen(true)
  }

  const selectDemo = (demo: DemoCredentials) => {
    setSelectedDemo(demo)
  }

  if (isDemoMode) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkle className="h-5 w-5 text-primary" />
            Demo Mode Active
          </CardTitle>
          <CardDescription>
            You're currently exploring the platform as a demo user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <UserCircle className="h-8 w-8 text-primary" />
            <div>
              <div className="font-medium">
                {DEMO_CREDENTIALS.find(c => c.email === user?.email)?.role || 'Demo User'}
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.email}
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is a demonstration environment. All data is for testing purposes and may be reset periodically.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openDemoSelection}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Switch Demo Role
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitDemo}
              className="flex-1"
            >
              Exit Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5" />
            Demo Mode
          </CardTitle>
          <CardDescription>
            Explore the platform with pre-configured demo accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={openDemoSelection} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Start Demo Experience
          </Button>
        </CardContent>
      </Card>

      {/* Demo Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle className="h-5 w-5" />
              Choose Your Demo Experience
            </DialogTitle>
            <DialogDescription>
              Select a role to explore different aspects of the Pulss platform with realistic demo data.
            </DialogDescription>
          </DialogHeader>

          {selectedDemo ? (
            /* Selected Demo Details */
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You're about to login as a <strong>{selectedDemo.role}</strong>. 
                  This will sign you out of your current account if you're logged in.
                </AlertDescription>
              </Alert>

              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                      <selectedDemo.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{selectedDemo.role}</h3>
                        <Badge variant="secondary">Demo Account</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedDemo.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Features:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {selectedDemo.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Login Credentials:</div>
                        <div className="font-mono text-sm">
                          <div>Email: {selectedDemo.email}</div>
                          <div>Password: {selectedDemo.password}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Demo Role Selection */
            <div className="grid gap-3">
              {DEMO_CREDENTIALS.map((demo) => {
                const IconComponent = demo.icon
                return (
                  <Card 
                    key={demo.role}
                    className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
                    onClick={() => selectDemo(demo)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{demo.role}</h3>
                            <Badge variant="outline" className="text-xs">
                              Demo
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {demo.description}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {demo.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {demo.features.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{demo.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <DialogFooter>
            {selectedDemo ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDemo(null)}
                  disabled={isLoggingIn}
                >
                  Back to Selection
                </Button>
                <Button
                  onClick={() => handleDemoLogin(selectedDemo)}
                  disabled={isLoggingIn}
                  className="min-w-[120px]"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Demo
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}