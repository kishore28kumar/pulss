const n8nService = require('../services/n8nService');
const { pool } = require('../config/db');

/**
 * Webhook Event Types
 */
const WEBHOOK_EVENTS = {
  ORDER_PLACED: 'order-placed',
  ORDER_ACCEPTED: 'order-accepted',
  ORDER_PACKED: 'order-packed',
  ORDER_DISPATCHED: 'order-dispatched',
  ORDER_DELIVERED: 'order-delivered',
  ORDER_CANCELLED: 'order-cancelled',
  CUSTOMER_REGISTERED: 'customer-registered',
  CUSTOMER_UPDATED: 'customer-updated',
  PRODUCT_CREATED: 'product-created',
  PRODUCT_OUT_OF_STOCK: 'product-out-of-stock',
  PAYMENT_RECEIVED: 'payment-received',
  LOYALTY_POINTS_EARNED: 'loyalty-points-earned'
};

/**
 * Log webhook trigger to database
 */
async function logWebhookTrigger(tenant_id, event_type, payload, result) {
  try {
    await pool.query(
      `INSERT INTO n8n_webhook_logs 
       (tenant_id, event_type, payload, response, success, triggered_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        tenant_id,
        event_type,
        JSON.stringify(payload),
        JSON.stringify(result),
        result.success || false
      ]
    );
  } catch (error) {
    console.error('Failed to log webhook trigger:', error.message);
  }
}

/**
 * Check if webhook is enabled for tenant and event type
 */
async function isWebhookEnabled(tenant_id, event_type) {
  try {
    const result = await pool.query(
      `SELECT enabled FROM n8n_workflow_triggers 
       WHERE tenant_id = $1 AND event_type = $2`,
      [tenant_id, event_type]
    );
    
    return result.rows.length > 0 && result.rows[0].enabled;
  } catch (error) {
    // If table doesn't exist yet or query fails, default to disabled
    console.warn('Failed to check webhook status:', error.message);
    return false;
  }
}

/**
 * Trigger a webhook for a specific event
 * @param {string} tenant_id - The tenant ID
 * @param {string} event_type - The event type (from WEBHOOK_EVENTS)
 * @param {object} data - The event data
 */
async function triggerWebhook(tenant_id, event_type, data) {
  try {
    // Check if webhook is enabled for this tenant and event
    const enabled = await isWebhookEnabled(tenant_id, event_type);
    
    if (!enabled) {
      console.log(`Webhook ${event_type} not enabled for tenant ${tenant_id}`);
      return { skipped: true, reason: 'not enabled for tenant' };
    }

    // Prepare payload
    const payload = {
      event: event_type,
      tenant_id: tenant_id,
      timestamp: new Date().toISOString(),
      data: data
    };

    // Trigger the webhook
    const result = await n8nService.triggerWebhook(event_type, payload, {
      tenant_id: tenant_id
    });

    // Log the trigger
    await logWebhookTrigger(tenant_id, event_type, payload, result);

    return result;
  } catch (error) {
    console.error('Webhook trigger error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger order placed webhook
 */
async function triggerOrderPlaced(tenant_id, orderData) {
  return triggerWebhook(tenant_id, WEBHOOK_EVENTS.ORDER_PLACED, {
    order_id: orderData.order_id,
    order_number: orderData.order_number,
    customer_id: orderData.customer_id,
    total: orderData.total,
    items_count: orderData.items?.length || 0,
    payment_method: orderData.payment_method,
    delivery_type: orderData.delivery_type,
    created_at: orderData.created_at
  });
}

/**
 * Trigger order status change webhook
 */
async function triggerOrderStatusChange(tenant_id, orderData, newStatus) {
  const eventMap = {
    'accepted': WEBHOOK_EVENTS.ORDER_ACCEPTED,
    'packed': WEBHOOK_EVENTS.ORDER_PACKED,
    'dispatched': WEBHOOK_EVENTS.ORDER_DISPATCHED,
    'delivered': WEBHOOK_EVENTS.ORDER_DELIVERED,
    'cancelled': WEBHOOK_EVENTS.ORDER_CANCELLED
  };

  const eventType = eventMap[newStatus];
  if (!eventType) {
    console.warn(`No webhook event defined for status: ${newStatus}`);
    return { skipped: true, reason: 'no event type for status' };
  }

  return triggerWebhook(tenant_id, eventType, {
    order_id: orderData.order_id,
    order_number: orderData.order_number,
    customer_id: orderData.customer_id,
    status: newStatus,
    previous_status: orderData.previous_status,
    total: orderData.total,
    updated_at: new Date().toISOString()
  });
}

/**
 * Trigger customer registered webhook
 */
async function triggerCustomerRegistered(tenant_id, customerData) {
  return triggerWebhook(tenant_id, WEBHOOK_EVENTS.CUSTOMER_REGISTERED, {
    customer_id: customerData.customer_id,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    loyalty_points: customerData.loyalty_points || 0,
    created_at: customerData.created_at
  });
}

/**
 * Trigger product out of stock webhook
 */
async function triggerProductOutOfStock(tenant_id, productData) {
  return triggerWebhook(tenant_id, WEBHOOK_EVENTS.PRODUCT_OUT_OF_STOCK, {
    product_id: productData.product_id,
    name: productData.name,
    sku: productData.sku,
    category: productData.category,
    last_inventory_count: productData.inventory_count,
    updated_at: new Date().toISOString()
  });
}

/**
 * Trigger loyalty points earned webhook
 */
async function triggerLoyaltyPointsEarned(tenant_id, data) {
  return triggerWebhook(tenant_id, WEBHOOK_EVENTS.LOYALTY_POINTS_EARNED, {
    customer_id: data.customer_id,
    order_id: data.order_id,
    points_earned: data.points_earned,
    total_points: data.total_points,
    purchase_amount: data.purchase_amount,
    earned_at: new Date().toISOString()
  });
}

module.exports = {
  WEBHOOK_EVENTS,
  triggerWebhook,
  triggerOrderPlaced,
  triggerOrderStatusChange,
  triggerCustomerRegistered,
  triggerProductOutOfStock,
  triggerLoyaltyPointsEarned,
  isWebhookEnabled,
  logWebhookTrigger
};
