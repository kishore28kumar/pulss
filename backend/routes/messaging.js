/**
 * Messaging Routes
 */

const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { authMiddleware } = require('../middleware/auth');

// Send SMS
router.post('/sms', authMiddleware, messagingController.sendSMS);

// Send WhatsApp message
router.post('/whatsapp', authMiddleware, messagingController.sendWhatsApp);

// Send broadcast message
router.post('/broadcast', authMiddleware, messagingController.sendBroadcast);

// Get message logs
router.get('/logs', authMiddleware, messagingController.getMessageLogs);

// Send order confirmation
router.post('/orders/:orderId/confirmation', authMiddleware, messagingController.sendOrderConfirmation);

// Get messaging configuration
router.get('/config', authMiddleware, messagingController.getConfig);

module.exports = router;
