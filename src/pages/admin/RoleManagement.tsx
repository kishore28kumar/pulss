import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash, 
  Users,
  Eye,
  Lock,
  Clock
} from '@phosphor-icons/react';

import { PermissionMatrix } from '@/components/rbac/PermissionMatrix';
import { RoleAssignments } from '@/components/rbac/RoleAssignments';
import { FeatureFlagManagement } from '@/components/rbac/FeatureFlagManagement';
import { RoleAuditLogs } from '@/components/rbac/RoleAuditLogs';

interface Role {
  role_id: string;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  user_count: number;
  tenant_id: string | null;
}

interface Permission {
  permission_id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
}

export const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('roles');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_ids: [] as string[]
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      return response.json();
    }
  });

  // Fetch permissions
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      
      return response.json();
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setIsCreateRoleOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permission_ids: []
    });
  };

  const handleCreateRole = () => {
    createRoleMutation.mutate(formData);
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditRoleOpen(true);
  };

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" weight="fill" />
            Role & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure roles, permissions, and access control for your organization
          </p>
        </div>
        <Button onClick={() => setIsCreateRoleOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesLoading ? (
              <div className="col-span-full text-center py-8">Loading roles...</div>
            ) : (
              roles?.map((role: Role) => (
                <Card key={role.role_id} className={role.is_system_role ? 'border-blue-200 bg-blue-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {role.display_name}
                          {role.is_system_role && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              System
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {role.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{role.user_count} user{role.user_count !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {!role.is_system_role && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role.role_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <RoleAssignments roles={roles || []} />
        </TabsContent>

        <TabsContent value="features">
          <FeatureFlagManagement roles={roles || []} />
        </TabsContent>

        <TabsContent value="audit">
          <RoleAuditLogs />
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name (Internal)</Label>
              <Input
                id="name"
                placeholder="e.g., inventory_manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase, underscores allowed, no spaces
              </p>
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
              <PermissionMatrix
                permissions={permissions || []}
                selectedPermissions={formData.permission_ids}
                onPermissionsChange={(ids) => setFormData({ ...formData, permission_ids: ids })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRole}
                disabled={!formData.name || !formData.display_name || createRoleMutation.isPending}
              >
                {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      {selectedRole && (
        <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRole.display_name}
                {selectedRole.is_system_role && (
                  <Badge variant="secondary" className="ml-2">System Role</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedRole.description || 'No description'}
              </DialogDescription>
            </DialogHeader>
            
            <PermissionMatrix
              roleId={selectedRole.role_id}
              permissions={permissions || []}
              readOnly={false}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RoleManagement;
