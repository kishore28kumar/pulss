const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantContext);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', cartController.addItem);

// Update cart item
router.put('/items/:id', cartController.updateItem);

// Remove cart item
router.delete('/items/:id', cartController.removeItem);

// Clear cart
router.delete('/', cartController.clearCart);

// Sync cart (for merging guest cart with user cart)
router.post('/sync', cartController.syncCart);

module.exports = router;
