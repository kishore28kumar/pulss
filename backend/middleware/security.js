const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Security Middleware
 * Implements rate limiting, security headers, and other security best practices
 */

// Rate limiting configuration
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaults, ...options });
};

// General API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Strict rate limiter for authentication
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true
});

// Rate limiter for cart operations
const cartLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30
});

// Rate limiter for search
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60
});

// Configure security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.supabase.io", "wss:"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  /**
   * Escape HTML entities to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  // Sanitize request body (only for string fields that might be displayed)
  if (req.body && typeof req.body === 'object') {
    // Note: Only sanitize fields that will be displayed as HTML
    // Don't sanitize passwords, tokens, or data that won't be rendered
    const fieldsToSanitize = ['name', 'description', 'comment', 'message', 'title'];
    fieldsToSanitize.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = escapeHtml(req.body[field]);
      }
    });
  }

  // Sanitize query parameters (all query params should be safe)
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Basic sanitization for query params
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

// Audit logging middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    const db = require('../config/db');
    
    // Store original send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after response
      setImmediate(async () => {
        try {
          const userId = req.user?.id || null;
          const tenantId = req.tenant?.id || null;
          const resourceId = req.params?.id || null;
          
          await db.query(
            `INSERT INTO audit_logs 
             (tenant_id, user_id, action, resource_type, resource_id, ip_address, user_agent) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              tenantId,
              userId,
              action,
              req.baseUrl.split('/').pop() || 'unknown',
              resourceId,
              req.ip || req.connection.remoteAddress,
              req.get('user-agent')
            ]
          );
        } catch (error) {
          console.error('Error logging audit:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// IP whitelist middleware (for admin operations)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    res.status(403).json({
      success: false,
      message: 'Access denied. IP not whitelisted.'
    });
  };
};

// API key validation middleware
const validateApiKey = async (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  try {
    const db = require('../config/db');
    
    const result = await db.query(
      `SELECT tenant_id, scopes, is_active 
       FROM api_keys 
       WHERE api_key = $1`,
      [apiKey]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }

    // Update last used timestamp
    await db.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE api_key = $1`,
      [apiKey]
    );

    // Attach API key info to request
    req.apiKey = {
      tenant_id: result.rows[0].tenant_id,
      scopes: result.rows[0].scopes
    };

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating API key'
    });
  }
};

// Check API key scope
const requireScope = (requiredScope) => {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.scopes) {
      return res.status(403).json({
        success: false,
        message: 'API key authentication required'
      });
    }

    if (!req.apiKey.scopes.includes(requiredScope)) {
      return res.status(403).json({
        success: false,
        message: `Missing required scope: ${requiredScope}`
      });
    }

    next();
  };
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  apiLimiter,
  authLimiter,
  cartLimiter,
  searchLimiter,
  securityHeaders,
  sanitizeInput,
  auditLog,
  ipWhitelist,
  validateApiKey,
  requireScope,
  corsOptions,
  createRateLimiter
};
