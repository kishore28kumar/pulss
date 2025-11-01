/**
 * Super Admin Analytics Controller
 * Handles super admin analytics endpoints with comprehensive data analysis
 */

const superAdminAnalyticsService = require('../services/superAdminAnalyticsService');
const XLSX = require('xlsx');
const { format } = require('date-fns');

/**
 * Get chemist-wise (tenant) analytics
 */
exports.getChemistWiseAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, tenantId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getChemistWiseAnalytics(
      startDate,
      endDate,
      tenantId
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get chemist-wise analytics error:', error);
    res.status(500).json({ error: 'Failed to get chemist-wise analytics' });
  }
};

/**
 * Get area-wise analytics
 */
exports.getAreaWiseAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'city' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getAreaWiseAnalytics(
      startDate,
      endDate,
      groupBy
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get area-wise analytics error:', error);
    res.status(500).json({ error: 'Failed to get area-wise analytics' });
  }
};

/**
 * Get product-wise sales by area
 */
exports.getProductSalesByArea = async (req, res) => {
  try {
    const { startDate, endDate, area, areaType = 'city' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getProductSalesByArea(
      startDate,
      endDate,
      area,
      areaType
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get product sales by area error:', error);
    res.status(500).json({ error: 'Failed to get product sales by area' });
  }
};

/**
 * Get time-based trends
 */
exports.getTimeTrends = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getTimeTrends(
      startDate,
      endDate,
      groupBy
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get time trends error:', error);
    res.status(500).json({ error: 'Failed to get time trends' });
  }
};

/**
 * Get product performance trends
 */
exports.getProductPerformanceTrends = async (req, res) => {
  try {
    const { startDate, endDate, productId, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getProductPerformanceTrends(
      startDate,
      endDate,
      productId,
      category
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get product performance trends error:', error);
    res.status(500).json({ error: 'Failed to get product performance trends' });
  }
};

/**
 * Get smart insights
 */
exports.getSmartInsights = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getSmartInsights(
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.insights);
  } catch (error) {
    console.error('Get smart insights error:', error);
    res.status(500).json({ error: 'Failed to get smart insights' });
  }
};

/**
 * Get comprehensive dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await superAdminAnalyticsService.getDashboardData(
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

/**
 * Export analytics data to Excel
 */
exports.exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate, dataType = 'dashboard' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    let data;
    let sheetName;

    // Fetch data based on type
    switch (dataType) {
      case 'chemist':
        const chemistResult = await superAdminAnalyticsService.getChemistWiseAnalytics(startDate, endDate);
        data = chemistResult.data;
        sheetName = 'Chemist Analytics';
        break;
      case 'area':
        const areaResult = await superAdminAnalyticsService.getAreaWiseAnalytics(startDate, endDate);
        data = areaResult.data;
        sheetName = 'Area Analytics';
        break;
      case 'product':
        const productResult = await superAdminAnalyticsService.getProductSalesByArea(startDate, endDate);
        data = productResult.data;
        sheetName = 'Product Sales';
        break;
      case 'trends':
        const trendsResult = await superAdminAnalyticsService.getTimeTrends(startDate, endDate);
        data = trendsResult.data;
        sheetName = 'Time Trends';
        break;
      default:
        const dashboardResult = await superAdminAnalyticsService.getDashboardData(startDate, endDate);
        data = dashboardResult.data;
        sheetName = 'Dashboard';
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    let ws;
    if (dataType === 'dashboard') {
      // For dashboard, create multiple sheets
      if (data.chemists) {
        const chemistWs = XLSX.utils.json_to_sheet(data.chemists);
        XLSX.utils.book_append_sheet(wb, chemistWs, 'Chemists');
      }
      if (data.areas) {
        const areaWs = XLSX.utils.json_to_sheet(data.areas);
        XLSX.utils.book_append_sheet(wb, areaWs, 'Areas');
      }
      if (data.products) {
        const productWs = XLSX.utils.json_to_sheet(data.products);
        XLSX.utils.book_append_sheet(wb, productWs, 'Products');
      }
      if (data.trends) {
        const trendWs = XLSX.utils.json_to_sheet(data.trends);
        XLSX.utils.book_append_sheet(wb, trendWs, 'Trends');
      }
      if (data.summary) {
        const summaryWs = XLSX.utils.json_to_sheet([data.summary]);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      }
    } else {
      ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export to Excel error:', error);
    res.status(500).json({ error: 'Failed to export data to Excel' });
  }
};

/**
 * Export analytics data to CSV
 */
exports.exportToCSV = async (req, res) => {
  try {
    const { startDate, endDate, dataType = 'dashboard' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    let data;

    // Fetch data based on type
    switch (dataType) {
      case 'chemist':
        const chemistResult = await superAdminAnalyticsService.getChemistWiseAnalytics(startDate, endDate);
        data = chemistResult.data;
        break;
      case 'area':
        const areaResult = await superAdminAnalyticsService.getAreaWiseAnalytics(startDate, endDate);
        data = areaResult.data;
        break;
      case 'product':
        const productResult = await superAdminAnalyticsService.getProductSalesByArea(startDate, endDate);
        data = productResult.data;
        break;
      case 'trends':
        const trendsResult = await superAdminAnalyticsService.getTimeTrends(startDate, endDate);
        data = trendsResult.data;
        break;
      default:
        const dashboardResult = await superAdminAnalyticsService.getDashboardData(startDate, endDate);
        data = dashboardResult.data.chemists || [];
    }

    // Convert to CSV
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data available for export' });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export to CSV error:', error);
    res.status(500).json({ error: 'Failed to export data to CSV' });
  }
};

module.exports = exports;
