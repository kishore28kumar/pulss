import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { SuperAdminAnalytics } from '@/components/SuperAdminAnalytics'
import { TenantManagement } from '@/components/TenantManagement'
import { FeatureFlagsManager } from '@/components/FeatureFlagsManager'
import { DemoDataSeeder } from '@/components/DemoDataSeeder'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { Footer } from '@/components/Footer'
import { toast } from 'sonner'
import { 
  ChartBar,
  Crown,
  Gear,
  Database,
  Play,
  Users,
  ShoppingCart,
  TrendUp,
  Sparkle
} from '@phosphor-icons/react'

export const SuperAdmin = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedTenantForFlags, setSelectedTenantForFlags] = useState<{ id: string, name: string } | null>(null)
  const [selectedTenantForDemo, setSelectedTenantForDemo] = useState<{ id: string, name: string } | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage tenants, feature flags, and platform analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
              {user && (
                <div className="text-right">
                  <div className="text-sm font-medium">{profile?.full_name || 'Admin'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Gear className="h-4 w-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="demo-data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Demo Data
            </TabsTrigger>
            <TabsTrigger value="demo-mode" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Demo Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <SuperAdminAnalytics />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <TenantManagement />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            {selectedTenantForFlags ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTenantForFlags(null)}
                  >
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Feature Flags</h2>
                    <p className="text-sm text-muted-foreground">
                      Managing features for {selectedTenantForFlags.name}
                    </p>
                  </div>
                </div>
                <FeatureFlagsManager 
                  tenantId={selectedTenantForFlags.id}
                  tenantName={selectedTenantForFlags.name}
                />
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Feature Management"
                description="Choose a tenant to manage their feature flags"
                onSelect={setSelectedTenantForFlags}
                icon={Gear}
              />
            )}
          </TabsContent>

          <TabsContent value="demo-data" className="space-y-6">
            {selectedTenantForDemo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTenantForDemo(null)}
                  >
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Demo Data Seeder</h2>
                    <p className="text-sm text-muted-foreground">
                      Seeding demo data for {selectedTenantForDemo.name}
                    </p>
                  </div>
                </div>
                <DemoDataSeeder
                  tenantId={selectedTenantForDemo.id}
                  tenantName={selectedTenantForDemo.name}
                />
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Demo Data"
                description="Choose a tenant to populate with comprehensive demo data"
                onSelect={setSelectedTenantForDemo}
                icon={Database}
              />
            )}
          </TabsContent>

          <TabsContent value="demo-mode" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DemoModeToggle />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="h-5 w-5" />
                    Demo Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Realistic sample data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>All role workflows</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Feature demonstrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Quick onboarding</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5" />
                    Platform Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Demo Users</span>
                    <Badge variant="secondary">4</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Features</span>
                    <Badge variant="secondary">15</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sample Data Sets</span>
                    <Badge variant="secondary">6</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

// Tenant Selector Component
interface TenantSelectorProps {
  title: string
  description: string
  onSelect: (tenant: { id: string, name: string }) => void
  icon: React.ComponentType<{ className?: string }>
}

