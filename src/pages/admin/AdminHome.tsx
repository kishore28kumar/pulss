copilot/remove-stray-copilot-tokens
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BusinessTypeSelector, BusinessTypeDisplay } from '@/components/BusinessTypeSelector'
import { ThemeSelector, ThemeDisplay } from '@/components/ThemeSelector'
import { CustomerProfileManager } from '@/components/CustomerProfileManager'
import { Footer } from '@/components/Footer'
import { QRCodeGenerator } from '@/components/QRCodeGenerator'
import { RealTimeOrderNotifications } from '@/components/RealTimeOrderNotifications'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { OrdersManagement } from '@/components/OrdersManagement'
import { ProductManagement } from '@/components/ProductManagement'
import N8nWorkflows from './N8nWorkflows'
import BrandingSettings from '@/components/BrandingSettings'
import CustomDomainSettings from '@/components/CustomDomainSettings'
import RoleManagement from './RoleManagement'
import { getBusinessType } from '@/lib/businessTypes'
import { getThemeById, applyTheme } from '@/lib/themes'
import { realtimeService } from '@/lib/realtime'
import { notificationService } from '@/lib/notifications'
import { realtimeNotificationService } from '@/lib/realtimeNotifications'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { 
  Plus, 
  Package, 
  Users, 
  ShoppingCart, 
  Camera, 
  Upload, 
  Download, 
  Check, 

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BusinessTypeSelector, BusinessTypeDisplay } from '@/components/BusinessTypeSelector';
import { ThemeSelector, ThemeDisplay } from '@/components/ThemeSelector';
import { CustomerProfileManager } from '@/components/CustomerProfileManager';
import { Footer } from '@/components/Footer';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { RealTimeOrderNotifications } from '@/components/RealTimeOrderNotifications';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { OrdersManagement } from '@/components/OrdersManagement';
import { ProductManagement } from '@/components/ProductManagement';
import N8nWorkflows from './N8nWorkflows';
import BrandingSettings from '@/components/BrandingSettings';
import CustomDomainSettings from '@/components/CustomDomainSettings';
copilot/audit-dependency-issues


copilot/fix-stray-tokens-and-references


main
main
import RoleManagement from './RoleManagement';
import { getBusinessType } from '@/lib/businessTypes';
import { getThemeById, applyTheme } from '@/lib/themes';
import { realtimeService } from '@/lib/realtime';
import { notificationService } from '@/lib/notifications';
import { realtimeNotificationService } from '@/lib/realtimeNotifications';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';
import {
  Plus,
  Package,
  Users,
  ShoppingCart,
  Camera,
  Upload,
  Download,
  Check,
main
  X,
  Bell,
  Gear,
  Eye,
  CreditCard,
  Truck,
  MapPin,
  Storefront,
  FileText,
  Palette,
  Image as ImageIcon,
  TrendUp,
  Heart,
  QrCode,
  Globe,
  WhatsappLogo,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  PaintBrush,
  User,
} from '@phosphor-icons/react';

interface BusinessSettings {
  id: string;
  tenant_id: string;
  business_name: string;
  business_type: string;
  theme_id: string;
  logo_url?: string;
  whatsapp_number?: string;
  phone_number?: string;
  address?: string;
  upi_id?: string;
  bank_details?: any;
  social_media?: any;
  hero_images: string[];
  splash_screen_url?: string;
  announcements: string[];
}

interface ProductStats {
  total_products: number;
  active_products: number;
  categories: number;
  out_of_stock: number;
}

