const express = require('express');
const router = express.Router();
const apiGatewayController = require('../controllers/apiGatewayController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// API Key Management
router.post('/keys', apiGatewayController.generateApiKey);
router.get('/keys', apiGatewayController.listApiKeys);
router.put('/keys/:keyId', apiGatewayController.updateApiKey);
router.delete('/keys/:keyId', apiGatewayController.revokeApiKey);

// API Scopes
router.get('/scopes', apiGatewayController.getApiScopes);

// Analytics
router.get('/analytics/usage', apiGatewayController.getUsageStats);
router.get('/analytics/endpoints', apiGatewayController.getPopularEndpoints);
router.get('/analytics/export', apiGatewayController.exportUsageReport);

module.exports = router;
