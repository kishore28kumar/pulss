/**
 * Analytics Controller
 * Handles business intelligence and analytics endpoints
 */

const analyticsService = require('../services/analyticsService');

/**
 * Get sales trends
 */
exports.getSalesTrends = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getSalesTrends(
      tenantId,
      startDate,
      endDate,
      groupBy
    );

    res.json(result);
  } catch (error) {
    console.error('Get sales trends error:', error);
    res.status(500).json({ error: 'Failed to get sales trends' });
  }
};

/**
 * Get cohort analysis
 */
exports.getCohortAnalysis = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getCohortAnalysis(
      tenantId,
      startDate,
      endDate
    );

    res.json(result);
  } catch (error) {
    console.error('Get cohort analysis error:', error);
    res.status(500).json({ error: 'Failed to get cohort analysis' });
  }
};

/**
 * Get customer segmentation
 */
exports.getCustomerSegmentation = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await analyticsService.getCustomerSegmentation(tenantId);
    res.json(result);
  } catch (error) {
    console.error('Get customer segmentation error:', error);
    res.status(500).json({ error: 'Failed to get customer segmentation' });
  }
};

/**
 * Get product performance
 */
exports.getProductPerformance = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getProductPerformance(
      tenantId,
      startDate,
      endDate
    );

    res.json(result);
  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({ error: 'Failed to get product performance' });
  }
};

/**
 * Get category performance
 */
exports.getCategoryPerformance = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getCategoryPerformance(
      tenantId,
      startDate,
      endDate
    );

    res.json(result);
  } catch (error) {
    console.error('Get category performance error:', error);
    res.status(500).json({ error: 'Failed to get category performance' });
  }
};

/**
 * Get comprehensive dashboard metrics
 */
exports.getDashboard = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getDashboardMetrics(
      tenantId,
      startDate,
      endDate
    );

    res.json(result);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard metrics' });
  }
};

/**
 * Get churn prediction
 */
exports.getChurnPrediction = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await analyticsService.getChurnPrediction(tenantId);
    res.json(result);
  } catch (error) {
    console.error('Get churn prediction error:', error);
    res.status(500).json({ error: 'Failed to get churn prediction' });
  }
};

/**
 * Get admin dashboard data
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.getAdminDashboard(
      tenantId,
      startDate,
      endDate
    );

    res.json(result);
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get admin dashboard data' });
  }
};

/**
 * Export orders data
 */
exports.exportOrders = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await analyticsService.exportOrders(tenantId, startDate, endDate);
    res.json(result);
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: 'Failed to export orders' });
  }
};

/**
 * Export customers data
 */
exports.exportCustomers = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await analyticsService.exportCustomers(tenantId);
    res.json(result);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: 'Failed to export customers' });
  }
};

/**
 * Export products data
 */
exports.exportProducts = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await analyticsService.exportProducts(tenantId);
    res.json(result);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
};
