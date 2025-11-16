'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, 
  Palette, 
  Bell, 
  Shield, 
  Info,
  Building2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import StoreInfoTab from './StoreInfoTab';
import AppearanceTab from './AppearanceTab';
import NotificationsTab from './NotificationsTab';
import TenantInfoTab from './TenantInfoTab';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission, getUserRole } from '@/lib/permissions';
import { authService } from '@/lib/auth';

type TabType = 'store' | 'appearance' | 'notifications' | 'security' | 'tenant';

const tabs = [
  { id: 'tenant' as TabType, name: 'Tenant Information', icon: Building2 },
  { id: 'store' as TabType, name: 'Store Information', icon: Store },
  { id: 'appearance' as TabType, name: 'Appearance', icon: Palette },
  { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
  { id: 'security' as TabType, name: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    const role = getUserRole();
    setUserRole(role);
    
    // Get tenant ID from stored user
    const user = authService.getStoredUser();
    if (user?.tenantId) {
      setTenantId(user.tenantId);
    }

    // Set default tab based on role
    // Admin and Staff see Tenant Information first, Super Admin sees Store Information
    if (role === 'ADMIN' || role === 'STAFF') {
      setActiveTab('tenant');
    } else {
      setActiveTab('store');
    }
  }, []);

  // Fetch current tenant settings (for store info, appearance, notifications)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const response = await api.get('/tenants/info');
      return response.data.data;
    },
  });

  // Fetch full tenant details (for tenant info tab) - Admin and Staff only
  const { data: tenantDetails, isLoading: tenantDetailsLoading } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID not found');
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data.data;
    },
    enabled: mounted && !!tenantId && (userRole === 'ADMIN' || userRole === 'STAFF'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!settings?.id) throw new Error('Tenant ID not found');
      return await api.put(`/tenants/${settings.id}`, data);
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  // Update tenant details mutation (for tenant info tab)
  const updateTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!tenantId) throw new Error('Tenant ID not found');
      return await api.put(`/tenants/${tenantId}`, data);
    },
    onSuccess: () => {
      toast.success('Tenant information updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update tenant information');
    },
  });

  const handleSave = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleTenantSave = (data: any) => {
    updateTenantMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your store configuration</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Settings Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              Changes to your store settings will be reflected across your storefront and admin dashboard. Make sure to save your changes before navigating away.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
            {tabs
              .filter((tab) => {
                // Show Tenant Information tab only for Admin and Staff
                if (tab.id === 'tenant') {
                  return mounted && (userRole === 'ADMIN' || userRole === 'STAFF');
                }
                return true;
              })
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'tenant' && mounted && (userRole === 'ADMIN' || userRole === 'STAFF') && (
            <>
              {tenantDetailsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500 mt-4">Loading tenant information...</p>
                </div>
              ) : (
                <PermissionGuard
                  permission={Permission.SETTINGS_UPDATE}
                  fallback={
                    <TenantInfoTab
                      settings={tenantDetails}
                      onSave={() => {}}
                      isSaving={false}
                      readOnly={true}
                    />
                  }
                >
                  <TenantInfoTab
                    settings={tenantDetails}
                    onSave={handleTenantSave}
                    isSaving={updateTenantMutation.isPending}
                    readOnly={false}
                  />
                </PermissionGuard>
              )}
            </>
          )}
          {activeTab === 'store' && (
            <PermissionGuard
              permission={Permission.SETTINGS_UPDATE}
              fallback={
                <StoreInfoTab
                  settings={settings}
                  onSave={() => {}}
                  isSaving={false}
                  readOnly={true}
                />
              }
            >
              <StoreInfoTab
                settings={settings}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            </PermissionGuard>
          )}
          {activeTab === 'appearance' && (
            <PermissionGuard
              permission={Permission.SETTINGS_UPDATE}
              fallback={
                <AppearanceTab
                  settings={settings}
                  onSave={() => {}}
                  isSaving={false}
                  readOnly={true}
                />
              }
            >
              <AppearanceTab
                settings={settings}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            </PermissionGuard>
          )}
          {activeTab === 'notifications' && (
            <PermissionGuard
              permission={Permission.SETTINGS_UPDATE}
              fallback={
                <NotificationsTab
                  settings={settings}
                  onSave={() => {}}
                  isSaving={false}
                  readOnly={true}
                />
              }
            >
              <NotificationsTab
                settings={settings}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            </PermissionGuard>
          )}
          {activeTab === 'security' && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
              <p className="text-gray-500">
                Security settings will be available in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

