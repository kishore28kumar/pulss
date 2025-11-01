const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const transactionsRoutes = require('./routes/transactions');
const rewardsRoutes = require('./routes/rewards');
const tenantsRoutes = require('./routes/tenants');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const ledgerRoutes = require('./routes/ledger');
const n8nRoutes = require('./routes/n8n');
const notificationsRoutes = require('./routes/notifications');
const advancedNotificationsRoutes = require('./routes/advancedNotifications');
const superAdminNotificationsRoutes = require('./routes/superAdminNotifications');
const cartRoutes = require('./routes/cart');
const paymentMethodsRoutes = require('./routes/paymentMethods');
const superAdminRoutes = require('./routes/superAdmin');
const bulkOperationsRoutes = require('./routes/bulkOperations');
const privacyRoutes = require('./routes/privacy');
const auditLogsRoutes = require('./routes/auditLogs');
const messagingRoutes = require('./routes/messaging');
const trackingRoutes = require('./routes/tracking');
const analyticsRoutes = require('./routes/analytics');
const superAdminAnalyticsRoutes = require('./routes/superAdminAnalytics');
const apiGatewayRoutes = require('./routes/apiGateway');
const partnersRoutes = require('./routes/partners');
const oauthRoutes = require('./routes/oauth');
const brandingRoutes = require('./routes/branding');
const customDomainsRoutes = require('./routes/customDomains');
const rbacRoutes = require('./routes/rbac');
const billingRoutes = require('./routes/billing');
const apiManagementRoutes = require('./routes/apiManagement');
const invitesRoutes = require('./routes/invites');
const cacheManagementRoutes = require('./routes/cacheManagement');

const {
  securityHeaders,
  sanitizeInput,
  apiLimiter,
  authLimiter,
  corsOptions,
} = require('./middleware/security');
const { apiLimiter: generalApiLimiter, speedLimiter } = require('./middleware/rateLimiter');
const { enforceHttps, hsts } = require('./middleware/httpsEnforce');
const { auditLoggerMiddleware } = require('./middleware/auditLogger');
const { cachePresets } = require('./middleware/cache');

const app = express();

// HTTPS enforcement (must be first)
app.use(enforceHttps);
app.use(hsts);

// Enhanced security middleware
app.use(securityHeaders);

// Hardened CORS configuration
app.use(cors(corsOptions));

// Compression middleware for response compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balanced compression level
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Audit logging middleware (after auth, before routes)
app.use(auditLoggerMiddleware({ resourceType: 'api' }));

// Rate limiting - apply to all routes
app.use(speedLimiter);

// Trust proxy (needed for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pulss API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
}));

// API Routes with rate limiting and caching
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customers', apiLimiter, customersRoutes);
app.use('/api/transactions', apiLimiter, transactionsRoutes);
app.use('/api/rewards', apiLimiter, rewardsRoutes);
app.use('/api/tenants', apiLimiter, cachePresets.medium(), tenantsRoutes);
app.use('/api/products', apiLimiter, cachePresets.short(), productsRoutes);
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/ledger', apiLimiter, ledgerRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/advanced-notifications', apiLimiter, advancedNotificationsRoutes);
app.use('/api/super-admin/notifications', apiLimiter, superAdminNotificationsRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/payment-methods', apiLimiter, cachePresets.medium(), paymentMethodsRoutes);
app.use('/api/super-admin', apiLimiter, superAdminRoutes);
app.use('/api/bulk', apiLimiter, bulkOperationsRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/privacy', cachePresets.static(), privacyRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', apiLimiter, cachePresets.short(), analyticsRoutes);
app.use('/api/super-admin/analytics', apiLimiter, cachePresets.short(), superAdminAnalyticsRoutes);
app.use('/api/gateway', apiLimiter, apiGatewayRoutes);
app.use('/api/partners', apiLimiter, cachePresets.medium(), partnersRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/branding', apiLimiter, cachePresets.long(), brandingRoutes);
app.use('/api/custom-domains', apiLimiter, cachePresets.long(), customDomainsRoutes);
app.use('/api/rbac', apiLimiter, cachePresets.medium(), rbacRoutes);
app.use('/api/billing', apiLimiter, billingRoutes);
app.use('/api/api-management', apiManagementRoutes);
app.use('/api/invites', apiLimiter, invitesRoutes);
app.use('/api/cache', apiLimiter, cacheManagementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;
