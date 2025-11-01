const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * API Key Authentication Middleware
 * Authenticates requests using API keys instead of JWT tokens
 */

// Verify API key and check permissions
const verifyApiKey = async (req, res, next) => {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid API key',
        message: 'Please provide a valid API key in the Authorization header'
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate API key format (should start with pk_)
    if (!apiKey.startsWith('pk_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
        message: 'API keys must start with pk_'
      });
    }

    // Query database for API key
    const result = await db.query(
      `SELECT ak.*, aff.* 
       FROM api_keys ak
       LEFT JOIN api_feature_flags aff ON ak.tenant_id = aff.tenant_id
       WHERE ak.api_key = $1 AND ak.is_active = true`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'API key not found or has been revoked'
      });
    }

    const apiKeyData = result.rows[0];

    // Check if API key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'API key expired',
        message: 'This API key has expired. Please generate a new one.'
      });
    }

    // Check if API is enabled for this tenant
    if (!apiKeyData.api_enabled) {
      return res.status(403).json({
        success: false,
        error: 'API access disabled',
        message: 'API access is disabled for this tenant. Contact support for more information.'
      });
    }

    // Check rate limits
    const rateLimitExceeded = await checkRateLimit(apiKeyData.id, apiKeyData);
    if (rateLimitExceeded) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: rateLimitExceeded.message,
        retryAfter: rateLimitExceeded.retryAfter
      });
    }

    // Update last used timestamp and request count
    await db.query(
      `UPDATE api_keys 
       SET last_used_at = NOW(), total_requests = total_requests + 1 
       WHERE id = $1`,
      [apiKeyData.id]
    );

    // Log API usage asynchronously (don't wait for it)
    logApiUsage(req, apiKeyData).catch(err => 
      console.error('Failed to log API usage:', err)
    );

    // Attach API key data to request
    req.apiKey = {
      id: apiKeyData.id,
      tenant_id: apiKeyData.tenant_id,
      scopes: apiKeyData.scopes || [],
      permissions: apiKeyData.permissions || {},
      key_name: apiKeyData.key_name
    };

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred while verifying your API key'
    });
  }
};

// Check if API key has exceeded rate limits
async function checkRateLimit(apiKeyId, apiKeyData) {
  try {
    const now = new Date();
    
    // Check hourly limit
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    
    const hourlyCount = await getRateLimitCount(apiKeyId, hourStart, 'hour');
    if (hourlyCount >= apiKeyData.rate_limit_per_hour) {
      const retryAfter = Math.ceil((3600000 - (now - hourStart)) / 1000);
      return {
        message: `Hourly rate limit of ${apiKeyData.rate_limit_per_hour} requests exceeded`,
        retryAfter
      };
    }

    // Check daily limit
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    const dailyCount = await getRateLimitCount(apiKeyId, dayStart, 'day');
    if (dailyCount >= apiKeyData.rate_limit_per_day) {
      const retryAfter = Math.ceil((86400000 - (now - dayStart)) / 1000);
      return {
        message: `Daily rate limit of ${apiKeyData.rate_limit_per_day} requests exceeded`,
        retryAfter
      };
    }

    // Check monthly limit
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyCount = await getRateLimitCount(apiKeyId, monthStart, 'month');
    if (monthlyCount >= apiKeyData.rate_limit_per_month) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const retryAfter = Math.ceil((nextMonth - now) / 1000);
      return {
        message: `Monthly rate limit of ${apiKeyData.rate_limit_per_month} requests exceeded`,
        retryAfter
      };
    }

    // Increment rate limit counters
    await incrementRateLimit(apiKeyId, hourStart, 'hour');
    await incrementRateLimit(apiKeyId, dayStart, 'day');
    await incrementRateLimit(apiKeyId, monthStart, 'month');

    return null; // No rate limit exceeded
  } catch (error) {
    console.error('Rate limit check error:', error);
    return null; // On error, don't block the request
  }
}

// Get current rate limit count for a window
async function getRateLimitCount(apiKeyId, windowStart, windowType) {
  const result = await db.query(
    `SELECT request_count FROM api_rate_limits
     WHERE api_key_id = $1 AND window_start = $2 AND window_type = $3`,
    [apiKeyId, windowStart, windowType]
  );
  
  return result.rows.length > 0 ? result.rows[0].request_count : 0;
}

// Increment rate limit counter
async function incrementRateLimit(apiKeyId, windowStart, windowType) {
  await db.query(
    `INSERT INTO api_rate_limits (api_key_id, window_start, window_type, request_count)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (api_key_id, window_start, window_type)
     DO UPDATE SET request_count = api_rate_limits.request_count + 1`,
    [apiKeyId, windowStart, windowType]
  );
}

// Log API usage for analytics
async function logApiUsage(req, apiKeyData) {
  const startTime = Date.now();
  
  // Hook into response to capture status and timing
  const originalSend = req.res.send;
  req.res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    db.query(
      `INSERT INTO api_usage_logs 
       (tenant_id, api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        apiKeyData.tenant_id,
        apiKeyData.id,
        req.path,
        req.method,
        req.res.statusCode,
        responseTime,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      ]
    ).catch(err => console.error('Failed to log API usage:', err));
    
    return originalSend.call(this, data);
  };
}

// Check if API key has specific permission
const requirePermission = (resource, action = 'read') => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'This endpoint requires API key authentication'
      });
    }

    const permissions = req.apiKey.permissions || {};
    const resourcePerms = permissions[resource] || [];

    if (!resourcePerms.includes(action) && !resourcePerms.includes('*')) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This API key does not have '${action}' permission for '${resource}'`
      });
    }

    next();
  };
};

// Check if API key has specific scope
const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'This endpoint requires API key authentication'
      });
    }

    const scopes = req.apiKey.scopes || [];
    const hasRequiredScope = requiredScopes.some(scope => scopes.includes(scope));

    if (!hasRequiredScope) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient scope',
        message: `This endpoint requires one of these scopes: ${requiredScopes.join(', ')}`
      });
    }

    next();
  };
};

// Add rate limit headers to response
const addRateLimitHeaders = async (req, res, next) => {
  if (req.apiKey) {
    const apiKeyData = await db.query(
      'SELECT * FROM api_keys WHERE id = $1',
      [req.apiKey.id]
    );

    if (apiKeyData.rows.length > 0) {
      const key = apiKeyData.rows[0];
      const now = new Date();
      const hourStart = new Date(now);
      hourStart.setMinutes(0, 0, 0);
      
      const hourlyCount = await getRateLimitCount(req.apiKey.id, hourStart, 'hour');
      
      res.setHeader('X-RateLimit-Limit', key.rate_limit_per_hour);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, key.rate_limit_per_hour - hourlyCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil((hourStart.getTime() + 3600000) / 1000));
    }
  }
  next();
};

module.exports = {
  verifyApiKey,
  requirePermission,
  requireScope,
  addRateLimitHeaders
};
