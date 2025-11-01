import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Palette,
  Globe,
  EnvelopeSimple,
  DeviceMobile,
  Bell,
  Code,
  Download,
  Upload,
  ShieldCheck,
  MapPin,
  Crown,
  Image as ImageIcon,
  TextAa,
  FileCss,
} from '@phosphor-icons/react';

interface BrandingFeatureTogglesProps {
  tenantId: string;
  tenantName: string;
}

interface FeatureToggles {
  toggle_id?: string;
  tenant_id: string;
  custom_logo_enabled: boolean;
  custom_colors_enabled: boolean;
  custom_fonts_enabled: boolean;
  custom_css_enabled: boolean;
  custom_domain_enabled: boolean;
  max_custom_domains: number;
  branded_email_enabled: boolean;
  branded_sms_enabled: boolean;
  email_template_customization: boolean;
  sms_template_customization: boolean;
  branded_notifications_enabled: boolean;
  notification_template_customization: boolean;
  branded_api_docs_enabled: boolean;
  white_label_mode_enabled: boolean;
  asset_management_enabled: boolean;
  compliance_templates_enabled: boolean;
  branding_export_enabled: boolean;
  branding_import_enabled: boolean;
  region_customization_enabled: boolean;
  allowed_regions: string[];
  max_logo_size_mb: number;
  max_asset_storage_mb: number;
  notes?: string;
}

