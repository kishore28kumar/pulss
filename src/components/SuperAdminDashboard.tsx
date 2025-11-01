import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  Funnel, 
  TrendUp, 
  TrendDown, 
  Users, 
  ShoppingBag, 
  CurrencyDollar,
  Storefront,
  ChartBar,
  Calendar as CalendarIcon,
  Notification,
  Bell,
  BellRinging
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { reportingService, SystemReport } from '@/lib/reporting'
import { advancedFilteringService, FilterOptions, FilterResult } from '@/lib/advancedFiltering'
import { realtimeNotificationService } from '@/lib/realtimeNotifications'
import { DemoDataBanner } from './DemoDataBanner'
import { useDemoStores, useDemoOrders, DEMO_STORES, DEMO_ORDERS } from '@/lib/demoData'
import { AdvancedAnalytics } from './AdvancedAnalytics'
import { NotificationCenter } from './NotificationCenter'
import { AdvancedOrderManagement } from './AdvancedOrderManagement'
import { PerformanceDashboard } from './PerformanceDashboard'
import { Footer } from './Footer'

interface SuperAdminDashboardProps {
  onNavigate?: (section: string, data?: any) => void
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [filters, setFilters] = useState<FilterOptions>({})
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Demo data hooks
  const [demoStores, setDemoStores] = useDemoStores()
  const [demoOrders, setDemoOrders] = useDemoOrders()
  
  // Clear any old agreement/legal popups that might be stored
  useEffect(() => {
    const clearOldData = async () => {
      try {
        await spark.kv.delete('agreement-accepted')
        await spark.kv.delete('legal-agreement')
        await spark.kv.delete('terms-accepted') 
        await spark.kv.delete('privacy-accepted')
        await spark.kv.delete('show-agreement')
        await spark.kv.delete('show-legal-modal')
      } catch (error) {
        // Ignore errors - these keys might not exist
      }
    }
    clearOldData()
  }, [])

