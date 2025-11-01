import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  Storefront, 
  Eye,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Crown,
  Info,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check
} from '@phosphor-icons/react'

interface TenantWithMetrics {
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
  last_order_date?: string
  feature_flags_enabled: number
  total_feature_flags: number
}

interface CreateTenantData {
  name: string
  admin_email: string
  business_type: string
  theme_id: string
  logo_file: File | null
}

export const TenantManagement: React.FC = () => {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithMetrics | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newTenant, setNewTenant] = useState<CreateTenantData>({
    name: '',
    admin_email: '',
    business_type: 'pharmacy',
    theme_id: 'medical',
    logo_file: null
  })

  // Fetch tenants with metrics
  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['tenants-with-metrics'],
    queryFn: async (): Promise<TenantWithMetrics[]> => {
      const response = await fetch('/api/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenants')
      }
      
      const { tenants } = await response.json()
      return tenants.map((tenant: any) => ({
        ...tenant,
        id: tenant.tenant_id // Map tenant_id to id for consistency
      }))
    }
  })

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: CreateTenantData) => {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          admin_email: data.admin_email,
          business_type: data.business_type,
          theme_id: data.theme_id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tenant')
      }

      const { tenant } = await response.json()
      return tenant
    },
    onSuccess: (data) => {
      refetch()
      setIsCreateModalOpen(false)
      setNewTenant({
        name: '',
        admin_email: '',
        business_type: 'pharmacy',
        theme_id: 'medical',
        logo_file: null
      })
      
      toast.success('Tenant created successfully!', {
        description: `Setup code: ${data.setup_code}. Share this with the admin.`
      })
    },
    onError: (error: any) => {
      toast.error('Failed to create tenant', {
        description: error.message
      })
    }
  })

  // Update tenant status mutation
  const updateTenantStatusMutation = useMutation({
    mutationFn: async ({ tenantId, status }: { tenantId: string, status: string }) => {
      const response = await fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tenant status')
      }
    },
    onSuccess: () => {
      refetch()
      toast.success('Tenant status updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update tenant status', {
        description: error.message
      })
    }
  })

  // Copy setup code to clipboard
  const copySetupCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('Setup code copied to clipboard')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy setup code')
    }
  }

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.admin_email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'inactive':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading tenants...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tenant Management</h2>
          <p className="text-muted-foreground">Manage all pharmacy tenants and their configurations</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tenants by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'inactive'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                  {status !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({tenants.filter(t => t.status === status).length})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      <div className="grid gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Logo/Avatar */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {tenant.logo_url ? (
                      <img 
                        src={tenant.logo_url} 
                        alt={tenant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <Storefront className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  {/* Tenant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold truncate">{tenant.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(tenant.status)} border`}
                      >
                        {getStatusIcon(tenant.status)}
                        <span className="ml-1 capitalize">{tenant.status}</span>
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      {tenant.admin_email && (
                        <div className="flex items-center gap-1 mb-1">
                          <span>Admin:</span>
                          <span className="font-medium">{tenant.admin_email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatDate(tenant.created_at)}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">{tenant.customers_count}</div>
                          <div className="text-xs text-muted-foreground">Customers</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">{tenant.orders_count}</div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium">{formatCurrency(tenant.revenue)}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {tenant.feature_flags_enabled}/{tenant.total_feature_flags}
                          </div>
                          <div className="text-xs text-muted-foreground">Features</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setIsDetailsModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  
                  {tenant.setup_code && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySetupCode(tenant.setup_code!)}
                      className="text-xs"
                    >
                      {copiedCode === tenant.setup_code ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Setup Code
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Storefront className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No tenants found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Create your first tenant to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Tenant Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Set up a new pharmacy tenant with admin credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Pharmacy Name</Label>
              <Input
                id="name"
                value={newTenant.name}
                onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter pharmacy name"
              />
            </div>

            <div>
              <Label htmlFor="admin_email">Admin Email</Label>
              <Input
                id="admin_email"
                type="email"
                value={newTenant.admin_email}
                onChange={(e) => setNewTenant(prev => ({ ...prev, admin_email: e.target.value }))}
                placeholder="admin@pharmacy.com"
              />
            </div>

            <div>
              <Label htmlFor="business_type">Business Type</Label>
              <select
                id="business_type"
                value={newTenant.business_type}
                onChange={(e) => setNewTenant(prev => ({ ...prev, business_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pharmacy">Pharmacy</option>
                <option value="medical_store">Medical Store</option>
                <option value="clinic">Clinic</option>
                <option value="hospital">Hospital</option>
              </select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A setup code will be generated and sent to the admin email for account activation.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTenantMutation.mutate(newTenant)}
              disabled={!newTenant.name || !newTenant.admin_email || createTenantMutation.isPending}
            >
              {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTenant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Storefront className="h-5 w-5 text-primary" />
                  </div>
                  {selectedTenant.name}
                  <Badge className={getStatusColor(selectedTenant.status)}>
                    {selectedTenant.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Detailed information and management options for this tenant
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tenant ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedTenant.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Business Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedTenant.business_type}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedTenant.created_at)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Order</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTenant.last_order_date 
                        ? formatDate(selectedTenant.last_order_date)
                        : 'No orders yet'
                      }
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Performance Metrics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-lg font-bold">{selectedTenant.customers_count}</div>
                          <div className="text-xs text-muted-foreground">Customers</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-lg font-bold">{selectedTenant.orders_count}</div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(selectedTenant.revenue)}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-lg font-bold">
                            {Math.round((selectedTenant.feature_flags_enabled / selectedTenant.total_feature_flags) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Features Active</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Status Management</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedTenant.status === 'active' ? 'default' : 'outline'}
                      onClick={() => updateTenantStatusMutation.mutate({ 
                        tenantId: selectedTenant.id, 
                        status: 'active' 
                      })}
                      disabled={updateTenantStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTenant.status === 'inactive' ? 'default' : 'outline'}
                      onClick={() => updateTenantStatusMutation.mutate({ 
                        tenantId: selectedTenant.id, 
                        status: 'inactive' 
                      })}
                      disabled={updateTenantStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  </div>
                </div>

                {selectedTenant.setup_code && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>Setup Code: <code className="font-mono">{selectedTenant.setup_code}</code></span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copySetupCode(selectedTenant.setup_code!)}
                        >
                          {copiedCode === selectedTenant.setup_code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDetailsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}