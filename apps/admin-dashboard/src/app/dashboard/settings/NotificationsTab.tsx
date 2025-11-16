'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationsTabProps {
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  readOnly?: boolean;
}

interface NotificationSettings {
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  customerRegistration: boolean;
  reviewNotifications: boolean;
  marketingEmails: boolean;
}

export default function NotificationsTab({ settings, onSave, isSaving, readOnly = false }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderNotifications: true,
    lowStockAlerts: true,
    customerRegistration: false,
    reviewNotifications: true,
    marketingEmails: false,
  });

  useEffect(() => {
    // Load notification settings from tenant metadata if available
    if (settings?.metadata?.notifications) {
      setNotifications(settings.metadata.notifications);
    }
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // Save notifications in tenant metadata
    onSave({
      metadata: {
        ...settings?.metadata,
        notifications,
      },
    });
  };

  const notificationGroups = [
    {
      title: 'Order Notifications',
      description: 'Get notified when new orders are placed',
      icon: Bell,
      key: 'orderNotifications' as keyof NotificationSettings,
    },
    {
      title: 'Low Stock Alerts',
      description: 'Receive alerts when products are running low',
      icon: Bell,
      key: 'lowStockAlerts' as keyof NotificationSettings,
    },
    {
      title: 'Customer Registration',
      description: 'Get notified when new customers sign up',
      icon: Bell,
      key: 'customerRegistration' as keyof NotificationSettings,
    },
    {
      title: 'Review Notifications',
      description: 'Receive notifications for new product reviews',
      icon: MessageSquare,
      key: 'reviewNotifications' as keyof NotificationSettings,
    },
    {
      title: 'Marketing Emails',
      description: 'Receive marketing and promotional emails',
      icon: Mail,
      key: 'marketingEmails' as keyof NotificationSettings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Notifications Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure which email notifications you want to receive
        </p>

        <div className="space-y-4">
          {notificationGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.key}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{group.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(group.key)}
                  disabled={readOnly}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    notifications[group.key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifications[group.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Email Delivery</h4>
              <p className="text-sm text-blue-700 mt-1">
                Notifications will be sent to: <strong>{settings?.email}</strong>
              </p>
              <p className="text-sm text-blue-600 mt-2">
                To change the email address, update your store information in the Store Information tab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
          </button>
        </div>
      )}
    </div>
  );
}