  // Calculate demo analytics
  const demoAnalytics = {
    totalStores: demoStores.length,
    totalProducts: demoStores.reduce((sum, store) => sum + store.products.length, 0),
    totalOrders: demoOrders.length,
    totalRevenue: demoOrders.reduce((sum, order) => sum + order.total, 0),
    activeOrders: demoOrders.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status)).length,
    completedOrders: demoOrders.filter(order => order.status === 'delivered').length
  }

  // Fetch system report
  const { data: systemReport, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['system-report', dateRange, filters],
    queryFn: () => {
      if (!dateRange?.from || !dateRange?.to) return null
      
      return reportingService.generateSystemReport(
        dateRange.from.toISOString(),
        dateRange.to.toISOString(),
        filters
      )
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })

  // Fetch filtered tenants
  const { data: filteredTenants, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery({
    queryKey: ['filtered-tenants', filters],
    queryFn: () => advancedFilteringService.filterTenants(filters, 
      { field: 'created_at', direction: 'desc' },
      { page: 1, limit: 100 }
    )
  })

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: () => advancedFilteringService.getFilterOptions()
  })

  // Initialize real-time notifications
  useEffect(() => {
    // Subscribe to system-wide alerts
    const channel = realtimeNotificationService.subscribeToSystemAlerts((alert) => {
      setNotifications(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50
      setUnreadCount(prev => prev + 1)
    })

    // Request notification permission
    realtimeNotificationService.requestNotificationPermission()

    return () => {
      realtimeNotificationService.unsubscribe('system-alerts')
    }
  }, [])

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  // Export system report
  const handleExportReport = (format: 'csv' | 'json' = 'csv') => {
    if (!systemReport) {
      toast.error('No data to export')
      return
    }

    const filename = `pulss-system-report-${dateRange?.from?.toISOString().split('T')[0]}-to-${dateRange?.to?.toISOString().split('T')[0]}`
    
    if (format === 'csv') {
      const csvData = [
        ...systemReport.tenantMetrics.map(tenant => ({
          tenant_id: tenant.tenantId,
          tenant_name: tenant.tenantName,
          business_type: tenant.businessType,
          location: tenant.location,
          total_revenue: tenant.sales.totalRevenue,
          total_orders: tenant.sales.totalOrders,
          total_customers: tenant.customers.totalCustomers,
          growth_rate: tenant.sales.growthRate,
          avg_order_value: tenant.sales.averageOrderValue,
          fulfillment_rate: tenant.performance.orderFulfillmentRate
        }))
      ]
      
      advancedFilteringService.exportFilteredData(csvData, filename, 'csv')
    } else {
      advancedFilteringService.exportFilteredData([systemReport], filename, 'json')
    }
  }

  // Generate automated monthly report
  const handleGenerateMonthlyReport = async () => {
    try {
      toast.info('Generating monthly report...')
      const report = await reportingService.scheduleMonthlyReports()
      toast.success('Monthly report generated successfully')
    } catch (error) {
      toast.error('Failed to generate monthly report')
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-IN').format(num)

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />
  }

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Pulss platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                {unreadCount > 0 ? (
                  <BellRinging className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 border-b">
                <h4 className="font-medium">System Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnreadCount(0)}
                    className="mt-2"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={index} className="p-3 border-b hover:bg-muted/50">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  'Pick a date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('csv')}
              disabled={!systemReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMonthlyReport}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Data Banner */}
      <DemoDataBanner onRefreshData={() => {
        setDemoStores(() => DEMO_STORES)
        setDemoOrders(() => DEMO_ORDERS)
        toast.success('Demo data refreshed')
      }} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Funnel className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <Select
                value={filters.businessType || 'all'}
                onValueChange={(value) => handleFilterChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions?.businessTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions?.locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Min Revenue</label>
              <Input
                type="number"
                placeholder="₹0"
                value={filters.minRevenue || ''}
                onChange={(e) => handleFilterChange('minRevenue', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats - Demo Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
                <Storefront className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(demoAnalytics.totalStores)}</div>
                <p className="text-xs text-muted-foreground mt-1">Demo stores available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(demoAnalytics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">From {demoAnalytics.totalOrders} orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(demoAnalytics.totalOrders)}</div>
                <p className="text-xs text-muted-foreground mt-1">{demoAnalytics.activeOrders} active, {demoAnalytics.completedOrders} completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(demoAnalytics.totalProducts)}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all stores</p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Stores List */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Storefront className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{store.name}</h3>
                          <p className="text-sm text-muted-foreground">{store.type} • {store.owner}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{store.products.length} products</p>
                      <p className="text-xs text-muted-foreground">{store.phone}</p>
                    </div>
                    <Badge variant={store.isActive ? "default" : "secondary"}>
                      {store.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Tenants */}
          {systemReport?.topPerformingTenants && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemReport.topPerformingTenants.slice(0, 10).map((tenant, index) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.businessType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(tenant.revenue)}</p>
                        <div className={`flex items-center gap-1 text-sm ${getGrowthColor(tenant.growthRate)}`}>
                          {getGrowthIcon(tenant.growthRate)}
                          <span>{tenant.growthRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          {/* Tenant List with real-time updates */}
          {filteredTenants && (
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredTenants.total} tenants found
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTenants.data.map(tenant => (
                    <div key={tenant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{tenant.name}</h4>
                          <p className="text-sm text-muted-foreground">{tenant.business_type}</p>
                          <p className="text-sm text-muted-foreground">{tenant.location}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                          {tenant.tenant_stats && (
                            <div className="mt-2 text-sm">
                              <p>Revenue: {formatCurrency(tenant.tenant_stats.total_revenue || 0)}</p>
                              <p>Orders: {formatNumber(tenant.tenant_stats.total_orders || 0)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Business Type Analysis */}
          {systemReport?.businessTypeAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Business Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemReport.businessTypeAnalysis.map(bt => (
                    <div key={bt.type} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{bt.type}</p>
                        <p className="text-sm text-muted-foreground">{bt.count} tenants</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(bt.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(bt.averageRevenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Analysis */}
          {systemReport?.locationAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemReport.locationAnalysis.slice(0, 10).map(loc => (
                    <div key={loc.location} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{loc.location}</p>
                        <p className="text-sm text-muted-foreground">
                          {loc.tenantCount} tenants • {formatNumber(loc.customerCount)} customers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(loc.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedAnalytics />
        </TabsContent>

        <TabsContent value="orders">
          <AdvancedOrderManagement />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Reports</CardTitle>
              <p className="text-sm text-muted-foreground">
                Schedule and manage automated reporting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleGenerateMonthlyReport}>
                  <ChartBar className="h-4 w-4 mr-2" />
                  Generate Monthly Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('json')}
                  disabled={!systemReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Full Report (JSON)
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Next Automated Report</h4>
                <p className="text-sm text-muted-foreground">
                  Monthly system report will be generated on the 1st of next month
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Footer variant="admin" />
    </div>
  )
}