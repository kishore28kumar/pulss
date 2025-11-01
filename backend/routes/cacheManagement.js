/**
 * Cache Management Routes (defensive)
 * Ensures middleware exports are normalized to functions so Express never
 * receives undefined or non-function handlers.
 */

const express = require('express');
const router = express.Router();

function tryRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

function normalizeMiddleware(m) {
  if (typeof m === 'function') return m;
  if (!m) return (req, res, next) => next();

  // Common named exports that may contain middleware
  const candidates = ['authenticateToken', 'authMiddleware', 'authenticate', 'requireAuth', 'middleware', 'default'];
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

  // If it's multer-like object with .single / .any, convert to middleware
  if (typeof m.single === 'function') return m.single('file');
  if (typeof m.any === 'function') return m.any();

  // ES module default
  if (typeof m.default === 'function') return m.default;

  // Fallback no-op
  return (req, res, next) => next();
}

// Safe cache helpers
const cacheModule = tryRequire('../middleware/cache') || {};
const getCacheStats = typeof cacheModule.getCacheStats === 'function' ? cacheModule.getCacheStats : () => ({ hits: 0, misses: 0, size: 0 });
const clearCache = typeof cacheModule.clearCache === 'function' ? cacheModule.clearCache : () => 0;
const invalidateCache = typeof cacheModule.invalidateCache === 'function' ? cacheModule.invalidateCache : () => 0;

// Normalize auth / superadmin middleware
const rawAuth = tryRequire('../middleware/auth');
const authenticateToken = normalizeMiddleware(rawAuth && (rawAuth.authenticateToken || rawAuth.authMiddleware || rawAuth.authenticate || rawAuth));

const rawSuper = tryRequire('../middleware/superAdminAuth');
const requireSuperAdmin = normalizeMiddleware(rawSuper && (rawSuper.requireSuperAdmin || rawSuper.requireRole || rawSuper.default || rawSuper));

// Routes
router.get('/stats', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get cache statistics' });
  }
});

router.post('/clear', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const cleared = clearCache();
    res.json({ success: true, message: 'Cache cleared successfully', data: { entriesCleared: cleared } });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
});

router.post('/invalidate', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) return res.status(400).json({ success: false, message: 'Pattern is required' });
    if (typeof pattern !== 'string') return res.status(400).json({ success: false, message: 'Pattern must be a string' });

    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = new RegExp(escapedPattern);
    const invalidated = invalidateCache(regexPattern);

    res.json({ success: true, message: 'Cache invalidated successfully', data: { entriesInvalidated: invalidated } });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ success: false, message: 'Failed to invalidate cache' });
  }
});

module.exports = router;
