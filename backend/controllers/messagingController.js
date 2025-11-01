/**
 * Messaging Controller
 * Handles SMS and WhatsApp messaging
 */

const messagingService = require('../services/messagingService');
const db = require('../config/db');

/**
 * Send SMS to customer
 */
exports.sendSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const { tenantId } = req.user;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    const result = await messagingService.sendSMS(phoneNumber, message);

    res.json(result);
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
};

/**
 * Send WhatsApp message to customer
 */
exports.sendWhatsApp = async (req, res) => {
  try {
    const { phoneNumber, message, templateName } = req.body;
    const { tenantId } = req.user;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    const result = await messagingService.sendWhatsApp(phoneNumber, message, templateName);

    res.json(result);
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
};

/**
 * Send broadcast message to multiple customers
 */
exports.sendBroadcast = async (req, res) => {
  try {
    const { message, phoneNumbers, method = 'whatsapp' } = req.body;
    const { tenantId } = req.user;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let targetPhoneNumbers = phoneNumbers;

    // If no phone numbers provided, get all customers
    if (!targetPhoneNumbers || targetPhoneNumbers.length === 0) {
      const { rows } = await db.query(
        `SELECT phone FROM customers 
         WHERE tenant_id = $1 AND is_active = true AND phone IS NOT NULL`,
        [tenantId]
      );
      targetPhoneNumbers = rows.map(row => row.phone);
    }

    if (targetPhoneNumbers.length === 0) {
      return res.status(400).json({ error: 'No phone numbers to send to' });
    }

    const result = await messagingService.sendBroadcastMessage(
      tenantId,
      message,
      targetPhoneNumbers,
      method
    );

    res.json(result);
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast message' });
  }
};

/**
 * Get message logs
 */
exports.getMessageLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const { tenantId } = req.user;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        message_log_id,
        type,
        phone_number,
        message,
        status,
        provider,
        error_message,
        sent_at
      FROM message_logs
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY sent_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM message_logs WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (type) {
      countQuery += ` AND type = $${countParamIndex++}`;
      countParams.push(type);
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex++}`;
      countParams.push(status);
    }

    const { rows: countRows } = await db.query(countQuery, countParams);

    res.json({
      success: true,
      logs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].count),
        pages: Math.ceil(countRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get message logs error:', error);
    res.status(500).json({ error: 'Failed to get message logs' });
  }
};

/**
 * Send order confirmation message
 */
exports.sendOrderConfirmation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { method = 'whatsapp' } = req.body;

    // Get order details
    const { rows } = await db.query(
      `SELECT o.order_id, c.name, c.phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { name, phone } = rows[0];

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number not available' });
    }

    const result = await messagingService.sendOrderConfirmation(
      orderId,
      phone,
      name,
      method
    );

    res.json(result);
  } catch (error) {
    console.error('Send order confirmation error:', error);
    res.status(500).json({ error: 'Failed to send order confirmation' });
  }
};

/**
 * Get messaging configuration status
 */
exports.getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        twilioEnabled: process.env.TWILIO_ENABLED === 'true',
        whatsappBusinessEnabled: process.env.WHATSAPP_BUSINESS_ENABLED === 'true',
        twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        whatsappConfigured: !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY),
      },
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get messaging configuration' });
  }
};