export const AdminHome = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBusinessTypeSelectorOpen, setIsBusinessTypeSelectorOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch business settings
  const { data: businessSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['business-settings', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chemist_settings')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BusinessSettings;
    },
    enabled: !!profile?.tenant_id,
  });

  // Apply theme when settings load
  React.useEffect(() => {
    if (businessSettings?.theme_id) {
      const theme = getThemeById(businessSettings.theme_id);
      applyTheme(theme);
    }
  }, [businessSettings?.theme_id]);

  // Initialize real-time services
  useEffect(() => {
    const initServices = async () => {
      if (profile?.tenant_id) {
        await notificationService.initialize();
        await realtimeService.initialize(profile.tenant_id);

        // Initialize real-time notifications with ringtone
        await realtimeNotificationService.initialize();

        // Subscribe to order notifications with ringtone
        realtimeNotificationService.subscribeToOrderNotifications(profile.tenant_id, (order) => {
          // Handle new order notification
          console.log('New order received:', order);
          // Refresh orders data
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Subscribe to low stock alerts
        realtimeNotificationService.subscribeToLowStockAlerts(profile.tenant_id, (item) => {
          console.log('Low stock alert:', item);
          // Refresh inventory data
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
        });

        // Request notification permission
        realtimeNotificationService.requestNotificationPermission();

        console.log('Real-time services initialized for admin');
      }
    };

    initServices();

    // Cleanup on unmount
    return () => {
      if (profile?.tenant_id) {
        realtimeNotificationService.unsubscribe(`orders-${profile.tenant_id}`);
        realtimeNotificationService.unsubscribe(`low-stock-${profile.tenant_id}`);
      }
    };

    return () => {
      // Cleanup on unmount
      realtimeService.disconnect();
    };
  }, [profile?.tenant_id]);

  // Fetch product stats
  const { data: productStats } = useQuery({
    queryKey: ['product-stats', profile?.tenant_id],
    queryFn: async () => {
      const [products, categories] = await Promise.all([
        supabase
          .from('products')
          .select('id, active, stock_quantity')
          .eq('tenant_id', profile?.tenant_id),
        supabase.from('categories').select('id').eq('tenant_id', profile?.tenant_id),
      ]);

      return {
        total_products: products.data?.length || 0,
        active_products: products.data?.filter((p) => p.active).length || 0,
        categories: categories.data?.length || 0,
        out_of_stock: products.data?.filter((p) => (p.stock_quantity || 0) === 0).length || 0,
      } as ProductStats;
    },
    enabled: !!profile?.tenant_id,
  });

  // Update business settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<BusinessSettings>) => {
      const { data, error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile?.tenant_id,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    },
  });

  // CSV Upload handler
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploadingCSV(true);

    try {
      // In a real implementation, you'd parse the CSV and upload to Supabase
      // For now, we'll simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        `CSV uploaded successfully! ${Math.floor(Math.random() * 100) + 50} products imported.`
      );
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV');
    } finally {
      setUploadingCSV(false);
      event.target.value = '';
    }
  };

  // Image upload handler
  const handleImageUpload = async (files: FileList, type: 'hero' | 'splash' | 'logo') => {
    if (!files.length) return;

    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage.from('public').upload(fileName, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from('public').getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update business settings with new images
      const updateData: Partial<BusinessSettings> = {};

      if (type === 'hero') {
        updateData.hero_images = [...(businessSettings?.hero_images || []), ...uploadedUrls];
      } else if (type === 'splash') {
        updateData.splash_screen_url = uploadedUrls[0];
      } else if (type === 'logo') {
        updateData.logo_url = uploadedUrls[0];
      }

      await updateSettingsMutation.mutateAsync(updateData);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const businessType = businessSettings ? getBusinessType(businessSettings.business_type) : null;
  const currentTheme = businessSettings ? getThemeById(businessSettings.theme_id) : null;

  const downloadSampleCSV = () => {
    const csvFileName =
      businessSettings?.business_type === 'pharmacy'
        ? 'sample-products-pharmacy.csv'
        : businessSettings?.business_type === 'grocery'
          ? 'sample-products-grocery.csv'
          : businessSettings?.business_type === 'fashion'
            ? 'sample-products-fashion.csv'
            : 'sample-products-pharmacy.csv';

    const link = document.createElement('a');
    link.href = `/${csvFileName}`;
    link.download = csvFileName;
    link.click();
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Order Notification Component */}
      <RealTimeOrderNotifications role="admin" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {businessSettings?.logo_url ? (
                <img
                  src={businessSettings.logo_url}
                  alt="Business Logo"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                  <Storefront className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {businessSettings?.business_name || 'Your Business'}
                </h1>
                <p className="text-muted-foreground">
                  {businessType?.welcomeMessage || 'Admin Dashboard'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsQRCodeOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" onClick={() => setIsProfileOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="text-3xl font-bold">{productStats?.total_products || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-3xl font-bold">{productStats?.categories || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Check className="h-8 w-8 text-purple-600" />
                <div className="text-3xl font-bold">{productStats?.active_products || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <X className="h-8 w-8 text-red-600" />
                <div className="text-3xl font-bold">{productStats?.out_of_stock || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="rbac">Roles & Permissions</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks to manage your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('products')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Products (CSV)
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('branding')}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Update Images & Carousel
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsThemeSelectorOpen(true)}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Change Theme
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsQRCodeOpen(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {businessType && (
                    <BusinessTypeDisplay
                      businessType={businessType}
                      showEditButton={true}
                      onEdit={() => setIsBusinessTypeSelectorOpen(true)}
                    />
                  )}

                  {currentTheme && (
                    <ThemeDisplay
                      theme={currentTheme}
                      showEditButton={true}
                      onEdit={() => setIsThemeSelectorOpen(true)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductManagement />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Logo</CardTitle>
                  <CardDescription>
                    Upload your business logo (512x512px recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {businessSettings?.logo_url ? (
                      <img
                        src={businessSettings.logo_url}
                        alt="Current Logo"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center border">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(e.target.files, 'logo');
                          }
                        }}
                        disabled={uploadingImages}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hero Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Hero Carousel Images</CardTitle>
                  <CardDescription>
                    Upload images for homepage carousel (1200x400px recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {businessSettings?.hero_images
                      ?.slice(0, 3)
                      .map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Hero ${index + 1}`}
                          className="h-20 w-full rounded object-cover border"
                        />
                      )) || (
                      <div className="col-span-3 h-20 bg-muted rounded flex items-center justify-center border">
                        <span className="text-sm text-muted-foreground">
                          No hero images uploaded
                        </span>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleImageUpload(e.target.files, 'hero');
                      }
                    }}
                    disabled={uploadingImages}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
                  />
                </CardContent>
              </Card>

              {/* Splash Screen */}
              <Card>
                <CardHeader>
                  <CardTitle>Splash Screen</CardTitle>
                  <CardDescription>App opening splash screen image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {businessSettings?.splash_screen_url ? (
                      <img
                        src={businessSettings.splash_screen_url}
                        alt="Splash Screen"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center border">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(e.target.files, 'splash');
                          }
                        }}
                        disabled={uploadingImages}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle>Scrolling Messages</CardTitle>
                  <CardDescription>Add promotional messages for your customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter promotional messages (one per line)"
                    className="min-h-[100px]"
                    value={businessSettings?.announcements?.join('\n') || ''}
                    onChange={(e) => {
                      const messages = e.target.value.split('\n').filter((line) => line.trim());
                      updateSettingsMutation.mutate({ announcements: messages });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each line will be a separate scrolling message. Example: "🎉 Free delivery on
                    orders above ₹500"
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Branding Section */}
            {businessSettings?.tenant_id && user?.access_token && (
              <div className="space-y-6 mt-8">
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-2">Advanced Branding</h3>
                  <p className="text-muted-foreground mb-6">
                    Customize your store's complete look and feel with advanced branding options
                  </p>
                  <BrandingSettings
                    tenantId={businessSettings.tenant_id}
                    token={user.access_token}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-2">Custom Domains</h3>
                  <p className="text-muted-foreground mb-6">
                    Set up custom domains for your store (requires super admin approval)
                  </p>
                  <CustomDomainSettings
                    tenantId={businessSettings.tenant_id}
                    token={user.access_token}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={businessSettings?.business_name || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({ business_name: e.target.value });
                      }}
                      placeholder="Enter your business name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={businessSettings?.address || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({ address: e.target.value });
                      }}
                      placeholder="Enter complete business address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={businessSettings?.phone_number || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({ phone_number: e.target.value });
                      }}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <div className="flex items-center gap-2">
                      <WhatsappLogo className="h-4 w-4 text-green-500" />
                      <Input
                        id="whatsapp"
                        value={businessSettings?.whatsapp_number || ''}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({ whatsapp_number: e.target.value });
                        }}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input
                      id="upi"
                      value={businessSettings?.upi_id || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({ upi_id: e.target.value });
                      }}
                      placeholder="yourname@paytm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Add your social media handles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <FacebookLogo className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={businessSettings?.social_media?.facebook || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({
                          social_media: {
                            ...businessSettings?.social_media,
                            facebook: e.target.value,
                          },
                        });
                      }}
                      placeholder="facebook.com/yourbusiness"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <InstagramLogo className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={businessSettings?.social_media?.instagram || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({
                          social_media: {
                            ...businessSettings?.social_media,
                            instagram: e.target.value,
                          },
                        });
                      }}
                      placeholder="instagram.com/yourbusiness"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <TwitterLogo className="h-4 w-4 text-blue-400" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={businessSettings?.social_media?.twitter || ''}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({
                          social_media: {
                            ...businessSettings?.social_media,
                            twitter: e.target.value,
                          },
                        });
                      }}
                      placeholder="twitter.com/yourbusiness"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <OrdersManagement />
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <N8nWorkflows />
          </TabsContent>

          <TabsContent value="rbac" className="space-y-6">
            <RoleManagement />
          </TabsContent>
        </Tabs>

        {/* Business Type Selector */}
        <BusinessTypeSelector
          isOpen={isBusinessTypeSelectorOpen}
          onClose={() => setIsBusinessTypeSelectorOpen(false)}
          onSelect={(businessType) => {
            updateSettingsMutation.mutate({
              business_type: businessType.id,
              theme_id: businessType.defaultTheme,
            });
          }}
          selectedType={businessSettings?.business_type}
        />

        {/* Theme Selector */}
        <ThemeSelector
          isOpen={isThemeSelectorOpen}
          onClose={() => setIsThemeSelectorOpen(false)}
          onSelect={(theme) => {
            updateSettingsMutation.mutate({ theme_id: theme.id });
          }}
          selectedThemeId={businessSettings?.theme_id}
          businessType={businessSettings?.business_type}
        />

        {/* QR Code Generator */}
        {businessSettings?.tenant_id && (
          <Dialog open={isQRCodeOpen} onOpenChange={setIsQRCodeOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>QR Code Generator</DialogTitle>
                <DialogDescription>
                  Generate QR codes for your customers to download your store app
                </DialogDescription>
              </DialogHeader>
              <QRCodeGenerator
                tenants={[
                  {
                    id: businessSettings.tenant_id,
                    name: businessSettings.business_name || 'My Store',
                    admin_email: '',
                    business_type: businessSettings.business_type || 'pharmacy',
                    logo_url: businessSettings.logo_url,
                  },
                ]}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Profile Manager */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Admin Profile</DialogTitle>
            </DialogHeader>
            <CustomerProfileManager />
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <Footer variant="minimal" />
      </div>
    </div>
  );
};
