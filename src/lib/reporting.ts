import { supabase } from './supabase'

export interface BusinessMetrics {
  tenantId: string
  tenantName: string
  businessType: string
  location: string
  period: {
    start: string
    end: string
  }
  sales: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    growthRate: number
  }
  customers: {
    totalCustomers: number
    newCustomers: number
    returningCustomers: number
    retentionRate: number
  }
  products: {
    totalProducts: number
    topSellingProducts: Array<{
      name: string
      category: string
      unitsSold: number
      revenue: number
    }>
    lowStockItems: Array<{
      name: string
      currentStock: number
      reorderLevel: number
    }>
  }
  performance: {
    orderFulfillmentRate: number
    averageDeliveryTime: number
    customerSatisfactionScore: number
    returnRate: number
  }
}

export interface SystemReport {
  period: {
    start: string
    end: string
  }
  overview: {
    totalTenants: number
    totalCustomers: number
    totalRevenue: number
    totalOrders: number
  }
  tenantMetrics: BusinessMetrics[]
  topPerformingTenants: Array<{
    tenantId: string
    name: string
    businessType: string
    revenue: number
    orders: number
    customers: number
    growthRate: number
  }>
  businessTypeAnalysis: Array<{
    type: string
    count: number
    totalRevenue: number
    averageRevenue: number
    growthRate: number
  }>
  locationAnalysis: Array<{
    location: string
    tenantCount: number
    totalRevenue: number
    customerCount: number
  }>
}

