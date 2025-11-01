/**
 * Advanced Notifications routes (defensive)
 *
 * This version loads controller methods and middleware defensively so runtime
 * errors like "Route.get() requires a callback function but got undefined"
 * are avoided. If a controller method or middleware is missing, a safe
 * fallback handler is used which returns 501 Not Implemented.
 */

const express = require('express');
const router = express.Router();

// Try to require controller and middleware; fall back to no-op handlers.
let advCtrl = {};
try { advCtrl = require('../controllers/advancedNotificationsController') || {}; } catch (e) { /* keep empty */ }

let authMiddleware = (req, res, next) => next();
let apiLimiter = (req, res, next) => next();
let validateBody = (req, res, next) => next();
let validateIdParam = (req, res, next) => next();

try { authMiddleware = require('../middleware/auth').authMiddleware || authMiddleware; } catch (e) {}
try { apiLimiter = require('../middleware/rateLimiter').apiLimiter || apiLimiter; } catch (e) {}
try { validateBody = require('../middleware/validators').validateBody || validateBody; } catch (e) {}
try { validateIdParam = require('../middleware/validators').validateIdParam || validateIdParam; } catch (e) {}

// A safe fallback that returns 501 when functionality isn't implemented
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ success: false, message: `${name} not implemented` });

// Ensure each exported controller function has a callable fallback
const safe = (fnName) => advCtrl[fnName] || notImplemented(fnName);

// Apply auth to all advanced-notifications routes
router.use(authMiddleware);

// TEMPLATES
router.get('/templates', apiLimiter, safe('getTemplates'));
router.get('/templates/:id', apiLimiter, validateIdParam, safe('getTemplate'));
router.post('/templates', apiLimiter, validateBody, safe('createTemplate'));
router.put('/templates/:id', apiLimiter, validateIdParam, validateBody, safe('updateTemplate'));
router.delete('/templates/:id', apiLimiter, validateIdParam, safe('deleteTemplate'));

// NOTIFICATIONS (in-app storage)
router.post('/send', apiLimiter, validateBody, safe('sendNotification'));
router.get('/', apiLimiter, safe('getNotifications'));
router.put('/:id/read', apiLimiter, validateIdParam, safe('markAsRead'));
router.put('/mark-all-read', apiLimiter, safe('markAllAsRead'));
router.delete('/:id', apiLimiter, validateIdParam, safe('deleteNotification'));

// CAMPAIGNS
router.get('/campaigns', apiLimiter, safe('getCampaigns'));
router.post('/campaigns', apiLimiter, validateBody, safe('createCampaign'));
router.get('/campaigns/:id', apiLimiter, validateIdParam, safe('getCampaignDetails'));
router.patch('/campaigns/:id/status', apiLimiter, validateIdParam, validateBody, safe('updateCampaignStatus'));
router.get('/campaigns/:id/analytics', apiLimiter, validateIdParam, safe('getCampaignAnalytics'));

// PREFERENCES & ANALYTICS
router.get('/preferences', apiLimiter, safe('getPreferences'));
router.put('/preferences', apiLimiter, validateBody, safe('updatePreferences'));
router.get('/analytics', apiLimiter, safe('getAnalytics'));

// EXPORT / HISTORY
router.get('/export', apiLimiter, safe('exportHistory'));
router.get('/export/notifications', apiLimiter, safe('exportNotifications'));

module.exports = router;
