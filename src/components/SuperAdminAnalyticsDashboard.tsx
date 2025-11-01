import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendUp,
  TrendDown,
  Users,
  Storefront,
  ShoppingCart,
  CurrencyDollar,
  Calendar as CalendarIcon,
  Download,
  FunnelSimple,
  Eye,
  MapPin,
  Clock,
  Star,
  Package,
  CreditCard
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsData {
  totalTenants: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  
  // Growth metrics
  tenantGrowth: number
  customerGrowth: number
  orderGrowth: number
  revenueGrowth: number
  
  // Top performers
  topTenants: Array<{
    id: string
    name: string
    orders: number
    revenue: number
    customers: number
    growth: number
  }>
  
  // Business type distribution
  businessTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  
  // Geographic distribution
  locations: Array<{
    state: string
    city: string
    count: number
  }>
  
  // Time series data
  timeSeriesData: Array<{
    date: string
    tenants: number
    customers: number
    orders: number
    revenue: number
  }>
  
  // Performance metrics
  avgOrderValue: number
  avgOrdersPerTenant: number
  avgCustomersPerTenant: number
  customerRetention: number
  
  // Feature adoption
  featureAdoption: Array<{
    feature: string
    adopted: number
    total: number
    percentage: number
  }>
}

interface SuperAdminAnalyticsProps {
  dateRange: {
    from: Date
    to: Date
  }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}

