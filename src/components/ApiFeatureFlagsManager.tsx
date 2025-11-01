import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Shield, 
  Gear, 
  Webhook, 
  Key, 
  Activity,
  Users,
  Globe,
  Save,
  RefreshCw
} from '@phosphor-icons/react'
import { useAuth } from '@/lib/useAuth'

interface ApiFeatureFlags {
  tenant_id: string
  api_enabled: boolean
  api_docs_enabled: boolean
  api_keys_enabled: boolean
  api_keys_max_count: number
  users_api_enabled: boolean
  billing_api_enabled: boolean
  notifications_api_enabled: boolean
  branding_api_enabled: boolean
  audit_log_api_enabled: boolean
  webhooks_enabled: boolean
  webhooks_max_count: number
  oauth_enabled: boolean
  api_analytics_enabled: boolean
  api_billing_enabled: boolean
  api_usage_alerts_enabled: boolean
  partner_integrations_enabled: boolean
  app_store_enabled: boolean
  custom_rate_limits_enabled: boolean
  rate_limit_multiplier: number
}

interface GlobalApiSettings {
  default_api_enabled: boolean
  default_rate_limit_per_hour: number
  default_rate_limit_per_day: number
  max_api_keys_per_tenant: number
  max_webhooks_per_tenant: number
  max_oauth_apps_per_tenant: number
  api_maintenance_mode: boolean
  maintenance_message: string
}

interface Tenant {
  tenant_id: string
  name: string
  subdomain: string
}

