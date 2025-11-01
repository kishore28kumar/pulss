const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenantMiddleware, enforceTenantIsolation } = require('../middleware/tenant');
const {
  getN8nHealth,
  getWorkflowTriggers,
  getAvailableEvents,
  updateWorkflowTrigger,
  deleteWorkflowTrigger,
  getWebhookLogs,
  testWebhook,
  getWebhookStats
} = require('../controllers/n8nController');

// All routes require authentication
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(enforceTenantIsolation);

// Health check (admin and super_admin)
router.get('/health', requireRole('admin', 'super_admin'), getN8nHealth);

// Get available webhook events (admin and super_admin)
router.get('/events', requireRole('admin', 'super_admin'), getAvailableEvents);

// Workflow triggers management (admin and super_admin)
router.get('/triggers', requireRole('admin', 'super_admin'), getWorkflowTriggers);
router.post('/triggers', requireRole('admin', 'super_admin'), updateWorkflowTrigger);
router.delete('/triggers/:id', requireRole('admin', 'super_admin'), deleteWorkflowTrigger);

// Webhook logs (admin and super_admin)
router.get('/logs', requireRole('admin', 'super_admin'), getWebhookLogs);
router.get('/stats', requireRole('admin', 'super_admin'), getWebhookStats);

// Test webhook (admin and super_admin)
router.post('/test', requireRole('admin', 'super_admin'), testWebhook);

module.exports = router;
