/**
 * Tracking Routes
 */

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authMiddleware } = require('../middleware/auth');

// Update order location (GPS)
router.post('/:orderId/location', authMiddleware, trackingController.updateLocation);

// Get order location history
router.get('/:orderId/location', trackingController.getLocationHistory);

// Update order status
router.post('/:orderId/status', authMiddleware, trackingController.updateStatus);

// Get order timeline
router.get('/:orderId/timeline', trackingController.getTimeline);

// Get comprehensive tracking data
router.get('/:orderId', trackingController.getTracking);

// Update estimated delivery time
router.post('/:orderId/eta', authMiddleware, trackingController.updateETA);

// Get active deliveries
router.get('/deliveries/active', authMiddleware, trackingController.getActiveDeliveries);

// Get tracking URL
router.get('/:orderId/url', trackingController.getTrackingUrl);

module.exports = router;
