/**
 * Tracking Controller
 * Handles order tracking and delivery updates
 */

const trackingService = require('../services/trackingService');

/**
 * Update order location (GPS tracking)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const result = await trackingService.updateOrderLocation(
      orderId,
      latitude,
      longitude,
      accuracy
    );

    res.json(result);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update order location' });
  }
};

/**
 * Get order location history
 */
exports.getLocationHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await trackingService.getOrderLocationHistory(orderId);
    res.json(result);
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
};

/**
 * Update order status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const { adminId } = req.user;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await trackingService.updateOrderStatus(
      orderId,
      status,
      notes,
      adminId
    );

    res.json(result);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

/**
 * Get order timeline
 */
exports.getTimeline = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await trackingService.getOrderTimeline(orderId);
    res.json(result);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to get order timeline' });
  }
};

/**
 * Get comprehensive order tracking data
 */
exports.getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await trackingService.getOrderTracking(orderId);
    res.json(result);
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ error: 'Failed to get order tracking' });
  }
};

/**
 * Update estimated delivery time
 */
exports.updateETA = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estimatedTime } = req.body;

    if (!estimatedTime) {
      return res.status(400).json({ error: 'Estimated time is required' });
    }

    const result = await trackingService.updateEstimatedDeliveryTime(
      orderId,
      estimatedTime
    );

    res.json(result);
  } catch (error) {
    console.error('Update ETA error:', error);
    res.status(500).json({ error: 'Failed to update estimated delivery time' });
  }
};

/**
 * Get active deliveries
 */
exports.getActiveDeliveries = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await trackingService.getActiveDeliveries(tenantId);
    res.json(result);
  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({ error: 'Failed to get active deliveries' });
  }
};

/**
 * Generate tracking URL
 */
exports.getTrackingUrl = async (req, res) => {
  try {
    const { orderId } = req.params;
    const trackingUrl = trackingService.generateTrackingUrl(orderId);
    res.json({ success: true, trackingUrl });
  } catch (error) {
    console.error('Get tracking URL error:', error);
    res.status(500).json({ error: 'Failed to generate tracking URL' });
  }
};
