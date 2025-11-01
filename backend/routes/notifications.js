const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', notificationsController.getUserNotifications || notificationsController.getNotifications);

// Get notification preferences
router.get('/preferences', notificationsController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationsController.updatePreferences);

// Mark notification as read
router.put('/:id/read', notificationsController.markAsRead);
router.patch('/:notificationId/read', notificationsController.markAsRead);

// Mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationsController.deleteNotification);

// Subscribe to push notifications
router.post('/subscribe', notificationsController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', notificationsController.unsubscribe);

// Send admin broadcast notification
router.post('/broadcast', notificationsController.sendBroadcast);

// Get VAPID public key
router.get('/vapid-key', notificationsController.getVapidPublicKey);

module.exports = router;
