/**
 * Super Admin Authentication Middleware
 * Ensures the user has super admin privileges
 */

const superAdminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user has super admin role
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

module.exports = superAdminAuth;
