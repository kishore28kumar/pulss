/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP requests to HTTPS in production
 */
const enforceHttps = (req, res, next) => {
  // Only enforce in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is already secure
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Redirect to HTTPS
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
  }
  next();
};

/**
 * HSTS (HTTP Strict Transport Security) Middleware
 * Tells browsers to only use HTTPS for future requests
 */
const hsts = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // max-age=31536000 (1 year), includeSubDomains, preload
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

module.exports = {
  enforceHttps,
  hsts
};
