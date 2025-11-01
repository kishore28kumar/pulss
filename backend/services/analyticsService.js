/**
 * Analytics Service
 * Provides business intelligence, cohort analysis, segmentation, and trends
 */

const db = require('../config/db');

class AnalyticsService {
  /**
   * Get sales trends over time
   */
  async getSalesTrends(tenantId, startDate, endDate, groupBy = 'day') {
    try {
      const dateFormat = {
        hour: 'YYYY-MM-DD HH24:00:00',
        day: 'YYYY-MM-DD',
        week: 'IYYY-IW',
        month: 'YYYY-MM',
        year: 'YYYY',
      }[groupBy] || 'YYYY-MM-DD';

      const { rows } = await db.query(
        `SELECT 
           TO_CHAR(created_at, $1) as period,
           COUNT(*) as order_count,
           SUM(total_amount) as total_revenue,
           AVG(total_amount) as avg_order_value,
           COUNT(DISTINCT customer_id) as unique_customers
         FROM orders
         WHERE tenant_id = $2
           AND created_at >= $3
           AND created_at <= $4
           AND status != 'cancelled'
         GROUP BY period
         ORDER BY period`,
        [dateFormat, tenantId, startDate, endDate]
      );

      return { success: true, trends: rows };
    } catch (error) {
      console.error('Get sales trends error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cohort analysis (customer retention by signup date)
   */
  async getCohortAnalysis(tenantId, startDate, endDate) {
    try {
      const { rows } = await db.query(
        `WITH cohorts AS (
           SELECT 
             customer_id,
             TO_CHAR(created_at, 'YYYY-MM') as cohort_month,
             created_at as signup_date
           FROM customers
           WHERE tenant_id = $1
             AND created_at >= $2
             AND created_at <= $3
         ),
         orders_by_month AS (
           SELECT 
             customer_id,
             TO_CHAR(created_at, 'YYYY-MM') as order_month,
             COUNT(*) as order_count,
             SUM(total_amount) as revenue
           FROM orders
           WHERE tenant_id = $1
             AND status != 'cancelled'
           GROUP BY customer_id, order_month
         )
         SELECT 
           c.cohort_month,
           COUNT(DISTINCT c.customer_id) as cohort_size,
           o.order_month,
           COUNT(DISTINCT o.customer_id) as active_customers,
           SUM(o.order_count) as total_orders,
           SUM(o.revenue) as total_revenue,
           ROUND(COUNT(DISTINCT o.customer_id)::numeric / COUNT(DISTINCT c.customer_id) * 100, 2) as retention_rate
         FROM cohorts c
         LEFT JOIN orders_by_month o ON c.customer_id = o.customer_id
         GROUP BY c.cohort_month, o.order_month
         ORDER BY c.cohort_month, o.order_month`,
        [tenantId, startDate, endDate]
      );

      return { success: true, cohorts: rows };
    } catch (error) {
      console.error('Get cohort analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer segmentation
   */
  async getCustomerSegmentation(tenantId) {
    try {
      const { rows } = await db.query(
        `WITH customer_metrics AS (
           SELECT 
             c.customer_id,
             c.name,
             c.email,
             c.phone,
             c.loyalty_points,
             c.created_at,
             COUNT(o.order_id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent,
             COALESCE(AVG(o.total_amount), 0) as avg_order_value,
             MAX(o.created_at) as last_order_date,
             EXTRACT(EPOCH FROM (NOW() - MAX(o.created_at))) / 86400 as days_since_last_order
           FROM customers c
           LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'cancelled'
           WHERE c.tenant_id = $1
           GROUP BY c.customer_id, c.name, c.email, c.phone, c.loyalty_points, c.created_at
         )
         SELECT 
           customer_id,
           name,
           email,
           phone,
           loyalty_points,
           total_orders,
           total_spent,
           avg_order_value,
           last_order_date,
           days_since_last_order,
           CASE
             WHEN total_orders = 0 THEN 'New'
             WHEN total_spent > 5000 AND days_since_last_order < 30 THEN 'VIP'
             WHEN total_spent > 2000 AND days_since_last_order < 60 THEN 'Loyal'
             WHEN days_since_last_order > 90 THEN 'At Risk'
             WHEN days_since_last_order > 180 THEN 'Churned'
             ELSE 'Regular'
           END as segment,
           CASE
             WHEN total_orders >= 10 THEN 'High'
             WHEN total_orders >= 5 THEN 'Medium'
             ELSE 'Low'
           END as frequency_tier,
           CASE
             WHEN total_spent >= 5000 THEN 'High'
             WHEN total_spent >= 2000 THEN 'Medium'
             ELSE 'Low'
           END as value_tier
         FROM customer_metrics
         ORDER BY total_spent DESC`,
        [tenantId]
      );

      // Group by segment
      const segments = rows.reduce((acc, customer) => {
        const segment = customer.segment;
        if (!acc[segment]) {
          acc[segment] = [];
        }
        acc[segment].push(customer);
        return acc;
      }, {});

      return { success: true, segments, customers: rows };
    } catch (error) {
      console.error('Get customer segmentation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product performance analytics
   */
  async getProductPerformance(tenantId, startDate, endDate) {
    try {
      const { rows } = await db.query(
        `SELECT 
           p.product_id,
           p.name,
           p.category,
           p.brand,
           p.price,
           COUNT(oi.order_item_id) as times_ordered,
           SUM(oi.quantity) as total_quantity_sold,
           SUM(oi.subtotal) as total_revenue,
           AVG(oi.quantity) as avg_quantity_per_order,
           COUNT(DISTINCT o.customer_id) as unique_customers
         FROM products p
         LEFT JOIN order_items oi ON p.product_id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.order_id
         WHERE p.tenant_id = $1
           AND (o.created_at >= $2 OR o.created_at IS NULL)
           AND (o.created_at <= $3 OR o.created_at IS NULL)
           AND (o.status != 'cancelled' OR o.status IS NULL)
         GROUP BY p.product_id, p.name, p.category, p.brand, p.price
         ORDER BY total_revenue DESC NULLS LAST`,
        [tenantId, startDate, endDate]
      );

      return { success: true, products: rows };
    } catch (error) {
      console.error('Get product performance error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get category performance analytics
   */
  async getCategoryPerformance(tenantId, startDate, endDate) {
    try {
      const { rows } = await db.query(
        `SELECT 
           p.category,
           COUNT(DISTINCT p.product_id) as product_count,
           COUNT(oi.order_item_id) as times_ordered,
           SUM(oi.quantity) as total_quantity_sold,
           SUM(oi.subtotal) as total_revenue,
           AVG(oi.subtotal) as avg_revenue_per_order
         FROM products p
         LEFT JOIN order_items oi ON p.product_id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.order_id
         WHERE p.tenant_id = $1
           AND (o.created_at >= $2 OR o.created_at IS NULL)
           AND (o.created_at <= $3 OR o.created_at IS NULL)
           AND (o.status != 'cancelled' OR o.status IS NULL)
         GROUP BY p.category
         ORDER BY total_revenue DESC NULLS LAST`,
        [tenantId, startDate, endDate]
      );

      return { success: true, categories: rows };
    } catch (error) {
      console.error('Get category performance error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(tenantId, startDate, endDate) {
    try {
      // Get all metrics in parallel
      const [salesTrends, cohortAnalysis, segmentation, productPerformance, categoryPerformance] = 
        await Promise.all([
          this.getSalesTrends(tenantId, startDate, endDate, 'day'),
          this.getCohortAnalysis(tenantId, startDate, endDate),
          this.getCustomerSegmentation(tenantId),
          this.getProductPerformance(tenantId, startDate, endDate),
          this.getCategoryPerformance(tenantId, startDate, endDate),
        ]);

      // Calculate summary metrics
      const { rows: summaryRows } = await db.query(
        `SELECT 
           COUNT(DISTINCT o.order_id) as total_orders,
           COUNT(DISTINCT o.customer_id) as total_customers,
           COALESCE(SUM(o.total_amount), 0) as total_revenue,
           COALESCE(AVG(o.total_amount), 0) as avg_order_value,
           COUNT(DISTINCT CASE WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN o.customer_id END) as active_customers_7d,
           COUNT(DISTINCT CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.customer_id END) as active_customers_30d
         FROM orders o
         WHERE o.tenant_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3
           AND o.status != 'cancelled'`,
        [tenantId, startDate, endDate]
      );

      return {
        success: true,
        summary: summaryRows[0],
        salesTrends: salesTrends.trends || [],
        cohortAnalysis: cohortAnalysis.cohorts || [],
        customerSegmentation: segmentation.segments || {},
        productPerformance: productPerformance.products || [],
        categoryPerformance: categoryPerformance.categories || [],
      };
    } catch (error) {
      console.error('Get dashboard metrics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get churn prediction data
   */
  async getChurnPrediction(tenantId) {
    try {
      const { rows } = await db.query(
        `WITH customer_activity AS (
           SELECT 
             c.customer_id,
             c.name,
             c.email,
             COUNT(o.order_id) as total_orders,
             MAX(o.created_at) as last_order_date,
             EXTRACT(EPOCH FROM (NOW() - MAX(o.created_at))) / 86400 as days_since_last_order,
             AVG(EXTRACT(EPOCH FROM (o.created_at - LAG(o.created_at) OVER (PARTITION BY c.customer_id ORDER BY o.created_at))) / 86400) as avg_days_between_orders
           FROM customers c
           LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'cancelled'
           WHERE c.tenant_id = $1
           GROUP BY c.customer_id, c.name, c.email
         )
         SELECT 
           customer_id,
           name,
           email,
           total_orders,
           last_order_date,
           days_since_last_order,
           avg_days_between_orders,
           CASE
             WHEN days_since_last_order > avg_days_between_orders * 2 THEN 'High Risk'
             WHEN days_since_last_order > avg_days_between_orders * 1.5 THEN 'Medium Risk'
             ELSE 'Low Risk'
           END as churn_risk
         FROM customer_activity
         WHERE total_orders > 0
         ORDER BY days_since_last_order DESC`,
        [tenantId]
      );

      return { success: true, predictions: rows };
    } catch (error) {
      console.error('Get churn prediction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get admin dashboard data - comprehensive business summary
   */
  async getAdminDashboard(tenantId, startDate, endDate) {
    try {
      // Get store information
      const storeInfoQuery = await db.query(
        `SELECT 
           t.name,
           s.phone as contact_number,
           t.business_type,
           s.address,
           s.city,
           s.state
         FROM tenants t
         LEFT JOIN store_settings s ON t.tenant_id = s.tenant_id
         WHERE t.tenant_id = $1`,
        [tenantId]
      );

      // Get summary metrics
      const summaryQuery = await db.query(
        `SELECT 
           COUNT(DISTINCT o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_revenue,
           COUNT(DISTINCT c.customer_id) as total_customers
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id 
           AND o.created_at >= $2 
           AND o.created_at <= $3
           AND o.status != 'cancelled'
         WHERE c.tenant_id = $1`,
        [tenantId, startDate, endDate]
      );

      // Get recent activity (last 10 orders)
      const recentActivityQuery = await db.query(
        `SELECT 
           o.order_id as id,
           'order' as type,
           'Order #' || SUBSTRING(o.order_id::text, 1, 8) || ' - ' || o.status || ' - ₹' || o.total_amount as description,
           o.created_at as timestamp,
           jsonb_build_object(
             'order_id', o.order_id,
             'customer_name', c.name,
             'status', o.status,
             'amount', o.total_amount
           ) as metadata
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.tenant_id = $1
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [tenantId]
      );

      // Get top 5 selling products
      const topProductsQuery = await db.query(
        `SELECT 
           p.product_id,
           p.name,
           p.category,
           COUNT(oi.order_item_id) as times_ordered,
           SUM(oi.quantity) as total_quantity_sold,
           SUM(oi.subtotal) as total_revenue
         FROM products p
         JOIN order_items oi ON p.product_id = oi.product_id
         JOIN orders o ON oi.order_id = o.order_id
         WHERE p.tenant_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3
           AND o.status != 'cancelled'
         GROUP BY p.product_id, p.name, p.category
         ORDER BY total_revenue DESC
         LIMIT 5`,
        [tenantId, startDate, endDate]
      );

      // Get low stock products
      const lowStockQuery = await db.query(
        `SELECT 
           p.product_id,
           p.name,
           p.category,
           p.stock_quantity as current_stock,
           COALESCE(p.min_stock_level, 10) as min_stock_level
         FROM products p
         WHERE p.tenant_id = $1
           AND p.stock_quantity <= COALESCE(p.min_stock_level, 10)
           AND p.is_active = true
         ORDER BY p.stock_quantity ASC
         LIMIT 10`,
        [tenantId]
      );

      // Get order status breakdown
      const statusBreakdownQuery = await db.query(
        `SELECT 
           status,
           COUNT(*) as count,
           ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3), 0) * 100, 2) as percentage
         FROM orders
         WHERE tenant_id = $1
           AND created_at >= $2
           AND created_at <= $3
         GROUP BY status
         ORDER BY count DESC`,
        [tenantId, startDate, endDate]
      );

      // Get recent customers
      const recentCustomersQuery = await db.query(
        `SELECT 
           c.customer_id,
           c.name,
           c.phone,
           c.email,
           c.loyalty_points,
           COALESCE(l.balance, 0) as credit_balance,
           MAX(o.created_at) as last_order_date,
           COUNT(o.order_id) as total_orders
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'cancelled'
         LEFT JOIN ledger l ON c.customer_id = l.customer_id AND l.ledger_type = 'credit'
         WHERE c.tenant_id = $1
         GROUP BY c.customer_id, c.name, c.phone, c.email, c.loyalty_points, l.balance
         ORDER BY c.created_at DESC
         LIMIT 10`,
        [tenantId]
      );

      // Get monthly sales for the last 12 months
      const monthlySalesQuery = await db.query(
        `SELECT 
           TO_CHAR(created_at, 'YYYY-MM') as month,
           SUM(total_amount) as revenue,
           COUNT(*) as order_count
         FROM orders
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '12 months'
           AND status != 'cancelled'
         GROUP BY month
         ORDER BY month`,
        [tenantId]
      );

      return {
        success: true,
        data: {
          storeInfo: storeInfoQuery.rows[0] || {},
          summary: summaryQuery.rows[0] || { total_orders: 0, total_revenue: 0, total_customers: 0 },
          recentActivity: recentActivityQuery.rows || [],
          topSellingProducts: topProductsQuery.rows || [],
          lowStockProducts: lowStockQuery.rows || [],
          orderStatusBreakdown: statusBreakdownQuery.rows || [],
          recentCustomers: recentCustomersQuery.rows || [],
          monthlySales: monthlySalesQuery.rows || []
        }
      };
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export orders data as CSV/Excel format
   */
  async exportOrders(tenantId, startDate, endDate) {
    try {
      const { rows } = await db.query(
        `SELECT 
           o.order_id,
           o.created_at,
           c.name as customer_name,
           c.phone as customer_phone,
           o.status,
           o.total_amount,
           o.payment_method,
           o.delivery_address
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.tenant_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3
         ORDER BY o.created_at DESC`,
        [tenantId, startDate, endDate]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Export orders error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export customers data as CSV/Excel format
   */
  async exportCustomers(tenantId) {
    try {
      const { rows } = await db.query(
        `SELECT 
           c.customer_id,
           c.name,
           c.phone,
           c.email,
           c.loyalty_points,
           c.created_at,
           COUNT(o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_spent
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'cancelled'
         WHERE c.tenant_id = $1
         GROUP BY c.customer_id, c.name, c.phone, c.email, c.loyalty_points, c.created_at
         ORDER BY c.created_at DESC`,
        [tenantId]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Export customers error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export products data as CSV/Excel format
   */
  async exportProducts(tenantId) {
    try {
      const { rows } = await db.query(
        `SELECT 
           p.product_id,
           p.name,
           p.category,
           p.brand,
           p.price,
           p.stock_quantity,
           p.is_active,
           p.created_at,
           COUNT(oi.order_item_id) as times_ordered,
           COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
           COALESCE(SUM(oi.subtotal), 0) as total_revenue
         FROM products p
         LEFT JOIN order_items oi ON p.product_id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status != 'cancelled'
         WHERE p.tenant_id = $1
         GROUP BY p.product_id, p.name, p.category, p.brand, p.price, p.stock_quantity, p.is_active, p.created_at
         ORDER BY p.name`,
        [tenantId]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Export products error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AnalyticsService();
