const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * API Gateway Service
 * Handles API key generation, validation, and management
 */

class ApiGatewayService {
  /**
   * Generate a new API key
   */
  async generateApiKey(data) {
    const {
      tenant_id,
      partner_id,
      key_name,
      key_type = 'tenant',
      scopes = [],
      description,
      rate_limit_per_minute = 60,
      rate_limit_per_hour = 1000,
      rate_limit_per_day = 10000,
      ip_whitelist = [],
      allowed_origins = [],
      geo_restrictions = null,
      expires_at = null,
      created_by
    } = data;

    // Generate secure random API key
    const apiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');
    
    // Hash the key and secret
    const apiKeyHash = await bcrypt.hash(apiKey, 10);
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);
    
    // Create prefix for display
    const apiKeyPrefix = `${apiKey.substring(0, 12)}...`;

    const result = await pool.query(
      `INSERT INTO api_gateway_keys 
       (tenant_id, partner_id, key_name, api_key_hash, api_key_prefix, api_secret_hash,
        key_type, scopes, description, rate_limit_per_minute, rate_limit_per_hour,
        rate_limit_per_day, ip_whitelist, allowed_origins, geo_restrictions, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING key_id, key_name, api_key_prefix, key_type, scopes, status, created_at`,
      [
        tenant_id, partner_id, key_name, apiKeyHash, apiKeyPrefix, apiSecretHash,
        key_type, scopes, description, rate_limit_per_minute, rate_limit_per_hour,
        rate_limit_per_day, ip_whitelist, allowed_origins, 
        geo_restrictions ? JSON.stringify(geo_restrictions) : null,
        expires_at, created_by
      ]
    );

