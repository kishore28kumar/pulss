const { pool } = require('../../backend/config/db')

export interface FilterOptions {
  businessType?: string
  location?: string
  city?: string
  state?: string
  country?: string
  minRevenue?: number
  maxRevenue?: number
  minOrders?: number
  maxOrders?: number
  minCustomers?: number
  maxCustomers?: number
  dateRange?: {
    start: string
    end: string
  }
  status?: 'active' | 'inactive' | 'suspended' | 'trial' | 'all'
  subscription?: {
    plan?: string
    status?: string
    expiryRange?: {
      start: string
      end: string
    }
  }
  features?: string[]
  integrations?: string[]
  tags?: string[]
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface FilterResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  filters: FilterOptions
  sort: SortOptions
}

class AdvancedFilteringService {
  // Filter tenants with advanced options
  async filterTenants(
    filters: FilterOptions = {},
    sort: SortOptions = { field: 'created_at', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<FilterResult<any>> {
    try {
      // Build SQL query
      const whereClauses: string[] = []
      const values: any[] = []
      let idx = 1

      if (filters.businessType) {
        whereClauses.push(`business_type = $${idx++}`)
        values.push(filters.businessType)
      }
      if (filters.location) {
        whereClauses.push(`location ILIKE $${idx++}`)
        values.push(`%${filters.location}%`)
      }
      if (filters.city && filters.city !== 'all') {
        whereClauses.push(`city ILIKE $${idx++}`)
        values.push(`%${filters.city}%`)
      }
      if (filters.state && filters.state !== 'all') {
        whereClauses.push(`state ILIKE $${idx++}`)
        values.push(`%${filters.state}%`)
      }
      if (filters.country && filters.country !== 'all') {
        whereClauses.push(`country ILIKE $${idx++}`)
        values.push(`%${filters.country}%`)
      }
      if (filters.status && filters.status !== 'all') {
        whereClauses.push(`status = $${idx++}`)
        values.push(filters.status)
      }
      if (filters.dateRange) {
        whereClauses.push(`created_at >= $${idx}`)
        values.push(filters.dateRange.start)
        idx++
        whereClauses.push(`created_at <= $${idx}`)
        values.push(filters.dateRange.end)
        idx++
      }
      if (filters.tags && filters.tags.length > 0) {
        // Assuming tags is a comma-separated string column
        filters.tags.forEach(tag => {
          whereClauses.push(`tags ILIKE $${idx}`)
          values.push(`%${tag}%`)
          idx++
        })
      }
      // Revenue filters (requires computed stats)
      if (filters.minRevenue) {
        whereClauses.push(`total_revenue >= $${idx}`)
        values.push(filters.minRevenue)
        idx++
      }
      if (filters.maxRevenue) {
        whereClauses.push(`total_revenue <= $${idx}`)
        values.push(filters.maxRevenue)
        idx++
      }

      // Build WHERE clause
      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

      // Sorting
      const orderSQL = `ORDER BY ${sort.field} ${sort.direction === 'asc' ? 'ASC' : 'DESC'}`

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit
      const limitSQL = `LIMIT $${idx} OFFSET $${idx + 1}`
      values.push(pagination.limit, offset)

      // Main query
      const sql = `SELECT *,
        (SELECT json_agg(cs) FROM chemist_settings cs WHERE cs.tenant_id = tenants.id) AS chemist_settings,
        (SELECT json_agg(ts) FROM tenant_stats ts WHERE ts.tenant_id = tenants.id) AS tenant_stats
        FROM tenants
        ${whereSQL}
        ${orderSQL}
        ${limitSQL}`

      // Count query
      const countSql = `SELECT COUNT(*) FROM tenants ${whereSQL}`

      const client = await pool.connect()
      try {
        const result = await client.query(sql, values)
        const countResult = await client.query(countSql, values.slice(0, idx - 2))
        const total = parseInt(countResult.rows[0].count, 10)
        const totalPages = Math.ceil(total / pagination.limit)
        return {
          data: result.rows,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages,
          filters,
          sort
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error filtering tenants:', error)
      throw error
    }
  }

  // Filter customers with advanced options
  async filterCustomers(
    tenantId: string | null = null,
    filters: FilterOptions = {},
    sort: SortOptions = { field: 'created_at', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<FilterResult<any>> {
    try {
      const whereClauses: string[] = []
      const values: any[] = []
      let idx = 1

      if (tenantId) {
        whereClauses.push(`tenant_id = $${idx++}`)
        values.push(tenantId)
      }
      if (filters.location) {
        whereClauses.push(`address ILIKE $${idx++}`)
        values.push(`%${filters.location}%`)
      }
      if (filters.dateRange) {
        whereClauses.push(`created_at >= $${idx}`)
        values.push(filters.dateRange.start)
        idx++
        whereClauses.push(`created_at <= $${idx}`)
        values.push(filters.dateRange.end)
        idx++
      }
      if (filters.minOrders) {
        whereClauses.push(`total_orders >= $${idx}`)
        values.push(filters.minOrders)
        idx++
      }
      if (filters.maxOrders) {
        whereClauses.push(`total_orders <= $${idx}`)
        values.push(filters.maxOrders)
        idx++
      }
      if (filters.minRevenue) {
        whereClauses.push(`total_spent >= $${idx}`)
        values.push(filters.minRevenue)
        idx++
      }
      if (filters.maxRevenue) {
        whereClauses.push(`total_spent <= $${idx}`)
        values.push(filters.maxRevenue)
        idx++
      }

      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
      const orderSQL = `ORDER BY ${sort.field} ${sort.direction === 'asc' ? 'ASC' : 'DESC'}`
      const offset = (pagination.page - 1) * pagination.limit
      const limitSQL = `LIMIT $${idx} OFFSET $${idx + 1}`
      values.push(pagination.limit, offset)

      const sql = `SELECT *,
        (SELECT json_agg(cs) FROM customer_stats cs WHERE cs.customer_id = customers.id) AS customer_stats,
        (SELECT json_agg(t) FROM tenants t WHERE t.id = customers.tenant_id) AS tenant_info
        FROM customers
        ${whereSQL}
        ${orderSQL}
        ${limitSQL}`

      const countSql = `SELECT COUNT(*) FROM customers ${whereSQL}`

      const client = await pool.connect()
      try {
        const result = await client.query(sql, values)
        const countResult = await client.query(countSql, values.slice(0, idx - 2))
        const total = parseInt(countResult.rows[0].count, 10)
        const totalPages = Math.ceil(total / pagination.limit)
        return {
          data: result.rows,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages,
          filters,
          sort
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error filtering customers:', error)
      throw error
    }
  }

  // Filter orders with advanced options
  async filterOrders(
    tenantId: string | null = null,
    filters: FilterOptions & {
      status?: string
      paymentMethod?: string
      deliveryType?: string
      hasRx?: boolean
      hasCoupon?: boolean
    } = {},
    sort: SortOptions = { field: 'created_at', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<FilterResult<any>> {
    try {
      const whereClauses: string[] = []
      const values: any[] = []
      let idx = 1

      if (tenantId) {
        whereClauses.push(`tenant_id = $${idx++}`)
        values.push(tenantId)
      }
      if (filters.status && filters.status !== 'all') {
        whereClauses.push(`status = $${idx++}`)
        values.push(filters.status)
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        whereClauses.push(`payment_method = $${idx++}`)
        values.push(filters.paymentMethod)
      }
      if (filters.dateRange) {
        whereClauses.push(`created_at >= $${idx}`)
        values.push(filters.dateRange.start)
        idx++
        whereClauses.push(`created_at <= $${idx}`)
        values.push(filters.dateRange.end)
        idx++
      }
      if (filters.minRevenue) {
        whereClauses.push(`total >= $${idx}`)
        values.push(filters.minRevenue)
        idx++
      }
      if (filters.maxRevenue) {
        whereClauses.push(`total <= $${idx}`)
        values.push(filters.maxRevenue)
        idx++
      }
      if (filters.hasRx !== undefined) {
        whereClauses.push(`requires_prescription = $${idx++}`)
        values.push(filters.hasRx)
      }
      if (filters.hasCoupon !== undefined) {
        if (filters.hasCoupon) {
          whereClauses.push(`coupon_code IS NOT NULL`)
        } else {
          whereClauses.push(`coupon_code IS NULL`)
        }
      }

      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
      const orderSQL = `ORDER BY ${sort.field} ${sort.direction === 'asc' ? 'ASC' : 'DESC'}`
      const offset = (pagination.page - 1) * pagination.limit
      const limitSQL = `LIMIT $${idx} OFFSET $${idx + 1}`
      values.push(pagination.limit, offset)

      const sql = `SELECT *,
        (SELECT json_agg(c) FROM customers c WHERE c.id = orders.customer_id) AS customer_info,
        (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = orders.id) AS order_items
        FROM orders
        ${whereSQL}
        ${orderSQL}
        ${limitSQL}`

      const countSql = `SELECT COUNT(*) FROM orders ${whereSQL}`

      const client = await pool.connect()
      try {
        const result = await client.query(sql, values)
        const countResult = await client.query(countSql, values.slice(0, idx - 2))
        const total = parseInt(countResult.rows[0].count, 10)
        const totalPages = Math.ceil(total / pagination.limit)
        return {
          data: result.rows,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages,
          filters,
          sort
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error filtering orders:', error)
      throw error
    }
  }

  // Get filter options for dropdowns
  async getFilterOptions(tenantId?: string): Promise<{
    businessTypes: string[]
    locations: string[]
    cities: string[]
    states: string[]
    countries: string[]
    statuses: string[]
    paymentMethods: string[]
    categories: string[]
    features: string[]
  }> {
    try {
      const client = await pool.connect()
      try {
        const businessTypesRes = await client.query('SELECT DISTINCT business_type FROM tenants WHERE business_type IS NOT NULL')
        const locationsRes = await client.query('SELECT DISTINCT location FROM tenants WHERE location IS NOT NULL')
        const citiesRes = await client.query('SELECT DISTINCT city FROM chemist_settings WHERE city IS NOT NULL')
        const statesRes = await client.query('SELECT DISTINCT state FROM chemist_settings WHERE state IS NOT NULL')
        const countriesRes = await client.query('SELECT DISTINCT country FROM chemist_settings WHERE country IS NOT NULL')
        const paymentMethodsRes = await client.query('SELECT DISTINCT payment_method FROM orders WHERE payment_method IS NOT NULL')
        const categoriesRes = await client.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL')

        const businessTypes = businessTypesRes.rows.map(row => String(row.business_type)).filter(Boolean)
        const locations = locationsRes.rows.map(row => String(row.location)).filter(Boolean)
        const cities = citiesRes.rows.map(row => String(row.city)).filter(Boolean)
        const states = statesRes.rows.map(row => String(row.state)).filter(Boolean)
        const countries = countriesRes.rows.map(row => String(row.country)).filter(Boolean)
        const paymentMethods = paymentMethodsRes.rows.map(row => String(row.payment_method)).filter(Boolean)
        const categories = categoriesRes.rows.map(row => String(row.category)).filter(Boolean)

        return {
          businessTypes,
          locations,
          cities,
          states,
          countries,
          statuses: ['active', 'inactive', 'suspended', 'trial'],
          paymentMethods,
          categories,
          features: [
            'wallet_enabled',
            'loyalty_enabled',
            'prescription_required',
            'multi_warehouse',
            'tracking_enabled',
            'whatsapp_notifications',
            'push_notifications'
          ]
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error getting filter options:', error)
      return {
        businessTypes: [],
        locations: [],
        cities: [],
        states: [],
        countries: [],
        statuses: [],
        paymentMethods: [],
        categories: [],
        features: []
      }
    }
  }

  // Create saved filter
  // TODO: Implement using PostgreSQL if needed
  async saveFilter(
    userId: string,
    name: string,
    filterType: 'tenants' | 'customers' | 'orders',
    filters: FilterOptions,
    sort: SortOptions
  ) {
    // Not implemented for Node.js/pg yet
    return null
  }

  // Get saved filters for user
  // TODO: Implement using PostgreSQL if needed
  async getSavedFilters(
    userId: string,
    filterType?: 'tenants' | 'customers' | 'orders'
  ) {
    // Not implemented for Node.js/pg yet
    return []
  }

  // Export filtered data
  exportFilteredData(
    data: any[],
    filename: string,
    format: 'csv' | 'json' = 'csv'
  ): void {
    if (!data.length) return

    if (format === 'csv') {
      const csvContent = this.convertToCSV(data)
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv')
    } else {
      const jsonContent = JSON.stringify(data, null, 2)
      this.downloadFile(jsonContent, `${filename}.json`, 'application/json')
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return ''

    // Flatten nested objects
    const flattenedData = data.map(item => this.flattenObject(item))
    
    const headers = Object.keys(flattenedData[0])
    const csvRows = [
      headers.join(','),
      ...flattenedData.map(row =>
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ]

    return csvRows.join('\n')
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey))
        } else if (Array.isArray(obj[key])) {
          flattened[newKey] = obj[key].join('; ')
        } else {
          flattened[newKey] = obj[key]
        }
      }
    }

    return flattened
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}

export const advancedFilteringService = new AdvancedFilteringService()