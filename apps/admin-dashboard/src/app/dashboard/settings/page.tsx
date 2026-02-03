'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Palette, 
  Bell, 
  Info,
  User,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AppearanceTab from './AppearanceTab';
import NotificationsTab from './NotificationsTab';
import ProfileTab from './ProfileTab';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';

type TabType = 'profile' | 'appearance' | 'notifications';

const tabs = [
  { id: 'profile' as TabType, name: 'Profile', icon: User },
  { id: 'appearance' as TabType, name: 'Appearance', icon: Palette },
  { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set default tab - Profile first for all users
    setActiveTab('profile');
  }, []);

  // Fetch current tenant settings (for store info, appearance, notifications)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const response = await api.get('/tenants/info');
      return response.data.data;
    },
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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  const handleSave = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage your store configuration</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">Settings Information</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Changes to your store settings will be reflected across your storefront and admin dashboard. Make sure to save your changes before navigating away.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition whitespace-nowrap
                    ${isActive
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
          {activeTab === 'profile' && (
            <ProfileTab
              readOnly={false}
            />
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
        </div>
      </div>
    </div>
  );
}

