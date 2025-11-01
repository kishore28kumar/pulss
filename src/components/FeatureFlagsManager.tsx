import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { FeatureFlags } from '@/types'
import { toast } from 'sonner'
import { 
  Shield, 
  Wallet,
  Gift,
  ArrowClockwise,
  CreditCard,
  Bell,
  Phone,
  Users,
  ChartBar,
  Megaphone,
  ShoppingBag,
  Truck,
  MagnifyingGlass,
  Heart,
  Eye,
  Gear
} from '@phosphor-icons/react'

interface FeatureFlagsManagerProps {
  tenantId: string
  tenantName: string
}

// Feature flag definitions with metadata
const FEATURE_FLAG_DEFINITIONS = [
  {
    key: 'tracking_enabled' as keyof FeatureFlags,
    name: 'Order Tracking',
    description: 'Real-time order tracking with delivery updates',
    icon: Truck,
    category: 'logistics',
    color: 'bg-blue-500'
  },
  {
    key: 'wallet_enabled' as keyof FeatureFlags,
    name: 'Digital Wallet',
    description: 'Customer wallet for payments and refunds',
    icon: Wallet,
    category: 'payments',
    color: 'bg-green-500'
  },
  {
    key: 'loyalty_enabled' as keyof FeatureFlags,
    name: 'Loyalty Program',
    description: 'Points-based customer loyalty system',
    icon: Heart,
    category: 'customer',
    color: 'bg-red-500'
  },
  {
    key: 'coupons_enabled' as keyof FeatureFlags,
    name: 'Coupons & Discounts',
    description: 'Promotional coupons and discount codes',
    icon: Gift,
    category: 'marketing',
    color: 'bg-yellow-500'
  },
  {
    key: 'returns_enabled' as keyof FeatureFlags,
    name: 'Return Management',
    description: 'Product returns and exchange system',
    icon: ArrowClockwise,
    category: 'operations',
    color: 'bg-orange-500'
  },
  {
    key: 'refunds_enabled' as keyof FeatureFlags,
    name: 'Refund Processing',
    description: 'Automated refund processing system',
    icon: CreditCard,
    category: 'payments',
    color: 'bg-purple-500'
  },
  {
    key: 'subscriptions_enabled' as keyof FeatureFlags,
    name: 'Subscriptions',
    description: 'Recurring orders and subscriptions',
    icon: ShoppingBag,
    category: 'operations',
    color: 'bg-indigo-500'
  },
  {
    key: 'prescription_required_enabled' as keyof FeatureFlags,
    name: 'Prescription Management',
    description: 'Prescription upload and approval system',
    icon: Shield,
    category: 'compliance',
    color: 'bg-emerald-500'
  },
  {
    key: 'multi_warehouse_enabled' as keyof FeatureFlags,
    name: 'Multi-Warehouse',
    description: 'Multiple warehouse inventory management',
    icon: Eye,
    category: 'operations',
    color: 'bg-teal-500'
  },
  {
    key: 'whatsapp_notifications_enabled' as keyof FeatureFlags,
    name: 'WhatsApp Notifications',
    description: 'WhatsApp messaging for order updates',
    icon: Phone,
    category: 'communication',
    color: 'bg-green-600'
  },
  {
    key: 'push_notifications_enabled' as keyof FeatureFlags,
    name: 'Push Notifications',
    description: 'Mobile app push notifications',
    icon: Bell,
    category: 'communication',
    color: 'bg-blue-600'
  },
  {
    key: 'social_login_enabled' as keyof FeatureFlags,
    name: 'Social Login',
    description: 'Login with Google, Facebook, etc.',
    icon: Users,
    category: 'authentication',
    color: 'bg-pink-500'
  },
  {
    key: 'customer_support_enabled' as keyof FeatureFlags,
    name: 'Customer Support',
    description: 'In-app customer support and chat',
    icon: Users,
    category: 'support',
    color: 'bg-cyan-500'
  },
  {
    key: 'analytics_enabled' as keyof FeatureFlags,
    name: 'Analytics Dashboard',
    description: 'Business analytics and reporting',
    icon: ChartBar,
    category: 'analytics',
    color: 'bg-violet-500'
  },
  {
    key: 'marketing_enabled' as keyof FeatureFlags,
    name: 'Marketing Tools',
    description: 'Email campaigns and marketing automation',
    icon: Megaphone,
    category: 'marketing',
    color: 'bg-rose-500'
  },
  {
    key: 'bulk_invite_enabled' as keyof FeatureFlags,
    name: 'Bulk User Invites',
    description: 'Allow tenant admins to invite multiple users via email list or CSV upload',
    icon: Users,
    category: 'administration',
    color: 'bg-slate-500'
  }
]

