const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Partner & Reseller Integration Service
 * Handles partner management, webhooks, and integrations
 */

class PartnerService {
  /**
   * Create a new partner
   */
  async createPartner(data) {
    const {
      name,
      type = 'partner',
      company_name,
      contact_email,
      contact_phone,
      website,
      business_address,
      tax_id,
      contract_details,
      allowed_scopes = [],
      logo_url,
      primary_color,
      created_by
    } = data;

    const result = await pool.query(
      `INSERT INTO partners
       (name, type, company_name, contact_email, contact_phone, website,
        business_address, tax_id, contract_details, allowed_scopes,
        logo_url, primary_color, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        name, type, company_name, contact_email, contact_phone, website,
        business_address, tax_id, contract_details ? JSON.stringify(contract_details) : null,
        allowed_scopes, logo_url, primary_color, created_by
      ]
    );

    return result.rows[0];
  }

  /**
   * Update partner information
   */
  async updatePartner(partnerId, updates) {
    const allowedFields = [
      'name', 'type', 'status', 'company_name', 'contact_email', 'contact_phone',
      'website', 'business_address', 'tax_id', 'contract_details', 'api_access_enabled',
      'allowed_scopes', 'sso_enabled', 'sso_provider', 'sso_config', 'webhook_url',
      'webhook_secret', 'webhook_events', 'logo_url', 'primary_color'
    ];

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount++}`);
        // Handle JSONB fields
        if (['contract_details', 'sso_config'].includes(key) && value !== null) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(partnerId);

    const result = await pool.query(
      `UPDATE partners
       SET ${updateFields.join(', ')}
       WHERE partner_id = $${paramCount}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(partnerId) {
    const result = await pool.query(
      `SELECT * FROM partners WHERE partner_id = $1`,
      [partnerId]
    );
    return result.rows[0];
  }

  /**
   * List partners
   */
  async listPartners(filters = {}) {
    const { type, status, limit = 50, offset = 0 } = filters;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (type) {
      conditions.push(`type = $${paramCount++}`);
      params.push(type);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT * FROM partners
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return result.rows;
  }

  /**
   * Configure webhook for partner
   */
  async configureWebhook(partnerId, config) {
    const { webhook_url, webhook_events = [] } = config;

    // Generate webhook secret if not provided
    const webhook_secret = config.webhook_secret || crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `UPDATE partners
       SET webhook_url = $1, webhook_secret = $2, webhook_events = $3, updated_at = NOW()
       WHERE partner_id = $4
       RETURNING partner_id, webhook_url, webhook_secret, webhook_events`,
      [webhook_url, webhook_secret, webhook_events, partnerId]
    );

    return result.rows[0];
  }

  /**
   * Send webhook to partner
   */
  async sendWebhook(partnerId, eventType, payload) {
    const partner = await this.getPartnerById(partnerId);

    if (!partner || !partner.webhook_url) {
      throw new Error('Partner webhook not configured');
    }

    // Check if partner is subscribed to this event
    if (!partner.webhook_events.includes(eventType)) {
      console.log(`Partner ${partnerId} not subscribed to ${eventType}`);
      return null;
    }

    // Create webhook signature
    const timestamp = Date.now();
    const signature = this.createWebhookSignature(
      partner.webhook_secret,
      timestamp,
      payload
    );

    // Log the webhook attempt
    const logResult = await pool.query(
      `INSERT INTO webhook_logs
       (partner_id, event_type, payload, webhook_url)
       VALUES ($1, $2, $3, $4)
       RETURNING webhook_log_id`,
      [partnerId, eventType, JSON.stringify(payload), partner.webhook_url]
    );

    const webhookLogId = logResult.rows[0].webhook_log_id;

    try {
      // Send webhook (in production, use a proper HTTP client like axios)
      const axios = require('axios');
      const response = await axios.post(
        partner.webhook_url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Pulss-Signature': signature,
            'X-Pulss-Timestamp': timestamp.toString(),
            'X-Pulss-Event': eventType
          },
          timeout: 30000 // 30 seconds
        }
      );

      // Update log with success
      await pool.query(
        `UPDATE webhook_logs
         SET success = true, status_code = $1, response_body = $2,
             delivery_attempts = delivery_attempts + 1, delivered_at = NOW()
         WHERE webhook_log_id = $3`,
        [response.status, JSON.stringify(response.data).substring(0, 5000), webhookLogId]
      );

      return { success: true, status: response.status };
    } catch (error) {
      // Update log with failure
      await pool.query(
        `UPDATE webhook_logs
         SET success = false, status_code = $1, response_body = $2,
             delivery_attempts = delivery_attempts + 1,
             next_retry_at = NOW() + INTERVAL '5 minutes'
         WHERE webhook_log_id = $3`,
        [
          error.response?.status || 0,
          error.message.substring(0, 5000),
          webhookLogId
        ]
      );

      console.error(`Webhook delivery failed for partner ${partnerId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create webhook signature for verification
   */
  createWebhookSignature(secret, timestamp, payload) {
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(secret, timestamp, payload, signature) {
    const expectedSignature = this.createWebhookSignature(secret, timestamp, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks() {
    // Get failed webhooks ready for retry
    const result = await pool.query(
      `SELECT webhook_log_id, partner_id, event_type, payload, webhook_url
       FROM webhook_logs
       WHERE success = false
       AND delivery_attempts < 5
       AND next_retry_at <= NOW()
       ORDER BY created_at ASC
       LIMIT 100`
    );

    const retryResults = [];

    for (const log of result.rows) {
      const partner = await this.getPartnerById(log.partner_id);
      if (!partner || !partner.webhook_url) {
        continue;
      }

      const timestamp = Date.now();
      const signature = this.createWebhookSignature(
        partner.webhook_secret,
        timestamp,
        log.payload
      );

      try {
        const axios = require('axios');
        const response = await axios.post(
          log.webhook_url,
          log.payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Pulss-Signature': signature,
              'X-Pulss-Timestamp': timestamp.toString(),
              'X-Pulss-Event': log.event_type,
              'X-Pulss-Retry': 'true'
            },
            timeout: 30000
          }
        );

        await pool.query(
          `UPDATE webhook_logs
           SET success = true, status_code = $1, response_body = $2,
               delivery_attempts = delivery_attempts + 1, delivered_at = NOW()
           WHERE webhook_log_id = $3`,
          [response.status, JSON.stringify(response.data).substring(0, 5000), log.webhook_log_id]
        );

        retryResults.push({ webhook_log_id: log.webhook_log_id, success: true });
      } catch (error) {
        const nextRetry = new Date();
        const attempts = log.delivery_attempts + 1;
        // Exponential backoff: 5min, 15min, 1hr, 3hr, 6hr
        const delays = [5, 15, 60, 180, 360];
        nextRetry.setMinutes(nextRetry.getMinutes() + (delays[attempts] || 360));

        await pool.query(
          `UPDATE webhook_logs
           SET success = false, status_code = $1, response_body = $2,
               delivery_attempts = delivery_attempts + 1, next_retry_at = $3
           WHERE webhook_log_id = $4`,
          [
            error.response?.status || 0,
            error.message.substring(0, 5000),
            nextRetry,
            log.webhook_log_id
          ]
        );

        retryResults.push({ webhook_log_id: log.webhook_log_id, success: false });
      }
    }

    return retryResults;
  }

  /**
   * Get webhook logs for a partner
   */
  async getWebhookLogs(partnerId, filters = {}) {
    const { success, limit = 50, offset = 0 } = filters;

    const conditions = [`partner_id = $1`];
    const params = [partnerId];
    let paramCount = 2;

    if (success !== undefined) {
      conditions.push(`success = $${paramCount++}`);
      params.push(success);
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT webhook_log_id, event_type, status_code, success,
              delivery_attempts, created_at, delivered_at, next_retry_at
       FROM webhook_logs
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return result.rows;
  }

  /**
   * Get integration templates
   */
  async getIntegrationTemplates(filters = {}) {
    const { type, category, is_active = true } = filters;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (type) {
      conditions.push(`type = $${paramCount++}`);
      params.push(type);
    }
    if (category) {
      conditions.push(`category = $${paramCount++}`);
      params.push(category);
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      params.push(is_active);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM integration_templates
       ${whereClause}
       ORDER BY category, name`,
      params
    );

    return result.rows;
  }
}

module.exports = new PartnerService();
