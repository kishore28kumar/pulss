/**
 * Response Caching Middleware
 * Implements in-memory caching for API responses to improve performance
 */

// Simple in-memory cache store
const cache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
};

/**
 * Cache middleware factory
 * @param {Object} options - Cache configuration options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {function} options.keyGenerator - Custom cache key generator
 * @param {function} options.shouldCache - Function to determine if response should be cached
 * @returns {function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200,
  } = options;

  return (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);

    // Check if response is in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && cachedData.expiresAt > Date.now()) {
      cacheStats.hits++;
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Age', Math.floor((Date.now() - cachedData.createdAt) / 1000));
      return res.status(cachedData.status).json(cachedData.data);
    }

    cacheStats.misses++;

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function (data) {
      // Check if we should cache this response
      if (shouldCache(req, res)) {
        const cacheEntry = {
          status: res.statusCode,
          data: data,
          createdAt: Date.now(),
          expiresAt: Date.now() + ttl * 1000,
        };

        cache.set(cacheKey, cacheEntry);
        cacheStats.sets++;

        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${ttl}`);
      } else {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache for specific pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
function invalidateCache(pattern) {
  let count = 0;
  
  if (typeof pattern === 'string') {
    // Exact match
    if (cache.has(pattern)) {
      cache.delete(pattern);
      count = 1;
    }
  } else if (pattern instanceof RegExp) {
    // Regex match
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        count++;
      }
    }
  }

  return count;
}

/**
 * Clear all cache
 */
function clearCache() {
  const size = cache.size;
  cache.clear();
  return size;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    ...cacheStats,
    size: cache.size,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
  };
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Auto-clean expired cache every 5 minutes
setInterval(cleanExpiredCache, 5 * 60 * 1000);

// Preset cache configurations
const cachePresets = {
  // Short cache for frequently changing data (1 minute)
  short: () => cacheMiddleware({ ttl: 60 }),

  // Medium cache for moderately changing data (5 minutes)
  medium: () => cacheMiddleware({ ttl: 300 }),

  // Long cache for rarely changing data (1 hour)
  long: () => cacheMiddleware({ ttl: 3600 }),

  // Static cache for unchanging data (24 hours)
  static: () => cacheMiddleware({ ttl: 86400 }),

  // Custom tenant-specific cache
  tenant: (ttl = 300) =>
    cacheMiddleware({
      ttl,
      keyGenerator: (req) => `${req.tenant?.id || 'unknown'}:${req.method}:${req.originalUrl}`,
    }),

  // User-specific cache
  user: (ttl = 300) =>
    cacheMiddleware({
      ttl,
      keyGenerator: (req) => `${req.user?.id || 'anonymous'}:${req.method}:${req.originalUrl}`,
    }),
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
  cleanExpiredCache,
  cachePresets,
};
