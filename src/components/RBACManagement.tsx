import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
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
  Users, 
  Key, 
  Lock, 
  Plus, 
  Pencil, 
  Trash,
  UserPlus,
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'

interface Role {
  role_id: string
  name: string
  display_name: string
  description: string
  is_system: boolean
  is_custom: boolean
  priority: number
  tenant_id?: string
  permissions?: Permission[]
}

interface Permission {
  permission_id: string
  name: string
  description: string
  action: string
  resource_name: string
  resource_description: string
}

interface Resource {
  resource_id: string
  name: string
  description: string
  resource_type: string
  permission_count: number
}

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
  max_custom_roles: number
  max_users_per_role: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Fetch functions
const fetchRoles = async (tenantId?: string) => {
  const url = tenantId 
    ? `${API_BASE_URL}/rbac/roles?tenant_id=${tenantId}`
    : `${API_BASE_URL}/rbac/roles`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch roles')
  const data = await response.json()
  return data.data
}

const fetchPermissions = async () => {
  const response = await fetch(`${API_BASE_URL}/rbac/permissions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch permissions')
  const data = await response.json()
  return data.data
}

const fetchResources = async () => {
  const response = await fetch(`${API_BASE_URL}/rbac/resources`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch resources')
  const data = await response.json()
  return data.data
}

const fetchRoleTemplates = async () => {
  const response = await fetch(`${API_BASE_URL}/rbac/templates`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch templates')
  const data = await response.json()
  return data.data
}

export const RBACManagement = ({ tenantId }: { tenantId?: string }) => {
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false)
  const queryClient = useQueryClient()

  // Queries
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['rbac-roles', tenantId],
    queryFn: () => fetchRoles(tenantId)
  })

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: fetchPermissions
  })

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['rbac-resources'],
    queryFn: fetchResources
  })

  const { data: templates } = useQuery({
    queryKey: ['rbac-templates'],
    queryFn: fetchRoleTemplates
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">RBAC Management</h2>
            <p className="text-muted-foreground">
              Manage roles, permissions, and access control
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsCreateRoleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <UserPlus className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <RolesManagement 
            roles={roles || []} 
            loading={rolesLoading}
            onSelectRole={setSelectedRole}
            onCreateRole={() => setIsCreateRoleOpen(true)}
          />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <PermissionsManagement 
            permissions={permissions || []}
            resources={resources || []}
            loading={permissionsLoading || resourcesLoading}
          />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <RoleAssignments 
            roles={roles || []}
            tenantId={tenantId}
            onAssignRole={() => setIsAssignRoleOpen(true)}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <RoleTemplatesView 
            templates={templates || []}
            tenantId={tenantId}
          />
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <CreateRoleDialog 
        open={isCreateRoleOpen}
        onOpenChange={setIsCreateRoleOpen}
        tenantId={tenantId}
        permissions={permissions || []}
      />
    </div>
  )
}

// Roles Management Component
const RolesManagement = ({ 
  roles, 
  loading, 
  onSelectRole,
  onCreateRole 
}: { 
  roles: Role[]
  loading: boolean
  onSelectRole: (role: Role) => void
  onCreateRole: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'system' && role.is_system) ||
                         (filterType === 'custom' && role.is_custom)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="system">System Roles</SelectItem>
            <SelectItem value="custom">Custom Roles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map(role => (
            <Card 
              key={role.role_id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectRole(role)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.display_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {role.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {role.is_system && (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    )}
                    {role.is_custom && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {role.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Priority: {role.priority}</span>
                  <span className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredRoles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Create your first custom role to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateRole}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Permissions Management Component
const PermissionsManagement = ({ 
  permissions, 
  resources,
  loading 
}: { 
  permissions: Permission[]
  resources: Resource[]
  loading: boolean
}) => {
  const [selectedResource, setSelectedResource] = useState<string>('all')

  const filteredPermissions = selectedResource === 'all'
    ? permissions
    : permissions.filter(p => p.resource_name === selectedResource)

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource_name]) {
      acc[perm.resource_name] = []
    }
    acc[perm.resource_name].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-4">
      {/* Resource Filter */}
      <div className="flex gap-4">
        <Select value={selectedResource} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resources.map(resource => (
              <SelectItem key={resource.resource_id} value={resource.name}>
                {resource.name} ({resource.permission_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions by Resource */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([resourceName, perms]) => (
            <Card key={resourceName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {resourceName}
                </CardTitle>
                <CardDescription>
                  {perms[0]?.resource_description || 'Resource permissions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map(permission => (
                    <div
                      key={permission.permission_id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Badge variant="outline">{permission.action}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {permission.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {permission.description}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Role Assignments Component
const RoleAssignments = ({ 
  roles, 
  tenantId,
  onAssignRole 
}: { 
  roles: Role[]
  tenantId?: string
  onAssignRole: () => void
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Assignments</CardTitle>
            <CardDescription>
              Manage user role assignments
            </CardDescription>
          </div>
          <Button onClick={onAssignRole}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Role Assignment Interface</h3>
          <p className="text-muted-foreground">
            Select a user to assign or modify their roles
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Role Templates Component
const RoleTemplatesView = ({ 
  templates,
  tenantId 
}: { 
  templates: any[]
  tenantId?: string
}) => {
  const queryClient = useQueryClient()

  const createFromTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`${API_BASE_URL}/rbac/templates/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ template_id: templateId, tenant_id: tenantId })
      })
      
      if (!response.ok) throw new Error('Failed to create role from template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] })
      toast.success('Role created from template successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role from template')
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <Card key={template.template_id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {template.display_name}
            </CardTitle>
            <CardDescription>
              {template.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium">Included Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {template.permissions.slice(0, 3).map((perm: string) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm.split(':')[0]}
                  </Badge>
                ))}
                {template.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => createFromTemplate.mutate(template.template_id)}
              disabled={createFromTemplate.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create from Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Create Role Dialog Component
const CreateRoleDialog = ({ 
  open, 
  onOpenChange, 
  tenantId,
  permissions 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId?: string
  permissions: Permission[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    selectedPermissions: [] as string[]
  })
  
  const queryClient = useQueryClient()

  const createRole = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`${API_BASE_URL}/rbac/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          display_name: data.display_name,
          description: data.description,
          tenant_id: tenantId,
          permissions: data.selectedPermissions
        })
      })
      
      if (!response.ok) throw new Error('Failed to create role')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] })
      toast.success('Role created successfully')
      onOpenChange(false)
      setFormData({ name: '', display_name: '', description: '', selectedPermissions: [] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role')
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Create a new custom role with specific permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name (System)</Label>
            <Input
              id="name"
              placeholder="e.g., inventory_manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="e.g., Inventory Manager"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role can do..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="mt-2 border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {permissions.slice(0, 20).map(permission => (
                <label
                  key={permission.permission_id}
                  className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedPermissions.includes(permission.permission_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          selectedPermissions: [...formData.selectedPermissions, permission.permission_id]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          selectedPermissions: formData.selectedPermissions.filter(id => id !== permission.permission_id)
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{permission.name}</p>
                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.selectedPermissions.length} permissions selected
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createRole.mutate(formData)}
            disabled={!formData.name || !formData.display_name || createRole.isPending}
          >
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
