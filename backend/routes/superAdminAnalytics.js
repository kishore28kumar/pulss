/**
 * Super Admin Analytics Routes
 * Comprehensive analytics endpoints for super admin dashboard
 */

const express = require('express');
const router = express.Router();
const superAdminAnalyticsController = require('../controllers/superAdminAnalyticsController');
const { authMiddleware } = require('../middleware/auth');
const superAdminAuth = require('../middleware/superAdminAuth');

// All routes require super admin authentication
router.use(authMiddleware);
router.use(superAdminAuth);

// Get chemist-wise (tenant) analytics
router.get('/chemist-wise', superAdminAnalyticsController.getChemistWiseAnalytics);

// Get area-wise analytics
router.get('/area-wise', superAdminAnalyticsController.getAreaWiseAnalytics);

// Get product-wise sales by area
router.get('/product-by-area', superAdminAnalyticsController.getProductSalesByArea);

// Get time-based trends
router.get('/time-trends', superAdminAnalyticsController.getTimeTrends);

// Get product performance trends
router.get('/product-trends', superAdminAnalyticsController.getProductPerformanceTrends);

// Get smart insights and recommendations
router.get('/insights', superAdminAnalyticsController.getSmartInsights);

// Get comprehensive dashboard data
router.get('/dashboard', superAdminAnalyticsController.getDashboard);

// Export data to Excel
router.get('/export/excel', superAdminAnalyticsController.exportToExcel);

// Export data to CSV
router.get('/export/csv', superAdminAnalyticsController.exportToCSV);

module.exports = router;
