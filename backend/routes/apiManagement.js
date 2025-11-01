/**
 * Defensive apiManagement routes
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
  const candidates = ['middleware', 'handler', 'single', 'array', 'any', 'default'];
  for (const k of candidates) {
    if (typeof m[k] === 'function') return m[k];
  }
  if (typeof m.default === 'function') return m.default;
  return (req, res, next) => next();
}

const apiMgmtController = tryRequire('../controllers/apiManagement') || {};
const rawAuth = tryRequire('../middleware/auth');
const rawRateLimiter = tryRequire('../middleware/rateLimiter');
const rawValidators = tryRequire('../middleware/validators');

const authMiddleware = normalizeMiddleware(rawAuth && (rawAuth.authMiddleware || rawAuth));
const apiLimiter = normalizeMiddleware(rawRateLimiter && (rawRateLimiter.apiLimiter || rawRateLimiter));
const validateBody = normalizeMiddleware(rawValidators && (rawValidators.validateBody || rawValidators));
const validateIdParam = normalizeMiddleware(rawValidators && (rawValidators.validateIdParam || rawValidators));

const notImplemented = (name) => (req, res) =>
  res.status(501).json({ success: false, message: `${name} not implemented` });

const safe = (fnName) => (typeof apiMgmtController[fnName] === 'function' ? apiMgmtController[fnName] : notImplemented(fnName));

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

router.get('/', ...makeMiddlewareArray(apiLimiter, authMiddleware), safe('listApis'));
router.get('/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('getApi'));
router.post('/', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateBody), safe('createApi'));
router.put('/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam, validateBody), safe('updateApi'));
router.delete('/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('deleteApi'));
router.get('/:id/keys', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('listApiKeys'));
router.post('/:id/keys', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam, validateBody), safe('createApiKey'));
router.delete('/:id/keys/:keyId', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('deleteApiKey'));

module.exports = router;
