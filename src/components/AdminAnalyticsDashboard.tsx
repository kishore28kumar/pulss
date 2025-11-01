import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { 
  TrendUp, 
  TrendDown, 
  Users, 
  ShoppingCart, 
  Package, 
  CurrencyDollar,
  Download,
  Calendar,
  ChartBar,
  ChartPieSlice
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    total_sold: number
    revenue: number
    category: string
  }>
  recentOrders: Array<{
    id: string
    customer_name: string
    total: number
    status: string
    created_at: string
    payment_method: string
    items_count: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  customerInsights: {
    newCustomers: number
    returningCustomers: number
    loyaltyPointsRedeemed: number
  }
  orderStatusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
}

interface AdminAnalyticsDashboardProps {
  role: 'admin' | 'super_admin'
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ role }) => {
  const { profile } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7') // days
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [tenants, setTenants] = useState<Array<{ id: string, name: string }>>([])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)))
      const endDate = endOfDay(new Date())

      // Build query with proper typing
      const buildQuery = () => {
        const query = supabase.from('orders').select(`
          id,
          total,
          status,
          customer_name,
          customer_phone,
          payment_method,
          created_at,
          tenant_id,
          order_items (
            quantity,
            unit_price,
            products (
              id,
              name,
              categories (name)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

        // Apply tenant filter
        if (role === 'admin' && profile?.tenant_id) {
          return query.eq('tenant_id', profile.tenant_id)
        } else if (selectedTenant !== 'all') {
          return query.eq('tenant_id', selectedTenant)
        }
        return query
      }

      const { data: orders, error: ordersError } = await buildQuery()

      if (ordersError) throw ordersError

      // Calculate analytics
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Get unique customers
      const uniqueCustomers = new Set(orders?.map(o => o.customer_phone) || [])
      const totalCustomers = uniqueCustomers.size

      // Calculate top products
      const productSales = new Map<string, {
        id: string
        name: string
        total_sold: number
        revenue: number
        category: string
      }>()

      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productId = item.products?.id
          const productName = item.products?.name || 'Unknown Product'
          const category = item.products?.categories?.name || 'General'
          
          if (productId) {
            const existing = productSales.get(productId) || {
              id: productId,
              name: productName,
              total_sold: 0,
              revenue: 0,
              category
            }
            
            existing.total_sold += item.quantity
            existing.revenue += item.quantity * item.unit_price
            productSales.set(productId, existing)
          }
        })
      })

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Revenue by day
      const revenueByDay = new Map<string, { revenue: number, orders: number }>()
      orders?.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd')
        const existing = revenueByDay.get(date) || { revenue: 0, orders: 0 }
        existing.revenue += order.total
        existing.orders += 1
        revenueByDay.set(date, existing)
      })

      const revenueByDayArray = Array.from(revenueByDay.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Order status breakdown
      const statusCounts = new Map<string, number>()
      orders?.forEach(order => {
        statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1)
      })

      const orderStatusBreakdown = Array.from(statusCounts.entries())
        .map(([status, count]) => ({
          status,
          count,
          percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
        }))

      const analyticsData: AnalyticsData = {
        totalOrders,
        totalRevenue,
        totalCustomers,
        averageOrderValue,
        topProducts,
        recentOrders: orders?.slice(0, 10).map(order => ({
          id: order.id,
          customer_name: order.customer_name,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
          payment_method: order.payment_method,
          items_count: order.order_items?.length || 0
        })) || [],
        revenueByDay: revenueByDayArray,
        customerInsights: {
          newCustomers: totalCustomers, // Simplified - in real app, track first-time vs returning
          returningCustomers: 0,
          loyaltyPointsRedeemed: 0
        },
        orderStatusBreakdown
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    if (role !== 'super_admin') return

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name')

      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const exportToExcel = async () => {
    if (!analytics) return

    try {
      toast.loading('Preparing Excel export...')

      // Create comprehensive data for export
      const exportData = {
        summary: {
          totalOrders: analytics.totalOrders,
          totalRevenue: analytics.totalRevenue,
          totalCustomers: analytics.totalCustomers,
          averageOrderValue: analytics.averageOrderValue,
          dateRange: `${dateRange} days`,
          generatedAt: new Date().toISOString()
        },
        topProducts: analytics.topProducts,
        recentOrders: analytics.recentOrders,
        revenueByDay: analytics.revenueByDay,
        orderStatusBreakdown: analytics.orderStatusBreakdown
      }

      // Convert to CSV format (simplified Excel export)
      const createCSV = (data: any[], headers: string[]) => {
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => {
            const value = row[header.toLowerCase().replace(/\s+/g, '_')]
            return typeof value === 'string' ? `"${value}"` : value
          }).join(','))
        ].join('\n')
        return csvContent
      }

      // Create multiple sheets as separate CSV files
      const sheets = [
        {
          name: 'Top Products',
          data: analytics.topProducts,
          headers: ['Name', 'Category', 'Total Sold', 'Revenue']
        },
        {
          name: 'Recent Orders',
          data: analytics.recentOrders,
          headers: ['Order ID', 'Customer Name', 'Total', 'Status', 'Payment Method', 'Items Count', 'Created At']
        },
        {
          name: 'Daily Revenue',
          data: analytics.revenueByDay,
          headers: ['Date', 'Revenue', 'Orders']
        }
      ]

      // Download each sheet
      sheets.forEach(sheet => {
        const csv = createCSV(sheet.data, sheet.headers)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sheet.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })

      toast.success('Excel files downloaded successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  useEffect(() => {
    if (role === 'super_admin') {
      fetchTenants()
    }
    fetchAnalytics()
  }, [dateRange, selectedTenant, role])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          {role === 'super_admin' && (
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{analytics.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <CurrencyDollar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold">{analytics.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-3xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
              </div>
              <ChartBar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{product.total_sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        #{order.id.slice(-8).toUpperCase()} • {order.items_count} items
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {order.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.revenueByDay.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(day.date), 'PPP')}</p>
                      <p className="text-sm text-muted-foreground">{day.orders} orders</p>
                    </div>
                    <p className="font-medium text-lg">{formatCurrency(day.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.orderStatusBreakdown.map((status) => (
                  <div key={status.status} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <ChartPieSlice className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{status.status.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{status.percentage.toFixed(1)}% of orders</p>
                      </div>
                    </div>
                    <p className="font-medium text-lg">{status.count}</p>
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