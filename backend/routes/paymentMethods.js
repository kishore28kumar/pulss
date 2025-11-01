const express = require('express');
const router = express.Router();
const paymentMethodsController = require('../controllers/paymentMethodsController');
const { authenticateToken } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');

// All routes require authentication
router.use(authenticateToken);

// Get saved payment methods
router.get('/', paymentMethodsController.getPaymentMethods);

// Add payment method
router.post('/', paymentMethodsController.addPaymentMethod);

// Update payment method
router.put('/:id', paymentMethodsController.updatePaymentMethod);

// Delete payment method
router.delete('/:id', paymentMethodsController.deletePaymentMethod);

// Get order history (for reorder)
router.get('/order-history', tenantContext, paymentMethodsController.getOrderHistory);

// Reorder
router.post('/reorder', tenantContext, paymentMethodsController.reorder);

module.exports = router;
