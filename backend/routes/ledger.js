const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ledgerController = require('../controllers/ledgerController');

// Request credit for order (customer)
router.post(
  '/orders/:id/request-credit',
  authMiddleware,
  requireRole('customer'),
  ledgerController.requestCredit
);

// Approve/reject credit request (admin)
router.post(
  '/orders/:id/approve-credit',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ledgerController.approveCredit
);

// Get customer ledger
router.get(
  '/customers/:id',
  authMiddleware,
  ledgerController.getCustomerLedger
);

// Record payment (admin)
router.post(
  '/:id/payment',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ledgerController.recordPayment
);

// Get pending credit requests for tenant (admin)
router.get(
  '/tenants/:tenant_id/pending',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ledgerController.getPendingCreditRequests
);

module.exports = router;