    return {
      ...result.rows[0],
      api_key: apiKey, // Only returned once at creation
      api_secret: apiSecret // Only returned once at creation
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(apiKey) {
    // Get all active keys
    const keys = await pool.query(
      `SELECT key_id, tenant_id, partner_id, api_key_hash, scopes, 
              rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day,
              ip_whitelist, allowed_origins, geo_restrictions, expires_at
       FROM api_gateway_keys
       WHERE status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())`
    );

    // Find matching key by comparing hashes
    for (const key of keys.rows) {
      const isMatch = await bcrypt.compare(apiKey, key.api_key_hash);
      if (isMatch) {
        // Update last used timestamp
        await pool.query(
          `UPDATE api_gateway_keys 
           SET last_used_at = NOW(), total_requests = total_requests + 1
           WHERE key_id = $1`,
          [key.key_id]
        );
        
        return key;
      }
    }

    return null;
  }

  /**
   * Check rate limits for an API key
   */
  async checkRateLimit(keyId, timeWindow = 'minute') {
    const now = new Date();
    let timeThreshold;
    let limitColumn;

    switch (timeWindow) {
      case 'minute':
        timeThreshold = new Date(now - 60 * 1000);
        limitColumn = 'rate_limit_per_minute';
        break;
      case 'hour':
        timeThreshold = new Date(now - 60 * 60 * 1000);
        limitColumn = 'rate_limit_per_hour';
        break;
      case 'day':
        timeThreshold = new Date(now - 24 * 60 * 60 * 1000);
        limitColumn = 'rate_limit_per_day';
        break;
      default:
        throw new Error('Invalid time window');
    }

    // Get rate limit and current usage
    const result = await pool.query(
      `SELECT k.${limitColumn} as rate_limit,
              COUNT(l.log_id) as current_usage
       FROM api_gateway_keys k
       LEFT JOIN api_usage_logs l ON k.key_id = l.key_id 
         AND l.timestamp > $2
       WHERE k.key_id = $1
       GROUP BY k.key_id, k.${limitColumn}`,
      [keyId, timeThreshold]
    );

    if (result.rows.length === 0) {
      return { allowed: false, reason: 'Key not found' };
    }

    const { rate_limit, current_usage } = result.rows[0];
    const allowed = current_usage < rate_limit;

    return {
      allowed,
      rate_limit,
      current_usage,
      remaining: Math.max(0, rate_limit - current_usage)
    };
  }

  /**
   * Log API usage
   */
  async logApiUsage(data) {
    const {
      key_id,
      tenant_id,
      endpoint,
      method,
      status_code,
      response_time_ms,
      ip_address,
      user_agent,
      geo_location,
      request_size,
      response_size,
      error_message
    } = data;

    await pool.query(
      `INSERT INTO api_usage_logs
       (key_id, tenant_id, endpoint, method, status_code, response_time_ms,
        ip_address, user_agent, geo_location, request_size, response_size, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        key_id, tenant_id, endpoint, method, status_code, response_time_ms,
        ip_address, user_agent, geo_location ? JSON.stringify(geo_location) : null,
        request_size, response_size, error_message
      ]
    );

    // Update success/failure counters
    if (status_code >= 200 && status_code < 300) {
      await pool.query(
        `UPDATE api_gateway_keys 
         SET successful_requests = successful_requests + 1
         WHERE key_id = $1`,
        [key_id]
      );
    } else {
      await pool.query(
        `UPDATE api_gateway_keys 
         SET failed_requests = failed_requests + 1
         WHERE key_id = $1`,
        [key_id]
      );
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(filters = {}) {
    const { key_id, tenant_id, start_date, end_date, group_by = 'day' } = filters;

    let dateFormat;
    switch (group_by) {
      case 'hour':
        dateFormat = "date_trunc('hour', timestamp)";
        break;
      case 'day':
        dateFormat = "date_trunc('day', timestamp)";
        break;
      case 'month':
        dateFormat = "date_trunc('month', timestamp)";
        break;
      default:
        dateFormat = "date_trunc('day', timestamp)";
    }

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (key_id) {
      conditions.push(`key_id = $${paramCount++}`);
      params.push(key_id);
    }
    if (tenant_id) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenant_id);
    }
    if (start_date) {
      conditions.push(`timestamp >= $${paramCount++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`timestamp <= $${paramCount++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT 
         ${dateFormat} as period,
         COUNT(*) as total_requests,
         COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
         COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests,
         AVG(response_time_ms)::integer as avg_response_time,
         SUM(request_size) as total_request_size,
         SUM(response_size) as total_response_size
       FROM api_usage_logs
       ${whereClause}
       GROUP BY period
       ORDER BY period DESC`,
      params
    );

    return result.rows;
  }

  /**
   * Get popular endpoints
   */
  async getPopularEndpoints(filters = {}) {
    const { key_id, tenant_id, limit = 10 } = filters;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (key_id) {
      conditions.push(`key_id = $${paramCount++}`);
      params.push(key_id);
    }
    if (tenant_id) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenant_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);

    const result = await pool.query(
      `SELECT 
         endpoint,
         method,
         COUNT(*) as request_count,
         AVG(response_time_ms)::integer as avg_response_time,
         COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as success_count,
         COUNT(*) FILTER (WHERE status_code >= 400) as error_count
       FROM api_usage_logs
       ${whereClause}
       GROUP BY endpoint, method
       ORDER BY request_count DESC
       LIMIT $${paramCount}`,
      params
    );

    return result.rows;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId, revokedBy) {
    await pool.query(
      `UPDATE api_gateway_keys 
       SET status = 'revoked', updated_at = NOW()
       WHERE key_id = $1`,
      [keyId]
    );

    // Log to audit
    await pool.query(
      `INSERT INTO audit_logs (action, resource_type, resource_id, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      ['revoke_api_key', 'api_key', keyId, revokedBy, JSON.stringify({ reason: 'Manual revocation' })]
    );
  }

  /**
   * Update API key settings
   */
  async updateApiKey(keyId, updates) {
    const allowedFields = [
      'key_name', 'scopes', 'description', 'rate_limit_per_minute',
      'rate_limit_per_hour', 'rate_limit_per_day', 'ip_whitelist',
      'allowed_origins', 'geo_restrictions', 'expires_at', 'status'
    ];

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount++}`);
        // Handle JSONB fields
        if (['geo_restrictions'].includes(key) && value !== null) {
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
    params.push(keyId);

    const result = await pool.query(
      `UPDATE api_gateway_keys 
       SET ${updateFields.join(', ')}
       WHERE key_id = $${paramCount}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  /**
   * List API keys
   */
  async listApiKeys(filters = {}) {
    const { tenant_id, partner_id, key_type, status, limit = 50, offset = 0 } = filters;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (tenant_id) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenant_id);
    }
    if (partner_id) {
      conditions.push(`partner_id = $${paramCount++}`);
      params.push(partner_id);
    }
    if (key_type) {
      conditions.push(`key_type = $${paramCount++}`);
      params.push(key_type);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT key_id, tenant_id, partner_id, key_name, api_key_prefix, key_type,
              scopes, status, total_requests, successful_requests, failed_requests,
              last_used_at, expires_at, created_at, updated_at
       FROM api_gateway_keys
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return result.rows;
  }
}

module.exports = new ApiGatewayService();
