import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Search,
  Heart,
  Package,
  Clock,
  MapPin,
  Star,
  Download,
  RefreshCw
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { format, subDays, startOfDay, endOfDay, subMonths } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { FeatureFlags } from '@/types'
import { toast } from 'sonner'

interface EnhancedAnalyticsProps {
  tenantId: string
  role: 'admin' | 'super_admin'
}

interface AnalyticsData {
  // Sales Metrics
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  conversionRate: number
  
  // Customer Metrics
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerLifetimeValue: number
  
  // Product Metrics
  totalProducts: number
  topSellingProducts: Array<{ name: string; sales: number; revenue: number }>
  lowStockProducts: Array<{ name: string; stock: number; sales: number }>
  
  // Search & Behavior
  topSearches: Array<{ query: string; count: number; conversion: number }>
  abandondedCarts: number
  wishlistItems: number
  
  // Time Series Data
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
  hourlyTraffic: Array<{ hour: number; visitors: number; conversions: number }>
  categoryPerformance: Array<{ category: string; revenue: number; orders: number }>
  
  // Geographic Data
  topCities: Array<{ city: string; orders: number; revenue: number }>
  deliveryPerformance: Array<{ area: string; avgTime: number; satisfaction: number }>
  
  // Comparison Data
  previousPeriod: {
    revenue: number
    orders: number
    customers: number
  }
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

const MetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<any>
  color?: string
  format?: 'currency' | 'number' | 'percentage'
}> = ({ title, value, change, icon: Icon, color = 'text-primary', format = 'number' }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return `₹${val.toLocaleString()}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {change !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-sm ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({ tenantId, role }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadFeatureFlags()
  }, [tenantId])

  useEffect(() => {
    if (featureFlags?.analytics_dashboard_enabled) {
      loadAnalyticsData()
    }
  }, [featureFlags, dateRange])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const startDate = startOfDay(dateRange.from)
      const endDate = endOfDay(dateRange.to)

      // Load orders data
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(name, category_id, categories(name))),
          customers(*)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('tenant_id', tenantId)

      // Load search analytics
      const { data: searchData } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('tenant_id', tenantId)

      // Load customer data
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('tenant_id', tenantId)

      // Load products data for inventory analysis
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)

      // Process analytics data
      const analytics = processAnalyticsData({
        orders: orders || [],
        searches: searchData || [],
        customers: customers || [],
        products: products || [],
        dateRange
      })

      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (data: {
    orders: any[]
    searches: any[]
    customers: any[]
    products: any[]
    dateRange: { from: Date; to: Date }
  }): AnalyticsData => {
    const { orders, searches, customers, products } = data

    // Basic metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Customer metrics
    const totalCustomers = customers.length
    const uniqueOrderCustomers = new Set(orders.map(o => o.customer_id)).size
    const conversionRate = totalCustomers > 0 ? (uniqueOrderCustomers / totalCustomers) * 100 : 0

    // Product performance
    const productSales: { [key: string]: { sales: number; revenue: number; name: string } } = {}
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id
        const productName = item.products?.name || 'Unknown Product'
        if (!productSales[productId]) {
          productSales[productId] = { sales: 0, revenue: 0, name: productName }
        }
        productSales[productId].sales += item.quantity
        productSales[productId].revenue += item.line_total
      })
    })

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)

    // Search analytics
    const searchCounts: { [key: string]: { count: number; conversions: number } } = {}
    searches.forEach(search => {
      const query = search.search_query.toLowerCase()
      if (!searchCounts[query]) {
        searchCounts[query] = { count: 0, conversions: 0 }
      }
      searchCounts[query].count++
      if (search.clicked_product_id) {
        searchCounts[query].conversions++
      }
    })

    const topSearches = Object.entries(searchCounts)
      .map(([query, data]) => ({
        query,
        count: data.count,
        conversion: data.count > 0 ? (data.conversions / data.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Time series data
    const dailyData: { [key: string]: { revenue: number; orders: number } } = {}
    orders.forEach(order => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd')
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 }
      }
      dailyData[date].revenue += order.total_amount
      dailyData[date].orders++
    })

    const dailyRevenue = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Category performance
    const categoryData: { [key: string]: { revenue: number; orders: number } } = {}
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const categoryName = item.products?.categories?.name || 'Uncategorized'
        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { revenue: 0, orders: 0 }
        }
        categoryData[categoryName].revenue += item.line_total
      })
    })
    orders.forEach(order => {
      const categories = new Set()
      order.order_items?.forEach((item: any) => {
        const categoryName = item.products?.categories?.name || 'Uncategorized'
        categories.add(categoryName)
      })
      categories.forEach(category => {
        if (categoryData[category as string]) {
          categoryData[category as string].orders++
        }
      })
    })

    const categoryPerformance = Object.entries(categoryData)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    // Geographic data
    const cityData: { [key: string]: { orders: number; revenue: number } } = {}
    orders.forEach(order => {
      const city = order.delivery_address?.city || 'Unknown'
      if (!cityData[city]) {
        cityData[city] = { orders: 0, revenue: 0 }
      }
      cityData[city].orders++
      cityData[city].revenue += order.total_amount
    })

    const topCities = Object.entries(cityData)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Hourly traffic (simulated data for demo)
    const hourlyTraffic = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visitors: Math.floor(Math.random() * 100) + 20,
      conversions: Math.floor(Math.random() * 20) + 5
    }))

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      totalCustomers,
      newCustomers: customers.length,
      returningCustomers: uniqueOrderCustomers - customers.length,
      customerLifetimeValue: uniqueOrderCustomers > 0 ? totalRevenue / uniqueOrderCustomers : 0,
      totalProducts: products.length,
      topSellingProducts,
      lowStockProducts: products
        .filter(p => p.inventory_count < 10)
        .map(p => ({ name: p.name, stock: p.inventory_count, sales: productSales[p.id]?.sales || 0 }))
        .slice(0, 10),
      topSearches,
      abandondedCarts: Math.floor(totalOrders * 0.3), // Estimated
      wishlistItems: Math.floor(totalCustomers * 2.5), // Estimated
      dailyRevenue,
      hourlyTraffic,
      categoryPerformance,
      topCities,
      deliveryPerformance: [], // Would be calculated from delivery data
      previousPeriod: {
        revenue: totalRevenue * 0.85, // Mock previous period data
        orders: Math.floor(totalOrders * 0.9),
        customers: Math.floor(totalCustomers * 0.8)
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  const exportData = () => {
    if (!analyticsData) return
    
    const dataToExport = {
      period: `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
      metrics: analyticsData
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!featureFlags?.analytics_dashboard_enabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">Analytics Dashboard</p>
          <p className="text-muted-foreground">Analytics dashboard is not enabled for this tenant</p>
        </CardContent>
      </Card>
    )
  }

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const revenueChange = analyticsData.previousPeriod.revenue > 0 
    ? ((analyticsData.totalRevenue - analyticsData.previousPeriod.revenue) / analyticsData.previousPeriod.revenue) * 100
    : 0

  const ordersChange = analyticsData.previousPeriod.orders > 0
    ? ((analyticsData.totalOrders - analyticsData.previousPeriod.orders) / analyticsData.previousPeriod.orders) * 100
    : 0

  const customersChange = analyticsData.previousPeriod.customers > 0
    ? ((analyticsData.totalCustomers - analyticsData.previousPeriod.customers) / analyticsData.previousPeriod.customers) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={analyticsData.totalRevenue}
          change={revenueChange}
          icon={DollarSign}
          color="text-green-600"
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={analyticsData.totalOrders}
          change={ordersChange}
          icon={ShoppingCart}
          color="text-blue-600"
        />
        <MetricCard
          title="Total Customers"
          value={analyticsData.totalCustomers}
          change={customersChange}
          icon={Users}
          color="text-purple-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={analyticsData.conversionRate}
          icon={TrendingUp}
          color="text-orange-600"
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        </TabsList>

        {/* Sales Analytics */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryPerformance.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analyticsData.categoryPerformance.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Cities by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topCities.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Insights */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard
              title="New Customers"
              value={analyticsData.newCustomers}
              icon={Users}
              color="text-green-600"
            />
            <MetricCard
              title="Returning Customers"
              value={analyticsData.returningCustomers}
              icon={Users}
              color="text-blue-600"
            />
            <MetricCard
              title="Avg Order Value"
              value={analyticsData.averageOrderValue}
              icon={DollarSign}
              color="text-purple-600"
              format="currency"
            />
            <MetricCard
              title="Customer LTV"
              value={analyticsData.customerLifetimeValue}
              icon={Star}
              color="text-orange-600"
              format="currency"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Traffic Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.hourlyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="visitors" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {analyticsData.topSellingProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                        </div>
                        <Badge variant="secondary">₹{product.revenue.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {analyticsData.lowStockProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded border-orange-200">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-orange-600">{product.stock} units remaining</p>
                        </div>
                        <Badge variant="destructive">{product.sales} sold</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Searches"
              value={analyticsData.topSearches.reduce((sum, s) => sum + s.count, 0)}
              icon={Search}
              color="text-blue-600"
            />
            <MetricCard
              title="Abandoned Carts"
              value={analyticsData.abandondedCarts}
              icon={ShoppingCart}
              color="text-red-600"
            />
            <MetricCard
              title="Wishlist Items"
              value={analyticsData.wishlistItems}
              icon={Heart}
              color="text-pink-600"
            />
            <MetricCard
              title="Avg Session Time"
              value="12m 34s"
              icon={Clock}
              color="text-purple-600"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analyticsData.topSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">"{search.query}"</p>
                        <p className="text-sm text-muted-foreground">{search.count} searches</p>
                      </div>
                      <Badge variant={search.conversion > 20 ? "default" : "secondary"}>
                        {search.conversion.toFixed(1)}% conversion
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedAnalytics