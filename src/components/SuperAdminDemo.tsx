import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
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
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Storefront,
  Bell,
  Package,
  Camera,
  Download,
  Shield,
  Wallet,
  Gift,
  ArrowClockwise,
  CreditCard,
  Phone,
  Heart,
  Megaphone
} from '@phosphor-icons/react'

// Mock data for demonstration
const mockTenants = [
  { id: '1', name: 'HealthCare Plus Pharmacy', status: 'active', customers: 245, orders: 1205, revenue: 45000 },
  { id: '2', name: 'MediCare Corner', status: 'active', customers: 189, orders: 892, revenue: 32000 },
  { id: '3', name: 'Wellness Drugstore', status: 'pending', customers: 67, orders: 234, revenue: 8500 },
  { id: '4', name: 'City Medical Store', status: 'active', customers: 312, orders: 1567, revenue: 58000 }
]

const revenueData = [
  { date: 'Mon', revenue: 15000 },
  { date: 'Tue', revenue: 18000 },
  { date: 'Wed', revenue: 22000 },
  { date: 'Thu', revenue: 19000 },
  { date: 'Fri', revenue: 25000 },
  { date: 'Sat', revenue: 21000 },
  { date: 'Sun', revenue: 28000 }
]

const statusData = [
  { name: 'Active', value: 8, color: '#10B981' },
  { name: 'Pending', value: 3, color: '#F59E0B' },
  { name: 'Inactive', value: 1, color: '#EF4444' }
]

const featureFlags = [
  { name: 'Order Tracking', key: 'tracking_enabled', enabled: true, icon: ShoppingCart, category: 'logistics' },
  { name: 'Digital Wallet', key: 'wallet_enabled', enabled: true, icon: Wallet, category: 'payments' },
  { name: 'Loyalty Program', key: 'loyalty_enabled', enabled: false, icon: Heart, category: 'customer' },
  { name: 'Coupons & Discounts', key: 'coupons_enabled', enabled: true, icon: Gift, category: 'marketing' },
  { name: 'WhatsApp Notifications', key: 'whatsapp_enabled', enabled: true, icon: Phone, category: 'communication' },
  { name: 'Social Login', key: 'social_login_enabled', enabled: false, icon: Users, category: 'authentication' },
  { name: 'Analytics Dashboard', key: 'analytics_enabled', enabled: true, icon: ChartBar, category: 'analytics' }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount)
}

export const SuperAdminDemo = () => {
  const [activeTab, setActiveTab] = React.useState('analytics')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Comprehensive platform management and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
              <div className="text-right">
                <div className="text-sm font-medium">Demo Admin</div>
                <div className="text-xs text-muted-foreground">admin@pulss.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Gear className="h-4 w-4" />
              Feature Flags
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">8 active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹1,43,500</div>
                  <div className="flex items-center text-xs">
                    <TrendUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+12.5%</span>
                    <span className="text-muted-foreground ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3,898</div>
                  <p className="text-xs text-muted-foreground">Across all tenants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">813</div>
                  <p className="text-xs text-muted-foreground">Platform-wide users</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Weekly revenue across all tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#0088FE" fill="#0088FE" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Status</CardTitle>
                  <CardDescription>Distribution of tenant statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {statusData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm">{entry.name}</span>
                        </div>
                        <span className="text-sm font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Tenant Management</h2>
                <p className="text-muted-foreground">Manage all pharmacy tenants and configurations</p>
              </div>
              <Button>
                <Crown className="h-4 w-4 mr-2" />
                Create New Tenant
              </Button>
            </div>

            <div className="grid gap-4">
              {mockTenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Storefront className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{tenant.name}</h3>
                            <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                              {tenant.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {tenant.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {tenant.status === 'inactive' && <XCircle className="h-3 w-3 mr-1" />}
                              {tenant.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium">{tenant.customers}</div>
                                <div className="text-xs text-muted-foreground">Customers</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="text-sm font-medium">{tenant.orders}</div>
                                <div className="text-xs text-muted-foreground">Orders</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-purple-500" />
                              <div>
                                <div className="text-sm font-medium">{formatCurrency(tenant.revenue)}</div>
                                <div className="text-xs text-muted-foreground">Revenue</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gear className="h-5 w-5" />
                  Feature Flags - HealthCare Plus Pharmacy
                </CardTitle>
                <CardDescription>
                  Enable or disable features for this tenant. Changes take effect immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureFlags.map((feature) => {
                  const IconComponent = feature.icon
                  return (
                    <Card key={feature.key} className={`transition-all ${feature.enabled ? 'bg-muted/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary text-white">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{feature.name}</h3>
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {feature.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Advanced {feature.category} feature for enhanced user experience
                              </p>
                            </div>
                          </div>
                          <Switch checked={feature.enabled} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Data Tab */}
          <TabsContent value="demo-data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Demo Data Seeder - HealthCare Plus Pharmacy
                </CardTitle>
                <CardDescription>
                  Populate this tenant with comprehensive demo data for testing and demonstration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Carousel Slides', icon: Camera, count: 3, status: 'completed' },
                    { name: 'Announcements', icon: Bell, count: 4, status: 'completed' },
                    { name: 'Product Categories', icon: Package, count: 6, status: 'completed' },
                    { name: 'Demo Products', icon: Storefront, count: 50, status: 'pending' },
                    { name: 'Demo Customers', icon: Users, count: 20, status: 'pending' },
                    { name: 'Demo Orders', icon: ShoppingCart, count: 30, status: 'pending' }
                  ].map((category) => {
                    const IconComponent = category.icon
                    return (
                      <Card key={category.name} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary text-white flex-shrink-0">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium">{category.name}</h3>
                                {category.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                High-quality demo content with realistic data
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {category.count} items
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    3 of 6 categories completed
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Seed Remaining Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Mode Tab */}
          <TabsContent value="demo-mode" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Demo Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore the platform with pre-configured demo accounts
                  </p>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo Experience
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="h-5 w-5" />
                    Demo Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['Realistic sample data', 'All role workflows', 'Feature demonstrations', 'Quick onboarding'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
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
                  {[
                    { label: 'Demo Users', value: '4' },
                    { label: 'Active Features', value: '15' },
                    { label: 'Sample Data Sets', value: '6' }
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between">
                      <span className="text-sm">{stat.label}</span>
                      <Badge variant="secondary">{stat.value}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}