import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Warning,
  Crown,
  Gear
} from '@phosphor-icons/react'

interface RBACFeatureFlags {
  tenant_id: string
  rbac_enabled: boolean
  custom_roles_enabled: boolean
  role_templates_enabled: boolean
  permission_inheritance_enabled: boolean
  bulk_assignment_enabled: boolean
  audit_logging_enabled: boolean
  access_review_enabled: boolean
  least_privilege_enforcement: boolean
  role_expiration_enabled: boolean
  max_custom_roles: number
  max_users_per_role: number
}

interface Tenant {
  tenant_id: string
  name: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const fetchTenants = async () => {
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch tenants')
  const data = await response.json()
  return data.tenants || []
}

const fetchRBACFeatureFlags = async (tenantId: string) => {
  const response = await fetch(`${API_BASE_URL}/rbac/feature-flags?tenant_id=${tenantId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch RBAC feature flags')
  const data = await response.json()
  return data.data
}

export const RBACFeatureFlagsManager = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants
  })

  const { data: flags, isLoading } = useQuery({
    queryKey: ['rbac-feature-flags', selectedTenantId],
    queryFn: () => fetchRBACFeatureFlags(selectedTenantId),
    enabled: !!selectedTenantId
  })

  const updateFlags = useMutation({
    mutationFn: async (updates: Partial<RBACFeatureFlags>) => {
      const response = await fetch(`${API_BASE_URL}/rbac/feature-flags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tenant_id: selectedTenantId,
          ...updates
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update RBAC feature flags')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-feature-flags', selectedTenantId] })
      toast.success('RBAC feature flags updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update RBAC feature flags')
    }
  })

  const handleToggle = (key: keyof RBACFeatureFlags) => {
    if (!flags) return
    updateFlags.mutate({ [key]: !flags[key] })
  }

  const handleNumberChange = (key: keyof RBACFeatureFlags, value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      updateFlags.mutate({ [key]: numValue })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Crown className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">RBAC Feature Flags</h2>
            <p className="text-muted-foreground">
              Configure RBAC features for tenants (Super Admin Only)
            </p>
          </div>
        </div>
        <Badge variant="default" className="bg-amber-500">
          <Crown className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
          <CardDescription>
            Choose a tenant to configure their RBAC features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants?.map((tenant: Tenant) => (
                <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      {selectedTenantId && (
        <>
          {isLoading ? (
            <Card className="animate-pulse">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" />
                  <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : flags ? (
            <div className="space-y-4">
              {/* Master Toggle */}
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Master RBAC Control
                  </CardTitle>
                  <CardDescription>
                    Enable or disable the entire RBAC system for this tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center gap-3">
                      {flags.rbac_enabled ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Warning className="h-6 w-6 text-amber-500" />
                      )}
                      <div>
                        <Label className="text-base font-semibold">
                          RBAC System
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {flags.rbac_enabled 
                            ? 'RBAC is active for this tenant' 
                            : 'RBAC is disabled - using legacy role system'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={flags.rbac_enabled}
                      onCheckedChange={() => handleToggle('rbac_enabled')}
                      disabled={updateFlags.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle>RBAC Features</CardTitle>
                  <CardDescription>
                    Configure available RBAC features for this tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Custom Roles */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Custom Roles</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow admins to create custom roles
                      </p>
                    </div>
                    <Switch
                      checked={flags.custom_roles_enabled}
                      onCheckedChange={() => handleToggle('custom_roles_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Role Templates */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Role Templates</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable pre-configured role templates
                      </p>
                    </div>
                    <Switch
                      checked={flags.role_templates_enabled}
                      onCheckedChange={() => handleToggle('role_templates_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Permission Inheritance */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Permission Inheritance</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable role hierarchy and permission inheritance
                      </p>
                    </div>
                    <Switch
                      checked={flags.permission_inheritance_enabled}
                      onCheckedChange={() => handleToggle('permission_inheritance_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Bulk Assignment */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Bulk Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow assigning roles to multiple users at once
                      </p>
                    </div>
                    <Switch
                      checked={flags.bulk_assignment_enabled}
                      onCheckedChange={() => handleToggle('bulk_assignment_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Role Expiration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Role Expiration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow temporary role assignments with expiration dates
                      </p>
                    </div>
                    <Switch
                      checked={flags.role_expiration_enabled}
                      onCheckedChange={() => handleToggle('role_expiration_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance & Security</CardTitle>
                  <CardDescription>
                    Configure audit and compliance features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audit Logging */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Track all RBAC changes in audit logs
                      </p>
                    </div>
                    <Switch
                      checked={flags.audit_logging_enabled}
                      onCheckedChange={() => handleToggle('audit_logging_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Least Privilege */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Least Privilege Enforcement</Label>
                      <p className="text-sm text-muted-foreground">
                        Log all access attempts for compliance
                      </p>
                    </div>
                    <Switch
                      checked={flags.least_privilege_enforcement}
                      onCheckedChange={() => handleToggle('least_privilege_enforcement')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>

                  {/* Access Reviews */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-base">Access Reviews</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable periodic access review workflows
                      </p>
                    </div>
                    <Switch
                      checked={flags.access_review_enabled}
                      onCheckedChange={() => handleToggle('access_review_enabled')}
                      disabled={updateFlags.isPending || !flags.rbac_enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Limits</CardTitle>
                  <CardDescription>
                    Configure limits for RBAC resources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Max Custom Roles */}
                  <div className="space-y-2">
                    <Label htmlFor="max_roles">Maximum Custom Roles</Label>
                    <div className="flex gap-2">
                      <Input
                        id="max_roles"
                        type="number"
                        min="1"
                        max="100"
                        value={flags.max_custom_roles}
                        onChange={(e) => handleNumberChange('max_custom_roles', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value !== flags.max_custom_roles.toString()) {
                            handleNumberChange('max_custom_roles', e.target.value)
                          }
                        }}
                        disabled={updateFlags.isPending || !flags.rbac_enabled}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground flex items-center">
                        roles per tenant
                      </span>
                    </div>
                  </div>

                  {/* Max Users Per Role */}
                  <div className="space-y-2">
                    <Label htmlFor="max_users">Maximum Users Per Role</Label>
                    <div className="flex gap-2">
                      <Input
                        id="max_users"
                        type="number"
                        min="1"
                        max="1000"
                        value={flags.max_users_per_role}
                        onChange={(e) => handleNumberChange('max_users_per_role', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value !== flags.max_users_per_role.toString()) {
                            handleNumberChange('max_users_per_role', e.target.value)
                          }
                        }}
                        disabled={updateFlags.isPending || !flags.rbac_enabled}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground flex items-center">
                        users per role
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      updateFlags.mutate({
                        rbac_enabled: true,
                        custom_roles_enabled: true,
                        role_templates_enabled: true,
                        permission_inheritance_enabled: true,
                        audit_logging_enabled: true,
                        least_privilege_enforcement: true
                      })
                    }}
                    disabled={updateFlags.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enable All Features
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      updateFlags.mutate({
                        rbac_enabled: false,
                        custom_roles_enabled: false,
                        role_templates_enabled: false,
                        permission_inheritance_enabled: false,
                        bulk_assignment_enabled: false,
                        role_expiration_enabled: false,
                        access_review_enabled: false
                      })
                    }}
                    disabled={updateFlags.isPending}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Disable All Features
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feature flags found</h3>
                <p className="text-muted-foreground">
                  Unable to load RBAC feature flags for this tenant
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Info Card */}
      {!selectedTenantId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Gear className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Tenant</h3>
            <p className="text-muted-foreground">
              Choose a tenant from the dropdown above to configure their RBAC features
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
