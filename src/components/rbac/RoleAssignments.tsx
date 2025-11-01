import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash, User, Shield } from '@phosphor-icons/react';

interface Role {
  role_id: string;
  name: string;
  display_name: string;
  is_system_role: boolean;
}

interface Admin {
  admin_id: string;
  email: string;
  full_name: string;
}

interface RoleAssignment {
  admin_id: string;
  role_id: string;
  email: string;
  full_name: string;
  role_name: string;
  role_display_name: string;
}

interface RoleAssignmentsProps {
  roles: Role[];
}

export const RoleAssignments: React.FC<RoleAssignmentsProps> = ({ roles }) => {
  const queryClient = useQueryClient();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch admins
  const { data: admins } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      // Using the existing tenants/users endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tenants/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      
      return response.json();
    }
  });

  // Fetch role assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      
      // Fetch assignments for all admins
      const adminList = admins || [];
      const assignmentPromises = adminList.map(async (admin: Admin) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/users/${admin.admin_id}/roles`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            return data.roles.map((role: any) => ({
              admin_id: admin.admin_id,
              role_id: role.role_id,
              email: admin.email,
              full_name: admin.full_name,
              role_name: role.name,
              role_display_name: role.display_name
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch roles for admin ${admin.admin_id}:`, error);
        }
        return [];
      });
      
      const results = await Promise.all(assignmentPromises);
      return results.flat();
    },
    enabled: !!admins && admins.length > 0
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ admin_id, role_id }: { admin_id: string; role_id: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/assign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ admin_id, role_id })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      toast.success('Role assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedAdmin('');
      setSelectedRole('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Revoke role mutation
  const revokeRoleMutation = useMutation({
    mutationFn: async ({ admin_id, role_id }: { admin_id: string; role_id: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/revoke`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ admin_id, role_id })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      toast.success('Role revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleAssignRole = () => {
    if (selectedAdmin && selectedRole) {
      assignRoleMutation.mutate({ admin_id: selectedAdmin, role_id: selectedRole });
    }
  };

  const handleRevokeRole = (admin_id: string, role_id: string) => {
    if (window.confirm('Are you sure you want to revoke this role?')) {
      revokeRoleMutation.mutate({ admin_id, role_id });
    }
  };

  // Group assignments by admin
  const groupedAssignments = assignments?.reduce((acc: Record<string, RoleAssignment[]>, assignment: RoleAssignment) => {
    if (!acc[assignment.admin_id]) {
      acc[assignment.admin_id] = [];
    }
    acc[assignment.admin_id].push(assignment);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Role Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Manage which roles are assigned to each user
          </p>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Role
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            Loading assignments...
          </CardContent>
        </Card>
      ) : Object.keys(groupedAssignments).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No role assignments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(groupedAssignments).map(([adminId, adminAssignments]) => {
            const firstAssignment = adminAssignments[0];
            return (
              <Card key={adminId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" weight="fill" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {firstAssignment.full_name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription>{firstAssignment.email}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {adminAssignments.map((assignment) => (
                      <Badge
                        key={assignment.role_id}
                        variant="secondary"
                        className="text-sm px-3 py-1.5 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" weight="fill" />
                        {assignment.role_display_name}
                        <button
                          onClick={() => handleRevokeRole(assignment.admin_id, assignment.role_id)}
                          className="ml-1 hover:text-destructive transition-colors"
                          aria-label="Revoke role"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Select a user and role to assign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {admins?.map((admin: Admin) => (
                    <SelectItem key={admin.admin_id} value={admin.admin_id}>
                      {admin.full_name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role: Role) => (
                    <SelectItem key={role.role_id} value={role.role_id}>
                      {role.display_name}
                      {role.is_system_role && <Badge variant="secondary" className="ml-2 text-xs">System</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedAdmin || !selectedRole || assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
