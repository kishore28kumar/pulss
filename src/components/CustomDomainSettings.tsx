import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Check, X, AlertCircle, RefreshCw, Trash2,
  Copy, ExternalLink, Shield, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface CustomDomain {
  domain_id: string;
  domain_name: string;
  is_primary: boolean;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_token: string;
  dns_records: {
    txt: { host: string; value: string; type: string };
    cname?: { host: string; value: string; type: string };
    a?: { host: string; value: string; type: string };
  };
  ssl_status: 'pending' | 'active' | 'failed' | 'expired';
  ssl_expires_at?: string;
  is_active: boolean;
  created_at: string;
  verified_at?: string;
  notes?: string;
}

interface CustomDomainSettingsProps {
  tenantId: string;
  token: string;
}

const CustomDomainSettings: React.FC<CustomDomainSettingsProps> = ({ tenantId, token }) => {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDomains();
  }, [tenantId]);

  const fetchDomains = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/custom-domains/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDomains(response.data.domains || []);
      setFeatureEnabled(response.data.feature_enabled);
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      if (error.response?.data?.feature_enabled === false) {
        setFeatureEnabled(false);
      } else {
        toast.error('Failed to load custom domains');
      }
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/custom-domains/${tenantId}`,
        { domain_name: newDomain, is_primary: isPrimary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Domain added successfully');
      setShowAddModal(false);
      setNewDomain('');
      setIsPrimary(false);
      fetchDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(error.response?.data?.error || 'Failed to add domain');
    }
  };

  const verifyDomain = async (domainId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/custom-domains/${tenantId}/${domainId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.verified) {
        toast.success('Domain verified successfully!');
      } else {
        toast.error(response.data.message || 'Domain verification failed');
      }
      fetchDomains();
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      toast.error(error.response?.data?.error || 'Failed to verify domain');
    }
  };

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      await axios.delete(`${API_URL}/api/custom-domains/${tenantId}/${domainId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Domain deleted successfully');
      fetchDomains();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.response?.data?.error || 'Failed to delete domain');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Custom Domains Not Available</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Custom domain functionality is not enabled for your account. 
          Please contact your administrator to enable this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Domains</h2>
          <p className="text-muted-foreground">
            Connect your own domain to your store (e.g., pharmacy.mycompany.com)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {/* Domains List */}
      {domains.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Custom Domains</h3>
          <p className="text-muted-foreground mb-6">
            Add a custom domain to use your own branding
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map(domain => (
            <motion.div
              key={domain.domain_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{domain.domain_name}</h3>
                    {domain.is_primary && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                        Primary
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      domain.verification_status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : domain.verification_status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {domain.verification_status === 'verified' && <Check className="w-3 h-3 inline mr-1" />}
                      {domain.verification_status === 'failed' && <X className="w-3 h-3 inline mr-1" />}
                      {domain.verification_status === 'pending' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                      {domain.verification_status.charAt(0).toUpperCase() + domain.verification_status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      SSL: {domain.ssl_status}
                    </span>
                    <span>Added: {new Date(domain.created_at).toLocaleDateString()}</span>
                    {domain.verified_at && (
                      <span>Verified: {new Date(domain.verified_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.verification_status !== 'verified' && (
                    <button
                      onClick={() => verifyDomain(domain.domain_id)}
                      className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-secondary"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDomain(domain)}
                    className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-secondary"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDomain(domain.domain_id)}
                    className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Configuration (if not verified) */}
              {domain.verification_status !== 'verified' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    DNS Configuration Required
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add these DNS records to your domain provider to verify ownership:
                  </p>
                  <div className="space-y-2">
                    {/* TXT Record */}
                    <div className="bg-white p-3 rounded border text-sm">
                      <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-semibold">TXT</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Host:</span>
                          <span className="ml-2">{domain.dns_records.txt.host}</span>
                          <button
                            onClick={() => copyToClipboard(domain.dns_records.txt.host)}
                            className="ml-2 text-primary hover:text-primary/80"
                          >
                            <Copy className="w-3 h-3 inline" />
                          </button>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <span className="ml-2">{domain.verification_token.substring(0, 16)}...</span>
                          <button
                            onClick={() => copyToClipboard(domain.verification_token)}
                            className="ml-2 text-primary hover:text-primary/80"
                          >
                            <Copy className="w-3 h-3 inline" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CNAME Record */}
                    {domain.dns_records.cname && (
                      <div className="bg-white p-3 rounded border text-sm">
                        <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-semibold">CNAME</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Host:</span>
                            <span className="ml-2">{domain.dns_records.cname.host}</span>
                            <button
                              onClick={() => copyToClipboard(domain.dns_records.cname!.host)}
                              className="ml-2 text-primary hover:text-primary/80"
                            >
                              <Copy className="w-3 h-3 inline" />
                            </button>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Value:</span>
                            <span className="ml-2">{domain.dns_records.cname.value}</span>
                            <button
                              onClick={() => copyToClipboard(domain.dns_records.cname!.value)}
                              className="ml-2 text-primary hover:text-primary/80"
                            >
                              <Copy className="w-3 h-3 inline" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    DNS changes can take up to 24-48 hours to propagate. Click "Verify" after adding the records.
                  </p>
                </div>
              )}

              {/* SSL Status (if verified) */}
              {domain.verification_status === 'verified' && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  domain.ssl_status === 'active'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold">
                      SSL Status: {domain.ssl_status.charAt(0).toUpperCase() + domain.ssl_status.slice(1)}
                    </span>
                  </div>
                  {domain.ssl_status === 'active' && domain.ssl_expires_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(domain.ssl_expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {domain.ssl_status === 'pending' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      SSL certificate is being provisioned. This usually takes a few minutes.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Add Custom Domain</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Domain Name</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="pharmacy.mycompany.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your domain without http:// or https://
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Set as primary domain</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  The primary domain will be used for all links and redirects
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDomain('');
                  setIsPrimary(false);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addDomain}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Add Domain
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomDomainSettings;
