import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  TrendUp,
  TrendDown,
  Users,
  Storefront,
  ShoppingCart,
  CurrencyDollar,
  Download,
  MapPin,
  Package,
  Calendar,
  Star,
  Eye,
  ChartBar,
  Lightbulb
} from '@phosphor-icons/react'
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'
import { AreaHeatmap } from './AreaHeatmap'
import { AnalyticsFilters, AnalyticsFilterState } from './AnalyticsFilters'

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#84CC16']

interface DashboardData {
  summary: {
    totalTenants: number
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
    avgOrderValue: number
  }
  chemists: any[]
  areas: any[]
  products: any[]
  trends: any[]
  insights: any[]
}

export const EnhancedSuperAdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilterState>({})

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const days = parseInt(dateRange)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/super-admin/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (format: 'csv' | 'excel', dataType: string = 'dashboard') => {
    try {
      const days = parseInt(dateRange)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/super-admin/analytics/export/${format}?startDate=${startDate}&endDate=${endDate}&dataType=${dataType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${format}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Data exported successfully as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Apply filters to data
  const applyFilters = (data: any[]) => {
    if (!data) return []
    
    return data.filter(item => {
      if (filters.tenantId && item.tenant_id !== filters.tenantId) return false
      if (filters.area && item.area !== filters.area) return false
      if (filters.category && item.category !== filters.category) return false
      if (filters.minRevenue && parseFloat(item.total_revenue) < filters.minRevenue) return false
      if (filters.maxRevenue && parseFloat(item.total_revenue) > filters.maxRevenue) return false
      if (filters.minOrders && parseInt(item.total_orders || item.order_count) < filters.minOrders) return false
      return true
    })
  }

  // Get unique categories from products
  const categories = dashboardData?.products 
    ? Array.from(new Set(dashboardData.products.map(p => p.category)))
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights across all stores and areas
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('excel')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Storefront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              Active chemists/stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Across all stores
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
              {formatCurrency(dashboardData.summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(dashboardData.summary.avgOrderValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Smart Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.insights.map((insight, index) => (
                <Card key={index} className={
                  insight.trend === 'positive' ? 'border-green-200 bg-green-50' :
                  insight.trend === 'negative' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {insight.trend === 'positive' && <TrendUp className="h-4 w-4 text-green-600" />}
                      {insight.trend === 'negative' && <TrendDown className="h-4 w-4 text-red-600" />}
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <p className="text-lg font-semibold">{formatCurrency(insight.value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      <AnalyticsFilters
        onFilterChange={setFilters}
        tenants={dashboardData.chemists.map(c => ({ 
          tenant_id: c.tenant_id, 
          tenant_name: c.tenant_name 
        }))}
        areas={dashboardData.areas.map(a => ({ area: a.area }))}
        categories={categories}
      />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="chemists" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chemists">
            <Storefront className="h-4 w-4 mr-2" />
            Chemists/Stores
          </TabsTrigger>
          <TabsTrigger value="areas">
            <MapPin className="h-4 w-4 mr-2" />
            Area Analysis
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Product Performance
          </TabsTrigger>
          <TabsTrigger value="trends">
            <ChartBar className="h-4 w-4 mr-2" />
            Time Trends
          </TabsTrigger>
        </TabsList>

        {/* Chemists/Stores Tab */}
        <TabsContent value="chemists" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Store Performance</CardTitle>
                <CardDescription>Revenue, orders, and customer metrics by store</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('excel', 'chemist')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {selectedTenant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTenant(null)}
                    >
                      ← Back to All Stores
                    </Button>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedTenant.tenant_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTenant.city}, {selectedTenant.state}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(selectedTenant.total_revenue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedTenant.total_orders}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedTenant.customer_count}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Avg Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(selectedTenant.avg_order_value)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Delivered', value: parseInt(selectedTenant.delivered_orders) },
                              { name: 'Processing', value: parseInt(selectedTenant.processing_orders) },
                              { name: 'Pending', value: parseInt(selectedTenant.pending_orders) },
                              { name: 'Cancelled', value: parseInt(selectedTenant.cancelled_orders) }
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2, 3].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead className="text-right">Customers</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.chemists.slice(0, 10).map((chemist) => (
                      <TableRow key={chemist.tenant_id}>
                        <TableCell className="font-medium">{chemist.tenant_name}</TableCell>
                        <TableCell>{chemist.city || 'N/A'}, {chemist.state || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{chemist.business_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{chemist.customer_count}</TableCell>
                        <TableCell className="text-right">{chemist.total_orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(chemist.total_revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTenant(chemist)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Top Stores Chart */}
          {!selectedTenant && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Stores by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={applyFilters(dashboardData.chemists).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="tenant_name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="total_revenue" fill={COLORS[0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Area Analysis Tab */}
        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Geographic Performance</CardTitle>
                <CardDescription>Sales and orders by city/area</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('excel', 'area')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area/City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Stores</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applyFilters(dashboardData.areas).slice(0, 15).map((area, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{area.area}</TableCell>
                      <TableCell>{area.state}</TableCell>
                      <TableCell className="text-right">{area.tenant_count}</TableCell>
                      <TableCell className="text-right">{area.total_orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(area.total_revenue)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{parseFloat(area.revenue_percentage).toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Area Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution by Area</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.areas.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_revenue" fill={COLORS[2]} name="Revenue" />
                  <Bar dataKey="total_orders" fill={COLORS[4]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area Heatmap */}
          <AreaHeatmap data={applyFilters(dashboardData.areas)} />
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Sales Performance</CardTitle>
                <CardDescription>Top selling products across all areas</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('excel', 'product')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applyFilters(dashboardData.products).slice(0, 15).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{product.area}</TableCell>
                      <TableCell className="text-right">{product.order_count}</TableCell>
                      <TableCell className="text-right">{product.total_quantity_sold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Products Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.products.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product_name" type="category" width={150} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="total_revenue" fill={COLORS[3]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Time-Based Trends</CardTitle>
                <CardDescription>Orders and revenue trends over time</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('excel', 'trends')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total_orders" 
                    stroke={COLORS[0]} 
                    name="Orders" 
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke={COLORS[1]} 
                    name="Revenue" 
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="unique_customers" 
                    stroke={COLORS[2]} 
                    name="Customers" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke={COLORS[0]} 
                    fill={COLORS[0]} 
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