const CATEGORY_COLORS = {
  logistics: 'bg-blue-100 text-blue-800',
  payments: 'bg-green-100 text-green-800',
  customer: 'bg-red-100 text-red-800',
  marketing: 'bg-yellow-100 text-yellow-800',
  operations: 'bg-orange-100 text-orange-800',
  compliance: 'bg-emerald-100 text-emerald-800',
  communication: 'bg-cyan-100 text-cyan-800',
  authentication: 'bg-pink-100 text-pink-800',
  support: 'bg-purple-100 text-purple-800',
  analytics: 'bg-violet-100 text-violet-800',
  administration: 'bg-slate-100 text-slate-800'
}

export const FeatureFlagsManager: React.FC<FeatureFlagsManagerProps> = ({ 
  tenantId, 
  tenantName 
}) => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingChange, setPendingChange] = useState<{
    key: keyof FeatureFlags
    value: boolean
  } | null>(null)

  // Fetch feature flags for the tenant
  const { data: featureFlags, isLoading } = useQuery({
    queryKey: ['feature-flags', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()
      
      if (error) {
        // If no flags exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newFlags, error: insertError } = await supabase
            .from('feature_flags')
            .insert({ tenant_id: tenantId })
            .select()
            .single()
          
          if (insertError) throw insertError
          return newFlags as FeatureFlags
        }
        throw error
      }
      
      return data as FeatureFlags
    }
  })

  // Update feature flag mutation
  const updateFeatureFlagMutation = useMutation({
    mutationFn: async ({ key, value }: { key: keyof FeatureFlags, value: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags', tenantId] })
      const feature = FEATURE_FLAG_DEFINITIONS.find(f => f.key === variables.key)
      toast.success(
        `${feature?.name} ${variables.value ? 'enabled' : 'disabled'} for ${tenantName}`,
        {
          description: 'Changes are effective immediately for all users'
        }
      )
    },
    onError: (error) => {
      toast.error('Failed to update feature flag', {
        description: error.message
      })
    }
  })

  const handleFeatureToggle = (key: keyof FeatureFlags, value: boolean) => {
    setPendingChange({ key, value })
    setIsConfirmOpen(true)
  }

  const confirmToggle = () => {
    if (pendingChange) {
      updateFeatureFlagMutation.mutate(pendingChange)
      setPendingChange(null)
    }
    setIsConfirmOpen(false)
  }

  // Filter features based on search and category
  const filteredFeatures = FEATURE_FLAG_DEFINITIONS.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || feature.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get categories with counts
  const categories = [...new Set(FEATURE_FLAG_DEFINITIONS.map(f => f.category))]
  const categoryStats = categories.map(category => ({
    category,
    total: FEATURE_FLAG_DEFINITIONS.filter(f => f.category === category).length,
    enabled: FEATURE_FLAG_DEFINITIONS
      .filter(f => f.category === category)
      .filter(f => featureFlags?.[f.key]).length
  }))

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading feature flags...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Feature Flags - {tenantName}
          </CardTitle>
          <CardDescription>
            Enable or disable features for this tenant. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categoryStats.map(({ category, total, enabled }) => (
              <Card key={category} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className={`${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} capitalize`}>
                      {category}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {enabled} of {total} enabled
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((enabled / total) * 100)}%
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Feature List */}
          <div className="grid gap-4">
            {filteredFeatures.map((feature) => {
              const IconComponent = feature.icon
              const isEnabled = featureFlags?.[feature.key] || false
              
              return (
                <Card key={feature.key} className={`transition-all ${isEnabled ? 'bg-muted/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{feature.name}</h3>
                            <Badge 
                              variant="secondary" 
                              className={`${CATEGORY_COLORS[feature.category as keyof typeof CATEGORY_COLORS]} text-xs`}
                            >
                              {feature.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                        disabled={updateFeatureFlagMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlass className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No features found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Feature Change</DialogTitle>
            <DialogDescription>
              {pendingChange && (
                <>
                  Are you sure you want to{' '}
                  <strong>{pendingChange.value ? 'enable' : 'disable'}</strong>{' '}
                  <strong>
                    {FEATURE_FLAG_DEFINITIONS.find(f => f.key === pendingChange.key)?.name}
                  </strong>{' '}
                  for <strong>{tenantName}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This change will take effect immediately for all users of this tenant. 
              No application restart is required.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggle}
              disabled={updateFeatureFlagMutation.isPending}
            >
              {updateFeatureFlagMutation.isPending ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}