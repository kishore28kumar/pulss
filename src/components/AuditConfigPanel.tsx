import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Shield,
  Gear,
  Database,
  Warning,
  CheckCircle,
  FileText,
  Bell,
  GlobeHemisphereWest
} from '@phosphor-icons/react';

interface AuditConfig {
  config_id: string;
  tenant_id: string;
  enabled: boolean;
  api_logging_enabled: boolean;
  billing_logging_enabled: boolean;
  notification_logging_enabled: boolean;
  rbac_logging_enabled: boolean;
  branding_logging_enabled: boolean;
  subscription_logging_enabled: boolean;
  developer_portal_logging_enabled: boolean;
  compliance_mode: string;
  auto_tagging_enabled: boolean;
  retention_days: number;
  auto_archive_enabled: boolean;
  archive_after_days: number;
  export_enabled: boolean;
  export_formats: string[];
  alerting_enabled: boolean;
  alert_on_failures: boolean;
  alert_threshold: number;
  region: string;
  region_restricted: boolean;
  allowed_regions: string[];
}

interface AuditConfigPanelProps {
  tenantId: string;
  tenantName: string;
  onConfigUpdate?: () => void;
}

export const AuditConfigPanel: React.FC<AuditConfigPanelProps> = ({
  tenantId,
  tenantName,
  onConfigUpdate
}) => {
  const [config, setConfig] = useState<AuditConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit-logs/config/settings?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch config');

      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Error fetching audit config:', error);
      toast.error('Failed to load audit configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/audit-logs/config/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          config: {
            enabled: config.enabled,
            api_logging_enabled: config.api_logging_enabled,
            billing_logging_enabled: config.billing_logging_enabled,
            notification_logging_enabled: config.notification_logging_enabled,
            rbac_logging_enabled: config.rbac_logging_enabled,
            branding_logging_enabled: config.branding_logging_enabled,
            subscription_logging_enabled: config.subscription_logging_enabled,
            developer_portal_logging_enabled: config.developer_portal_logging_enabled,
            compliance_mode: config.compliance_mode,
            auto_tagging_enabled: config.auto_tagging_enabled,
            retention_days: config.retention_days,
            auto_archive_enabled: config.auto_archive_enabled,
            archive_after_days: config.archive_after_days,
            export_enabled: config.export_enabled,
            export_formats: config.export_formats,
            alerting_enabled: config.alerting_enabled,
            alert_on_failures: config.alert_on_failures,
            alert_threshold: config.alert_threshold,
            region: config.region,
            region_restricted: config.region_restricted,
            allowed_regions: config.allowed_regions
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save config');

      toast.success('Audit configuration saved successfully');
      onConfigUpdate?.();
    } catch (error) {
      console.error('Error saving audit config:', error);
      toast.error('Failed to save audit configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<AuditConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading configuration...</div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Configuration not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Configuration
            </CardTitle>
            <CardDescription>
              Configure audit logging and compliance features for {tenantName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enabled">Master Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable all audit logging for this tenant
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance_mode">Compliance Mode</Label>
                <Select
                  value={config.compliance_mode}
                  onValueChange={(value) => updateConfig({ compliance_mode: value })}
                >
                  <SelectTrigger id="compliance_mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal - Basic logging only</SelectItem>
                    <SelectItem value="standard">Standard - Normal compliance</SelectItem>
                    <SelectItem value="strict">Strict - Full compliance logging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto_tagging">Auto-Tagging</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically tag audit logs with compliance categories
                  </p>
                </div>
                <Switch
                  id="auto_tagging"
                  checked={config.auto_tagging_enabled}
                  onCheckedChange={(checked) => updateConfig({ auto_tagging_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={config.region}
                  onValueChange={(value) => updateConfig({ region: value })}
                >
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="apac">Asia Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="region_restricted">Region Restrictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict audit log storage to specific regions
                  </p>
                </div>
                <Switch
                  id="region_restricted"
                  checked={config.region_restricted}
                  onCheckedChange={(checked) => updateConfig({ region_restricted: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Feature Toggles */}
          <TabsContent value="features" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="api_logging">API Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all API requests and responses
                  </p>
                </div>
                <Switch
                  id="api_logging"
                  checked={config.api_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ api_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="billing_logging">Billing Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all billing and payment operations
                  </p>
                </div>
                <Switch
                  id="billing_logging"
                  checked={config.billing_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ billing_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notification_logging">Notification Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log notification sends and delivery status
                  </p>
                </div>
                <Switch
                  id="notification_logging"
                  checked={config.notification_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ notification_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="rbac_logging">RBAC Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log role and permission changes
                  </p>
                </div>
                <Switch
                  id="rbac_logging"
                  checked={config.rbac_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ rbac_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="branding_logging">Branding Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log branding and theme changes
                  </p>
                </div>
                <Switch
                  id="branding_logging"
                  checked={config.branding_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ branding_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="subscription_logging">Subscription Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log subscription changes and renewals
                  </p>
                </div>
                <Switch
                  id="subscription_logging"
                  checked={config.subscription_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ subscription_logging_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="developer_portal_logging">Developer Portal Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log developer portal API key operations
                  </p>
                </div>
                <Switch
                  id="developer_portal_logging"
                  checked={config.developer_portal_logging_enabled}
                  onCheckedChange={(checked) => updateConfig({ developer_portal_logging_enabled: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Retention Settings */}
          <TabsContent value="retention" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retention_days">Retention Period (Days)</Label>
                <Input
                  id="retention_days"
                  type="number"
                  value={config.retention_days}
                  onChange={(e) => updateConfig({ retention_days: parseInt(e.target.value) })}
                  min={1}
                  max={3650}
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep audit logs before deletion (1-3650 days)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto_archive">Auto-Archive</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically archive old audit logs
                  </p>
                </div>
                <Switch
                  id="auto_archive"
                  checked={config.auto_archive_enabled}
                  onCheckedChange={(checked) => updateConfig({ auto_archive_enabled: checked })}
                />
              </div>

              {config.auto_archive_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="archive_after_days">Archive After (Days)</Label>
                  <Input
                    id="archive_after_days"
                    type="number"
                    value={config.archive_after_days}
                    onChange={(e) => updateConfig({ archive_after_days: parseInt(e.target.value) })}
                    min={1}
                    max={365}
                  />
                  <p className="text-sm text-muted-foreground">
                    Move logs to archive storage after this many days
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="export_enabled">Export Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow exporting audit logs
                  </p>
                </div>
                <Switch
                  id="export_enabled"
                  checked={config.export_enabled}
                  onCheckedChange={(checked) => updateConfig({ export_enabled: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Alert Settings */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="alerting_enabled">Enable Alerting</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts for suspicious activities
                  </p>
                </div>
                <Switch
                  id="alerting_enabled"
                  checked={config.alerting_enabled}
                  onCheckedChange={(checked) => updateConfig({ alerting_enabled: checked })}
                />
              </div>

              {config.alerting_enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="alert_on_failures">Alert on Failures</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts when operations fail
                      </p>
                    </div>
                    <Switch
                      id="alert_on_failures"
                      checked={config.alert_on_failures}
                      onCheckedChange={(checked) => updateConfig({ alert_on_failures: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert_threshold">Alert Threshold</Label>
                    <Input
                      id="alert_threshold"
                      type="number"
                      value={config.alert_threshold}
                      onChange={(e) => updateConfig({ alert_threshold: parseInt(e.target.value) })}
                      min={1}
                      max={1000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of failures before triggering an alert
                    </p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
