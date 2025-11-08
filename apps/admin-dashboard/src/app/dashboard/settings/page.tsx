'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, 
  Palette, 
  Bell, 
  Shield, 
  Save,
  Info
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import StoreInfoTab from './StoreInfoTab';
import AppearanceTab from './AppearanceTab';
import NotificationsTab from './NotificationsTab';

type TabType = 'store' | 'appearance' | 'notifications' | 'security';

const tabs = [
  { id: 'store' as TabType, name: 'Store Information', icon: Store },
  { id: 'appearance' as TabType, name: 'Appearance', icon: Palette },
  { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
  { id: 'security' as TabType, name: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const queryClient = useQueryClient();

  // Fetch current tenant settings
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
          <p className="text-gray-500 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your store configuration</p>
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
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'store' && (
            <StoreInfoTab
              settings={settings}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
            />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab
              settings={settings}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              settings={settings}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
            />
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

