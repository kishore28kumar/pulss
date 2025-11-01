const { pool } = require('../config/db');

/**
 * Record usage for a tenant
 */
const recordUsage = async (req, res) => {
  try {
    const {
      tenantId, subscriptionId, metricName, quantity, unit,
      unitPrice, periodStart, periodEnd
    } = req.body;
    
    if (!tenantId || !subscriptionId || !metricName || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const totalAmount = unitPrice ? quantity * unitPrice : null;
    
    const result = await pool.query(
      `INSERT INTO usage_records (
        tenant_id, subscription_id, metric_name, quantity, unit,
        unit_price, total_amount, period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenantId, subscriptionId, metricName, quantity, unit,
        unitPrice, totalAmount, periodStart || new Date(), periodEnd || new Date()
      ]
    );
    
    res.status(201).json({ usage: result.rows[0] });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};

/**
 * Get usage records for a tenant
 */
const getTenantUsage = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { subscriptionId, metricName, startDate, endDate, is_billed, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM usage_records WHERE tenant_id = $1';
    const params = [tenantId];
    
    if (subscriptionId) {
      params.push(subscriptionId);
      query += ` AND subscription_id = $${params.length}`;
    }
    
    if (metricName) {
      params.push(metricName);
      query += ` AND metric_name = $${params.length}`;
    }
    
    if (startDate) {
      params.push(startDate);
      query += ` AND period_start >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND period_end <= $${params.length}`;
    }
    
    if (is_billed !== undefined) {
      params.push(is_billed === 'true');
      query += ` AND is_billed = $${params.length}`;
    }
    
    query += ` ORDER BY period_start DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get summary
    const summaryQuery = `
      SELECT 
        metric_name,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_amount,
        COUNT(*) as record_count,
        SUM(CASE WHEN is_billed THEN quantity ELSE 0 END) as billed_quantity,
        SUM(CASE WHEN NOT is_billed THEN quantity ELSE 0 END) as unbilled_quantity
      FROM usage_records
      WHERE tenant_id = $1
        ${subscriptionId ? 'AND subscription_id = $2' : ''}
        ${metricName ? `AND metric_name = $${subscriptionId ? '3' : '2'}` : ''}
      GROUP BY metric_name
    `;
    
    const summaryParams = [tenantId];
    if (subscriptionId) summaryParams.push(subscriptionId);
    if (metricName) summaryParams.push(metricName);
    
    const summaryResult = await pool.query(summaryQuery, summaryParams);
    
    res.json({ 
      usage_records: result.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Error fetching tenant usage:', error);
    res.status(500).json({ error: 'Failed to fetch tenant usage' });
  }
};

/**
 * Get usage summary by metric
 */
const getUsageSummary = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        metric_name,
        unit,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_quantity,
        MAX(quantity) as max_quantity,
        MIN(quantity) as min_quantity,
        SUM(total_amount) as total_cost,
        COUNT(*) as measurement_count
      FROM usage_records
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND period_start >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND period_end <= $${params.length}`;
    }
    
    query += ' GROUP BY metric_name, unit ORDER BY total_cost DESC';
    
    const result = await pool.query(query, params);
    res.json({ summary: result.rows });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
};

/**
 * Mark usage records as billed
 */
const markUsageAsBilled = async (req, res) => {
  try {
    const { usageIds, invoiceId } = req.body;
    
    if (!usageIds || !Array.isArray(usageIds) || usageIds.length === 0) {
      return res.status(400).json({ error: 'Usage IDs required' });
    }
    
    const result = await pool.query(
      `UPDATE usage_records 
       SET is_billed = true, billed_in_invoice_id = $1
       WHERE usage_id = ANY($2::uuid[])
       RETURNING *`,
      [invoiceId, usageIds]
    );
    
    res.json({ 
      updated_count: result.rows.length,
      usage_records: result.rows
    });
  } catch (error) {
    console.error('Error marking usage as billed:', error);
    res.status(500).json({ error: 'Failed to mark usage as billed' });
  }
};

/**
 * Batch record usage (for API usage tracking, etc.)
 */
const batchRecordUsage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { records } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Usage records required' });
    }
    
    const insertedRecords = [];
    
    for (const record of records) {
      const {
        tenantId, subscriptionId, metricName, quantity, unit,
        unitPrice, periodStart, periodEnd
      } = record;
      
      if (!tenantId || !subscriptionId || !metricName || !quantity) {
        continue; // Skip invalid records
      }
      
      const totalAmount = unitPrice ? quantity * unitPrice : null;
      
      const result = await client.query(
        `INSERT INTO usage_records (
          tenant_id, subscription_id, metric_name, quantity, unit,
          unit_price, total_amount, period_start, period_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          tenantId, subscriptionId, metricName, quantity, unit,
          unitPrice, totalAmount, periodStart || new Date(), periodEnd || new Date()
        ]
      );
      
      insertedRecords.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ 
      count: insertedRecords.length,
      usage_records: insertedRecords
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error batch recording usage:', error);
    res.status(500).json({ error: 'Failed to batch record usage' });
  } finally {
    client.release();
  }
};

/**
 * Generate usage-based invoice
 */
const generateUsageInvoice = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { tenantId, subscriptionId, periodStart, periodEnd } = req.body;
    
    if (!tenantId || !subscriptionId || !periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get unbilled usage for the period
    const usageResult = await client.query(
      `SELECT * FROM usage_records
       WHERE tenant_id = $1 
         AND subscription_id = $2
         AND period_start >= $3
         AND period_end <= $4
         AND is_billed = false
       ORDER BY metric_name, period_start`,
      [tenantId, subscriptionId, periodStart, periodEnd]
    );
    
    if (usageResult.rows.length === 0) {
      return res.status(400).json({ error: 'No unbilled usage found for the period' });
    }
    
    // Calculate totals
    const subtotal = usageResult.rows.reduce((sum, record) => 
      sum + parseFloat(record.total_amount || 0), 0
    );
    
    const taxAmount = 0; // TODO: Calculate based on tenant location
    const totalAmount = subtotal + taxAmount;
    
    // Generate invoice number
    const invoiceNumber = `INV-USAGE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 15);
    
    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        tenant_id, subscription_id, invoice_number, invoice_date, due_date,
        status, subtotal, tax_amount, total_amount, paid_amount, balance_due, currency
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, 0, $8, 'INR')
      RETURNING *`,
      [tenantId, subscriptionId, invoiceNumber, invoiceDate, dueDate, 
       subtotal, taxAmount, totalAmount]
    );
    
    const invoice = invoiceResult.rows[0];
    
    // Group usage by metric and add as line items
    const metricGroups = {};
    usageResult.rows.forEach(record => {
      if (!metricGroups[record.metric_name]) {
        metricGroups[record.metric_name] = {
          quantity: 0,
          amount: 0,
          unit: record.unit,
          unit_price: record.unit_price
        };
      }
      metricGroups[record.metric_name].quantity += parseFloat(record.quantity);
      metricGroups[record.metric_name].amount += parseFloat(record.total_amount || 0);
    });
    
    // Add line items
    for (const [metricName, data] of Object.entries(metricGroups)) {
      await client.query(
        `INSERT INTO invoice_line_items (
          invoice_id, description, quantity, unit_price, amount
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          invoice.invoice_id,
          `${metricName} (${data.unit})`,
          data.quantity,
          data.unit_price,
          data.amount
        ]
      );
    }
    
    // Mark usage as billed
    const usageIds = usageResult.rows.map(r => r.usage_id);
    await client.query(
      `UPDATE usage_records 
       SET is_billed = true, billed_in_invoice_id = $1
       WHERE usage_id = ANY($2::uuid[])`,
      [invoice.invoice_id, usageIds]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ 
      invoice,
      usage_records_count: usageIds.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating usage invoice:', error);
    res.status(500).json({ error: 'Failed to generate usage invoice' });
  } finally {
    client.release();
  }
};

module.exports = {
  recordUsage,
  getTenantUsage,
  getUsageSummary,
  markUsageAsBilled,
  batchRecordUsage,
  generateUsageInvoice
};
