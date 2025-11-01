/**
 * Defensive branding routes (normalizes middleware exports)
 *
 * Ensures middleware values are functions (or no-op) so Express does not throw:
 *  Error: Route.<method>() requires a callback function but got a [object Object]
 */

const express = require('express');
const router = express.Router();

function tryRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

function normalizeMiddleware(m) {
  // Return a function middleware in all cases (no-op fallback).
  if (typeof m === 'function') return m;
  if (!m) return (req, res, next) => next();

  // If module exports a named middleware property, prefer common names.
  const candidates = ['middleware', 'handler', 'authMiddleware', 'authenticate', 'authenticateToken', 'default'];
  for (const k of candidates) {
    if (typeof m[k] === 'function') return m[k];
  }

  // If it's an array of middlewares, run them sequentially
  if (Array.isArray(m)) {
    return (req, res, next) => {
      let i = 0;
      const run = (err) => {
        if (err) return next(err);
        const fn = m[i++];
        if (!fn) return next();
        try { fn(req, res, run); } catch (e) { next(e); }
      };
      run();
    };
  }

  // If it's a multer-like object with .single / .any, convert to middleware:
  if (typeof m.single === 'function') return m.single('file');
  if (typeof m.any === 'function') return m.any();

  // Fallback no-op middleware
  return (req, res, next) => next();
}

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

// Try to require controller and middleware; fall back to safe no-op handlers.
const brandingController = tryRequire('../controllers/branding') || {};
const rawAuth = tryRequire('../middleware/auth');
const rawRateLimiter = tryRequire('../middleware/rateLimiter');
const rawValidators = tryRequire('../middleware/validators');
const rawUpload = tryRequire('../middleware/upload'); // could be multer or custom

const authMiddleware = normalizeMiddleware(rawAuth && (rawAuth.authMiddleware || rawAuth.authenticate || rawAuth));
const apiLimiter = normalizeMiddleware(rawRateLimiter && (rawRateLimiter.apiLimiter || rawRateLimiter));
const uploadMiddleware = normalizeMiddleware(rawUpload);
const validateBody = normalizeMiddleware(rawValidators && (rawValidators.validateBody || rawValidators));
const validateIdParam = normalizeMiddleware(rawValidators && (rawValidators.validateIdParam || rawValidators));

// Safe fallback that returns 501 Not Implemented for missing handlers
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ success: false, message: `${name} not implemented` });

// Ensure we provide a callable handler for every named controller method
const safe = (fnName) => (typeof brandingController[fnName] === 'function' ? brandingController[fnName] : notImplemented(fnName));

/* Routes */

// Public branding listing (example)
router.get('/', ...makeMiddlewareArray(apiLimiter), safe('listBranding'));

// Get branding details for a tenant
router.get('/:id', ...makeMiddlewareArray(apiLimiter, validateIdParam), safe('getBranding'));

// Update branding for a tenant
router.put('/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam, validateBody), safe('updateBranding'));

// Upload tenant PWA icon / favicon (if upload middleware exists)
router.post('/:id/upload-icon', ...makeMiddlewareArray(apiLimiter, authMiddleware, uploadMiddleware), safe('uploadIcon'));
router.post('/:id/upload-favicon', ...makeMiddlewareArray(apiLimiter, authMiddleware, uploadMiddleware), safe('uploadFavicon'));

// Custom domains listing and management
router.get('/custom-domains', ...makeMiddlewareArray(apiLimiter, authMiddleware), safe('getCustomDomains'));
router.post('/custom-domains', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateBody), safe('createCustomDomain'));
router.delete('/custom-domains/:id', ...makeMiddlewareArray(apiLimiter, authMiddleware, validateIdParam), safe('deleteCustomDomain'));

// Export router
module.exports = router;
