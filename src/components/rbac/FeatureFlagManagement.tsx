import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Flag, Warning } from '@phosphor-icons/react';

interface Role {
  role_id: string;
  name: string;
  display_name: string;
}

interface FeatureFlag {
  feature_flag_id: string;
  tenant_id: string;
  role_id: string;
  feature_name: string;
  is_enabled: boolean;
}

interface FeatureFlagManagementProps {
  roles: Role[];
}

const AVAILABLE_FEATURES = [
  { name: 'advanced_analytics', display: 'Advanced Analytics', description: 'Access to detailed analytics and reports' },
  { name: 'bulk_operations', display: 'Bulk Operations', description: 'Perform bulk import/export operations' },
  { name: 'api_access', display: 'API Access', description: 'Access to REST API endpoints' },
  { name: 'custom_reports', display: 'Custom Reports', description: 'Create and schedule custom reports' },
  { name: 'data_export', display: 'Data Export', description: 'Export data to CSV/Excel' },
  { name: 'integrations', display: 'Third-Party Integrations', description: 'Configure external integrations' },
  { name: 'audit_logs', display: 'Audit Logs', description: 'View detailed audit trail' },
  { name: 'advanced_search', display: 'Advanced Search', description: 'Use advanced search filters' },
  { name: 'batch_messaging', display: 'Batch Messaging', description: 'Send messages to multiple customers' },
  { name: 'inventory_forecasting', display: 'Inventory Forecasting', description: 'AI-powered inventory predictions' }
];

export const FeatureFlagManagement: React.FC<FeatureFlagManagementProps> = ({ roles }) => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Fetch feature flags
  const { data: featureFlags, isLoading } = useQuery({
    queryKey: ['feature-flags', selectedRole],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const url = selectedRole
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/feature-flags?role_id=${selectedRole}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/feature-flags`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      return response.json();
    },
    enabled: !!selectedRole
  });

  // Update feature flag mutation
  const updateFeatureFlagMutation = useMutation({
    mutationFn: async ({ role_id, feature_name, is_enabled }: { 
      role_id: string; 
      feature_name: string; 
      is_enabled: boolean;
    }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/feature-flags`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role_id, feature_name, is_enabled })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update feature flag');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleFeatureToggle = (featureName: string, currentValue: boolean) => {
    if (!selectedRole) {
      toast.error('Please select a role first');
      return;
    }

    updateFeatureFlagMutation.mutate({
      role_id: selectedRole,
      feature_name: featureName,
      is_enabled: !currentValue
    });
  };

  const isFeatureEnabled = (featureName: string): boolean => {
    if (!featureFlags) return false;
    const flag = featureFlags.find((f: FeatureFlag) => f.feature_name === featureName);
    return flag?.is_enabled || false;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" weight="fill" />
            Feature Flags Management
          </CardTitle>
          <CardDescription>
            Control which features are available to each role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role-select">Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Choose a role to configure features" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role: Role) => (
                  <SelectItem key={role.role_id} value={role.role_id}>
                    {role.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedRole && (
            <div className="py-12 text-center text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a role to configure feature flags</p>
            </div>
          )}

          {selectedRole && isLoading && (
            <div className="py-8 text-center">Loading feature flags...</div>
          )}

          {selectedRole && !isLoading && (
            <div className="space-y-3 mt-6">
              {AVAILABLE_FEATURES.map((feature) => {
                const enabled = isFeatureEnabled(feature.name);
                return (
                  <div
                    key={feature.name}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={feature.name}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {feature.display}
                        </Label>
                        {enabled && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                        {feature.name}
                      </p>
                    </div>
                    <Switch
                      id={feature.name}
                      checked={enabled}
                      onCheckedChange={() => handleFeatureToggle(feature.name, enabled)}
                      disabled={updateFeatureFlagMutation.isPending}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {selectedRole && !isLoading && (
            <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex gap-3">
                <Warning className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Feature Flag Changes
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Changes to feature flags take effect immediately for all users with this role. 
                    Be careful when disabling features that are currently in use.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Feature flags</strong> allow you to enable or disable specific features for different roles
              without requiring code changes or deployments.
            </p>
            <p className="text-muted-foreground">
              Use feature flags to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Gradually roll out new features to specific user groups</li>
              <li>Create tiered access levels (e.g., basic, premium, enterprise)</li>
              <li>Quickly disable problematic features without downtime</li>
              <li>Run A/B tests with different user segments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