export const BrandingFeatureToggles: React.FC<BrandingFeatureTogglesProps> = ({
  tenantId,
  tenantName,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState<FeatureToggles>({
    tenant_id: tenantId,
    custom_logo_enabled: false,
    custom_colors_enabled: false,
    custom_fonts_enabled: false,
    custom_css_enabled: false,
    custom_domain_enabled: false,
    max_custom_domains: 1,
    branded_email_enabled: false,
    branded_sms_enabled: false,
    email_template_customization: false,
    sms_template_customization: false,
    branded_notifications_enabled: false,
    notification_template_customization: false,
    branded_api_docs_enabled: false,
    white_label_mode_enabled: false,
    asset_management_enabled: false,
    compliance_templates_enabled: false,
    branding_export_enabled: false,
    branding_import_enabled: false,
    region_customization_enabled: false,
    allowed_regions: ['india', 'global'],
    max_logo_size_mb: 5.0,
    max_asset_storage_mb: 100.0,
    notes: '',
  });

  useEffect(() => {
    fetchToggles();
  }, [tenantId]);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/branding/toggles/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setToggles({ ...toggles, ...data });
      }
    } catch (error) {
      console.error('Error fetching toggles:', error);
      toast.error('Failed to load feature toggles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/branding/toggles/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(toggles),
      });

      if (response.ok) {
        toast.success('Feature toggles updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update toggles');
      }
    } catch (error) {
      console.error('Error saving toggles:', error);
      toast.error('Failed to save feature toggles');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof FeatureToggles) => {
    setToggles((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field: keyof FeatureToggles, value: any) => {
    setToggles((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const enableAllBasic = () => {
    setToggles((prev) => ({
      ...prev,
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      max_custom_domains: 1,
      max_logo_size_mb: 5.0,
      max_asset_storage_mb: 100.0,
    }));
    toast.info('Basic features enabled');
  };

  const enableAllProfessional = () => {
    setToggles((prev) => ({
      ...prev,
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      custom_fonts_enabled: true,
      custom_domain_enabled: true,
      branded_email_enabled: true,
      email_template_customization: true,
      asset_management_enabled: true,
      branding_export_enabled: true,
      max_custom_domains: 3,
      max_logo_size_mb: 10.0,
      max_asset_storage_mb: 500.0,
    }));
    toast.info('Professional features enabled');
  };

  const enableAllEnterprise = () => {
    setToggles((prev) => ({
      ...prev,
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      custom_fonts_enabled: true,
      custom_css_enabled: true,
      custom_domain_enabled: true,
      branded_email_enabled: true,
      branded_sms_enabled: true,
      branded_notifications_enabled: true,
      branded_api_docs_enabled: true,
      email_template_customization: true,
      sms_template_customization: true,
      notification_template_customization: true,
      white_label_mode_enabled: true,
      asset_management_enabled: true,
      compliance_templates_enabled: true,
      branding_export_enabled: true,
      branding_import_enabled: true,
      region_customization_enabled: true,
      max_custom_domains: 999,
      max_logo_size_mb: 50.0,
      max_asset_storage_mb: 5000.0,
    }));
    toast.info('Enterprise features enabled');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading feature toggles...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Branding Feature Toggles</CardTitle>
                <CardDescription>
                  Control advanced branding features for {tenantName}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={enableAllBasic}>
                Basic Tier
              </Button>
              <Button variant="outline" size="sm" onClick={enableAllProfessional}>
                Professional
              </Button>
              <Button variant="outline" size="sm" onClick={enableAllEnterprise}>
                Enterprise
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Core Branding Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Core Branding Features
          </CardTitle>
          <CardDescription>Basic branding customization options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Label>Custom Logo</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom logo upload (light/dark/favicon)
              </p>
            </div>
            <Switch
              checked={toggles.custom_logo_enabled}
              onCheckedChange={() => handleToggle('custom_logo_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label>Custom Colors</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom color palette configuration
              </p>
            </div>
            <Switch
              checked={toggles.custom_colors_enabled}
              onCheckedChange={() => handleToggle('custom_colors_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <TextAa className="h-4 w-4 text-muted-foreground" />
                <Label>Custom Fonts</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom font selection (Google Fonts)
              </p>
            </div>
            <Switch
              checked={toggles.custom_fonts_enabled}
              onCheckedChange={() => handleToggle('custom_fonts_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCss className="h-4 w-4 text-muted-foreground" />
                <Label>Custom CSS</Label>
                <Badge variant="secondary" className="text-xs">
                  Advanced
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Allow custom CSS for advanced styling</p>
            </div>
            <Switch
              checked={toggles.custom_css_enabled}
              onCheckedChange={() => handleToggle('custom_css_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain Features
          </CardTitle>
          <CardDescription>Custom domain and DNS management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Custom Domains</Label>
              <p className="text-sm text-muted-foreground">
                Allow custom domain configuration with DNS verification
              </p>
            </div>
            <Switch
              checked={toggles.custom_domain_enabled}
              onCheckedChange={() => handleToggle('custom_domain_enabled')}
            />
          </div>

          {toggles.custom_domain_enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Maximum Custom Domains</Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={toggles.max_custom_domains}
                  onChange={(e) =>
                    handleInputChange('max_custom_domains', parseInt(e.target.value))
                  }
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of custom domains allowed
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Communication Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeSimple className="h-5 w-5" />
            Communication Branding
          </CardTitle>
          <CardDescription>Branded email, SMS, and notification templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <EnvelopeSimple className="h-4 w-4 text-muted-foreground" />
                <Label>Branded Emails</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom email header, footer, and from name
              </p>
            </div>
            <Switch
              checked={toggles.branded_email_enabled}
              onCheckedChange={() => handleToggle('branded_email_enabled')}
            />
          </div>

          {toggles.branded_email_enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label className="text-sm">Email Template Customization</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow custom email template editing
                  </p>
                </div>
                <Switch
                  checked={toggles.email_template_customization}
                  onCheckedChange={() => handleToggle('email_template_customization')}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <DeviceMobile className="h-4 w-4 text-muted-foreground" />
                <Label>Branded SMS</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom SMS sender name and templates
              </p>
            </div>
            <Switch
              checked={toggles.branded_sms_enabled}
              onCheckedChange={() => handleToggle('branded_sms_enabled')}
            />
          </div>

          {toggles.branded_sms_enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label className="text-sm">SMS Template Customization</Label>
                  <p className="text-xs text-muted-foreground">Allow custom SMS template editing</p>
                </div>
                <Switch
                  checked={toggles.sms_template_customization}
                  onCheckedChange={() => handleToggle('sms_template_customization')}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label>Branded Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom notification icon and templates
              </p>
            </div>
            <Switch
              checked={toggles.branded_notifications_enabled}
              onCheckedChange={() => handleToggle('branded_notifications_enabled')}
            />
          </div>

          {toggles.branded_notifications_enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label className="text-sm">Notification Template Customization</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow custom notification template editing
                  </p>
                </div>
                <Switch
                  checked={toggles.notification_template_customization}
                  onCheckedChange={() => handleToggle('notification_template_customization')}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Advanced Features
          </CardTitle>
          <CardDescription>Premium branding capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <Label>Branded API Documentation</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow custom API docs with tenant branding
              </p>
            </div>
            <Switch
              checked={toggles.branded_api_docs_enabled}
              onCheckedChange={() => handleToggle('branded_api_docs_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <Label>White-Label Mode</Label>
                <Badge variant="destructive" className="text-xs">
                  Premium
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Remove all Pulss branding (complete white-label)
              </p>
            </div>
            <Switch
              checked={toggles.white_label_mode_enabled}
              onCheckedChange={() => handleToggle('white_label_mode_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Asset Management</Label>
              <p className="text-sm text-muted-foreground">
                Enable organized asset upload and management
              </p>
            </div>
            <Switch
              checked={toggles.asset_management_enabled}
              onCheckedChange={() => handleToggle('asset_management_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compliance Templates</Label>
              <p className="text-sm text-muted-foreground">
                Allow custom privacy policy and terms templates
              </p>
            </div>
            <Switch
              checked={toggles.compliance_templates_enabled}
              onCheckedChange={() => handleToggle('compliance_templates_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export/Import Features
          </CardTitle>
          <CardDescription>Configuration backup and restore capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <Label>Branding Export</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow exporting branding configuration
              </p>
            </div>
            <Switch
              checked={toggles.branding_export_enabled}
              onCheckedChange={() => handleToggle('branding_export_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Label>Branding Import</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow importing branding configuration
              </p>
            </div>
            <Switch
              checked={toggles.branding_import_enabled}
              onCheckedChange={() => handleToggle('branding_import_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Region Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Region Controls
          </CardTitle>
          <CardDescription>Region-specific customization and compliance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Region Customization</Label>
              <p className="text-sm text-muted-foreground">
                Allow region-specific branding configurations
              </p>
            </div>
            <Switch
              checked={toggles.region_customization_enabled}
              onCheckedChange={() => handleToggle('region_customization_enabled')}
            />
          </div>

          {toggles.region_customization_enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Allowed Regions</Label>
                <div className="flex flex-wrap gap-2">
                  {['india', 'global', 'us', 'eu', 'asia', 'africa'].map((region) => (
                    <Badge
                      key={region}
                      variant={toggles.allowed_regions.includes(region) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const regions = toggles.allowed_regions.includes(region)
                          ? toggles.allowed_regions.filter((r) => r !== region)
                          : [...toggles.allowed_regions, region];
                        handleInputChange('allowed_regions', regions);
                      }}
                    >
                      {region.toUpperCase()}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click to toggle region access</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Limits</CardTitle>
          <CardDescription>Storage and file size limits for branding assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Max Logo Size (MB)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={toggles.max_logo_size_mb}
                onChange={(e) => handleInputChange('max_logo_size_mb', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Maximum file size for logo uploads</p>
            </div>

            <div className="space-y-2">
              <Label>Max Asset Storage (MB)</Label>
              <Input
                type="number"
                min="10"
                max="10000"
                step="10"
                value={toggles.max_asset_storage_mb}
                onChange={(e) =>
                  handleInputChange('max_asset_storage_mb', parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Total storage limit for all branding assets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>Add notes about this tenant's branding configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Upgraded to Professional tier on 2025-10-20..."
            value={toggles.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 sticky bottom-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Changes will be applied immediately
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Feature Toggles'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
