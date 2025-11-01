const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenantMiddleware, enforceTenantIsolation } = require('../middleware/tenant');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(enforceTenantIsolation);

router.get('/', rewardsController.getRewards);
router.post('/', requireRole('admin', 'super_admin'), rewardsController.createReward);
router.post('/redeem', rewardsController.redeemReward);
router.get('/customer/:customer_id/redemptions', rewardsController.getCustomerRedemptions);

module.exports = router;
