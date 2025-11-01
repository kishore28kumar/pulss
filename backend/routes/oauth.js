const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');

// OAuth2 endpoints (no authentication required for OAuth flow)
router.get('/authorize', oauthController.authorize);
router.post('/token', oauthController.token);
router.post('/revoke', oauthController.revoke);
router.post('/introspect', oauthController.introspect);

// OAuth2 discovery endpoint
router.get('/.well-known/oauth-authorization-server', oauthController.getConfiguration);

module.exports = router;
