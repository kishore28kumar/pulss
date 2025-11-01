import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/useAuth';
import { SuperAdminAnalytics } from '@/components/SuperAdminAnalytics';
import { EnhancedSuperAdminAnalytics } from '@/components/EnhancedSuperAdminAnalytics';
import { TenantManagement } from '@/components/TenantManagement';
import { FeatureFlagsManager } from '@/components/FeatureFlagsManager';
import { DemoDataSeeder } from '@/components/DemoDataSeeder';
import { DemoModeToggle } from '@/components/DemoModeToggle';
import { BrandingManager } from '@/components/BrandingManager';
import { BrandingFeatureToggles } from '@/components/BrandingFeatureToggles';
import { CommunityFeatures } from '@/components/CommunityFeatures';
import { AuditConfigPanel } from '@/components/AuditConfigPanel';
import { ComplianceReporting } from '@/components/ComplianceReporting';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Footer } from '@/components/Footer';
import AdvancedBrandingControl from '@/components/AdvancedBrandingControl';
import { toast } from 'sonner';
import {
  ChartBar,
  Crown,
  Gear,
  Database,
  Play,
  Users,
  ShoppingCart,
  TrendUp,
  Sparkle,
  Palette,
  UsersThree,
  Sliders,
  Shield,
copilot/remove-stray-copilot-tokens
  FileText
} from '@phosphor-icons/react'

export const SuperAdmin = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedTenantForFlags, setSelectedTenantForFlags] = useState<{ id: string, name: string } | null>(null)
  const [selectedTenantForDemo, setSelectedTenantForDemo] = useState<{ id: string, name: string } | null>(null)
  const [selectedTenantForBranding, setSelectedTenantForBranding] = useState<{ id: string, name: string } | null>(null)
  const [selectedTenantForAudit, setSelectedTenantForAudit] = useState<{ id: string, name: string } | null>(null)

  FileText,
} from '@phosphor-icons/react';

export const SuperAdmin = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedTenantForFlags, setSelectedTenantForFlags] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTenantForDemo, setSelectedTenantForDemo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTenantForBranding, setSelectedTenantForBranding] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTenantForAudit, setSelectedTenantForAudit] = useState<{
    id: string;
    name: string;
  } | null>(null);
main

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage tenants, feature flags, and platform analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
              {user && (
                <div className="text-right">
                  <div className="text-sm font-medium">{profile?.full_name || 'Admin'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="branding-controls" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="advanced-branding" className="flex items-center gap-2">
              <Sparkle className="h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <UsersThree className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Gear className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="demo-data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Demo Data
            </TabsTrigger>
            <TabsTrigger value="demo-mode" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Demo Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <EnhancedSuperAdminAnalytics />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <TenantManagement />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <BrandingManager />
          </TabsContent>

          <TabsContent value="branding-controls" className="space-y-6">
            {selectedTenantForBranding ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedTenantForBranding(null)}>
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Branding Feature Controls</h2>
                    <p className="text-sm text-muted-foreground">
                      Managing branding features for {selectedTenantForBranding.name}
                    </p>
                  </div>
                </div>
                <BrandingFeatureToggles
                  tenantId={selectedTenantForBranding.id}
                  tenantName={selectedTenantForBranding.name}
                />
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Branding Controls"
                description="Choose a tenant to manage their branding feature toggles"
                onSelect={setSelectedTenantForBranding}
                icon={Sliders}
              />
            )}
          </TabsContent>

          <TabsContent value="advanced-branding" className="space-y-6">
            <AdvancedBrandingControl token={user?.access_token || ''} />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <CommunityFeatures />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            {selectedTenantForFlags ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedTenantForFlags(null)}>
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Feature Flags</h2>
                    <p className="text-sm text-muted-foreground">
                      Managing features for {selectedTenantForFlags.name}
                    </p>
                  </div>
                </div>
                <FeatureFlagsManager
                  tenantId={selectedTenantForFlags.id}
                  tenantName={selectedTenantForFlags.name}
                />
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Feature Management"
                description="Choose a tenant to manage their feature flags"
                onSelect={setSelectedTenantForFlags}
                icon={Gear}
              />
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {selectedTenantForAudit ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedTenantForAudit(null)}>
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Audit Configuration</h2>
                    <p className="text-sm text-muted-foreground">
                      Managing audit & compliance for {selectedTenantForAudit.name}
                    </p>
                  </div>
                </div>
                <Tabs defaultValue="config" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="reporting">Compliance Reports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="config">
                    <AuditConfigPanel
                      tenantId={selectedTenantForAudit.id}
                      tenantName={selectedTenantForAudit.name}
                    />
                  </TabsContent>
                  <TabsContent value="reporting">
                    <ComplianceReporting tenantId={selectedTenantForAudit.id} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Audit Configuration"
                description="Choose a tenant to manage audit logging and compliance features"
                onSelect={setSelectedTenantForAudit}
                icon={Shield}
              />
            )}
          </TabsContent>

          <TabsContent value="demo-data" className="space-y-6">
            {selectedTenantForDemo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedTenantForDemo(null)}>
                    ← Back to Tenant Selection
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">Demo Data Seeder</h2>
                    <p className="text-sm text-muted-foreground">
                      Seeding demo data for {selectedTenantForDemo.name}
                    </p>
                  </div>
                </div>
                <DemoDataSeeder
                  tenantId={selectedTenantForDemo.id}
                  tenantName={selectedTenantForDemo.name}
                />
              </div>
            ) : (
              <TenantSelector
                title="Select Tenant for Demo Data"
                description="Choose a tenant to populate with comprehensive demo data"
                onSelect={setSelectedTenantForDemo}
                icon={Database}
              />
            )}
          </TabsContent>

          <TabsContent value="demo-mode" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DemoModeToggle />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="h-5 w-5" />
                    Demo Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Realistic sample data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>All role workflows</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Feature demonstrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Quick onboarding</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5" />
                    Platform Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Demo Users</span>
                    <Badge variant="secondary">4</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Features</span>
                    <Badge variant="secondary">15</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sample Data Sets</span>
                    <Badge variant="secondary">6</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

// Tenant Selector Component
interface TenantSelectorProps {
  title: string;
  description: string;
  onSelect: (tenant: { id: string; name: string }) => void;
  icon: React.ComponentType<{ className?: string }>;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({
  title,
  description,
  onSelect,
  icon: Icon,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch tenants');

        const { tenants } = await response.json();
        setTenants(
          tenants.map((t: any) => ({
            id: t.tenant_id,
            name: t.name,
            status: t.status,
          }))
        );
      } catch (error: any) {
        toast.error('Failed to load tenants', { description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
          <span>Loading tenants...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => onSelect({ id: tenant.id, name: tenant.name })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{tenant.name}</h3>
                    <Badge
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No tenants found</h3>
            <p className="text-sm text-muted-foreground">
              Create a tenant first to manage features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
