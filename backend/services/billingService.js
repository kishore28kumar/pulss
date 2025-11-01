const { pool } = require('../config/db');

/**
 * Billing Service
 * Handles automated billing tasks and business logic
 */

/**
 * Process subscription renewals
 * Should be run daily via cron job
 */
const processSubscriptionRenewals = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find subscriptions due for renewal
    const renewalResult = await client.query(
      `SELECT s.*, p.name as plan_name, p.price, p.billing_cycle
       FROM subscriptions s
       JOIN subscription_plans p ON s.plan_id = p.plan_id
       WHERE s.next_billing_date <= NOW()
         AND s.auto_renew = true
         AND s.status = 'active'`
    );
    
    const renewals = renewalResult.rows;
    const results = {
      processed: 0,
      failed: 0,
      details: []
    };
    
    for (const subscription of renewals) {
      try {
        // Calculate new billing dates
        const nextBillingDate = new Date(subscription.next_billing_date);
        let newNextBillingDate = new Date(nextBillingDate);
        
        switch (subscription.billing_cycle) {
          case 'monthly':
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
            break;
          case 'quarterly':
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 3);
            break;
          case 'yearly':
            newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
            break;
        }
        
        // Generate invoice for renewal
        const invoiceNumber = `INV-RENEWAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 15);
        
        const invoiceResult = await client.query(
          `INSERT INTO invoices (
            tenant_id, subscription_id, invoice_number, invoice_date, due_date,
            status, subtotal, tax_amount, total_amount, paid_amount, balance_due, currency
          ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, 0, $6, 0, $6, $7)
          RETURNING invoice_id`,
          [
            subscription.tenant_id, subscription.subscription_id,
            invoiceNumber, invoiceDate, dueDate,
            subscription.total_amount, subscription.currency
          ]
        );
        
        // Add line item
        await client.query(
          `INSERT INTO invoice_line_items (
            invoice_id, description, quantity, unit_price, amount
          ) VALUES ($1, $2, 1, $3, $3)`,
          [
            invoiceResult.rows[0].invoice_id,
            `${subscription.plan_name} - Renewal`,
            subscription.total_amount
          ]
        );
        
        // Update subscription next billing date
        await client.query(
          `UPDATE subscriptions 
           SET next_billing_date = $1, updated_at = NOW()
           WHERE subscription_id = $2`,
          [newNextBillingDate, subscription.subscription_id]
        );
        
        results.processed++;
        results.details.push({
          tenant_id: subscription.tenant_id,
          subscription_id: subscription.subscription_id,
          invoice_id: invoiceResult.rows[0].invoice_id,
          status: 'success'
        });
        
        // TODO: Send notification email
      } catch (error) {
        results.failed++;
        results.details.push({
          tenant_id: subscription.tenant_id,
          subscription_id: subscription.subscription_id,
          status: 'failed',
          error: error.message
        });
        console.error('Error processing renewal:', error);
      }
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in processSubscriptionRenewals:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update overdue invoices
 * Should be run daily via cron job
 */
const updateOverdueInvoices = async () => {
  try {
    const result = await pool.query(
      `UPDATE invoices 
       SET status = 'overdue', updated_at = NOW()
       WHERE due_date < NOW() 
         AND status = 'pending'
       RETURNING invoice_id, tenant_id, invoice_number, balance_due`
    );
    
    // TODO: Send overdue notifications
    
    return {
      updated: result.rows.length,
      invoices: result.rows
    };
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    throw error;
  }
};

/**
 * Expire trial subscriptions
 * Should be run daily via cron job
 */
const expireTrialSubscriptions = async () => {
  try {
    const result = await pool.query(
      `UPDATE subscriptions 
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'trial'
         AND trial_end_date <= NOW()
       RETURNING subscription_id, tenant_id`
    );
    
    // TODO: Send trial expiry notifications
    
    return {
      expired: result.rows.length,
      subscriptions: result.rows
    };
  } catch (error) {
    console.error('Error expiring trial subscriptions:', error);
    throw error;
  }
};

/**
 * Calculate partner commissions for recent payments
 */
const calculatePendingCommissions = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find recent payments without commissions
    const paymentsResult = await client.query(
      `SELECT p.*, s.tenant_id
       FROM payments p
       JOIN subscriptions s ON p.subscription_id = s.subscription_id
       WHERE p.status = 'completed'
         AND p.payment_id NOT IN (SELECT payment_id FROM commissions WHERE payment_id IS NOT NULL)
         AND p.payment_date >= NOW() - INTERVAL '7 days'`
    );
    
    const results = {
      created: 0,
      details: []
    };
    
    for (const payment of paymentsResult.rows) {
      // Check if tenant is linked to a partner
      const partnerResult = await client.query(
        `SELECT pt.*, p.commission_type, p.commission_value
         FROM partner_tenants pt
         JOIN partners p ON pt.partner_id = p.partner_id
         WHERE pt.tenant_id = $1 AND p.is_active = true`,
        [payment.tenant_id]
      );
      
      if (partnerResult.rows.length === 0) continue;
      
      const partner = partnerResult.rows[0];
      const commType = partner.custom_commission_type || partner.commission_type;
      const commValue = partner.custom_commission_value || partner.commission_value;
      
      let commissionAmount;
      let commissionRate;
      
      if (commType === 'percentage') {
        commissionRate = commValue;
        commissionAmount = parseFloat(payment.amount) * (commValue / 100);
      } else {
        commissionAmount = commValue;
        commissionRate = (commValue / parseFloat(payment.amount)) * 100;
      }
      
      // Create commission record
      await client.query(
        `INSERT INTO commissions (
          partner_id, tenant_id, subscription_id, payment_id,
          base_amount, commission_rate, commission_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          partner.partner_id, payment.tenant_id, payment.subscription_id,
          payment.payment_id, payment.amount, commissionRate, commissionAmount
        ]
      );
      
      results.created++;
      results.details.push({
        partner_id: partner.partner_id,
        payment_id: payment.payment_id,
        commission_amount: commissionAmount
      });
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error calculating commissions:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate monthly usage invoices
 * Should be run monthly via cron job
 */
