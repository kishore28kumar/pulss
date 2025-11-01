const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { authMiddleware } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/integration-templates', partnerController.getIntegrationTemplates);

// SSO routes (public)
router.post('/:partnerId/sso/login', partnerController.initiateSSOLogin);
router.post('/sso/callback', partnerController.completeSSOCallback);

// Protected routes (require authentication)
router.use(authMiddleware);

// Partner Management
router.post('/', partnerController.createPartner);
router.get('/', partnerController.listPartners);
router.get('/:partnerId', partnerController.getPartner);
router.put('/:partnerId', partnerController.updatePartner);

// Webhook Management
router.post('/:partnerId/webhook', partnerController.configureWebhook);
router.post('/:partnerId/webhook/test', partnerController.testWebhook);
router.get('/:partnerId/webhook/logs', partnerController.getWebhookLogs);
router.post('/:partnerId/webhook/retry/:webhookLogId', partnerController.retryWebhook);

// Reports
router.get('/:partnerId/export', partnerController.exportPartnerReport);

module.exports = router;
