const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  auditLogsViewLimiter,
  auditLogsExportLimiter,
  auditConfigUpdateLimiter,
  auditAlertCreationLimiter,
} = require('../middleware/rateLimiter');
const {
  validatePagination,
  validateAuditLogQuery,
  validateExportParams,
  validateAuditConfig,
  validateAlertCreation,
  validateLogId,
} = require('../middleware/auditValidation');
const auditLogsController = require('../controllers/auditLogs');

// All audit log routes require authentication and admin/super_admin role
router.use(authMiddleware);
router.use(requireRole('admin', 'super_admin'));

// ============================================================================
// AUDIT LOG VIEWING
// ============================================================================

// Get audit logs with filtering and pagination
/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit logs with filtering
 *     description: Retrieve system audit logs with optional filtering and pagination (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Results per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT]
 *         description: Filter by action type
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., customer, product, order)
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs up to this date (YYYY-MM-DD)
 */
router.get(
  '/',
  auditLogsViewLimiter,
  validatePagination,
  validateAuditLogQuery,
  auditLogsController.getAuditLogs
);

// Audit logs stats
router.get(
  '/stats',
  auditLogsViewLimiter,
  validateAuditLogQuery,
  auditLogsController.getAuditLogStats
);

// Export audit logs (CSV)
router.get('/export', auditLogsController.exportAuditLogs);

// Get specific audit log by ID
router.get(
  '/:logId',
  auditLogsViewLimiter,
  validateLogId,
  auditLogsController.getAuditLogById
);

// ============================================================================
// AUDIT CONFIGURATION (Super Admin Only)
// ============================================================================

// Get audit configuration
router.get('/config/settings', auditLogsController.getAuditConfig);

// Update audit configuration (super admin only)
router.put(
  '/config/settings',
  requireRole('super_admin'),
  auditConfigUpdateLimiter,
  validateAuditConfig,
  auditLogsController.updateAuditConfig
);

// ============================================================================
// COMPLIANCE
// ============================================================================

// Get compliance templates
router.get('/compliance/templates', auditLogsController.getComplianceTemplates);

// Generate compliance report
router.get('/compliance/report', auditLogsController.getComplianceReport);

// Get retention policies
router.get('/compliance/retention-policies', auditLogsController.getRetentionPolicies);

// ============================================================================
// EXPORT (enhanced)
// ============================================================================

// Export audit logs (enhanced)
router.post(
  '/export/generate',
  auditLogsExportLimiter,
  validateExportParams,
  auditLogsController.exportAuditLogsEnhanced
);

// Get export history
router.get('/export/history', auditLogsController.getExportHistory);

// ============================================================================
// ALERTS (Super Admin Only)
// ============================================================================

// Get audit alerts
router.get('/alerts', auditLogsController.getAuditAlerts);

// Create audit alert (super admin only)
router.post(
  '/alerts',
  requireRole('super_admin'),
  auditAlertCreationLimiter,
  validateAlertCreation,
  auditLogsController.createAuditAlert
);

module.exports = router;