const TenantSelector: React.FC<TenantSelectorProps> = ({ 
  title, 
  description, 
  onSelect, 
  icon: Icon 
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])

  React.useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, status')
          .order('name')
        
        if (error) throw error
        setTenants(data || [])
      } catch (error: any) {
        toast.error('Failed to load tenants', { description: error.message })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenants()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
          <span>Loading tenants...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => onSelect({ id: tenant.id, name: tenant.name })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{tenant.name}</h3>
                    <Badge 
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {tenants.length === 0 && (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No tenants found</h3>
            <p className="text-sm text-muted-foreground">Create a tenant first to manage features</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface Tenant {
  id: string
  name: string
  admin_email: string
  business_type: string
  theme_id: string
  logo_url?: string
  status: 'active' | 'inactive' | 'pending'
  setup_code?: string
  created_at: string
  customers_count: number
  orders_count: number
  revenue: number
}

interface PendingSetup {
  id: string
  email: string
  tenant_name: string
  business_type: string
  setup_code: string
  created_at: string
  expires_at: string
}

export const SuperAdmin = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('analytics')
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false)
  const [isBusinessTypeSelectorOpen, setIsBusinessTypeSelectorOpen] = useState(false)
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAgreementOpen, setIsAgreementOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [newTenant, setNewTenant] = useState({
    name: '',
    admin_email: '',
    business_type: 'pharmacy',
    theme_id: 'medical',
    logo_file: null as File | null
  })

  // Fetch tenants
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          profiles!profiles_tenant_id_fkey(count),
          orders(count),
          chemist_settings(name, logo_url)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data.map(tenant => ({
        ...tenant,
        customers_count: tenant.profiles?.[0]?.count || 0,
        orders_count: tenant.orders?.[0]?.count || 0,
        revenue: Math.floor(Math.random() * 50000), // Mock revenue
        name: tenant.chemist_settings?.[0]?.name || tenant.name,
        logo_url: tenant.chemist_settings?.[0]?.logo_url
      })) as Tenant[]
    }
  })

  // Fetch pending setups
  const { data: pendingSetups = [] } = useQuery({
    queryKey: ['pending-setups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_admin_invites')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as PendingSetup[]
    }
  })

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: typeof newTenant) => {
      // Upload logo if provided
      let logoUrl: string | null = null
      if (tenantData.logo_file) {
        const fileExt = tenantData.logo_file.name.split('.').pop()
        const fileName = `tenant-logos/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(fileName, tenantData.logo_file)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(fileName)
        
        logoUrl = publicUrl
      }

      // Create tenant and setup code
      const { data, error } = await supabase.rpc('admin_create_tenant_with_setup', {
        admin_email: tenantData.admin_email,
        tenant_name: tenantData.name,
        business_type: tenantData.business_type,
        theme_id: tenantData.theme_id,
        logo_url: logoUrl
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['pending-setups'] })
      setIsCreateTenantOpen(false)
      setNewTenant({
        name: '',
        admin_email: '',
        business_type: 'pharmacy',
        theme_id: 'medical',
        logo_file: null
      })
      toast.success(`Tenant created! Setup code: ${data.setup_code}`)
    },
    onError: (error) => {
      console.error('Error creating tenant:', error)
      toast.error('Failed to create tenant')
    }
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Copied to clipboard')
  }

  const generateQRCode = (tenantId: string) => {
    const appUrl = `${window.location.origin}/?tenant=${tenantId}`
    return appUrl
  }

  const handleCreateTenant = () => {
    if (!newTenant.name.trim() || !newTenant.admin_email.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    createTenantMutation.mutate(newTenant)
  }

  const totalStats = {
    tenants: tenants.length,
    customers: tenants.reduce((sum, tenant) => sum + tenant.customers_count, 0),
    orders: tenants.reduce((sum, tenant) => sum + tenant.orders_count, 0),
    revenue: tenants.reduce((sum, tenant) => sum + tenant.revenue, 0)
  }

  const getBusinessTypeConfig = (typeId: string) => {
    return BUSINESS_TYPES.find(type => type.id === typeId) || BUSINESS_TYPES[0]
  }

  const getThemeConfig = (themeId: string) => {
    return THEME_PRESETS.find(theme => theme.id === themeId) || THEME_PRESETS[0]
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pulss Super Admin</h1>
                <p className="text-muted-foreground">Universal White-Label Platform Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAgreementOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Legal Documents
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsProfileOpen(true)}
            >
              <Gear className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setIsCreateTenantOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Business
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Total Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Storefront className="h-8 w-8 text-blue-600" />
                <div className="text-3xl font-bold text-blue-900">{totalStats.tenants}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div className="text-3xl font-bold text-green-900">{totalStats.customers}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-purple-600" />
                <div className="text-3xl font-bold text-purple-900">{totalStats.orders}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <TrendUp className="h-8 w-8 text-orange-600" />
                <div className="text-3xl font-bold text-orange-900">₹{totalStats.revenue.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Businesses</TabsTrigger>
            <TabsTrigger value="pending">Pending Setup</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Businesses Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => {
                const businessType = getBusinessTypeConfig(tenant.business_type)
                const theme = getThemeConfig(tenant.theme_id)
                
                return (
                  <Card key={tenant.id} className="relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {tenant.logo_url ? (
                            <img 
                              src={tenant.logo_url} 
                              alt={tenant.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-lg">{businessType.icon}</span>
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">{tenant.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{businessType.name}</p>
                          </div>
                        </div>
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">{tenant.customers_count}</div>
                          <div className="text-xs text-muted-foreground">Customers</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{tenant.orders_count}</div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">₹{tenant.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const url = generateQRCode(tenant.id)
                            copyToClipboard(url)
                          }}
                        >
                          {copiedCode === generateQRCode(tenant.id) ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <QrCode className="h-4 w-4 mr-1" />
                          )}
                          QR Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`${window.location.origin}/?tenant=${tenant.id}`, '_blank')
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <div>Admin: {tenant.admin_email}</div>
                        <div>Created: {new Date(tenant.created_at).toLocaleDateString()}</div>
                        <div>Theme: {theme.name}</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Pending Setup Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingSetups.map((setup) => (
                <Card key={setup.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{setup.tenant_name}</CardTitle>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <CardDescription>{setup.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono">{setup.setup_code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(setup.setup_code)}
                        >
                          {copiedCode === setup.setup_code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Created: {new Date(setup.created_at).toLocaleDateString()}</div>
                      <div>Expires: {new Date(setup.expires_at).toLocaleDateString()}</div>
                      <div>Business Type: {getBusinessTypeConfig(setup.business_type).name}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {THEME_PRESETS.map((theme) => (
                <Card key={theme.id} className="overflow-hidden">
                  <div 
                    className="h-4 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
                    }}
                  />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {theme.name}
                      <Badge variant="outline">
                        {tenants.filter(t => t.theme_id === theme.id).length} businesses
                      </Badge>
                    </CardTitle>
                    <CardDescription>{theme.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div 
                        className="h-8 rounded border"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary"
                      />
                      <div 
                        className="h-8 rounded border"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Secondary"
                      />
                      <div 
                        className="h-8 rounded border"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent"
                      />
                      <div 
                        className="h-8 rounded border"
                        style={{ backgroundColor: theme.colors.muted }}
                        title="Muted"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Best for: {theme.businessTypes.join(', ')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* QR Codes Tab */}
          <TabsContent value="qrcodes" className="space-y-6">
            <QRCodeGenerator tenants={tenants} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <SuperAdminDashboard />
          </TabsContent>
        </Tabs>

        {/* Create Tenant Dialog */}
        <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Business</DialogTitle>
              <DialogDescription>
                Set up a new business on the Pulss platform with customized branding and features.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    placeholder="e.g., HealthCare Plus Pharmacy"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="admin-email">Admin Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@business.com"
                    value={newTenant.admin_email}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, admin_email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Business Type *</Label>
                <BusinessTypeDisplay
                  businessType={getBusinessTypeConfig(newTenant.business_type)}
                  showEditButton={true}
                  onEdit={() => setIsBusinessTypeSelectorOpen(true)}
                />
              </div>

              <div>
                <Label>Visual Theme *</Label>
                <ThemeDisplay
                  theme={getThemeConfig(newTenant.theme_id)}
                  showEditButton={true}
                  onEdit={() => setIsThemeSelectorOpen(true)}
                />
              </div>

              <div>
                <Label htmlFor="business-logo">Business Logo (Optional)</Label>
                <div className="mt-2">
                  <Input
                    id="business-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Logo file should be less than 5MB')
                          return
                        }
                        setNewTenant(prev => ({ ...prev, logo_file: file }))
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a square logo (recommended: 512x512px, max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateTenantOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTenant}
                disabled={createTenantMutation.isPending}
              >
                {createTenantMutation.isPending ? 'Creating...' : 'Create Business'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Business Type Selector */}
        <BusinessTypeSelector
          isOpen={isBusinessTypeSelectorOpen}
          onClose={() => setIsBusinessTypeSelectorOpen(false)}
          onSelect={(businessType) => {
            setNewTenant(prev => ({ 
              ...prev, 
              business_type: businessType.id,
              theme_id: businessType.defaultTheme 
            }))
          }}
          selectedType={newTenant.business_type}
        />

        {/* Theme Selector */}
        <ThemeSelector
          isOpen={isThemeSelectorOpen}
          onClose={() => setIsThemeSelectorOpen(false)}
          onSelect={(theme) => {
            setNewTenant(prev => ({ ...prev, theme_id: theme.id }))
          }}
          selectedThemeId={newTenant.theme_id}
          businessType={newTenant.business_type}
        />

        {/* Profile Manager */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Super Admin Settings</DialogTitle>
              <DialogDescription>
                Manage your super admin profile and platform settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <Crown size={48} className="text-primary mx-auto mb-3" />
                <div className="text-lg font-semibold">Super Administrator</div>
                <div className="text-sm text-muted-foreground">lbalajeesreeshan@gmail.com</div>
                <Badge className="mt-2">Full Access</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Platform</div>
                  <div>Pulss Commerce Platform</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Version</div>
                  <div>v1.0.0</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Total Tenants</div>
                  <div>{totalStats.tenants}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Total Revenue</div>
                  <div>${totalStats.revenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Agreement Modal */}
        <AgreementModal
          isOpen={isAgreementOpen}
          onClose={() => setIsAgreementOpen(false)}
          onAccept={() => {
            setIsAgreementOpen(false)
            toast.success('Legal documents reviewed')
          }}
          userRole="admin"
        />

        {/* Footer */}
        <Footer variant="minimal" />
      </div>
    </div>
  )
}