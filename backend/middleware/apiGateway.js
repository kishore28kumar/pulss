const apiGatewayService = require('../services/apiGatewayService');
const oauthService = require('../services/oauthService');
const { pool } = require('../config/db');

/**
 * API Gateway Middleware
 * Handles authentication, rate limiting, IP whitelisting, and geo-fencing
 */

/**
 * Authenticate API key or OAuth token
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Missing authorization header',
        code: 'MISSING_AUTH'
      });
    }

    let apiKey, tokenType;

    // Support both "Bearer" and "ApiKey" auth schemes
    if (authHeader.startsWith('Bearer ')) {
      tokenType = 'bearer';
      apiKey = authHeader.substring(7);
    } else if (authHeader.startsWith('ApiKey ')) {
      tokenType = 'apikey';
      apiKey = authHeader.substring(7);
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use "Bearer <token>" or "ApiKey <key>"',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    // Try OAuth token validation first if Bearer token
    let authData;
    if (tokenType === 'bearer') {
      authData = await oauthService.validateToken(apiKey, 'access');
      if (authData) {
        req.partner = authData;
        req.scopes = authData.scopes;
        return next();
      }
    }

    // Try API key validation
    authData = await apiGatewayService.validateApiKey(apiKey);

    if (!authData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if tenant has API gateway enabled
    const featureCheck = await pool.query(
      `SELECT api_gateway_enabled FROM feature_flags WHERE tenant_id = $1`,
      [authData.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_gateway_enabled) {
      return res.status(403).json({
        success: false,
        error: 'API Gateway not enabled for this tenant',
        code: 'API_GATEWAY_DISABLED'
      });
    }

    // Attach auth data to request
    req.apiKey = authData;
    req.scopes = authData.scopes;

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Check if request has required scopes
 */
const requireScopes = (...requiredScopes) => {
  return (req, res, next) => {
    const userScopes = req.scopes || [];

    const hasAllScopes = requiredScopes.every(scope => userScopes.includes(scope));

    if (!hasAllScopes) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_SCOPES',
        required_scopes: requiredScopes,
        user_scopes: userScopes
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      return next();
    }

    // Check if rate limiting is enabled for tenant
    const featureCheck = await pool.query(
      `SELECT api_rate_limiting_enabled FROM feature_flags WHERE tenant_id = $1`,
      [req.apiKey.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_rate_limiting_enabled) {
      return next();
    }

    // Check rate limits
    const minuteLimit = await apiGatewayService.checkRateLimit(req.apiKey.key_id, 'minute');
    const hourLimit = await apiGatewayService.checkRateLimit(req.apiKey.key_id, 'hour');
    const dayLimit = await apiGatewayService.checkRateLimit(req.apiKey.key_id, 'day');

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit-Minute', minuteLimit.rate_limit);
    res.setHeader('X-RateLimit-Remaining-Minute', minuteLimit.remaining);
    res.setHeader('X-RateLimit-Limit-Hour', hourLimit.rate_limit);
    res.setHeader('X-RateLimit-Remaining-Hour', hourLimit.remaining);
    res.setHeader('X-RateLimit-Limit-Day', dayLimit.rate_limit);
    res.setHeader('X-RateLimit-Remaining-Day', dayLimit.remaining);

    // Check if any limit is exceeded
    if (!minuteLimit.allowed || !hourLimit.allowed || !dayLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        rate_limits: {
          minute: minuteLimit,
          hour: hourLimit,
          day: dayLimit
        }
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block request on rate limit check error
    next();
  }
};

/**
 * IP whitelisting middleware
 */
const ipWhitelistMiddleware = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      return next();
    }

    // Check if IP whitelisting is enabled
    const featureCheck = await pool.query(
      `SELECT api_ip_whitelisting_enabled FROM feature_flags WHERE tenant_id = $1`,
      [req.apiKey.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_ip_whitelisting_enabled) {
      return next();
    }

    const ipWhitelist = req.apiKey.ip_whitelist || [];

    if (ipWhitelist.length === 0) {
      return next();
    }

    // Get client IP
    const clientIp = req.ip || req.connection.remoteAddress;

    // Simple IP matching (in production, use a library like ipaddr.js for CIDR matching)
    const isWhitelisted = ipWhitelist.some(ip => clientIp.includes(ip));

    if (!isWhitelisted) {
      return res.status(403).json({
        success: false,
        error: 'IP address not whitelisted',
        code: 'IP_NOT_WHITELISTED',
        client_ip: clientIp
      });
    }

    next();
  } catch (error) {
    console.error('IP whitelist check error:', error);
    next();
  }
};

/**
 * Geo-fencing middleware
 */
const geoFencingMiddleware = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      return next();
    }

    // Check if geo-fencing is enabled
    const featureCheck = await pool.query(
      `SELECT api_geo_fencing_enabled FROM feature_flags WHERE tenant_id = $1`,
      [req.apiKey.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_geo_fencing_enabled) {
      return next();
    }

    const geoRestrictions = req.apiKey.geo_restrictions;

    if (!geoRestrictions) {
      return next();
    }

    // In production, use a geo-IP service to get country from IP
    // For now, we'll check if geo_location is passed in headers
    const clientCountry = req.headers['x-client-country'];

    if (!clientCountry) {
      // If no country info available, allow the request
      return next();
    }

    const { allowed = [], blocked = [] } = geoRestrictions;

    // Check blocked countries first
    if (blocked.length > 0 && blocked.includes(clientCountry)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied from this location',
        code: 'GEO_BLOCKED',
        country: clientCountry
      });
    }

    // Check allowed countries
    if (allowed.length > 0 && !allowed.includes(clientCountry)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied from this location',
        code: 'GEO_NOT_ALLOWED',
        country: clientCountry
      });
    }

    next();
  } catch (error) {
    console.error('Geo-fencing check error:', error);
    next();
  }
};

/**
 * API usage logging middleware
 */
const apiUsageLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture response data
  const originalSend = res.send;
  let responseSize = 0;

  res.send = function (data) {
    responseSize = Buffer.byteLength(JSON.stringify(data));
    originalSend.call(this, data);
  };

  // Log after response is sent
  res.on('finish', async () => {
    if (!req.apiKey && !req.partner) {
      return;
    }

    const responseTime = Date.now() - startTime;
    const requestSize = parseInt(req.headers['content-length']) || 0;

    try {
      await apiGatewayService.logApiUsage({
        key_id: req.apiKey?.key_id || req.partner?.key_id,
        tenant_id: req.apiKey?.tenant_id || null,
        endpoint: req.originalUrl,
        method: req.method,
        status_code: res.statusCode,
        response_time_ms: responseTime,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        geo_location: req.headers['x-client-country'] ? { country: req.headers['x-client-country'] } : null,
        request_size: requestSize,
        response_size: responseSize,
        error_message: res.statusCode >= 400 ? res.statusMessage : null
      });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  });

  next();
};

/**
 * Combined API gateway middleware
 */
const apiGatewayMiddleware = [
  authenticateApiKey,
  ipWhitelistMiddleware,
  geoFencingMiddleware,
  rateLimitMiddleware,
  apiUsageLogger
];

module.exports = {
  authenticateApiKey,
  requireScopes,
  rateLimitMiddleware,
  ipWhitelistMiddleware,
  geoFencingMiddleware,
  apiUsageLogger,
  apiGatewayMiddleware
};
