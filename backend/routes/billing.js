/**
 * Defensive billing routes
 *
 * Normalizes middleware/controller exports so Express always receives functions.
 * Missing controller methods fall back to 501 Not Implemented responses.
 */

const express = require('express');
const router = express.Router();

function tryRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

function normalizeMiddleware(m) {
  if (typeof m === 'function') return m;
  if (!m || typeof m !== 'object') return (req, res, next) => next();
  const candidates = ['middleware', 'handler', 'single', 'array', 'any', 'upload', 'default'];
  for (const k of candidates) {
    if (typeof m[k] === 'function') return m[k];
  }
  return (req, res, next) => next();
}

const billingController = tryRequire('../controllers/billingController') || {};
const rawAuth = tryRequire('../middleware/auth');
const rawRateLimiter = tryRequire('../middleware/rateLimiter');
const rawValidators = tryRequire('../middleware/validators');
const rawPayment = tryRequire('../middleware/payment') || null;

const authMiddleware = normalizeMiddleware(rawAuth && (rawAuth.authMiddleware || rawAuth));
const apiLimiter = normalizeMiddleware(rawRateLimiter && (rawRateLimiter.apiLimiter || rawRateLimiter));
const validateBody = normalizeMiddleware(rawValidators && (rawValidators.validateBody || rawValidators));
const validateIdParam = normalizeMiddleware(rawValidators && (rawValidators.validateIdParam || rawValidators));
const paymentMiddleware = normalizeMiddleware(rawPayment);

const notImplemented = (name) => (req, res) =>
  res.status(501).json({ success: false, message: `${name} not implemented` });

const safe = (fnName) => (typeof billingController[fnName] === 'function' ? billingController[fnName] : notImplemented(fnName));

function makeMiddlewareArray(...items) {
  const arr = [];
  for (const it of items) {
    if (!it) continue;
    if (Array.isArray(it)) {
      for (const sub of it) arr.push(normalizeMiddleware(sub));
    } else {
      arr.push(normalizeMiddleware(it));
    }
  }
  return arr.length ? arr : [(req, res, next) => next()];
}

/* Routes (example/typical billing endpoints) */

router.post('/charge', ...makeMiddlewareArray(apiLimiter, authMiddleware, paymentMiddleware, validateBody), safe('createCharge'));
router.post('/invoices', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateBody), safe('createInvoice'));
router.get('/invoices/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('getInvoice'));
router.get('/invoices', ...makeMiddlewareArray(apiLimiter, authMiddleware), safe('listInvoices'));
router.put('/invoices/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam, validateBody), safe('updateInvoice'));
router.post('/refunds', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateBody), safe('createRefund'));
router.post('/webhook', ...makeMiddlewareArray(apiLimiter, paymentMiddleware), safe('handleWebhook'));
router.get('/health', (req, res) => res.json({ success: true, message: 'billing routes ok' }));

module.exports = router;
