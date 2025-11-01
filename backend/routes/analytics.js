/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

// Get sales trends
router.get('/sales-trends', authMiddleware, analyticsController.getSalesTrends);

// Get cohort analysis
router.get('/cohort-analysis', authMiddleware, analyticsController.getCohortAnalysis);

// Get customer segmentation
router.get('/customer-segmentation', authMiddleware, analyticsController.getCustomerSegmentation);

// Get product performance
router.get('/product-performance', authMiddleware, analyticsController.getProductPerformance);

// Get category performance
router.get('/category-performance', authMiddleware, analyticsController.getCategoryPerformance);

// Get comprehensive dashboard
router.get('/dashboard', authMiddleware, analyticsController.getDashboard);

// Get churn prediction
router.get('/churn-prediction', authMiddleware, analyticsController.getChurnPrediction);

// Get admin dashboard (comprehensive business summary)
router.get('/admin-dashboard', authMiddleware, analyticsController.getAdminDashboard);

// Export endpoints
router.get('/export/orders', authMiddleware, analyticsController.exportOrders);
router.get('/export/customers', authMiddleware, analyticsController.exportCustomers);
router.get('/export/products', authMiddleware, analyticsController.exportProducts);

module.exports = router;
