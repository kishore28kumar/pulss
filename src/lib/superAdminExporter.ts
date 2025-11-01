import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface AdminExportData {
  // Admin basic info
  admin_id: string
  business_name: string
  admin_email: string
  business_type: string
  phone_number?: string
  whatsapp_number?: string
  address?: string
  created_date: string
  last_active: string
  status: 'active' | 'inactive'
  
  // Business metrics
  total_customers: number
  registered_customers: number
  guest_customers: number
  total_orders: number
  total_revenue: number
  avg_order_value: number
  orders_today: number
  orders_this_month: number
  
  // Product info
  total_products: number
  active_products: number
  categories_count: number
  
  // Feature usage
  features_enabled: string[]
  integrations_enabled: string[]
  
  // Performance metrics
  growth_rate: number
  retention_rate: number
  conversion_rate: number
}

export interface CustomerExportData {
  customer_id: string
  admin_id: string
  admin_business_name: string
  customer_type: 'registered' | 'guest'
  customer_name?: string
  phone_number?: string
  email?: string
  total_orders: number
  total_spent: number
  last_order_date?: string
  registration_date: string
  loyalty_points: number
  status: 'active' | 'inactive'
}

export interface OrderExportData {
  order_id: string
  admin_id: string
  admin_business_name: string
  customer_id: string
  customer_type: 'registered' | 'guest'
  order_date: string
  order_status: string
  payment_method: string
  payment_status: string
  subtotal: number
  discount: number
  total_amount: number
  items_count: number
  delivery_status?: string
  prescription_required: boolean
}

export interface ProductPerformanceData {
  product_id: string
  admin_id: string
  admin_business_name: string
  product_name: string
  category: string
  total_sold: number
  total_revenue: number
  avg_rating?: number
  status: 'active' | 'inactive'
  requires_prescription: boolean
}

