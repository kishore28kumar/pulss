const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General API rate limiter - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Stricter rate limiter for authentication endpoints - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Create account rate limiter - 3 accounts per hour per IP
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Account creation limit exceeded',
      message: 'Too many accounts created from this IP address. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Slow down middleware - gradually increases response time for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after the limit
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Password reset rate limiter - 3 attempts per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Password reset limit exceeded',
      message: 'Too many password reset attempts. Please try again in an hour.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Audit log viewing rate limiter - 100 requests per 15 minutes
const auditLogsViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many audit log requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded for audit log viewing. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Audit log export rate limiter - 10 exports per hour
const auditLogsExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many export requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Export rate limit exceeded',
      message: 'You can only export audit logs 10 times per hour.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Audit configuration update rate limiter - 20 updates per hour
const auditConfigUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many configuration updates. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Configuration update rate limit exceeded',
      message: 'You can only update audit configuration 20 times per hour.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Audit alert creation rate limiter - 5 alerts per hour
const auditAlertCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many alert creation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Alert creation rate limit exceeded',
      message: 'You can only create 5 alerts per hour.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  createAccountLimiter,
  speedLimiter,
  passwordResetLimiter,
  auditLogsViewLimiter,
  auditLogsExportLimiter,
  auditConfigUpdateLimiter,
  auditAlertCreationLimiter
};
