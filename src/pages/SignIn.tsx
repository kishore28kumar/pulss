import React, { useState, useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AgreementModal } from '../components/AgreementModalSimple'
import { toast } from 'sonner'
import { useAuth, isSuperAdmin, isAdmin, isCustomer, isDelivery } from '../lib/useAuthSimple'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Pill, Eye, EyeSlash, Shield } from '@phosphor-icons/react'

export const SignIn = () => {
  const { user, profile, signIn, signUp, resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [pendingUserData, setPendingUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    setupCode: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const isRecovery = searchParams.get('type') === 'recovery'

  useEffect(() => {
    if (isRecovery) {
      toast.info('Please enter your new password')
    }
  }, [isRecovery])

  if (user && profile) {
    if (isSuperAdmin(profile)) {
      return <Navigate to="/super" replace />
    } else if (isAdmin(profile)) {
      return <Navigate to="/admin" replace />
    } else if (isDelivery(profile)) {
      return <Navigate to="/delivery" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Pill className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Supabase credentials are missing. Please check your environment configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/health">Check Configuration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(formData.email, formData.password)
      if (error) {
        setError(error.message)
      } else {
        // Check if this is an admin user who needs to accept agreements
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single()
          
          if (profile?.role === 'admin') {
            // Check if admin has accepted agreements
            const agreed = localStorage.getItem(`admin_agreement_${userData.user.id}`)
            if (!agreed) {
              setPendingUserData(userData)
              setShowAgreement(true)
              setLoading(false)
              return
            }
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAgreementAccept = () => {
    if (pendingUserData?.user) {
      localStorage.setItem(`admin_agreement_${pendingUserData.user.id}`, 'true')
      setPendingUserData(null)
      setShowAgreement(false)
      toast.success('Welcome! You can now access your admin panel.')
      // The user will be automatically redirected by the auth state change
    }
  }

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc('complete_admin_setup', {
        admin_email: formData.email,
        setup_code: formData.setupCode,
        new_password: formData.password
      })

      if (error) {
        setError(error.message)
      } else {
        toast.success('Account setup complete! Please sign in.')
        setFormData({ email: formData.email, password: '', setupCode: '', confirmPassword: '' })
      }
    } catch (err) {
      setError('Setup failed. Please check your setup code.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await resetPassword(formData.email)
      if (error) {
        setError(error.message)
      } else {
        toast.success('Password reset link sent to your email')
      }
    } catch (err) {
      setError('Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password)
      if (error) {
        setError(error.message)
      } else {
        toast.success('Account created! Please check your email for verification.')
      }
    } catch (err) {
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Pill className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Pulss</CardTitle>
          <CardDescription>
            Smart Chemist Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={isRecovery ? "reset" : "signin"}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="forgot">Reset</TabsTrigger>
            </TabsList>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlash /> : <Eye />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="setup">
              <form onSubmit={handleAdminSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-email">Admin Email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-code">Setup Code</Label>
                  <Input
                    id="setup-code"
                    type="text"
                    placeholder="Enter setup code"
                    value={formData.setupCode}
                    onChange={(e) => setFormData({ ...formData, setupCode: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setup-password">New Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-confirm">Confirm Password</Label>
                  <Input
                    id="setup-confirm"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Setting Up...' : 'Complete Setup'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Agreement Modal for Admins */}
      <AgreementModal
        isOpen={showAgreement}
        onClose={() => {
          // If user closes modal without accepting, sign them out
          setShowAgreement(false)
          setPendingUserData(null)
          supabase.auth.signOut()
          toast.info('Please accept the agreements to continue')
        }}
        onAccept={handleAgreementAccept}
        userRole="admin"
        isFirstTime={true}
      />
    </div>
  )
}