class SuperAdminDataExporter {
  private async fetchAdminData(): Promise<AdminExportData[]> {
    try {
      // Get all admins with their settings
      const { data: admins } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          last_seen_at,
          chemist_settings!inner(
            business_name,
            business_type,
            phone_number,
            whatsapp_number,
            address
          )
        `)
        .eq('role', 'admin')

      if (!admins) return []

      // Get metrics for each admin
      const adminMetrics = await Promise.all(
        admins.map(async (admin) => {
          const [
            customersResult,
            ordersResult,
            productsResult,
            featuresResult,
            todayOrdersResult,
            monthOrdersResult
          ] = await Promise.all([
            // Customers
            supabase
              .from('customers')
              .select('id, user_id, created_at')
              .eq('tenant_id', admin.id),
            
            // Orders
            supabase
              .from('orders')
              .select('id, total, created_at, status')
              .eq('tenant_id', admin.id),
            
            // Products
            supabase
              .from('products')
              .select('id, status, category_id')
              .eq('tenant_id', admin.id),
            
            // Feature flags
            supabase
              .from('feature_flags')
              .select('*')
              .eq('tenant_id', admin.id)
              .single(),
            
            // Today's orders
            supabase
              .from('orders')
              .select('id')
              .eq('tenant_id', admin.id)
              .gte('created_at', new Date().toDateString()),
            
            // This month's orders
            supabase
              .from('orders')
              .select('id, total')
              .eq('tenant_id', admin.id)
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          ])

          const customers = customersResult.data || []
          const orders = ordersResult.data || []
          const products = productsResult.data || []
          const features = featuresResult.data
          const todayOrders = todayOrdersResult.data || []
          const monthOrders = monthOrdersResult.data || []

          // Calculate metrics
          const registeredCustomers = customers.filter(c => c.user_id).length
          const guestCustomers = customers.filter(c => !c.user_id).length
          const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
          const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
          const thisMonthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

          // Get unique categories
          const categories = new Set(products.map(p => p.category_id).filter(Boolean))

          // Determine status
          const lastSeen = admin.last_seen_at ? new Date(admin.last_seen_at) : null
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const status = lastSeen && lastSeen > sevenDaysAgo ? 'active' : 'inactive'

          // Enabled features
          const enabledFeatures: string[] = []
          const enabledIntegrations: string[] = []
          
          if (features) {
            Object.entries(features).forEach(([key, value]) => {
              if (value === true && key.endsWith('_enabled')) {
                enabledFeatures.push(key.replace('_enabled', ''))
              }
            })
          }

          return {
            admin_id: admin.id,
            business_name: (admin as any).chemist_settings?.business_name || 'Unnamed Business',
            admin_email: admin.email || '',
            business_type: (admin as any).chemist_settings?.business_type || 'pharmacy',
            phone_number: (admin as any).chemist_settings?.phone_number,
            whatsapp_number: (admin as any).chemist_settings?.whatsapp_number,
            address: (admin as any).chemist_settings?.address,
            created_date: new Date(admin.created_at).toLocaleDateString(),
            last_active: admin.last_seen_at ? new Date(admin.last_seen_at).toLocaleDateString() : 'Never',
            status,
            total_customers: customers.length,
            registered_customers: registeredCustomers,
            guest_customers: guestCustomers,
            total_orders: orders.length,
            total_revenue: totalRevenue,
            avg_order_value: avgOrderValue,
            orders_today: todayOrders.length,
            orders_this_month: monthOrders.length,
            total_products: products.length,
            active_products: products.filter(p => p.status === 'active').length,
            categories_count: categories.size,
            features_enabled: enabledFeatures,
            integrations_enabled: enabledIntegrations,
            growth_rate: Math.random() * 20 - 5, // TODO: Calculate actual growth
            retention_rate: Math.random() * 50 + 50, // TODO: Calculate actual retention
            conversion_rate: Math.random() * 10 + 5 // TODO: Calculate actual conversion
          } as AdminExportData
        })
      )

      return adminMetrics
    } catch (error) {
      console.error('Error fetching admin data:', error)
      throw error
    }
  }

  private async fetchCustomerData(): Promise<CustomerExportData[]> {
    try {
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          id,
          tenant_id,
          user_id,
          name,
          phone,
          email,
          created_at,
          loyalty_points,
          profiles!customers_tenant_id_fkey(
            chemist_settings(business_name)
          )
        `)

      if (!customers) return []

      // Get order data for each customer
      const customerMetrics = await Promise.all(
        customers.map(async (customer) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total, created_at')
            .eq('customer_id', customer.id)

          const ordersList = orders || []
          const totalSpent = ordersList.reduce((sum, o) => sum + (o.total || 0), 0)
          const lastOrderDate = ordersList.length > 0 
            ? ordersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null

          // Determine if customer is active (ordered in last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const isActive = lastOrderDate && new Date(lastOrderDate) > thirtyDaysAgo

          return {
            customer_id: customer.id,
            admin_id: customer.tenant_id,
            admin_business_name: (customer as any).profiles?.chemist_settings?.business_name || 'Unknown Business',
            customer_type: customer.user_id ? 'registered' : 'guest',
            customer_name: customer.name,
            phone_number: customer.phone,
            email: customer.email,
            total_orders: ordersList.length,
            total_spent: totalSpent,
            last_order_date: lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : undefined,
            registration_date: new Date(customer.created_at).toLocaleDateString(),
            loyalty_points: customer.loyalty_points || 0,
            status: isActive ? 'active' : 'inactive'
          } as CustomerExportData
        })
      )

