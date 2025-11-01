const { pool } = require('../config/db');

/**
 * Get billing analytics for a tenant
 */
const getTenantBillingAnalytics = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Revenue metrics
    const revenueQuery = `
      SELECT 
        COUNT(DISTINCT s.subscription_id) as total_subscriptions,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.subscription_id END) as active_subscriptions,
        COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.subscription_id END) as cancelled_subscriptions,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as avg_revenue_per_subscription,
        SUM(CASE WHEN s.status = 'active' THEN s.total_amount ELSE 0 END) as mrr
      FROM subscriptions s
      WHERE s.tenant_id = $1
        ${startDate ? 'AND s.created_at >= $2' : ''}
        ${endDate ? `AND s.created_at <= $${startDate ? '3' : '2'}` : ''}
    `;
    
    const params = [tenantId];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const revenueResult = await pool.query(revenueQuery, params);
    
    // Invoice metrics
    const invoiceQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        SUM(total_amount) as total_invoiced,
        SUM(paid_amount) as total_paid,
        SUM(balance_due) as total_outstanding
      FROM invoices
      WHERE tenant_id = $1
        ${startDate ? 'AND invoice_date >= $2' : ''}
        ${endDate ? `AND invoice_date <= $${startDate ? '3' : '2'}` : ''}
    `;
    
    const invoiceResult = await pool.query(invoiceQuery, params);
    
    // Payment metrics
    const paymentQuery = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        COUNT(DISTINCT payment_method) as payment_methods_used
      FROM payments
      WHERE tenant_id = $1 AND status = 'completed'
        ${startDate ? 'AND payment_date >= $2' : ''}
        ${endDate ? `AND payment_date <= $${startDate ? '3' : '2'}` : ''}
    `;
    
    const paymentResult = await pool.query(paymentQuery, params);
    
    // Churn metrics
    const churnQuery = `
      SELECT 
        COUNT(*) as churned_count,
        AVG(EXTRACT(DAY FROM (cancelled_at - start_date))) as avg_subscription_lifetime_days
      FROM subscriptions
      WHERE tenant_id = $1 AND status = 'cancelled'
        ${startDate ? 'AND cancelled_at >= $2' : ''}
        ${endDate ? `AND cancelled_at <= $${startDate ? '3' : '2'}` : ''}
    `;
    
    const churnResult = await pool.query(churnQuery, params);
    
    // Calculate churn rate
    const totalSubs = parseInt(revenueResult.rows[0].total_subscriptions) || 0;
    const churnedSubs = parseInt(churnResult.rows[0].churned_count) || 0;
    const churnRate = totalSubs > 0 ? ((churnedSubs / totalSubs) * 100).toFixed(2) : 0;
    
    // Calculate ARPU (Average Revenue Per User)
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
    const arpu = totalSubs > 0 ? (totalRevenue / totalSubs).toFixed(2) : 0;
    
    // Calculate LTV (Lifetime Value) - simplified
    const avgLifetimeDays = parseFloat(churnResult.rows[0].avg_subscription_lifetime_days) || 30;
    const avgMonthlyRevenue = parseFloat(revenueResult.rows[0].avg_revenue_per_subscription) || 0;
    const ltv = ((avgLifetimeDays / 30) * avgMonthlyRevenue).toFixed(2);
    
    res.json({
      revenue: revenueResult.rows[0],
      invoices: invoiceResult.rows[0],
      payments: paymentResult.rows[0],
      churn: {
        ...churnResult.rows[0],
        churn_rate: churnRate
      },
      metrics: {
        arpu,
        ltv,
        mrr: revenueResult.rows[0].mrr
      }
    });
  } catch (error) {
    console.error('Error fetching billing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch billing analytics' });
  }
};

/**
 * Get revenue trends over time
 */
