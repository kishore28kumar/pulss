const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ordersController = require('../controllers/ordersController');

// Create order (customer or admin)
router.post(
  '/tenants/:tenant_id',
  authMiddleware,
  ordersController.createOrder
);

// Accept order (admin only)
router.post(
  '/:id/accept',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.acceptOrder
);

// Pack order (admin only)
router.post(
  '/:id/pack',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.packOrder
);

// Send out / Dispatch order (admin only)
router.post(
  '/:id/send-out',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.sendOutOrder
);

// Deliver order (admin only)
router.post(
  '/:id/deliver',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.deliverOrder
);

// Ready for pickup (admin only)
router.post(
  '/:id/ready-for-pickup',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.readyForPickup
);

// Get order status history
router.get(
  '/:id/history',
  authMiddleware,
  ordersController.getOrderHistory
);

// Get pending acceptance orders for tenant
router.get(
  '/tenants/:tenant_id/pending-acceptance',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.getPendingAcceptanceOrders
);

// Process auto-accept for expired orders (system/admin only)
router.post(
  '/process-auto-accept',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  ordersController.processAutoAccept
);

module.exports = router;