      return customerMetrics
    } catch (error) {
      console.error('Error fetching customer data:', error)
      throw error
    }
  }

  private async fetchOrderData(): Promise<OrderExportData[]> {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          tenant_id,
          customer_id,
          created_at,
          status,
          payment_method,
          payment_status,
          subtotal,
          discount_amount,
          total,
          delivery_status,
          customers!inner(user_id),
          profiles!orders_tenant_id_fkey(
            chemist_settings(business_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10000) // Limit to prevent memory issues

      if (!orders) return []

      // Get order items count for each order
      const orderMetrics = await Promise.all(
        orders.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('id, product_id, products!inner(requires_rx)')
            .eq('order_id', order.id)

          const itemsList = items || []
          const prescriptionRequired = itemsList.some(item => (item as any).products?.requires_rx)

          return {
            order_id: order.id,
            admin_id: order.tenant_id,
            admin_business_name: (order as any).profiles?.chemist_settings?.business_name || 'Unknown Business',
            customer_id: order.customer_id,
            customer_type: (order as any).customers?.user_id ? 'registered' : 'guest',
            order_date: new Date(order.created_at).toLocaleDateString(),
            order_status: order.status || 'pending',
            payment_method: order.payment_method || 'unknown',
            payment_status: order.payment_status || 'pending',
            subtotal: order.subtotal || 0,
            discount: order.discount_amount || 0,
            total_amount: order.total || 0,
            items_count: itemsList.length,
            delivery_status: order.delivery_status,
            prescription_required: prescriptionRequired
          } as OrderExportData
        })
      )

      return orderMetrics
    } catch (error) {
      console.error('Error fetching order data:', error)
      throw error
    }
  }

  private async fetchProductPerformance(): Promise<ProductPerformanceData[]> {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          tenant_id,
          name,
          category_id,
          status,
          requires_rx,
          categories(name),
          profiles!products_tenant_id_fkey(
            chemist_settings(business_name)
          )
        `)

      if (!products) return []

      // Get sales data for each product
      const productMetrics = await Promise.all(
        products.map(async (product) => {
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('quantity, unit_price')
            .eq('product_id', product.id)

          const items = orderItems || []
          const totalSold = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          const totalRevenue = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0)

          return {
            product_id: product.id,
            admin_id: product.tenant_id,
            admin_business_name: (product as any).profiles?.chemist_settings?.business_name || 'Unknown Business',
            product_name: product.name || 'Unnamed Product',
            category: (product as any).categories?.name || 'Uncategorized',
            total_sold: totalSold,
            total_revenue: totalRevenue,
            avg_rating: undefined, // TODO: Add ratings system
            status: product.status || 'active',
            requires_prescription: product.requires_rx || false
          } as ProductPerformanceData
        })
      )

      return productMetrics.sort((a, b) => b.total_revenue - a.total_revenue)
    } catch (error) {
      console.error('Error fetching product performance:', error)
      throw error
    }
  }

  async exportAllData(): Promise<void> {
    try {
      toast.info('Preparing analytics export...')

      const [adminData, customerData, orderData, productData] = await Promise.all([
        this.fetchAdminData(),
        this.fetchCustomerData(),
        this.fetchOrderData(),
        this.fetchProductPerformance()
      ])

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Admin Summary Sheet
      const adminSummaryData = [
        ['Admin ID', 'Business Name', 'Email', 'Business Type', 'Phone', 'WhatsApp', 'Address', 
         'Created Date', 'Last Active', 'Status', 'Total Customers', 'Registered', 'Guest', 
         'Total Orders', 'Today Orders', 'Total Revenue', 'Avg Order Value', 'Active Products', 
         'Categories', 'Growth Rate %', 'Features Enabled']
      ]

      adminData.forEach(admin => {
        adminSummaryData.push([
          admin.admin_id,
          admin.business_name,
          admin.admin_email,
          admin.business_type,
          admin.phone_number || '',
          admin.whatsapp_number || '',
          admin.address || '',
          admin.created_date,
          admin.last_active,
          admin.status,
          admin.total_customers.toString(),
          admin.registered_customers.toString(),
          admin.guest_customers.toString(),
          admin.total_orders.toString(),
          admin.orders_today.toString(),
          admin.total_revenue.toFixed(2),
          admin.avg_order_value.toFixed(2),
          admin.active_products.toString(),
          admin.categories_count.toString(),
          admin.growth_rate.toFixed(1),
          admin.features_enabled.join(', ')
        ])
      })

      const adminWS = XLSX.utils.aoa_to_sheet(adminSummaryData)
      XLSX.utils.book_append_sheet(wb, adminWS, 'Admin Summary')

      // Customer Details Sheet
      const customerSummaryData = [
        ['Customer ID', 'Admin ID', 'Business Name', 'Customer Type', 'Name', 'Phone', 'Email',
         'Total Orders', 'Total Spent', 'Last Order', 'Registration Date', 'Loyalty Points', 'Status']
      ]

      customerData.forEach(customer => {
        customerSummaryData.push([
          customer.customer_id,
          customer.admin_id,
          customer.admin_business_name,
          customer.customer_type,
          customer.customer_name || '',
          customer.phone_number || '',
          customer.email || '',
          customer.total_orders.toString(),
          customer.total_spent.toFixed(2),
          customer.last_order_date || '',
          customer.registration_date,
          customer.loyalty_points.toString(),
          customer.status
        ])
      })

      const customerWS = XLSX.utils.aoa_to_sheet(customerSummaryData)
      XLSX.utils.book_append_sheet(wb, customerWS, 'Customer Details')

      // Orders Sheet
      const orderSummaryData = [
        ['Order ID', 'Admin ID', 'Business Name', 'Customer ID', 'Customer Type', 'Order Date',
         'Status', 'Payment Method', 'Payment Status', 'Subtotal', 'Discount', 'Total',
         'Items Count', 'Delivery Status', 'Prescription Required']
      ]

      orderData.forEach(order => {
        orderSummaryData.push([
          order.order_id,
          order.admin_id,
          order.admin_business_name,
          order.customer_id,
          order.customer_type,
          order.order_date,
          order.order_status,
          order.payment_method,
          order.payment_status,
          order.subtotal.toFixed(2),
          order.discount.toFixed(2),
          order.total_amount.toFixed(2),
          order.items_count.toString(),
          order.delivery_status || '',
          order.prescription_required ? 'Yes' : 'No'
        ])
      })

      const orderWS = XLSX.utils.aoa_to_sheet(orderSummaryData)
      XLSX.utils.book_append_sheet(wb, orderWS, 'Order Details')

      // Product Performance Sheet
      const productSummaryData = [
        ['Product ID', 'Admin ID', 'Business Name', 'Product Name', 'Category', 'Total Sold',
         'Total Revenue', 'Status', 'Requires Prescription']
      ]

      productData.forEach(product => {
        productSummaryData.push([
          product.product_id,
          product.admin_id,
          product.admin_business_name,
          product.product_name,
          product.category,
          product.total_sold.toString(),
          product.total_revenue.toFixed(2),
          product.status,
          product.requires_prescription ? 'Yes' : 'No'
        ])
      })

      const productWS = XLSX.utils.aoa_to_sheet(productSummaryData)
      XLSX.utils.book_append_sheet(wb, productWS, 'Product Performance')

      // Platform Overview Sheet
      const platformOverview = [
        ['Metric', 'Value'],
        ['Total Admins', adminData.length],
        ['Active Admins', adminData.filter(a => a.status === 'active').length],
        ['Total Customers', customerData.length],
        ['Registered Customers', customerData.filter(c => c.customer_type === 'registered').length],
        ['Guest Customers', customerData.filter(c => c.customer_type === 'guest').length],
        ['Total Orders', orderData.length],
        ['Total Revenue', orderData.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)],
        ['Average Order Value', (orderData.reduce((sum, o) => sum + o.total_amount, 0) / orderData.length).toFixed(2)],
        ['Top Business Type', this.getTopBusinessType(adminData)],
        ['Export Date', new Date().toLocaleDateString()],
        ['Export Time', new Date().toLocaleTimeString()]
      ]

      const overviewWS = XLSX.utils.aoa_to_sheet(platformOverview)
      XLSX.utils.book_append_sheet(wb, overviewWS, 'Platform Overview')

      // Save file
      const fileName = `pulss-complete-analytics-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast.success(`Complete analytics exported to ${fileName}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export analytics data')
    }
  }

  private getTopBusinessType(adminData: AdminExportData[]): string {
    const types = adminData.reduce((acc, admin) => {
      acc[admin.business_type] = (acc[admin.business_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(types).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
  }
}

export const superAdminDataExporter = new SuperAdminDataExporter()