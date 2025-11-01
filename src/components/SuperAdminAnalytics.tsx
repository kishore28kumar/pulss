import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { 
  ChartBar, 
  Download, 
  Users, 
  Storefront, 
  ShoppingCart, 
  TrendUp, 
  CurrencyDollar,
  Eye,
  UserCheck,
  User,
  Calendar,
  MapPin,
  Package,
  CreditCard,
  Star
} from '@phosphor-icons/react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { toast } from 'sonner'

interface AnalyticsData {
  totalTenants: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  activeToday: number
  newSignups: number
  topPerformingTenants: Array<{
    id: string
    name: string
    customers: number
    orders: number
    revenue: number
    business_type: string
  }>
  recentActivity: Array<{
    type: 'tenant_created' | 'customer_signup' | 'order_placed'
    tenant_name: string
    details: string
    timestamp: string
  }>
  customerGrowth: Array<{
    date: string
    registered: number
    guest: number
  }>
  revenueByTenant: Array<{
    tenant: string
    revenue: number
    orders: number
  }>
  popularBusinessTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#84CC16']

export const SuperAdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedTenant, setSelectedTenant] = useState<string>('all')

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['super-admin-analytics', dateRange, selectedTenant],
    queryFn: async () => {
      // Calculate date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = startOfDay(subDays(new Date(), days))
      const endDate = endOfDay(new Date())

      // Fetch all tenants with stats
      const { data: tenants } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          business_type,
          created_at,
          chemist_settings (
            name
          )
        `)

      // Fetch customer stats
      const { data: customerStats } = await supabase
        .from('customers')
        .select(`
          id,
          tenant_id,
          created_at,
          email,
          tenants (
            name,
            business_type
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Fetch order stats
      const { data: orderStats } = await supabase
        .from('orders')
        .select(`
          id,
          tenant_id,
          total,
          created_at,
          status,
          customer_id,
          customers (
            email
          ),
          tenants (
            name,
            business_type
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Process data
      const totalTenants = tenants?.length || 0
      const totalCustomers = customerStats?.length || 0
      const totalOrders = orderStats?.length || 0
      const totalRevenue = orderStats?.reduce((sum, order) => sum + order.total, 0) || 0

      // Calculate active users today
      const today = new Date()
      const todayStart = startOfDay(today)
      const activeToday = customerStats?.filter(c => 
        new Date(c.created_at) >= todayStart
      ).length || 0

      const newSignups = customerStats?.filter(c => 
        new Date(c.created_at) >= subDays(today, 1)
      ).length || 0

      // Top performing tenants
      const tenantStats = tenants?.map(tenant => {
        const tenantCustomers = customerStats?.filter(c => c.tenant_id === tenant.id) || []
        const tenantOrders = orderStats?.filter(o => o.tenant_id === tenant.id) || []
        const tenantRevenue = tenantOrders.reduce((sum, order) => sum + order.total, 0)

        return {
          id: tenant.id,
          name: tenant.chemist_settings?.[0]?.name || tenant.name,
          customers: tenantCustomers.length,
          orders: tenantOrders.length,
          revenue: tenantRevenue,
          business_type: tenant.business_type
        }
      }) || []

      const topPerformingTenants = tenantStats
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Customer growth data
      const customerGrowth: Array<{
        date: string
        registered: number
        guest: number
      }> = []
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'MMM dd')
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        const dayCustomers = customerStats?.filter(c => {
          const createdAt = new Date(c.created_at)
          return createdAt >= dayStart && createdAt <= dayEnd
        }) || []

        const registered = dayCustomers.filter(c => c.email).length
        const guest = dayCustomers.filter(c => !c.email).length

        customerGrowth.push({
          date: dateStr,
          registered,
          guest
        })
      }

      // Revenue by tenant
      const revenueByTenant = topPerformingTenants.map(tenant => ({
        tenant: tenant.name.length > 15 ? tenant.name.substring(0, 15) + '...' : tenant.name,
        revenue: tenant.revenue,
        orders: tenant.orders
      }))

      // Popular business types
      const businessTypeCounts = tenants?.reduce((acc, tenant) => {
        acc[tenant.business_type] = (acc[tenant.business_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const totalBusinessTypes = Object.values(businessTypeCounts).reduce((sum, count) => sum + count, 0)
      const popularBusinessTypes = Object.entries(businessTypeCounts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: Math.round((count / totalBusinessTypes) * 100)
      }))

      // Recent activity
      const recentActivity = [
        ...tenants?.slice(-5).map(t => ({
          type: 'tenant_created' as const,
          tenant_name: t.chemist_settings?.[0]?.name || t.name,
          details: `New ${t.business_type} registered`,
          timestamp: t.created_at
        })) || [],
        ...customerStats?.slice(-5).map(c => ({
          type: 'customer_signup' as const,
          tenant_name: c.tenants?.[0]?.name || 'Unknown',
          details: c.email ? 'Registered customer' : 'Guest customer',
          timestamp: c.created_at
        })) || [],
        ...orderStats?.slice(-5).map(o => ({
          type: 'order_placed' as const,
          tenant_name: o.tenants?.[0]?.name || 'Unknown',
          details: `Order worth $${o.total.toFixed(2)}`,
          timestamp: o.created_at
        })) || []
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)

      return {
        totalTenants,
        totalCustomers,
        totalOrders,
        totalRevenue,
        activeToday,
        newSignups,
        topPerformingTenants,
        recentActivity,
        customerGrowth,
        revenueByTenant,
        popularBusinessTypes
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Export analytics data
  const exportAnalytics = async (exportFormat: 'excel' | 'csv') => {
    if (!analytics) return

    try {
      // Prepare data for export
      const exportData = {
        summary: {
          total_tenants: analytics.totalTenants,
          total_customers: analytics.totalCustomers,
          total_orders: analytics.totalOrders,
          total_revenue: analytics.totalRevenue,
          active_today: analytics.activeToday,
          new_signups: analytics.newSignups,
          generated_at: new Date().toISOString()
        },
        top_performing_tenants: analytics.topPerformingTenants,
        customer_growth: analytics.customerGrowth,
        revenue_by_tenant: analytics.revenueByTenant,
        business_types: analytics.popularBusinessTypes,
        recent_activity: analytics.recentActivity
      }

      // Convert to CSV or prepare for Excel
      if (exportFormat === 'csv') {
        const csvContent = Object.entries(exportData).map(([key, data]) => {
          if (Array.isArray(data)) {
            const headers = Object.keys(data[0] || {}).join(',')
            const rows = data.map(row => Object.values(row || {}).join(',')).join('\n')
            return `\n${key.toUpperCase()}\n${headers}\n${rows}`
          } else {
            const headers = Object.keys(data as any).join(',')
            const values = Object.values(data as any).join(',')
            return `\n${key.toUpperCase()}\n${headers}\n${values}`
          }
        }).join('\n\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pulss-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // For Excel, we'll create a more complex JSON structure
        // In a real implementation, you'd use a library like xlsx
        const jsonContent = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pulss-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
        a.click()
        URL.revokeObjectURL(url)
      }

      toast.success(`Analytics exported successfully as ${exportFormat.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export analytics')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="skeleton h-4 w-24 mb-2"></div>
                <div className="skeleton h-6 w-16"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time insights into your platform performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportAnalytics('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportAnalytics('excel')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Storefront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active businesses on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newSignups || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform-wide revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs value="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Growth</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>
                  Registered vs Guest customers over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.customerGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="registered"
                        stackId="1"
                        stroke="#6366F1"
                        fill="#6366F1"
                        name="Registered"
                      />
                      <Area
                        type="monotone"
                        dataKey="guest"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        name="Guest"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Business Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Business Types</CardTitle>
                <CardDescription>
                  Distribution of tenant business types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.popularBusinessTypes || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.popularBusinessTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="space-y-6">
            {/* Revenue by Tenant Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tenant</CardTitle>
                <CardDescription>
                  Top performing tenants by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.revenueByTenant || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tenant" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Tenants Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Tenants</CardTitle>
                <CardDescription>
                  Detailed performance metrics for your best tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Customers</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.topPerformingTenants?.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {tenant.business_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.customers}</TableCell>
                        <TableCell>{tenant.orders}</TableCell>
                        <TableCell className="text-right">
                          ${tenant.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeToday || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Customers active today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{analytics?.newSignups || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  New customers today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.totalCustomers && analytics.newSignups 
                    ? ((analytics.newSignups / analytics.totalCustomers) * 100).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Daily growth rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest activities across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      {activity.type === 'tenant_created' && (
                        <Storefront className="h-5 w-5 text-blue-600" />
                      )}
                      {activity.type === 'customer_signup' && (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      )}
                      {activity.type === 'order_placed' && (
                        <ShoppingCart className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.tenant_name}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}