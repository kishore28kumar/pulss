import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X } from '@phosphor-icons/react';

interface Permission {
  permission_id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
}

interface PermissionMatrixProps {
  roleId?: string;
  permissions: Permission[];
  selectedPermissions?: string[];
  onPermissionsChange?: (permissionIds: string[]) => void;
  readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roleId,
  permissions,
  selectedPermissions: externalSelected,
  onPermissionsChange,
  readOnly = false
}) => {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(externalSelected || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch role permissions if roleId is provided
  const { data: roleData } = useQuery({
    queryKey: ['role', roleId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/roles/${roleId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }
      
      return response.json();
    },
    enabled: !!roleId
  });

  // Initialize selected permissions from role data
  useEffect(() => {
    if (roleData?.permissions) {
      const permissionIds = roleData.permissions.map((p: Permission) => p.permission_id);
      setSelectedPermissions(permissionIds);
    } else if (externalSelected) {
      setSelectedPermissions(externalSelected);
    }
  }, [roleData, externalSelected]);

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/roles/${roleId}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ permission_ids: permissionIds })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update permissions');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      toast.success('Permissions updated successfully');
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    setSelectedPermissions(newSelected);
    setHasChanges(true);
    
    if (onPermissionsChange) {
      onPermissionsChange(newSelected);
    }
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.permission_id) || [];
    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id));
    
    let newSelected: string[];
    if (allSelected) {
      // Deselect all in category
      newSelected = selectedPermissions.filter(id => !categoryPermissions.includes(id));
    } else {
      // Select all in category
      newSelected = [...new Set([...selectedPermissions, ...categoryPermissions])];
    }
    
    setSelectedPermissions(newSelected);
    setHasChanges(true);
    
    if (onPermissionsChange) {
      onPermissionsChange(newSelected);
    }
  };

  const handleSave = () => {
    if (roleId) {
      updatePermissionsMutation.mutate(selectedPermissions);
    }
  };

  const handleReset = () => {
    if (roleData?.permissions) {
      const permissionIds = roleData.permissions.map((p: Permission) => p.permission_id);
      setSelectedPermissions(permissionIds);
    } else if (externalSelected) {
      setSelectedPermissions(externalSelected);
    }
    setHasChanges(false);
  };

  const categoryLabels: Record<string, string> = {
    users: 'User Management',
    roles: 'Role Management',
    orders: 'Order Management',
    products: 'Product Management',
    customers: 'Customer Management',
    analytics: 'Analytics',
    reports: 'Reports',
    settings: 'Settings',
    audit_logs: 'Audit Logs',
    feature_flags: 'Feature Flags',
    messaging: 'Messaging',
    notifications: 'Notifications',
    tenants: 'Tenant Management'
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
        const selectedCount = categoryPermissions.filter(p => 
          selectedPermissions.includes(p.permission_id)
        ).length;
        const totalCount = categoryPermissions.length;
        const allSelected = selectedCount === totalCount;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    {categoryLabels[category] || category}
                  </CardTitle>
                  <Badge variant="secondary">
                    {selectedCount} / {totalCount}
                  </Badge>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(category)}
                  >
                    {allSelected ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Select All
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryPermissions.map((permission) => (
                  <div
                    key={permission.permission_id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={permission.permission_id}
                      checked={selectedPermissions.includes(permission.permission_id)}
                      onCheckedChange={() => handlePermissionToggle(permission.permission_id)}
                      disabled={readOnly}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.permission_id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {permission.display_name}
                      </Label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                        {permission.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {roleId && !readOnly && hasChanges && (
        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-lg">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending}
          >
            {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};
