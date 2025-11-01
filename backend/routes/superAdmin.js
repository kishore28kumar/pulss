const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Showcase (visible to super admin only)
router.get('/showcase', superAdminController.getShowcase);

// User stories
router.post('/user-stories', superAdminController.addUserStory);

// Legacy API keys routes - redirects to new API management system
// These are kept for backward compatibility
router.get('/api-keys', superAdminController.getApiKeys);
router.post('/api-keys', superAdminController.generateApiKey);
router.delete('/api-keys/:id', superAdminController.revokeApiKey);

// Note: New API management features are available at /api/api-management/*
// Including: webhooks, OAuth, comprehensive API analytics, feature flags, etc.

// Contribution templates
router.get('/contribution-templates', superAdminController.getContributionTemplates);
router.post('/contribution-templates', superAdminController.addContributionTemplate);

// Platform analytics
router.get('/analytics', superAdminController.getPlatformAnalytics);

// API Feature Toggles
router.get('/api-features/:tenantId', superAdminController.getApiFeatureToggles);
router.put('/api-features/:tenantId', superAdminController.updateApiFeatureToggles);

// Global API Settings
router.get('/api-settings', superAdminController.getGlobalApiSettings);
router.put('/api-settings/:settingKey', superAdminController.updateGlobalApiSetting);

module.exports = router;
