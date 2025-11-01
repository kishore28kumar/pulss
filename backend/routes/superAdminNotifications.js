/**
 * Super Admin Notifications Routes
 * Handles super admin-only notification control endpoints
 */

const express = require('express');
const router = express.Router();
const superAdminNotificationsController = require('../controllers/superAdminNotificationsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// GLOBAL NOTIFICATION CONTROLS
// ============================================================================

/**
 * Get global notification controls
 * GET /api/super-admin/notifications/controls
 */
router.get('/controls', superAdminNotificationsController.getGlobalControls);

/**
 * Update global notification controls
 * PUT /api/super-admin/notifications/controls
 * Body: {
 *   notifications_enabled, email_enabled, sms_enabled, push_enabled,
 *   webhook_enabled, global_email_daily_limit, global_sms_daily_limit,
 *   global_push_daily_limit, alert_on_high_failure_rate,
 *   failure_rate_threshold, alert_email, email_provider_primary,
 *   email_provider_fallback, sms_provider_primary, sms_provider_fallback
 * }
 */
router.put('/controls', superAdminNotificationsController.updateGlobalControls);

// ============================================================================
// TENANT NOTIFICATION SETTINGS
// ============================================================================

/**
 * Get all tenant notification settings
 * GET /api/super-admin/notifications/tenant-settings
 * Query: page, limit
 */
router.get('/tenant-settings', superAdminNotificationsController.getAllTenantSettings);

/**
 * Get tenant notification settings
 * GET /api/super-admin/notifications/tenant-settings/:tenantId
 */
router.get('/tenant-settings/:tenantId', superAdminNotificationsController.getTenantSettings);

/**
 * Update tenant notification settings
 * PUT /api/super-admin/notifications/tenant-settings/:tenantId
 * Body: {
 *   email_enabled, sms_enabled, push_enabled, webhook_enabled,
 *   in_app_enabled, transactional_enabled, marketing_enabled,
 *   system_enabled, promotional_enabled, email_provider,
 *   email_provider_config, sms_provider, sms_provider_config,
 *   push_provider, push_provider_config, webhook_url, webhook_secret,
 *   webhook_events, email_daily_limit, sms_daily_limit, push_daily_limit,
 *   default_sender_name, default_sender_email, default_reply_to,
 *   default_sms_sender_id, track_opens, track_clicks
 * }
 */
router.put('/tenant-settings/:tenantId', superAdminNotificationsController.updateTenantSettings);

/**
 * Toggle notification channel for tenant
 * POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle
 * Body: { channel: 'email|sms|push|webhook|in_app', enabled: true|false }
 */
router.post('/tenant-settings/:tenantId/toggle', superAdminNotificationsController.toggleTenantChannel);

/**
 * Toggle notification type for tenant
 * POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle-type
 * Body: { notificationType: 'transactional|marketing|system|promotional', enabled: true|false }
 */
router.post('/tenant-settings/:tenantId/toggle-type', superAdminNotificationsController.toggleTenantNotificationType);

// ============================================================================
// PLATFORM ANALYTICS AND MONITORING
// ============================================================================

/**
 * Get platform-wide notification analytics
 * GET /api/super-admin/notifications/analytics
 * Query: startDate, endDate, groupBy
 */
router.get('/analytics', superAdminNotificationsController.getPlatformAnalytics);

/**
 * Get notification delivery logs for monitoring
 * GET /api/super-admin/notifications/delivery-logs
 * Query: page, limit, status, channel, tenantId, startDate, endDate
 */
router.get('/delivery-logs', superAdminNotificationsController.getDeliveryLogs);

/**
 * Retry failed notification
 * POST /api/super-admin/notifications/retry/:notificationId
 */
router.post('/retry/:notificationId', superAdminNotificationsController.retryNotification);

module.exports = router;
