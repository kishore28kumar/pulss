const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenantMiddleware, enforceTenantIsolation } = require('../middleware/tenant');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(enforceTenantIsolation);

router.get('/', transactionsController.getTransactions);
router.post('/', requireRole('admin', 'super_admin'), transactionsController.createTransaction);
router.get('/customer/:customer_id', transactionsController.getCustomerTransactions);

module.exports = router;
