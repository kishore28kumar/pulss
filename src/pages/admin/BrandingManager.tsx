import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, Upload, Globe, Code, Mail, Smartphone, Eye, Save, AlertCircle } from 'lucide-react';

interface BrandingConfig {
  tenantId: string;
  logo?: {
    url: string;
    width?: number;
    height?: number;
    format?: string;
  };
  favicon?: {
    url: string;
    format?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  theme: {
    name: string;
    mode: 'light' | 'dark' | 'auto';
    fontFamily: string;
  };
  customDomain?: {
    domain: string;
    isVerified: boolean;
    sslEnabled: boolean;
  };
  features: {
    customLogo: boolean;
    customColors: boolean;
    customDomain: boolean;
    customCSS: boolean;
    emailBranding: boolean;
    mobileBranding: boolean;
  };
}

const BrandingManager: React.FC = () => {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Get tenant ID from localStorage or context
  const tenantId = localStorage.getItem('tenantId') || '';

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const response = await fetch(`/api/branding/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      } else {
        // Initialize with defaults
        setBranding({
          tenantId,
          colors: {
            primary: '#3B82F6',
            secondary: '#10B981',
            accent: '#F59E0B',
            background: '#FFFFFF',
            text: '#1F2937',
          },
          theme: {
            name: 'Default',
            mode: 'light',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          features: {
            customLogo: true,
            customColors: true,
            customDomain: false,
            customCSS: false,
            emailBranding: true,
            mobileBranding: true,
          },
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      showMessage('error', 'Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!branding) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/branding/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(branding),
      });

      if (response.ok) {
        showMessage('success', 'Branding settings saved successfully');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      showMessage('error', 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch(`/api/branding/${tenantId}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data);
        showMessage('success', 'Logo uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Failed to upload logo');
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    if (!branding) return;
    setBranding({
      ...branding,
      colors: {
        ...branding.colors,
        [colorKey]: value,
      },
    });
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/branding/${tenantId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        showMessage('success', 'Branding published successfully');
      } else {
        throw new Error('Publish failed');
      }
    } catch (error) {
      console.error('Error publishing branding:', error);
      showMessage('error', 'Failed to publish branding');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  if (!branding) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load branding settings</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Branding Manager</h1>
          <p className="text-muted-foreground">Customize your store's appearance and branding</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePublish}>
            <Eye className="mr-2 h-4 w-4" />
            Preview & Publish
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <Upload className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="domain" disabled={!branding.features.customDomain}>
            <Globe className="mr-2 h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="css" disabled={!branding.features.customCSS}>
            <Code className="mr-2 h-4 w-4" />
            Custom CSS
          </TabsTrigger>
          <TabsTrigger value="email" disabled={!branding.features.emailBranding}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="mobile" disabled={!branding.features.mobileBranding}>
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Visual Identity</CardTitle>
              <CardDescription>Upload your logo and configure visual assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Company Logo</Label>
                {branding.features.customLogo ? (
                  <div className="space-y-2">
                    {branding.logo?.url && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img
                          src={branding.logo.url}
                          alt="Logo"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                ) : (
                  <Badge variant="secondary">Custom logo disabled by admin</Badge>
                )}
              </div>

              <div>
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  value={branding.theme.name}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      theme: { ...branding.theme, name: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Input
                  id="font-family"
                  value={branding.theme.fontFamily}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      theme: { ...branding.theme, fontFamily: e.target.value },
                    })
                  }
                  placeholder="Inter, system-ui, sans-serif"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Customize your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding.features.customColors ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(branding.colors).map(([key, value]) => (
                    <div key={key}>
                      <Label htmlFor={key} className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Badge variant="secondary">Custom colors disabled by admin</Badge>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Configure your custom domain and SSL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Custom domain feature is currently disabled. Contact your administrator to enable it.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="css" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom CSS for advanced styling</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Custom CSS feature is currently disabled. Contact your administrator to enable it.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Branding</CardTitle>
              <CardDescription>Customize email templates and branding</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Email branding configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Icons</CardTitle>
              <CardDescription>Configure mobile app icons for iOS and Android</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Mobile icon configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandingManager;
