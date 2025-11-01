import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { 
  TrendUp, 
  TrendDown, 
  Users, 
  ShoppingCart, 
  Package, 
  CurrencyCircleDollar as DollarSign,
  Calendar,
  Clock,
  MapPin,
  Star,
  Eye,
  Heart,
  Share,
  Download,
  Funnel as Filter,
  ChartBar as BarChart,
  ChartPie as PieChart,
  Activity
} from '@phosphor-icons/react'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  conversionRate: number
  avgOrderValue: number
  revenueGrowth: number
  customerGrowth: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
    views: number
    conversionRate: number
  }>
  salesByCategory: Array<{
    category: string
    sales: number
    revenue: number
    percentage: number
  }>
  customerBehavior: {
    newVsReturning: {
      new: number
      returning: number
    }
    deviceTypes: {
      mobile: number
      desktop: number
      tablet: number
    }
    topPages: Array<{
      page: string
      views: number
      bounceRate: number
    }>
  }
  recentActivity: Array<{
    id: string
    type: 'order' | 'customer' | 'product' | 'review'
    message: string
    timestamp: string
    value?: number
  }>
}

const defaultAnalytics: AnalyticsData = {
  totalRevenue: 45780,
  totalOrders: 156,
  totalCustomers: 89,
  totalProducts: 234,
  conversionRate: 3.2,
  avgOrderValue: 293.46,
  revenueGrowth: 15.8,
  customerGrowth: 12.3,
  topProducts: [
    {
      id: '1',
      name: 'Paracetamol 500mg',
      sales: 145,
      revenue: 7250,
      views: 1230,
      conversionRate: 11.8
    },
    {
      id: '2', 
      name: 'Vitamin D3 Tablets',
      sales: 89,
      revenue: 5340,
      views: 890,
      conversionRate: 10.0
    },
    {
      id: '3',
      name: 'Blood Pressure Monitor',
      sales: 23,
      revenue: 6900,
      views: 456,
      conversionRate: 5.0
    }
  ],
  salesByCategory: [
    { category: 'Medicines', sales: 234, revenue: 23400, percentage: 45 },
    { category: 'Vitamins', sales: 156, revenue: 15600, percentage: 30 },
    { category: 'Medical Devices', sales: 67, revenue: 10050, percentage: 19 },
    { category: 'Personal Care', sales: 45, revenue: 3150, percentage: 6 }
  ],
  customerBehavior: {
    newVsReturning: { new: 34, returning: 55 },
    deviceTypes: { mobile: 67, desktop: 28, tablet: 5 },
    topPages: [
      { page: '/products', views: 2340, bounceRate: 34 },
      { page: '/categories/medicines', views: 1890, bounceRate: 28 },
      { page: '/product/paracetamol', views: 756, bounceRate: 12 }
    ]
  },
  recentActivity: [
    {
      id: '1',
      type: 'order',
      message: 'New order #ORD-2024-0001 placed',
      timestamp: '2024-01-15T14:30:00Z',
      value: 299
    },
    {
      id: '2', 
      type: 'customer',
      message: 'New customer registered: john.doe@email.com',
      timestamp: '2024-01-15T14:15:00Z'
    },
    {
      id: '3',
      type: 'review',
      message: '5-star review for Vitamin C Tablets',
      timestamp: '2024-01-15T13:45:00Z',
      value: 5
    }
  ]
}

interface AdvancedAnalyticsDashboardProps {
  tenantId?: string
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  tenantId = 'demo-tenant'
}) => {
  const [analytics, setAnalytics] = useKV<AnalyticsData>(`analytics-${tenantId}`, defaultAnalytics)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedView, setSelectedView] = useState('overview')

  const currentData = analytics || defaultAnalytics

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4 text-green-600" />
      case 'customer': return <Users className="w-4 h-4 text-blue-600" />
      case 'product': return <Package className="w-4 h-4 text-purple-600" />
      case 'review': return <Star className="w-4 h-4 text-yellow-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your store performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(currentData.totalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{currentData.revenueGrowth}% from last period
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatNumber(currentData.totalOrders)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Avg: {formatCurrency(currentData.avgOrderValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Customers</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatNumber(currentData.totalCustomers)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600">
                    +{currentData.customerGrowth}% growth
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-800">
                  {currentData.conversionRate}%
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  {currentData.totalProducts} products
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <BarChart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="w-5 h-5" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentData.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{product.sales} sales</span>
                      <span>{formatCurrency(product.revenue)}</span>
                      <span>{product.views} views</span>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {product.conversionRate}% CVR
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentData.salesByCategory.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.category}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(category.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{category.sales} sales</div>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">New vs Returning</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>New Customers</span>
                  <span className="font-semibold">{currentData.customerBehavior.newVsReturning.new}%</span>
                </div>
                <Progress value={currentData.customerBehavior.newVsReturning.new} className="h-2" />
                <div className="flex justify-between">
                  <span>Returning Customers</span>
                  <span className="font-semibold">{currentData.customerBehavior.newVsReturning.returning}%</span>
                </div>
                <Progress value={currentData.customerBehavior.newVsReturning.returning} className="h-2" />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Device Types</h4>
              <div className="space-y-2">
                {Object.entries(currentData.customerBehavior.deviceTypes).map(([device, percentage]) => (
                  <div key={device} className="flex justify-between items-center">
                    <span className="capitalize">{device}</span>
                    <Badge variant="outline">{percentage}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.value && (
                    <Badge>
                      {activity.type === 'order' ? formatCurrency(activity.value) : `${activity.value}★`}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}