class ReportingService {
  // Generate business metrics for a specific tenant
  async generateBusinessMetrics(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<BusinessMetrics> {
    try {
      // Get tenant information
      const { data: tenant, error: tenantError } = await supabase
        .from('chemist_settings')
        .select(`
          tenants(name, business_type, location),
          *
        `)
        .eq('tenant_id', tenantId)
        .single()

      if (tenantError) throw tenantError

      // Get sales data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (ordersError) throw ordersError

      // Get previous period for growth calculation
      const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime()
      const prevStartDate = new Date(new Date(startDate).getTime() - periodLength).toISOString()
      const prevEndDate = startDate

      const { data: prevOrders, error: prevOrdersError } = await supabase
        .from('orders')
        .select('total')
        .eq('tenant_id', tenantId)
        .gte('created_at', prevStartDate)
        .lte('created_at', prevEndDate)

      if (prevOrdersError) throw prevOrdersError

      // Calculate sales metrics
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total, 0)
      const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

      // Get customer data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)

      if (customersError) throw customersError

      // Get new customers in period
      const { data: newCustomers, error: newCustomersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (newCustomersError) throw newCustomersError

      // Get returning customers (customers with multiple orders)
      const customerOrderCounts = new Map()
      orders.forEach(order => {
        const count = customerOrderCounts.get(order.customer_id) || 0
        customerOrderCounts.set(order.customer_id, count + 1)
      })
      const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length

      // Get product data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)

      if (productsError) throw productsError

      // Get order items for top products analysis
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name, category)
        `)
        .in('order_id', orders.map(o => o.id))

      if (orderItemsError) throw orderItemsError

      // Calculate top selling products
      const productSales = new Map()
      orderItems.forEach(item => {
        const key = item.product_id
        const existing = productSales.get(key) || {
          name: item.products?.name || 'Unknown',
          category: item.products?.category || 'Unknown',
          unitsSold: 0,
          revenue: 0
        }
        existing.unitsSold += item.quantity
        existing.revenue += item.line_total
        productSales.set(key, existing)
      })

      const topSellingProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Get low stock items
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          reorder_level,
          products!inner(name)
        `)
        .eq('tenant_id', tenantId)
        .filter('quantity', 'lt', 'reorder_level')

      const lowStockItems = inventory?.map((item: any) => ({
        name: item.products?.name || 'Unknown',
        currentStock: item.quantity,
        reorderLevel: item.reorder_level || 10
      })) || []

      // Calculate performance metrics
      const deliveredOrders = orders.filter(o => o.status === 'delivered')
      const orderFulfillmentRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0

      // Get returns data
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .in('order_id', orders.map(o => o.id))

      const returnRate = totalOrders > 0 ? ((returns?.length || 0) / totalOrders) * 100 : 0

      return {
        tenantId,
        tenantName: tenant.tenants?.name || 'Unknown',
        businessType: tenant.tenants?.business_type || 'Unknown',
        location: tenant.tenants?.location || 'Unknown',
        period: {
          start: startDate,
          end: endDate
        },
        sales: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          growthRate
        },
        customers: {
          totalCustomers: customers.length,
          newCustomers: newCustomers.length,
          returningCustomers,
          retentionRate: customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0
        },
        products: {
          totalProducts: products.length,
          topSellingProducts,
          lowStockItems
        },
        performance: {
          orderFulfillmentRate,
          averageDeliveryTime: 0, // This would need delivery tracking data
          customerSatisfactionScore: 0, // This would need rating data
          returnRate
        }
      }
    } catch (error) {
      console.error('Error generating business metrics:', error)
      throw error
    }
  }

  // Generate system-wide report for super admin
  async generateSystemReport(
    startDate: string,
    endDate: string,
    filters?: {
      businessType?: string
      location?: string
      minRevenue?: number
    }
  ): Promise<SystemReport> {
    try {
      // Get all tenants
      let query = supabase
        .from('tenants')
        .select('*')

      if (filters?.businessType) {
        query = query.eq('business_type', filters.businessType)
      }
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      const { data: tenants, error: tenantsError } = await query
      if (tenantsError) throw tenantsError

      // Generate metrics for each tenant
      const tenantMetrics: BusinessMetrics[] = []
      for (const tenant of tenants) {
        try {
          const metrics = await this.generateBusinessMetrics(
            tenant.id,
            startDate,
            endDate
          )
          
          if (filters?.minRevenue && metrics.sales.totalRevenue < filters.minRevenue) {
            continue
          }
          
          tenantMetrics.push(metrics)
        } catch (error) {
          console.error(`Error generating metrics for tenant ${tenant.id}:`, error)
        }
      }

      // Calculate overview metrics
      const overview = {
        totalTenants: tenantMetrics.length,
        totalCustomers: tenantMetrics.reduce((sum, m) => sum + m.customers.totalCustomers, 0),
        totalRevenue: tenantMetrics.reduce((sum, m) => sum + m.sales.totalRevenue, 0),
        totalOrders: tenantMetrics.reduce((sum, m) => sum + m.sales.totalOrders, 0)
      }

      // Calculate top performing tenants
      const topPerformingTenants = tenantMetrics
        .map(m => ({
          tenantId: m.tenantId,
          name: m.tenantName,
          businessType: m.businessType,
          revenue: m.sales.totalRevenue,
          orders: m.sales.totalOrders,
          customers: m.customers.totalCustomers,
          growthRate: m.sales.growthRate
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Business type analysis
      const businessTypeMap = new Map()
      tenantMetrics.forEach(m => {
        const existing = businessTypeMap.get(m.businessType) || {
          type: m.businessType,
          count: 0,
          totalRevenue: 0,
          revenues: []
        }
        existing.count++
        existing.totalRevenue += m.sales.totalRevenue
        existing.revenues.push(m.sales.totalRevenue)
        businessTypeMap.set(m.businessType, existing)
      })

      const businessTypeAnalysis = Array.from(businessTypeMap.values())
        .map(bt => ({
          type: bt.type,
          count: bt.count,
          totalRevenue: bt.totalRevenue,
          averageRevenue: bt.totalRevenue / bt.count,
          growthRate: 0 // Would need previous period data
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)

      // Location analysis
      const locationMap = new Map()
      tenantMetrics.forEach(m => {
        const existing = locationMap.get(m.location) || {
          location: m.location,
          tenantCount: 0,
          totalRevenue: 0,
          customerCount: 0
        }
        existing.tenantCount++
        existing.totalRevenue += m.sales.totalRevenue
        existing.customerCount += m.customers.totalCustomers
        locationMap.set(m.location, existing)
      })

      const locationAnalysis = Array.from(locationMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)

      return {
        period: {
          start: startDate,
          end: endDate
        },
        overview,
        tenantMetrics,
        topPerformingTenants,
        businessTypeAnalysis,
        locationAnalysis
      }
    } catch (error) {
      console.error('Error generating system report:', error)
      throw error
    }
  }

  // Export report to CSV
  exportToCSV(data: any[], filename: string): string {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""')
          }
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  // Download CSV file
  downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Schedule automated reports (this would typically run on the server)
  async scheduleMonthlyReports() {
    // This is a client-side simulation - in production, this would be a server-side cron job
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    try {
      const report = await this.generateSystemReport(
        lastMonth.toISOString(),
        endOfLastMonth.toISOString()
      )

      // In production, this would send emails to super admin
      console.log('Monthly report generated:', report)
      
      // Store report in database for later access
      const { error } = await supabase
        .from('automated_reports')
        .insert({
          type: 'monthly_system_report',
          period_start: lastMonth.toISOString(),
          period_end: endOfLastMonth.toISOString(),
          report_data: report,
          generated_at: new Date().toISOString()
        })

      if (error) throw error
      
      return report
    } catch (error) {
      console.error('Error generating monthly report:', error)
      throw error
    }
  }
}

export const reportingService = new ReportingService()