export const SuperAdminAnalytics: React.FC<SuperAdminAnalyticsProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'orders' | 'revenue' | 'customers' | 'tenants'>('orders')
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // This would typically call multiple endpoints or a comprehensive analytics API
      const analyticsData = await fetchAnalyticsData()
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
    // In a real app, this would make API calls to get actual data
    // For demo purposes, returning mock data
    return {
      totalTenants: 127,
      totalCustomers: 8432,
      totalOrders: 15678,
      totalRevenue: 892456,
      
      tenantGrowth: 12.5,
      customerGrowth: 8.3,
      orderGrowth: 15.7,
      revenueGrowth: 18.2,
      
      topTenants: [
        { id: '1', name: 'City Medical Store', orders: 1234, revenue: 45678, customers: 567, growth: 23.4 },
        { id: '2', name: 'Green Pharmacy', orders: 987, revenue: 34567, customers: 432, growth: 18.7 },
        { id: '3', name: 'Super Market Plus', orders: 876, revenue: 29876, customers: 398, growth: 15.2 },
        { id: '4', name: 'Health Corner', orders: 765, revenue: 28765, customers: 345, growth: 12.8 },
        { id: '5', name: 'Quick Mart', orders: 654, revenue: 25432, customers: 289, growth: 9.4 }
      ],
      
      businessTypes: [
        { type: 'Pharmacy', count: 45, percentage: 35.4 },
        { type: 'Grocery', count: 38, percentage: 29.9 },
        { type: 'Medical Store', count: 23, percentage: 18.1 },
        { type: 'Supermarket', count: 15, percentage: 11.8 },
        { type: 'General Store', count: 6, percentage: 4.7 }
      ],
      
      locations: [
        { state: 'Karnataka', city: 'Bangalore', count: 25 },
        { state: 'Maharashtra', city: 'Mumbai', count: 22 },
        { state: 'Tamil Nadu', city: 'Chennai', count: 18 },
        { state: 'Delhi', city: 'New Delhi', count: 16 },
        { state: 'West Bengal', city: 'Kolkata', count: 14 }
      ],
      
      timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        tenants: Math.floor(Math.random() * 10) + 120,
        customers: Math.floor(Math.random() * 200) + 8200,
        orders: Math.floor(Math.random() * 500) + 500,
        revenue: Math.floor(Math.random() * 10000) + 25000
      })),
      
      avgOrderValue: 56.78,
      avgOrdersPerTenant: 123.4,
      avgCustomersPerTenant: 66.4,
      customerRetention: 73.2,
      
      featureAdoption: [
        { feature: 'Online Payments', adopted: 89, total: 127, percentage: 70.1 },
        { feature: 'WhatsApp Integration', adopted: 76, total: 127, percentage: 59.8 },
        { feature: 'Prescription Upload', adopted: 45, total: 127, percentage: 35.4 },
        { feature: 'Loyalty Program', adopted: 34, total: 127, percentage: 26.8 },
        { feature: 'Subscription Service', adopted: 23, total: 127, percentage: 18.1 }
      ]
    }
  }

  const exportAnalytics = async () => {
    try {
      // In a real app, this would generate and download an Excel/PDF report
      const dataStr = JSON.stringify(analytics, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `pulss-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast.success('Analytics data exported successfully')
    } catch (error) {
      toast.error('Failed to export analytics data')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendDown className="w-4 h-4 text-red-600" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your platform performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDateRangeChange({
                      from: subDays(new Date(), 7),
                      to: new Date()
                    })
                    setShowCalendar(false)
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDateRangeChange({
                      from: subDays(new Date(), 30),
                      to: new Date()
                    })
                    setShowCalendar(false)
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDateRangeChange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date())
                    })
                    setShowCalendar(false)
                  }}
                >
                  This month
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportAnalytics} className="gap-2">
            <Download className="w-4 h-4" />
            Export
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
            <div className="text-2xl font-bold">{formatNumber(analytics.totalTenants)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getGrowthIcon(analytics.tenantGrowth)}
              <span className={getGrowthColor(analytics.tenantGrowth)}>
                {analytics.tenantGrowth > 0 ? '+' : ''}{analytics.tenantGrowth.toFixed(1)}%
              </span>
              <span>from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalCustomers)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getGrowthIcon(analytics.customerGrowth)}
              <span className={getGrowthColor(analytics.customerGrowth)}>
                {analytics.customerGrowth > 0 ? '+' : ''}{analytics.customerGrowth.toFixed(1)}%
              </span>
              <span>from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalOrders)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getGrowthIcon(analytics.orderGrowth)}
              <span className={getGrowthColor(analytics.orderGrowth)}>
                {analytics.orderGrowth > 0 ? '+' : ''}{analytics.orderGrowth.toFixed(1)}%
              </span>
              <span>from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getGrowthIcon(analytics.revenueGrowth)}
              <span className={getGrowthColor(analytics.revenueGrowth)}>
                {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
              </span>
              <span>from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Performance Trends</CardTitle>
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="tenants">Tenants</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => {
                    if (selectedMetric === 'revenue') {
                      return [formatCurrency(value), 'Revenue']
                    }
                    return [formatNumber(value), selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)]
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Business Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.businessTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.businessTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feature Adoption */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.featureAdoption.map((feature, index) => (
                <div key={feature.feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.feature}</span>
                    <Badge variant="secondary">
                      {feature.adopted}/{feature.total} ({feature.percentage.toFixed(1)}%)
                    </Badge>
                  </div>
                  <Progress value={feature.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Performing Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topTenants.map((tenant, index) => (
                <div key={tenant.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{tenant.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{formatNumber(tenant.orders)} orders</span>
                        <span>{formatCurrency(tenant.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{formatNumber(tenant.customers)} customers</span>
                        <span className={getGrowthColor(tenant.growth)}>
                          {tenant.growth > 0 ? '+' : ''}{tenant.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.locations.map((location, index) => (
                <div key={`${location.state}-${location.city}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium">{location.city}</h4>
                    <p className="text-xs text-muted-foreground">{location.state}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{location.count} stores</div>
                    <div className="text-xs text-muted-foreground">
                      {((location.count / analytics.totalTenants) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per order across platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Orders/Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgOrdersPerTenant.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Orders per tenant monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Customers/Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgCustomersPerTenant.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Customers per tenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.customerRetention.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Returning customers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}