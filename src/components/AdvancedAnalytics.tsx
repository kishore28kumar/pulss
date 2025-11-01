import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  useDemoSalesMetrics, 
  useDemoCategorySales, 
  useDemoTopProducts,
  SalesMetric, 
  CategorySales, 
  TopProduct 
} from '@/lib/demoData'
import { 
  TrendUp, 
  TrendDown, 
  CurrencyCircleDollar, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  ChartBar,
  ChartPie,
  Activity,
  Target,
  Trophy
} from '@phosphor-icons/react'

interface MetricCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  trend: 'up' | 'down'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
        {trend === 'up' ? (
          <TrendUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendDown className="h-3 w-3 text-red-500" />
        )}
        <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
          {Math.abs(change)}% from last period
        </span>
      </p>
    </CardContent>
  </Card>
)

interface SimpleChartProps {
  data: SalesMetric[]
  metric: 'sales' | 'orders' | 'customers'
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, metric }) => {
  const values = data.map(d => d[metric])
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Last 7 days</span>
        <span>High: {max.toLocaleString()}</span>
      </div>
      <div className="flex items-end gap-1 h-32">
        {values.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-primary/20 rounded-t relative flex items-end justify-center"
            style={{ height: `${(value / max) * 100}%` }}
          >
            <div 
              className="w-full bg-primary rounded-t transition-all duration-300"
              style={{ height: '100%' }}
            >
              <div className="text-xs text-white text-center pt-1 font-medium">
                {value > max * 0.7 ? value.toLocaleString() : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {new Date(d.date).getDate()}
          </span>
        ))}
      </div>
    </div>
  )
}

interface PieChartProps {
  data: CategorySales[]
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500'
  ]
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative w-32 h-32 mx-auto">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-red-500 to-purple-500">
            <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">
                  ₹{(data.reduce((sum, cat) => sum + cat.sales, 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((category, index) => (
            <div key={category.category} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
              <span className="flex-1 text-xs">{category.category}</span>
              <span className="font-medium">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const AdvancedAnalytics: React.FC = () => {
  const [salesMetrics] = useDemoSalesMetrics()
  const [categorySales] = useDemoCategorySales()
  const [topProducts] = useDemoTopProducts()
  const [timeRange, setTimeRange] = useState('7days')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Calculate summary metrics
  const totalSales = salesMetrics.reduce((sum, metric) => sum + metric.sales, 0)
  const totalOrders = salesMetrics.reduce((sum, metric) => sum + metric.orders, 0)
  const totalCustomers = salesMetrics.reduce((sum, metric) => sum + metric.customers, 0)
  const avgOrderValue = totalSales / totalOrders
  
  // Calculate growth rates (simulated)
  const salesGrowth = 12.5
  const orderGrowth = 8.3
  const customerGrowth = 15.7
  const avgOrderGrowth = 4.2
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₹${(totalSales / 1000).toFixed(0)}K`}
          change={salesGrowth}
          trend="up"
          icon={<CurrencyCircleDollar className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders}
          change={orderGrowth}
          trend="up"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Customers"
          value={totalCustomers}
          change={customerGrowth}
          trend="up"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg. Order Value"
          value={`₹${avgOrderValue.toFixed(0)}`}
          change={avgOrderGrowth}
          trend="up"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              Sales Trends
            </CardTitle>
            <CardDescription>Daily sales performance over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={salesMetrics} metric="sales" />
          </CardContent>
        </Card>
        
        {/* Order Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Trends
            </CardTitle>
            <CardDescription>Daily order count over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={salesMetrics} metric="orders" />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartPie className="h-5 w-5" />
              Category Performance
            </CardTitle>
            <CardDescription>Sales distribution by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={categorySales} />
          </CardContent>
        </Card>
        
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Performing Products
            </CardTitle>
            <CardDescription>Best sellers by revenue and volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Indicators
          </CardTitle>
          <CardDescription>Key performance metrics and targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenue Target</span>
                <span className="font-medium">75% (₹{(totalSales / 1000).toFixed(0)}K / ₹200K)</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Target</span>
                <span className="font-medium">82% ({totalOrders} / 350)</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Growth</span>
                <span className="font-medium">90% ({totalCustomers} / 250)</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}