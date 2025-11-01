const jwt = require('jsonwebtoken');

// Auth middleware - requires valid JWT token
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided.' });
    }
    const token = authHeader.slice(7);
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Optional auth middleware - attempts to verify token but allows request to continue if not present
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Token is invalid, but we continue without user context
            console.log('Invalid token in optional auth, continuing without user');
            req.user = null;
        }
    }
    // Continue regardless of token presence or validity
    next();
};

// Role check - requires user to have one of the specified roles
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
};

// Specific role checks
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required.' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

module.exports = { 
  authMiddleware, 
  authenticateToken: authMiddleware, // Alias for compatibility
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  optionalAuth
};
