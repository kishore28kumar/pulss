/**
 * Super Admin Analytics Service
 * Provides comprehensive analytics across all tenants with drill-down capabilities
 */

const db = require('../config/db');

class SuperAdminAnalyticsService {
  /**
   * Get chemist-wise (tenant) analytics with drill-down
   */
  async getChemistWiseAnalytics(startDate, endDate, tenantId = null) {
    try {
      const tenantFilter = tenantId ? 'AND t.tenant_id = $3' : '';
      const params = tenantId ? [startDate, endDate, tenantId] : [startDate, endDate];

      const { rows } = await db.query(
        `SELECT 
           t.tenant_id,
           t.name as tenant_name,
           t.business_type,
           t.city,
           t.state,
           t.pincode,
           COUNT(DISTINCT c.customer_id) as customer_count,
           COUNT(DISTINCT o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_revenue,
           COALESCE(AVG(o.total_amount), 0) as avg_order_value,
           COUNT(DISTINCT p.product_id) as product_count,
           COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders,
           COUNT(DISTINCT CASE WHEN o.status = 'processing' THEN o.order_id END) as processing_orders,
           COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as delivered_orders,
           COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.order_id END) as cancelled_orders
         FROM tenants t
         LEFT JOIN customers c ON t.tenant_id = c.tenant_id 
           AND c.created_at >= $1 AND c.created_at <= $2
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id 
           AND o.created_at >= $1 AND o.created_at <= $2
         LEFT JOIN products p ON t.tenant_id = p.tenant_id
         WHERE 1=1 ${tenantFilter}
         GROUP BY t.tenant_id, t.name, t.business_type, t.city, t.state, t.pincode
         ORDER BY total_revenue DESC`,
        params
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Get chemist-wise analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get area-wise analytics (city, pin code, district)
   */
  async getAreaWiseAnalytics(startDate, endDate, groupBy = 'city') {
    try {
      const groupField = {
        city: 't.city',
        pincode: 't.pincode',
        state: 't.state',
        district: 't.district'
      }[groupBy] || 't.city';

      const { rows } = await db.query(
        `SELECT 
           ${groupField} as area,
           t.state,
           COUNT(DISTINCT t.tenant_id) as tenant_count,
           COUNT(DISTINCT o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_revenue,
           COALESCE(AVG(o.total_amount), 0) as avg_order_value,
           COUNT(DISTINCT c.customer_id) as total_customers,
           COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as delivered_orders,
           ROUND(COALESCE(SUM(o.total_amount), 0) * 100.0 / NULLIF(SUM(SUM(o.total_amount)) OVER (), 0), 2) as revenue_percentage
         FROM tenants t
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id 
           AND o.created_at >= $1 AND o.created_at <= $2
         LEFT JOIN customers c ON t.tenant_id = c.tenant_id
           AND c.created_at >= $1 AND c.created_at <= $2
         WHERE ${groupField} IS NOT NULL
         GROUP BY ${groupField}, t.state
         ORDER BY total_revenue DESC`,
        [startDate, endDate]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Get area-wise analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product-wise sales by area
   */
  async getProductSalesByArea(startDate, endDate, area = null, areaType = 'city') {
    try {
      const areaField = {
        city: 't.city',
        pincode: 't.pincode',
        state: 't.state',
        district: 't.district'
      }[areaType] || 't.city';

      const areaFilter = area ? `AND ${areaField} = $3` : '';
      const params = area ? [startDate, endDate, area] : [startDate, endDate];

      const { rows } = await db.query(
        `SELECT 
           p.product_id,
           p.name as product_name,
           p.category,
           ${areaField} as area,
           t.state,
           COUNT(DISTINCT oi.order_id) as order_count,
           SUM(oi.quantity) as total_quantity_sold,
           COALESCE(SUM(oi.line_total), 0) as total_revenue,
           COALESCE(AVG(oi.unit_price), 0) as avg_price,
           COUNT(DISTINCT t.tenant_id) as tenant_count
         FROM products p
         JOIN order_items oi ON p.product_id = oi.product_id
         JOIN orders o ON oi.order_id = o.order_id
         JOIN tenants t ON p.tenant_id = t.tenant_id
         WHERE o.created_at >= $1 AND o.created_at <= $2
           AND o.status != 'cancelled'
           ${areaFilter}
         GROUP BY p.product_id, p.name, p.category, ${areaField}, t.state
         ORDER BY total_revenue DESC`,
        params
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Get product sales by area error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get time-based trends (daily/weekly/monthly/yearly)
   */
  async getTimeTrends(startDate, endDate, groupBy = 'day') {
    try {
      const dateFormat = {
        hour: 'YYYY-MM-DD HH24:00:00',
        day: 'YYYY-MM-DD',
        week: 'IYYY-IW',
        month: 'YYYY-MM',
        year: 'YYYY'
      }[groupBy] || 'YYYY-MM-DD';

      const { rows } = await db.query(
        `SELECT 
           TO_CHAR(o.created_at, $1) as period,
           COUNT(DISTINCT o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_revenue,
           COALESCE(AVG(o.total_amount), 0) as avg_order_value,
           COUNT(DISTINCT o.customer_id) as unique_customers,
           COUNT(DISTINCT o.tenant_id) as active_tenants,
           COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as delivered_orders,
           COUNT(DISTINCT p.product_id) as products_sold
         FROM orders o
         LEFT JOIN order_items oi ON o.order_id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.product_id
         WHERE o.created_at >= $2 AND o.created_at <= $3
         GROUP BY period
         ORDER BY period`,
        [dateFormat, startDate, endDate]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Get time trends error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product performance trends
   */
  async getProductPerformanceTrends(startDate, endDate, productId = null, category = null) {
    try {
      let filters = 'WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status != \'cancelled\'';
      const params = [startDate, endDate];
      
      if (productId) {
        params.push(productId);
        filters += ` AND p.product_id = $${params.length}`;
      }
      
      if (category) {
        params.push(category);
        filters += ` AND p.category = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT 
           p.product_id,
           p.name as product_name,
           p.category,
           TO_CHAR(o.created_at, 'YYYY-MM-DD') as date,
           COUNT(DISTINCT oi.order_id) as orders,
           SUM(oi.quantity) as quantity_sold,
           COALESCE(SUM(oi.line_total), 0) as revenue
         FROM products p
         JOIN order_items oi ON p.product_id = oi.product_id
         JOIN orders o ON oi.order_id = o.order_id
         ${filters}
         GROUP BY p.product_id, p.name, p.category, date
         ORDER BY date, revenue DESC`,
        params
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Get product performance trends error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get smart insights and recommendations
   */
  async getSmartInsights(startDate, endDate) {
    try {
      const insights = [];

      // Top performing tenant
      const { rows: topTenant } = await db.query(
        `SELECT 
           t.name as tenant_name,
           COALESCE(SUM(o.total_amount), 0) as revenue
         FROM tenants t
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id
           AND o.created_at >= $1 AND o.created_at <= $2
           AND o.status != 'cancelled'
         GROUP BY t.tenant_id, t.name
         ORDER BY revenue DESC
         LIMIT 1`,
        [startDate, endDate]
      );

      if (topTenant.length > 0) {
        insights.push({
          type: 'top_performer',
          title: 'Top Performing Store',
          description: `${topTenant[0].tenant_name} generated the highest revenue`,
          value: topTenant[0].revenue,
          trend: 'positive'
        });
      }

      // Bottom performing tenant
      const { rows: bottomTenant } = await db.query(
        `SELECT 
           t.name as tenant_name,
           COALESCE(SUM(o.total_amount), 0) as revenue
         FROM tenants t
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id
           AND o.created_at >= $1 AND o.created_at <= $2
           AND o.status != 'cancelled'
         GROUP BY t.tenant_id, t.name
         HAVING COALESCE(SUM(o.total_amount), 0) > 0
         ORDER BY revenue ASC
         LIMIT 1`,
        [startDate, endDate]
      );

      if (bottomTenant.length > 0) {
        insights.push({
          type: 'needs_attention',
          title: 'Store Needs Attention',
          description: `${bottomTenant[0].tenant_name} has the lowest revenue`,
          value: bottomTenant[0].revenue,
          trend: 'negative'
        });
      }

      // Best selling product
      const { rows: topProduct } = await db.query(
        `SELECT 
           p.name as product_name,
           SUM(oi.quantity) as quantity_sold,
           COALESCE(SUM(oi.line_total), 0) as revenue
         FROM products p
         JOIN order_items oi ON p.product_id = oi.product_id
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.created_at >= $1 AND o.created_at <= $2
           AND o.status != 'cancelled'
         GROUP BY p.product_id, p.name
         ORDER BY quantity_sold DESC
         LIMIT 1`,
        [startDate, endDate]
      );

      if (topProduct.length > 0) {
        insights.push({
          type: 'trending_product',
          title: 'Best Selling Product',
          description: `${topProduct[0].product_name} sold ${topProduct[0].quantity_sold} units`,
          value: topProduct[0].revenue,
          trend: 'positive'
        });
      }

      // Peak sales area
      const { rows: topArea } = await db.query(
        `SELECT 
           t.city as area,
           COALESCE(SUM(o.total_amount), 0) as revenue,
           COUNT(DISTINCT o.order_id) as orders
         FROM tenants t
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id
           AND o.created_at >= $1 AND o.created_at <= $2
           AND o.status != 'cancelled'
         WHERE t.city IS NOT NULL
         GROUP BY t.city
         ORDER BY revenue DESC
         LIMIT 1`,
        [startDate, endDate]
      );

      if (topArea.length > 0) {
        insights.push({
          type: 'peak_area',
          title: 'Peak Sales Area',
          description: `${topArea[0].area} leads with ${topArea[0].orders} orders`,
          value: topArea[0].revenue,
          trend: 'positive'
        });
      }

      // Growth opportunity
      const { rows: lowActivity } = await db.query(
        `SELECT 
           t.city as area,
           COUNT(DISTINCT t.tenant_id) as tenant_count,
           COALESCE(SUM(o.total_amount), 0) as revenue
         FROM tenants t
         LEFT JOIN orders o ON t.tenant_id = o.tenant_id
           AND o.created_at >= $1 AND o.created_at <= $2
         WHERE t.city IS NOT NULL
         GROUP BY t.city
         HAVING COUNT(DISTINCT t.tenant_id) >= 2
         ORDER BY revenue ASC
         LIMIT 1`,
        [startDate, endDate]
      );

      if (lowActivity.length > 0 && lowActivity[0].revenue < 10000) {
        insights.push({
          type: 'opportunity',
          title: 'Growth Opportunity',
          description: `${lowActivity[0].area} has ${lowActivity[0].tenant_count} stores with low activity`,
          value: lowActivity[0].revenue,
          trend: 'neutral'
        });
      }

      return { success: true, insights };
    } catch (error) {
      console.error('Get smart insights error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(startDate, endDate) {
    try {
      const [
        chemistData,
        areaData,
        productData,
        trendData,
        insights
      ] = await Promise.all([
        this.getChemistWiseAnalytics(startDate, endDate),
        this.getAreaWiseAnalytics(startDate, endDate, 'city'),
        this.getProductSalesByArea(startDate, endDate),
        this.getTimeTrends(startDate, endDate, 'day'),
        this.getSmartInsights(startDate, endDate)
      ]);

      // Calculate summary metrics
      const summary = {
        totalTenants: chemistData.data?.length || 0,
        totalOrders: chemistData.data?.reduce((sum, t) => sum + parseInt(t.total_orders), 0) || 0,
        totalRevenue: chemistData.data?.reduce((sum, t) => sum + parseFloat(t.total_revenue), 0) || 0,
        totalCustomers: chemistData.data?.reduce((sum, t) => sum + parseInt(t.customer_count), 0) || 0,
        avgOrderValue: 0
      };

      summary.avgOrderValue = summary.totalOrders > 0 
        ? summary.totalRevenue / summary.totalOrders 
        : 0;

      return {
        success: true,
        data: {
          summary,
          chemists: chemistData.data || [],
          areas: areaData.data || [],
          products: productData.data || [],
          trends: trendData.data || [],
          insights: insights.insights || []
        }
      };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SuperAdminAnalyticsService();