const getRevenueTrends = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = 'monthly', startDate, endDate } = req.query;
    
    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = "DATE_TRUNC('day', created_at)";
        break;
      case 'weekly':
        groupBy = "DATE_TRUNC('week', created_at)";
        break;
      case 'yearly':
        groupBy = "DATE_TRUNC('year', created_at)";
        break;
      default:
        groupBy = "DATE_TRUNC('month', created_at)";
    }
    
    const query = `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as subscription_count,
        SUM(total_amount) as revenue,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM subscriptions
      WHERE tenant_id = $1
        ${startDate ? 'AND created_at >= $2' : ''}
        ${endDate ? `AND created_at <= $${startDate ? '3' : '2'}` : ''}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `;
    
    const params = [tenantId];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const result = await pool.query(query, params);
    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trends' });
  }
};

/**
 * Get super admin global analytics
 */
const getGlobalBillingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Overall metrics
    const globalQuery = `
      SELECT 
        COUNT(DISTINCT tenant_id) as total_tenants,
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_revenue_per_subscription,
        SUM(CASE WHEN status = 'active' THEN total_amount ELSE 0 END) as total_mrr
      FROM subscriptions
      ${startDate ? 'WHERE created_at >= $1' : ''}
      ${endDate ? `${startDate ? 'AND' : 'WHERE'} created_at <= $${startDate ? '2' : '1'}` : ''}
    `;
    
    const params = [];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const globalResult = await pool.query(globalQuery, params);
    
    // Plan distribution
    const planQuery = `
      SELECT 
        p.name as plan_name,
        p.plan_type,
        COUNT(s.subscription_id) as subscription_count,
        SUM(s.total_amount) as revenue
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.plan_id
      WHERE s.status = 'active'
      GROUP BY p.plan_id, p.name, p.plan_type
      ORDER BY subscription_count DESC
    `;
    
    const planResult = await pool.query(planQuery);
    
    // Top tenants by revenue
    const topTenantsQuery = `
      SELECT 
        t.name as tenant_name,
        t.tenant_id,
        COUNT(s.subscription_id) as subscription_count,
        SUM(s.total_amount) as total_revenue
      FROM subscriptions s
      JOIN tenants t ON s.tenant_id = t.tenant_id
      GROUP BY t.tenant_id, t.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    
    const topTenantsResult = await pool.query(topTenantsQuery);
    
    res.json({
      global: globalResult.rows[0],
      plan_distribution: planResult.rows,
      top_tenants: topTenantsResult.rows
    });
  } catch (error) {
    console.error('Error fetching global billing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch global billing analytics' });
  }
};

/**
 * Export billing data
 */
const exportBillingData = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { type = 'invoices', format = 'json', startDate, endDate } = req.query;
    
    let query;
    let params = [tenantId];
    
    switch (type) {
      case 'invoices':
        query = `
          SELECT * FROM invoices 
          WHERE tenant_id = $1
          ${startDate ? 'AND invoice_date >= $2' : ''}
          ${endDate ? `AND invoice_date <= $${startDate ? '3' : '2'}` : ''}
          ORDER BY invoice_date DESC
        `;
        break;
      case 'payments':
        query = `
          SELECT * FROM payments 
          WHERE tenant_id = $1
          ${startDate ? 'AND payment_date >= $2' : ''}
          ${endDate ? `AND payment_date <= $${startDate ? '3' : '2'}` : ''}
          ORDER BY payment_date DESC
        `;
        break;
      case 'subscriptions':
        query = `
          SELECT s.*, p.name as plan_name 
          FROM subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.plan_id
          WHERE s.tenant_id = $1
          ${startDate ? 'AND s.created_at >= $2' : ''}
          ${endDate ? `AND s.created_at <= $${startDate ? '3' : '2'}` : ''}
          ORDER BY s.created_at DESC
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const result = await pool.query(query, params);
    
    if (format === 'csv') {
      // TODO: Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);
      // Simple CSV conversion (would need proper library in production)
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const rows = result.rows.map(row => Object.values(row).join(',')).join('\n');
      res.send(`${headers}\n${rows}`);
    } else {
      res.json({ data: result.rows });
    }
  } catch (error) {
    console.error('Error exporting billing data:', error);
    res.status(500).json({ error: 'Failed to export billing data' });
  }
};

module.exports = {
  getTenantBillingAnalytics,
  getRevenueTrends,
  getGlobalBillingAnalytics,
  exportBillingData
};
