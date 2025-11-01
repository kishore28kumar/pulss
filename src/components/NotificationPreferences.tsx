/**
 * Notification Preferences Component
 * Allows users to manage their notification settings
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Clock,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface NotificationType {
  type_code: string;
  name: string;
  description: string;
  category: string;
  can_opt_out: boolean;
}

interface NotificationPreference {
  preference_id: string;
  type_code: string;
  type_name: string;
  description: string;
  category: string;
  can_opt_out: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: string | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface NotificationPreferencesProps {
  apiUrl?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  apiUrl = '/api/advanced-notifications',
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch notification types
  const fetchNotificationTypes = async () => {
    try {
      const response = await fetch(`${apiUrl}/types`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotificationTypes(data.types || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notification types:', error);
      toast.error('Failed to load notification types');
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    try {
      const response = await fetch(`${apiUrl}/preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.preferences || []);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchNotificationTypes(), fetchPreferences()]);
      setIsLoading(false);
    };
    init();
  }, []);

  // Update preference
  const updatePreference = async (
    typeCode: string,
    updates: Partial<NotificationPreference>
  ) => {
    try {
      const response = await fetch(`${apiUrl}/preferences/${typeCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          emailEnabled: updates.email_enabled,
          smsEnabled: updates.sms_enabled,
          pushEnabled: updates.push_enabled,
          whatsappEnabled: updates.whatsapp_enabled,
          inAppEnabled: updates.in_app_enabled,
          digestFrequency: updates.digest_frequency,
          quietHoursStart: updates.quiet_hours_start,
          quietHoursEnd: updates.quiet_hours_end,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setPreferences((prev) => {
            const existing = prev.find((p) => p.type_code === typeCode);
            if (existing) {
              return prev.map((p) =>
                p.type_code === typeCode ? { ...p, ...updates } : p
              );
            } else {
              // Add new preference
              return [...prev, data.preference];
            }
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  };

  // Toggle channel for a notification type
  const toggleChannel = async (
    typeCode: string,
    channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'in_app',
    enabled: boolean
  ) => {
    const preference = preferences.find((p) => p.type_code === typeCode);
    const updates: Partial<NotificationPreference> = {
      email_enabled: preference?.email_enabled ?? true,
      sms_enabled: preference?.sms_enabled ?? false,
      push_enabled: preference?.push_enabled ?? true,
      whatsapp_enabled: preference?.whatsapp_enabled ?? false,
      in_app_enabled: preference?.in_app_enabled ?? true,
    };

    updates[`${channel}_enabled`] = enabled;

    const success = await updatePreference(typeCode, updates);
    if (success) {
      toast.success('Preference updated');
    } else {
      toast.error('Failed to update preference');
    }
  };

  // Get categories
  const categories = Array.from(
    new Set(notificationTypes.map((t) => t.category))
  );

  // Filter types by category
  const filteredTypes =
    selectedCategory === 'all'
      ? notificationTypes
      : notificationTypes.filter((t) => t.category === selectedCategory);

  // Get preference for a type
  const getPreference = (typeCode: string): NotificationPreference | undefined => {
    return preferences.find((p) => p.type_code === typeCode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how you receive notifications across different channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, 1fr)` }}>
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6 space-y-4">
              {filteredTypes.map((type) => {
                const pref = getPreference(type.type_code);
                const canOptOut = type.can_opt_out;

                return (
                  <motion.div
                    key={type.type_code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">{type.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {type.description}
                            </p>
                            {!canOptOut && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                ⚠️ This notification cannot be disabled
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* Email */}
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`${type.type_code}-email`} className="text-sm">
                                Email
                              </Label>
                              <Switch
                                id={`${type.type_code}-email`}
                                checked={pref?.email_enabled ?? true}
                                onCheckedChange={(checked) =>
                                  toggleChannel(type.type_code, 'email', checked)
                                }
                                disabled={!canOptOut}
                              />
                            </div>

                            {/* Push */}
                            <div className="flex items-center space-x-2">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`${type.type_code}-push`} className="text-sm">
                                Push
                              </Label>
                              <Switch
                                id={`${type.type_code}-push`}
                                checked={pref?.push_enabled ?? true}
                                onCheckedChange={(checked) =>
                                  toggleChannel(type.type_code, 'push', checked)
                                }
                                disabled={!canOptOut}
                              />
                            </div>

                            {/* SMS */}
                            <div className="flex items-center space-x-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`${type.type_code}-sms`} className="text-sm">
                                SMS
                              </Label>
                              <Switch
                                id={`${type.type_code}-sms`}
                                checked={pref?.sms_enabled ?? false}
                                onCheckedChange={(checked) =>
                                  toggleChannel(type.type_code, 'sms', checked)
                                }
                                disabled={!canOptOut}
                              />
                            </div>

                            {/* WhatsApp */}
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`${type.type_code}-whatsapp`} className="text-sm">
                                WhatsApp
                              </Label>
                              <Switch
                                id={`${type.type_code}-whatsapp`}
                                checked={pref?.whatsapp_enabled ?? false}
                                onCheckedChange={(checked) =>
                                  toggleChannel(type.type_code, 'whatsapp', checked)
                                }
                                disabled={!canOptOut}
                              />
                            </div>

                            {/* In-App */}
                            <div className="flex items-center space-x-2">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`${type.type_code}-in-app`} className="text-sm">
                                In-App
                              </Label>
                              <Switch
                                id={`${type.type_code}-in-app`}
                                checked={pref?.in_app_enabled ?? true}
                                onCheckedChange={(checked) =>
                                  toggleChannel(type.type_code, 'in_app', checked)
                                }
                                disabled={!canOptOut}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Global Quiet Hours Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set a time range when you don't want to receive non-urgent notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Start Time</Label>
              <input
                id="quiet-start"
                type="time"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">End Time</Label>
              <input
                id="quiet-end"
                type="time"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            During quiet hours, only urgent notifications will be delivered
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