export const ApiFeatureFlagsManager = () => {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [featureFlags, setFeatureFlags] = useState<ApiFeatureFlags | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalApiSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchTenants()
      fetchGlobalSettings()
    }
  }, [user])

  useEffect(() => {
    if (selectedTenant) {
      fetchFeatureFlags(selectedTenant)
    }
  }, [selectedTenant])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTenants(data.data || [])
        if (data.data && data.data.length > 0) {
          setSelectedTenant(data.data[0].tenant_id)
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
      toast.error('Failed to fetch tenants')
    }
  }

  const fetchFeatureFlags = async (tenantId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/api-management/feature-flags?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeatureFlags(data.data)
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      toast.error('Failed to fetch feature flags')
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/api-management/settings/global', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGlobalSettings(data.data)
      }
    } catch (error) {
      console.error('Error fetching global settings:', error)
      toast.error('Failed to fetch global settings')
    }
  }

  const saveFeatureFlags = async () => {
    if (!featureFlags || !selectedTenant) return

    setSaving(true)
    try {
      const response = await fetch(`/api/api-management/feature-flags/${selectedTenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(featureFlags)
      })

      if (response.ok) {
        toast.success('Feature flags updated successfully')
      } else {
        toast.error('Failed to update feature flags')
      }
    } catch (error) {
      console.error('Error saving feature flags:', error)
      toast.error('Failed to save feature flags')
    } finally {
      setSaving(false)
    }
  }

  const saveGlobalSettings = async () => {
    if (!globalSettings) return

    setSaving(true)
    try {
      const response = await fetch('/api/api-management/settings/global', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(globalSettings)
      })

      if (response.ok) {
        toast.success('Global settings updated successfully')
      } else {
        toast.error('Failed to update global settings')
      }
    } catch (error) {
      console.error('Error saving global settings:', error)
      toast.error('Failed to save global settings')
    } finally {
      setSaving(false)
    }
  }

  const updateFlag = (key: keyof ApiFeatureFlags, value: any) => {
    if (featureFlags) {
      setFeatureFlags({ ...featureFlags, [key]: value })
    }
  }

  const updateGlobalSetting = (key: keyof GlobalApiSettings, value: any) => {
    if (globalSettings) {
      setGlobalSettings({ ...globalSettings, [key]: value })
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">This feature is only available to super admins</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gear className="h-6 w-6" />
            API Feature Management
          </h2>
          <p className="text-muted-foreground">
            Control API features and settings for tenants
          </p>
        </div>
        <Button onClick={() => fetchGlobalSettings()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tenant-flags">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tenant-flags">
            <Users className="h-4 w-4 mr-2" />
            Tenant Settings
          </TabsTrigger>
          <TabsTrigger value="global-settings">
            <Globe className="h-4 w-4 mr-2" />
            Global Settings
          </TabsTrigger>
        </TabsList>

        {/* Tenant Settings Tab */}
        <TabsContent value="tenant-flags" className="space-y-6">
          {/* Tenant Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Tenant</CardTitle>
              <CardDescription>
                Choose a tenant to configure their API features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.name} ({tenant.subdomain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : featureFlags && (
            <>
              {/* Core API Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Core API Features
                  </CardTitle>
                  <CardDescription>
                    Enable or disable basic API access and documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>API Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable overall API access for this tenant
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.api_enabled}
                      onCheckedChange={(checked) => updateFlag('api_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>API Documentation</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow access to API documentation portal
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.api_docs_enabled}
                      onCheckedChange={(checked) => updateFlag('api_docs_enabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* API Key Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key Management
                  </CardTitle>
                  <CardDescription>
                    Control API key creation and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>API Keys Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow tenant to create and manage API keys
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.api_keys_enabled}
                      onCheckedChange={(checked) => updateFlag('api_keys_enabled', checked)}
                    />
                  </div>

                  {featureFlags.api_keys_enabled && (
                    <div className="space-y-2">
                      <Label>Maximum API Keys</Label>
                      <Input
                        type="number"
                        value={featureFlags.api_keys_max_count}
                        onChange={(e) => updateFlag('api_keys_max_count', parseInt(e.target.value))}
                        min="1"
                        max="50"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Endpoint Access */}
              <Card>
                <CardHeader>
                  <CardTitle>Endpoint Access</CardTitle>
                  <CardDescription>
                    Control access to specific API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Users API</Label>
                      <Switch
                        checked={featureFlags.users_api_enabled}
                        onCheckedChange={(checked) => updateFlag('users_api_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Billing API</Label>
                      <Switch
                        checked={featureFlags.billing_api_enabled}
                        onCheckedChange={(checked) => updateFlag('billing_api_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Notifications API</Label>
                      <Switch
                        checked={featureFlags.notifications_api_enabled}
                        onCheckedChange={(checked) => updateFlag('notifications_api_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Branding API</Label>
                      <Switch
                        checked={featureFlags.branding_api_enabled}
                        onCheckedChange={(checked) => updateFlag('branding_api_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Audit Log API</Label>
                      <Switch
                        checked={featureFlags.audit_log_api_enabled}
                        onCheckedChange={(checked) => updateFlag('audit_log_api_enabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Advanced Features
                  </CardTitle>
                  <CardDescription>
                    Webhooks, OAuth, and other advanced capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Webhooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable webhook subscriptions
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.webhooks_enabled}
                      onCheckedChange={(checked) => updateFlag('webhooks_enabled', checked)}
                    />
                  </div>

                  {featureFlags.webhooks_enabled && (
                    <div className="space-y-2">
                      <Label>Maximum Webhooks</Label>
                      <Input
                        type="number"
                        value={featureFlags.webhooks_max_count}
                        onChange={(e) => updateFlag('webhooks_max_count', parseInt(e.target.value))}
                        min="1"
                        max="50"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>OAuth 2.0</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable OAuth 2.0 authentication
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.oauth_enabled}
                      onCheckedChange={(checked) => updateFlag('oauth_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Partner Integrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable third-party app integrations
                      </p>
                    </div>
                    <Switch
                      checked={featureFlags.partner_integrations_enabled}
                      onCheckedChange={(checked) => updateFlag('partner_integrations_enabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Analytics & Billing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Analytics & Billing
                  </CardTitle>
                  <CardDescription>
                    API usage tracking and billing features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>API Analytics</Label>
                    <Switch
                      checked={featureFlags.api_analytics_enabled}
                      onCheckedChange={(checked) => updateFlag('api_analytics_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>API Billing</Label>
                    <Switch
                      checked={featureFlags.api_billing_enabled}
                      onCheckedChange={(checked) => updateFlag('api_billing_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Usage Alerts</Label>
                    <Switch
                      checked={featureFlags.api_usage_alerts_enabled}
                      onCheckedChange={(checked) => updateFlag('api_usage_alerts_enabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={saveFeatureFlags} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Feature Flags'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Global Settings Tab */}
        <TabsContent value="global-settings" className="space-y-6">
          {globalSettings && (
            <>
              {/* Default Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Settings for New Tenants</CardTitle>
                  <CardDescription>
                    These settings will be applied to newly created tenants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>API Enabled by Default</Label>
                    <Switch
                      checked={globalSettings.default_api_enabled}
                      onCheckedChange={(checked) => updateGlobalSetting('default_api_enabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Hourly Rate Limit</Label>
                      <Input
                        type="number"
                        value={globalSettings.default_rate_limit_per_hour}
                        onChange={(e) => updateGlobalSetting('default_rate_limit_per_hour', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default Daily Rate Limit</Label>
                      <Input
                        type="number"
                        value={globalSettings.default_rate_limit_per_day}
                        onChange={(e) => updateGlobalSetting('default_rate_limit_per_day', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform-Wide Limits</CardTitle>
                  <CardDescription>
                    Maximum limits for all tenants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Max API Keys per Tenant</Label>
                      <Input
                        type="number"
                        value={globalSettings.max_api_keys_per_tenant}
                        onChange={(e) => updateGlobalSetting('max_api_keys_per_tenant', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Webhooks per Tenant</Label>
                      <Input
                        type="number"
                        value={globalSettings.max_webhooks_per_tenant}
                        onChange={(e) => updateGlobalSetting('max_webhooks_per_tenant', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max OAuth Apps per Tenant</Label>
                      <Input
                        type="number"
                        value={globalSettings.max_oauth_apps_per_tenant}
                        onChange={(e) => updateGlobalSetting('max_oauth_apps_per_tenant', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Mode */}
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>
                    Disable all API access platform-wide for maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Maintenance Mode Enabled</Label>
                    <Switch
                      checked={globalSettings.api_maintenance_mode}
                      onCheckedChange={(checked) => updateGlobalSetting('api_maintenance_mode', checked)}
                    />
                  </div>

                  {globalSettings.api_maintenance_mode && (
                    <div className="space-y-2">
                      <Label>Maintenance Message</Label>
                      <Input
                        value={globalSettings.maintenance_message}
                        onChange={(e) => updateGlobalSetting('maintenance_message', e.target.value)}
                        placeholder="API is currently under maintenance. Please try again later."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={saveGlobalSettings} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Global Settings'}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
