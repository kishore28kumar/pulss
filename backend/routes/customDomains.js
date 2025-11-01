const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const customDomainsController = require('../controllers/customDomainsController');

// ============================================================================
// CUSTOM DOMAINS ROUTES
// ============================================================================

/**
 * @route   GET /api/custom-domains/:tenant_id
 * @desc    Get all custom domains for a tenant
 * @access  Tenant Admin, Super Admin
 */
router.get('/:tenant_id', authMiddleware, customDomainsController.getCustomDomains);

/**
 * @route   POST /api/custom-domains/:tenant_id
 * @desc    Add a new custom domain
 * @access  Tenant Admin, Super Admin
 */
router.post('/:tenant_id', authMiddleware, customDomainsController.addCustomDomain);

/**
 * @route   POST /api/custom-domains/:tenant_id/:domain_id/verify
 * @desc    Verify domain ownership via DNS
 * @access  Tenant Admin, Super Admin
 */
router.post(
  '/:tenant_id/:domain_id/verify',
  authMiddleware,
  customDomainsController.verifyCustomDomain
);

/**
 * @route   PUT /api/custom-domains/:tenant_id/:domain_id
 * @desc    Update custom domain configuration
 * @access  Tenant Admin, Super Admin
 */
router.put(
  '/:tenant_id/:domain_id',
  authMiddleware,
  customDomainsController.updateCustomDomain
);

/**
 * @route   DELETE /api/custom-domains/:tenant_id/:domain_id
 * @desc    Delete a custom domain
 * @access  Tenant Admin, Super Admin
 */
router.delete(
  '/:tenant_id/:domain_id',
  authMiddleware,
  customDomainsController.deleteCustomDomain
);

/**
 * @route   GET /api/custom-domains/:tenant_id/:domain_id/ssl-status
 * @desc    Check SSL certificate status for domain
 * @access  Tenant Admin, Super Admin
 */
router.get(
  '/:tenant_id/:domain_id/ssl-status',
  authMiddleware,
  customDomainsController.checkSSLStatus
);

module.exports = router;
