const express = require('express');
const router = express.Router();
const bulkOperationsController = require('../controllers/bulkOperationsController');
const { authenticateToken } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantContext);

// Bulk import products
router.post('/products/import', bulkOperationsController.bulkImportProducts);

// Bulk update prices
router.post('/products/prices', bulkOperationsController.bulkUpdatePrices);

// Export orders
router.get('/orders/export', bulkOperationsController.exportOrders);

// Export products
router.get('/products/export', bulkOperationsController.exportProducts);

// Get bulk operation status
router.get('/operations/:id', bulkOperationsController.getBulkOperationStatus);

// List bulk operations
router.get('/operations', bulkOperationsController.listBulkOperations);

module.exports = router;
