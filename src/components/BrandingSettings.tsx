import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, Upload, Save, Eye, Download, History,
  Image as ImageIcon, Mail, Globe, Type, Layout
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface BrandingConfig {
  branding_id?: string;
  tenant_id: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  pwa_icon_url?: string;
  login_background_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  font_family?: string;
  font_url?: string;
  theme_mode?: 'light' | 'dark' | 'auto';
  custom_css?: string;
  company_name?: string;
  legal_company_name?: string;
  company_address?: string;
  support_email?: string;
  support_phone?: string;
  terms_url?: string;
  privacy_url?: string;
  about_url?: string;
  custom_footer_html?: string;
  copyright_text?: string;
  email_header_logo_url?: string;
  email_footer_text?: string;
  email_primary_color?: string;
  login_title?: string;
  login_subtitle?: string;
  login_show_logo?: boolean;
  login_custom_message?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface FeatureFlags {
  logo_upload_enabled?: boolean;
  color_customization_enabled?: boolean;
  theme_selection_enabled?: boolean;
  favicon_enabled?: boolean;
  login_customization_enabled?: boolean;
  custom_domain_enabled?: boolean;
  white_label_enabled?: boolean;
  custom_footer_enabled?: boolean;
  custom_legal_enabled?: boolean;
  email_branding_enabled?: boolean;
  custom_css_enabled?: boolean;
}

interface BrandingSettingsProps {
  tenantId: string;
  token: string;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ tenantId, token }) => {
  const [branding, setBranding] = useState<BrandingConfig>({ tenant_id: tenantId });
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchBranding();
    fetchFeatureFlags();
  }, [tenantId]);

  const fetchBranding = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branding/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranding(response.data);
    } catch (error) {
      console.error('Error fetching branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branding/${tenantId}/features`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatures(response.data);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/api/branding/${tenantId}`,
        branding,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Branding settings saved successfully');
      fetchBranding(); // Refresh data
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error(error.response?.data?.error || 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    const formData = new FormData();
    formData.append(type, file);

    try {
      const response = await axios.post(
        `${API_URL}/api/branding/${tenantId}/upload/${type}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('Image uploaded successfully');
      fetchBranding(); // Refresh to get new URL
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    }
  };

  const exportConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branding/${tenantId}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `branding-config-${tenantId}.json`;
      link.click();
      
      toast.success('Configuration exported successfully');
    } catch (error) {
      console.error('Error exporting config:', error);
      toast.error('Failed to export configuration');
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding Settings</h2>
          <p className="text-muted-foreground">Customize your store's appearance and identity</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportConfig}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-secondary"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Feature Access Notice */}
      {features.white_label_enabled && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div>
              <p className="font-semibold">White-Label Mode Enabled</p>
              <p className="text-sm text-muted-foreground">
                You have access to advanced branding features including custom domains and white-labeling
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {[
            { id: 'visual', label: 'Visual Identity', icon: Palette },
            { id: 'login', label: 'Login Page', icon: Layout },
            { id: 'email', label: 'Email Branding', icon: Mail },
            { id: 'legal', label: 'Legal & Footer', icon: Globe }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Visual Identity Tab */}
        {activeTab === 'visual' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            {features.logo_upload_enabled && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Light Mode Logo</label>
                    <div className="flex items-center gap-4">
                      {branding.logo_url && (
                        <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dark Mode Logo</label>
                    <div className="flex items-center gap-4">
                      {branding.logo_dark_url && (
                        <img src={branding.logo_dark_url} alt="Dark Logo" className="h-16 object-contain" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('logo-dark', e.target.files[0])}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Favicon */}
            {features.favicon_enabled && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Favicon</h3>
                <div className="flex items-center gap-4">
                  {branding.favicon_url && (
                    <img src={branding.favicon_url} alt="Favicon" className="h-8 w-8" />
                  )}
                  <input
                    type="file"
                    accept=".ico,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('favicon', e.target.files[0])}
                  />
                </div>
              </div>
            )}

            {/* Colors */}
            {features.color_customization_enabled && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'primary_color', label: 'Primary Color' },
                    { key: 'secondary_color', label: 'Secondary Color' },
                    { key: 'accent_color', label: 'Accent Color' },
                    { key: 'text_color', label: 'Text Color' },
                    { key: 'background_color', label: 'Background Color' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding[key as keyof BrandingConfig] as string || '#000000'}
                          onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={branding[key as keyof BrandingConfig] as string || ''}
                          onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Typography</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Font Family</label>
                  <select
                    value={branding.font_family || 'Inter'}
                    onChange={(e) => setBranding({ ...branding, font_family: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={branding.company_name || ''}
                    onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Legal Company Name</label>
                  <input
                    type="text"
                    value={branding.legal_company_name || ''}
                    onChange={(e) => setBranding({ ...branding, legal_company_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Support Email</label>
                  <input
                    type="email"
                    value={branding.support_email || ''}
                    onChange={(e) => setBranding({ ...branding, support_email: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Support Phone</label>
                  <input
                    type="tel"
                    value={branding.support_phone || ''}
                    onChange={(e) => setBranding({ ...branding, support_phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Company Address</label>
                  <textarea
                    value={branding.company_address || ''}
                    onChange={(e) => setBranding({ ...branding, company_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Page Tab */}
        {activeTab === 'login' && features.login_customization_enabled && (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Login Page Customization</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Login Title</label>
                  <input
                    type="text"
                    value={branding.login_title || ''}
                    onChange={(e) => setBranding({ ...branding, login_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Welcome Back"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Login Subtitle</label>
                  <input
                    type="text"
                    value={branding.login_subtitle || ''}
                    onChange={(e) => setBranding({ ...branding, login_subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Sign in to your account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Message</label>
                  <textarea
                    value={branding.login_custom_message || ''}
                    onChange={(e) => setBranding({ ...branding, login_custom_message: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={branding.login_show_logo !== false}
                      onChange={(e) => setBranding({ ...branding, login_show_logo: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Show logo on login page</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('login-background', e.target.files[0])}
                  />
                  {branding.login_background_url && (
                    <img src={branding.login_background_url} alt="Login BG" className="mt-2 h-32 object-cover rounded" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Branding Tab */}
        {activeTab === 'email' && features.email_branding_enabled && (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Email Template Branding</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Header Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('email-logo', e.target.files[0])}
                  />
                  {branding.email_header_logo_url && (
                    <img src={branding.email_header_logo_url} alt="Email Logo" className="mt-2 h-16 object-contain" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.email_primary_color || '#3B82F6'}
                      onChange={(e) => setBranding({ ...branding, email_primary_color: e.target.value })}
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={branding.email_primary_color || ''}
                      onChange={(e) => setBranding({ ...branding, email_primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Footer Text</label>
                  <textarea
                    value={branding.email_footer_text || ''}
                    onChange={(e) => setBranding({ ...branding, email_footer_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal & Footer Tab */}
        {activeTab === 'legal' && (
          <div className="space-y-6">
            {features.custom_legal_enabled && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Legal Pages</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Terms of Service URL</label>
                    <input
                      type="url"
                      value={branding.terms_url || ''}
                      onChange={(e) => setBranding({ ...branding, terms_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Privacy Policy URL</label>
                    <input
                      type="url"
                      value={branding.privacy_url || ''}
                      onChange={(e) => setBranding({ ...branding, privacy_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">About Us URL</label>
                    <input
                      type="url"
                      value={branding.about_url || ''}
                      onChange={(e) => setBranding({ ...branding, about_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Footer Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Copyright Text</label>
                  <input
                    type="text"
                    value={branding.copyright_text || ''}
                    onChange={(e) => setBranding({ ...branding, copyright_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>
                {features.custom_footer_enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Footer HTML</label>
                    <textarea
                      value={branding.custom_footer_html || ''}
                      onChange={(e) => setBranding({ ...branding, custom_footer_html: e.target.value })}
                      className="w-full px-3 py-2 border rounded font-mono text-sm"
                      rows={6}
                      placeholder="<div>Custom footer content...</div>"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Advanced: Add custom HTML for your footer
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map(platform => (
                  <div key={platform}>
                    <label className="block text-sm font-medium mb-2 capitalize">{platform}</label>
                    <input
                      type="url"
                      value={branding.social_links?.[platform as keyof typeof branding.social_links] || ''}
                      onChange={(e) => setBranding({
                        ...branding,
                        social_links: { ...branding.social_links, [platform]: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder={`https://${platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BrandingSettings;
