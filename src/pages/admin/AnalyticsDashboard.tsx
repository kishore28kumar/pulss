import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendUp, 
  TrendDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Package,
  ChartBar,
  Target,
  Download,
  AlertTriangle,
  Clock,
  Store
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import * as XLSX from 'xlsx'
import type { 
  AdminDashboardData, 
  RecentActivity, 
  TopSellingProduct, 
  LowStockProduct,
  OrderStatusBreakdown,
  RecentCustomer,
  MonthlySalesData
} from '@/types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [exporting, setExporting] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const response = await fetch(
        `/api/analytics/admin-dashboard?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const handleExport = async (type: 'orders' | 'customers' | 'products') => {
    setExporting(type)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const endpoint = type === 'orders' 
        ? `/api/analytics/export/orders?startDate=${startDate}&endDate=${endDate}`
        : `/api/analytics/export/${type}`

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) throw new Error(`Failed to export ${type}`)
      const result = await response.json()

      if (result.success && result.data) {
        // Convert to Excel
        const ws = XLSX.utils.json_to_sheet(result.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1))
        XLSX.writeFile(wb, `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`)
      } else {
        throw new Error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error(`Export ${type} error:`, error)
      toast.error(`Failed to export ${type}`)
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Business summary and key metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Store Name</p>
              <p className="font-semibold">{dashboardData.storeInfo.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="font-semibold">{dashboardData.storeInfo.contact_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="font-semibold capitalize">{dashboardData.storeInfo.business_type || 'N/A'}</p>
            </div>
            {dashboardData.storeInfo.address && (
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold">
                  {dashboardData.storeInfo.address}
                  {dashboardData.storeInfo.city && `, ${dashboardData.storeInfo.city}`}
                  {dashboardData.storeInfo.state && `, ${dashboardData.storeInfo.state}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.total_orders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.summary.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.total_customers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('orders')}
          disabled={exporting === 'orders'}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting === 'orders' ? 'Exporting...' : 'Export Orders'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('customers')}
          disabled={exporting === 'customers'}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting === 'customers' ? 'Exporting...' : 'Export Customers'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('products')}
          disabled={exporting === 'products'}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting === 'products' ? 'Exporting...' : 'Export Products'}
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Sales Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Sales Trend</CardTitle>
                <CardDescription>Revenue and order count by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return formatCurrency(value)
                        return value
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                    <Bar yAxisId="right" dataKey="order_count" fill="#82ca9d" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown by order status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.orderStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.status}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData.orderStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status List */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Summary</CardTitle>
                <CardDescription>Orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.orderStatusBreakdown.map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{status.status}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{status.count}</p>
                        <p className="text-xs text-muted-foreground">{status.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-green-600" />
                  Top 5 Selling Products
                </CardTitle>
                <CardDescription>Best performers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.topSellingProducts.length > 0 ? (
                    dashboardData.topSellingProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            <p className="font-medium">{product.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {product.category} • {product.times_ordered} orders • {product.total_quantity_sold} units
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.total_revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No sales data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Products running low on inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.lowStockProducts.length > 0 ? (
                    dashboardData.lowStockProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded bg-orange-50 dark:bg-orange-950">
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">
                            {product.current_stock} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.min_stock_level}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">All products are well stocked!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Latest customer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.recentCustomers.length > 0 ? (
                  dashboardData.recentCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone || customer.email || 'No contact info'}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <p className="text-sm font-medium">Orders: {customer.total_orders}</p>
                        </div>
                        {customer.loyalty_points > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {customer.loyalty_points} pts
                          </Badge>
                        )}
                        {customer.credit_balance > 0 && (
                          <Badge variant="outline" className="text-xs ml-1">
                            ₹{customer.credit_balance} credit
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No customers yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity Timeline
              </CardTitle>
              <CardDescription>Last 10 orders and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 border rounded">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
