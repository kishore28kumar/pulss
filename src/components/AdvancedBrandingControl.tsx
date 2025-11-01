import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface FeatureFlags {
  tenant_id: string;
  logo_upload_enabled: boolean;
  color_customization_enabled: boolean;
  theme_selection_enabled: boolean;
  favicon_enabled: boolean;
  login_customization_enabled: boolean;
  custom_domain_enabled: boolean;
  white_label_enabled: boolean;
  custom_footer_enabled: boolean;
  custom_legal_enabled: boolean;
  email_branding_enabled: boolean;
  custom_css_enabled: boolean;
  multi_brand_enabled: boolean;
  api_access_enabled: boolean;
  custom_email_templates_enabled: boolean;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
}

interface Tenant {
  tenant_id: string;
  name: string;
  subdomain?: string;
  status: string;
}

interface AdvancedBrandingControlProps {
  token: string;
}

const AdvancedBrandingControl: React.FC<AdvancedBrandingControlProps> = ({ token }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchFeatureFlags(selectedTenant.tenant_id);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async (tenantId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/branding/${tenantId}/features`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatures(response.data);
      setNotes(response.data.notes || '');
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature flags');
    }
  };

  const toggleFeature = (featureKey: keyof FeatureFlags) => {
    if (!features) return;
    setFeatures({
      ...features,
      [featureKey]: !features[featureKey]
    });
  };

  const saveFeatures = async () => {
    if (!selectedTenant || !features) return;

    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/api/branding/${selectedTenant.tenant_id}/features`,
        { ...features, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Feature flags updated successfully');
      fetchFeatureFlags(selectedTenant.tenant_id);
    } catch (error: any) {
      console.error('Error saving feature flags:', error);
      toast.error(error.response?.data?.error || 'Failed to save feature flags');
    } finally {
      setSaving(false);
    }
  };

  const featureGroups = [
    {
      title: 'Standard Features',
      description: 'Basic branding features available to all tenants by default',
      features: [
        { key: 'logo_upload_enabled', label: 'Logo Upload', description: 'Upload and customize logos' },
        { key: 'color_customization_enabled', label: 'Color Customization', description: 'Customize brand colors' },
        { key: 'theme_selection_enabled', label: 'Theme Selection', description: 'Choose from predefined themes' },
        { key: 'favicon_enabled', label: 'Favicon', description: 'Upload custom favicon' },
        { key: 'login_customization_enabled', label: 'Login Customization', description: 'Customize login page appearance' }
      ]
    },
    {
      title: 'Advanced Features',
      description: 'Advanced features that require super admin approval',
      features: [
        { key: 'custom_domain_enabled', label: 'Custom Domains', description: 'Use custom domains with DNS verification' },
        { key: 'white_label_enabled', label: 'White-Label Mode', description: 'Hide platform branding completely' },
        { key: 'custom_footer_enabled', label: 'Custom Footer', description: 'Add custom HTML footer content' },
        { key: 'custom_legal_enabled', label: 'Custom Legal Pages', description: 'Custom terms, privacy policy links' },
        { key: 'email_branding_enabled', label: 'Email Branding', description: 'Customize email templates' },
        { key: 'custom_css_enabled', label: 'Custom CSS', description: 'Add custom CSS styling' },
        { key: 'multi_brand_enabled', label: 'Multi-Brand Support', description: 'Manage multiple brands (for resellers)' },
        { key: 'api_access_enabled', label: 'API Access', description: 'Access branding via API' },
        { key: 'custom_email_templates_enabled', label: 'Custom Email Templates', description: 'Create custom email templates' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Advanced Branding Control</h2>
        <p className="text-muted-foreground">
          Enable or disable advanced branding features for specific tenants
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Super Admin Feature Control</p>
            <p className="text-sm text-blue-700 mt-1">
              Standard branding features (logo, colors, themes) are enabled by default for all tenants. 
              Advanced features (custom domains, white-label, etc.) require your explicit approval and can be 
              enabled on a per-tenant basis below.
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Selection */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Select Tenant</h3>
        <select
          value={selectedTenant?.tenant_id || ''}
          onChange={(e) => {
            const tenant = tenants.find(t => t.tenant_id === e.target.value);
            setSelectedTenant(tenant || null);
          }}
          className="w-full px-4 py-3 border rounded-lg text-base"
        >
          <option value="">-- Select a tenant --</option>
          {tenants.map(tenant => (
            <option key={tenant.tenant_id} value={tenant.tenant_id}>
              {tenant.name} {tenant.subdomain ? `(${tenant.subdomain})` : ''} - {tenant.status}
            </option>
          ))}
        </select>
      </div>

      {/* Feature Flags */}
      {selectedTenant && features && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {featureGroups.map(group => (
            <div key={group.title} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{group.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
              
              <div className="space-y-3">
                {group.features.map(feature => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{feature.label}</span>
                        {features[feature.key as keyof FeatureFlags] ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={features[feature.key as keyof FeatureFlags] as boolean || false}
                        onChange={() => toggleFeature(feature.key as keyof FeatureFlags)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Admin Notes */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about why certain features are enabled or disabled for this tenant..."
              className="w-full px-4 py-3 border rounded-lg min-h-[120px]"
            />
            {features.approved_at && (
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date(features.approved_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveFeatures}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              <Settings className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Feature Configuration'}
            </button>
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Important</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Enabling advanced features may have security and billing implications. 
                  Ensure you understand the impact before enabling features like custom domains or white-labeling.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedBrandingControl;