const generateMonthlyUsageInvoices = async (month, year) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);
    
    // Get tenants with unbilled usage
    const tenantsResult = await client.query(
      `SELECT DISTINCT tenant_id, subscription_id
       FROM usage_records
       WHERE is_billed = false
         AND period_start >= $1
         AND period_end <= $2`,
      [periodStart, periodEnd]
    );
    
    const results = {
      generated: 0,
      failed: 0,
      details: []
    };
    
    for (const tenant of tenantsResult.rows) {
      try {
        // Get unbilled usage
        const usageResult = await client.query(
          `SELECT * FROM usage_records
           WHERE tenant_id = $1 
             AND subscription_id = $2
             AND is_billed = false
             AND period_start >= $3
             AND period_end <= $4`,
          [tenant.tenant_id, tenant.subscription_id, periodStart, periodEnd]
        );
        
        if (usageResult.rows.length === 0) continue;
        
        const subtotal = usageResult.rows.reduce((sum, record) => 
          sum + parseFloat(record.total_amount || 0), 0
        );
        
        // Generate invoice
        const invoiceNumber = `INV-USAGE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 15);
        
        const invoiceResult = await client.query(
          `INSERT INTO invoices (
            tenant_id, subscription_id, invoice_number, invoice_date, due_date,
            status, subtotal, tax_amount, total_amount, paid_amount, balance_due, currency
          ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, 0, $6, 0, $6, 'INR')
          RETURNING invoice_id`,
          [tenant.tenant_id, tenant.subscription_id, invoiceNumber, invoiceDate, 
           dueDate, subtotal]
        );
        
        const invoiceId = invoiceResult.rows[0].invoice_id;
        
        // Add line items grouped by metric
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
        
        for (const [metricName, data] of Object.entries(metricGroups)) {
          await client.query(
            `INSERT INTO invoice_line_items (
              invoice_id, description, quantity, unit_price, amount
            ) VALUES ($1, $2, $3, $4, $5)`,
            [invoiceId, `${metricName} (${data.unit})`, data.quantity, data.unit_price, data.amount]
          );
        }
        
        // Mark usage as billed
        const usageIds = usageResult.rows.map(r => r.usage_id);
        await client.query(
          `UPDATE usage_records 
           SET is_billed = true, billed_in_invoice_id = $1
           WHERE usage_id = ANY($2::uuid[])`,
          [invoiceId, usageIds]
        );
        
        results.generated++;
        results.details.push({
          tenant_id: tenant.tenant_id,
          invoice_id: invoiceId,
          amount: subtotal,
          usage_records: usageIds.length
        });
        
        // TODO: Send invoice notification
      } catch (error) {
        results.failed++;
        results.details.push({
          tenant_id: tenant.tenant_id,
          error: error.message
        });
        console.error('Error generating usage invoice:', error);
      }
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in generateMonthlyUsageInvoices:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Send billing notification (integrate with existing notification system)
 */
const sendBillingNotification = async (type, data) => {
  // TODO: Integrate with existing notification system
  // This is a placeholder for email/SMS notifications
  
  const notifications = {
    'invoice_generated': {
      subject: 'New Invoice Generated',
      template: 'invoice_email.html'
    },
    'payment_received': {
      subject: 'Payment Received Successfully',
      template: 'payment_confirmation.html'
    },
    'subscription_renewed': {
      subject: 'Subscription Renewed',
      template: 'renewal_confirmation.html'
    },
    'invoice_overdue': {
      subject: 'Invoice Overdue - Payment Required',
      template: 'overdue_notice.html'
    },
    'trial_expiring': {
      subject: 'Trial Period Expiring Soon',
      template: 'trial_expiry.html'
    },
    'subscription_cancelled': {
      subject: 'Subscription Cancelled',
      template: 'cancellation_confirmation.html'
    }
  };
  
  const notification = notifications[type];
  
  if (!notification) {
    console.error('Unknown notification type:', type);
    return;
  }
  
  // Log notification (replace with actual email/SMS service)
  console.log('Billing Notification:', {
    type,
    subject: notification.subject,
    data
  });
  
  return {
    sent: true,
    type,
    ...notification
  };
};

/**
 * Get billing metrics for dashboard
 */
const getBillingMetrics = async (tenantId = null) => {
  try {
    const tenantFilter = tenantId ? 'WHERE tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];
    
    const query = `
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial_subscriptions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        SUM(CASE WHEN status = 'active' THEN total_amount ELSE 0 END) as monthly_recurring_revenue,
        AVG(total_amount) as average_subscription_value
      FROM subscriptions
      ${tenantFilter}
    `;
    
    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting billing metrics:', error);
    throw error;
  }
};

module.exports = {
  processSubscriptionRenewals,
  updateOverdueInvoices,
  expireTrialSubscriptions,
  calculatePendingCommissions,
  generateMonthlyUsageInvoices,
  sendBillingNotification,
  getBillingMetrics
};

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Billing Service
 * Core billing operations including subscriptions, invoicing, and usage tracking
 */

class BillingService {
  /**
   * Create a new subscription for a tenant
   */
  async createSubscription(
    tenantId,
    planId,
    billingEmail,
    paymentGateway = 'razorpay',
    trialDays = null
  ) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Get plan details
      const planResult = await client.query(
        'SELECT * FROM subscription_plans WHERE plan_id = $1 AND is_active = true',
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Invalid or inactive plan');
      }

      const plan = planResult.rows[0];

      // Calculate subscription period
      const currentPeriodStart = new Date();
      let currentPeriodEnd;
      const effectiveTrialDays = trialDays !== null ? trialDays : plan.trial_days;

      switch (plan.billing_period) {
        case 'monthly':
          currentPeriodEnd = new Date(currentPeriodStart);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          break;
        case 'quarterly':
          currentPeriodEnd = new Date(currentPeriodStart);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
          break;
        case 'yearly':
          currentPeriodEnd = new Date(currentPeriodStart);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          break;
        default:
          throw new Error('Invalid billing period');
      }

      // Set trial period if applicable
      let trialStart = null;
      let trialEnd = null;
      let status = 'active';

      if (effectiveTrialDays > 0) {
        trialStart = currentPeriodStart;
        trialEnd = new Date(currentPeriodStart);
        trialEnd.setDate(trialEnd.getDate() + effectiveTrialDays);
        status = 'trial';
      }

      // Create subscription
      const subscriptionResult = await client.query(
        `INSERT INTO tenant_subscriptions 
         (tenant_id, plan_id, status, current_period_start, current_period_end, 
          trial_start, trial_end, billing_email, payment_gateway)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          tenantId,
          planId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          trialStart,
          trialEnd,
          billingEmail,
          paymentGateway,
        ]
      );

      const subscription = subscriptionResult.rows[0];

      // Log audit
      await this.logAudit(
        client,
        tenantId,
        null,
        'subscription_created',
        'subscription',
        subscription.subscription_id,
        null,
        subscription
      );

      await client.query('COMMIT');

      return subscription;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate invoice for subscription period
   */
  async generateInvoice(tenantId, subscriptionId, includedUsage = true) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Get subscription and plan details
      const subResult = await client.query(
        `SELECT ts.*, sp.name as plan_name, sp.base_price, sp.billing_period, sp.limits
         FROM tenant_subscriptions ts
         JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
         WHERE ts.subscription_id = $1 AND ts.tenant_id = $2`,
        [subscriptionId, tenantId]
      );

      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = subResult.rows[0];

      // Get tenant billing details
      const tenantResult = await client.query(
        `SELECT t.name, ss.address, ss.business_name, ss.phone
         FROM tenants t
         LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
         WHERE t.tenant_id = $1`,
        [tenantId]
      );

      const tenant = tenantResult.rows[0];

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(client);

      // Calculate amounts
      let subtotal = parseFloat(subscription.base_price);
      const invoiceDate = new Date();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 7); // 7 days payment term

      // Calculate GST (18% for digital services in India)
      const gstRate = 18.0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      // For simplicity, using CGST+SGST (intra-state). In production, determine based on place_of_supply
      cgstAmount = subtotal * (gstRate / 2 / 100);
      sgstAmount = subtotal * (gstRate / 2 / 100);

      // Add usage-based charges if enabled
      if (includedUsage) {
        const usageCharges = await this.calculateUsageCharges(
          client,
          tenantId,
          subscription.current_period_start,
          subscription.current_period_end
        );
        subtotal += usageCharges.totalCharges;
      }

      const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices 
         (tenant_id, subscription_id, invoice_number, invoice_date, due_date,
          subtotal, cgst_amount, sgst_amount, igst_amount, total_amount,
          gst_rate, billing_name, billing_address, billing_email, billing_phone,
          status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [
          tenantId,
          subscriptionId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          subtotal,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount,
          gstRate,
          tenant.business_name || tenant.name,
          tenant.address || '',
          subscription.billing_email,
          tenant.phone || '',
          'pending',
          'unpaid',
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Add invoice line items
      await client.query(
        `INSERT INTO invoice_items 
         (invoice_id, description, item_type, quantity, unit_price, amount,
          period_start, period_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          invoice.invoice_id,
          `${subscription.plan_name} - ${subscription.billing_period}`,
          'subscription',
          1,
          subscription.base_price,
          subscription.base_price,
          subscription.current_period_start,
          subscription.current_period_end,
        ]
      );

      // Log audit
      await this.logAudit(
        client,
        tenantId,
        null,
        'invoice_generated',
        'invoice',
        invoice.invoice_id,
        null,
        invoice
      );

      await client.query('COMMIT');

      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate usage charges for a period
   */
  async calculateUsageCharges(client, tenantId, periodStart, periodEnd) {
    const usageResult = await client.query(
      `SELECT um.meter_type, um.unit_price, um.included_units,
              SUM(ue.quantity) as total_usage
       FROM usage_events ue
       JOIN usage_meters um ON ue.meter_id = um.meter_id
       WHERE ue.tenant_id = $1 
       AND ue.event_time >= $2 
       AND ue.event_time < $3
       AND ue.processed = false
       AND um.unit_price IS NOT NULL
       GROUP BY um.meter_id, um.meter_type, um.unit_price, um.included_units`,
      [tenantId, periodStart, periodEnd]
    );

    let totalCharges = 0;
    const breakdown = [];

    for (const usage of usageResult.rows) {
      const billableUsage = Math.max(0, usage.total_usage - usage.included_units);
      const charge = billableUsage * parseFloat(usage.unit_price);

      if (charge > 0) {
        totalCharges += charge;
        breakdown.push({
          meterType: usage.meter_type,
          totalUsage: usage.total_usage,
          includedUnits: usage.included_units,
          billableUsage,
          unitPrice: usage.unit_price,
          charge,
        });
      }
    }

    return { totalCharges, breakdown };
  }

  /**
   * Record usage event
   */
  async recordUsage(tenantId, meterType, quantity = 1, metadata = {}) {
    const client = await db.connect();

    try {
      // Get or create meter
      let meterResult = await client.query(
        'SELECT meter_id FROM usage_meters WHERE tenant_id = $1 AND meter_type = $2',
        [tenantId, meterType]
      );

      let meterId;
      if (meterResult.rows.length === 0) {
        // Create meter if doesn't exist
        const newMeter = await client.query(
          'INSERT INTO usage_meters (tenant_id, meter_type) VALUES ($1, $2) RETURNING meter_id',
          [tenantId, meterType]
        );
        meterId = newMeter.rows[0].meter_id;
      } else {
        meterId = meterResult.rows[0].meter_id;
      }

      // Record usage event
      await client.query(
        `INSERT INTO usage_events (tenant_id, meter_id, quantity, metadata)
         VALUES ($1, $2, $3, $4)`,
        [tenantId, meterId, quantity, metadata]
      );

      return { success: true };
    } finally {
      client.release();
    }
  }

  /**
   * Apply coupon code
   */
  async applyCoupon(couponCode, tenantId, invoiceId) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Get coupon
      const couponResult = await client.query(
        `SELECT * FROM coupons 
         WHERE code = $1 AND is_active = true
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (max_redemptions IS NULL OR redemptions_count < max_redemptions)`,
        [couponCode]
      );

      if (couponResult.rows.length === 0) {
        throw new Error('Invalid or expired coupon code');
      }

      const coupon = couponResult.rows[0];

      // Check if already used by tenant (if first_time_only)
      if (coupon.first_time_only) {
        const usedResult = await client.query(
          'SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = $1 AND tenant_id = $2',
          [coupon.coupon_id, tenantId]
        );

        if (parseInt(usedResult.rows[0].count) > 0) {
          throw new Error('Coupon can only be used once');
        }
      }

      // Get invoice
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE invoice_id = $1 AND tenant_id = $2',
        [invoiceId, tenantId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Check minimum purchase amount
      if (coupon.min_purchase_amount && invoice.subtotal < coupon.min_purchase_amount) {
        throw new Error(`Minimum purchase amount of ₹${coupon.min_purchase_amount} required`);
      }

      // Calculate discount
      let discountAmount;
      if (coupon.discount_type === 'percentage') {
        discountAmount = invoice.subtotal * (parseFloat(coupon.discount_value) / 100);
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
        }
      } else {
        discountAmount = parseFloat(coupon.discount_value);
      }

      // Update invoice
      const newSubtotal = invoice.subtotal - discountAmount;
      const newTotal = invoice.total_amount - discountAmount;

      await client.query(
        `UPDATE invoices 
         SET discount_amount = $1, subtotal = $2, total_amount = $3, updated_at = NOW()
         WHERE invoice_id = $4`,
        [discountAmount, newSubtotal, newTotal, invoiceId]
      );

      // Record redemption
      await client.query(
        `INSERT INTO coupon_redemptions (coupon_id, tenant_id, invoice_id, discount_amount)
         VALUES ($1, $2, $3, $4)`,
        [coupon.coupon_id, tenantId, invoiceId, discountAmount]
      );

      // Update coupon redemption count
      await client.query(
        'UPDATE coupons SET redemptions_count = redemptions_count + 1 WHERE coupon_id = $1',
        [coupon.coupon_id]
      );

      await client.query('COMMIT');

      return { discountAmount, couponName: coupon.name };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process payment
   */
  async processPayment(tenantId, invoiceId, paymentData) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Create payment transaction
      const transactionResult = await client.query(
        `INSERT INTO payment_transactions 
         (tenant_id, invoice_id, amount, currency, payment_method, payment_gateway,
          gateway_transaction_id, gateway_order_id, gateway_payment_id, gateway_signature,
          gateway_response, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          tenantId,
          invoiceId,
          paymentData.amount,
          paymentData.currency || 'INR',
          paymentData.payment_method,
          paymentData.payment_gateway,
          paymentData.gateway_transaction_id,
          paymentData.gateway_order_id,
          paymentData.gateway_payment_id,
          paymentData.gateway_signature,
          paymentData.gateway_response || {},
          paymentData.status || 'pending',
        ]
      );

      const transaction = transactionResult.rows[0];

      // If payment successful, update invoice
      if (paymentData.status === 'success') {
        await client.query(
          `UPDATE invoices 
           SET amount_paid = amount_paid + $1,
               payment_status = CASE 
                 WHEN amount_paid + $1 >= total_amount THEN 'paid'
                 ELSE 'partial'
               END,
               status = CASE 
                 WHEN amount_paid + $1 >= total_amount THEN 'paid'
                 ELSE status
               END,
               paid_at = NOW(),
               payment_method = $2,
               payment_gateway = $3,
               gateway_transaction_id = $4,
               updated_at = NOW()
           WHERE invoice_id = $5`,
          [
            paymentData.amount,
            paymentData.payment_method,
            paymentData.payment_gateway,
            paymentData.gateway_transaction_id,
            invoiceId,
          ]
        );

        // Update transaction status
        await client.query(
          'UPDATE payment_transactions SET completed_at = NOW() WHERE transaction_id = $1',
          [transaction.transaction_id]
        );

        // Log audit
        await this.logAudit(
          client,
          tenantId,
          null,
          'payment_received',
          'payment',
          transaction.transaction_id,
          null,
          transaction
        );
      }

      await client.query('COMMIT');

      return transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Request refund
   */
  async requestRefund(tenantId, transactionId, amount, reason, requestedBy) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Get transaction
      const transactionResult = await client.query(
        'SELECT * FROM payment_transactions WHERE transaction_id = $1 AND tenant_id = $2',
        [transactionId, tenantId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionResult.rows[0];

      // Determine refund type
      const refundType = amount >= parseFloat(transaction.amount) ? 'full' : 'partial';

      // Create refund request
      const refundResult = await client.query(
        `INSERT INTO refunds 
         (transaction_id, invoice_id, tenant_id, amount, reason, refund_type, requested_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [transactionId, transaction.invoice_id, tenantId, amount, reason, refundType, requestedBy]
      );

      const refund = refundResult.rows[0];

      // Log audit
      await this.logAudit(
        client,
        tenantId,
        requestedBy,
        'refund_requested',
        'refund',
        refund.refund_id,
        null,
        refund
      );

      await client.query('COMMIT');

      return refund;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(client) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const result = await client.query(
      `SELECT invoice_number FROM invoices 
       WHERE invoice_number LIKE $1 
       ORDER BY created_at DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Log audit trail
   */
  async logAudit(client, tenantId, adminId, action, entityType, entityId, oldValues, newValues) {
    await client.query(
      `INSERT INTO billing_audit_log 
       (tenant_id, admin_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, adminId, action, entityType, entityId, oldValues || {}, newValues || {}]
    );
  }

  /**
   * Get tenant subscription with plan details
   */
  async getTenantSubscription(tenantId) {
    const result = await db.query(
      `SELECT ts.*, sp.name as plan_name, sp.description as plan_description,
              sp.base_price, sp.billing_period, sp.features, sp.limits
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
       WHERE ts.tenant_id = $1
       ORDER BY ts.created_at DESC
       LIMIT 1`,
      [tenantId]
    );

    return result.rows[0] || null;
  }

  /**
   * Check if feature is enabled for tenant
   */
  async isFeatureEnabled(tenantId, featureKey) {
    const result = await db.query(
      `SELECT enabled FROM tenant_feature_permissions
       WHERE tenant_id = $1 AND feature_key = $2`,
      [tenantId, featureKey]
    );

    return result.rows.length > 0 ? result.rows[0].enabled : false;
  }

  /**
   * Enable/disable feature for tenant (super admin only)
   */
  async setFeatureEnabled(tenantId, featureKey, enabled, adminId) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO tenant_feature_permissions (tenant_id, feature_key, enabled, enabled_by, enabled_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (tenant_id, feature_key) 
         DO UPDATE SET enabled = $3, enabled_by = $4, enabled_at = NOW(), updated_at = NOW()
         RETURNING *`,
        [tenantId, featureKey, enabled, adminId]
      );

      // Log audit
      await this.logAudit(
        client,
        tenantId,
        adminId,
        enabled ? 'feature_enabled' : 'feature_disabled',
        'feature',
        result.rows[0].permission_id,
        null,
        result.rows[0]
      );

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new BillingService();
