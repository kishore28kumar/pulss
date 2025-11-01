const { pool } = require('../config/db');
const { validateTenantAccess, extractTenantId } = require('../utils/tenantIsolation');

/**
 * Tenant Middleware
 * Extracts and validates tenant_id from various sources
 * Priority: user.tenant_id > subdomain > URL params > query params > body
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    let tenant_id = null;
    
    // 1. From authenticated user (highest priority for non-super-admins)
    if (req.user && req.user.tenant_id && req.user.role !== 'super_admin') {
      tenant_id = req.user.tenant_id;
    }
    
    // 2. From Host header (subdomain-based routing)
    if (!tenant_id && req.headers.host) {
      const hostname = req.headers.host.split(':')[0];
      const parts = hostname.split('.');
      
      // Check if it's a subdomain (e.g., tenant1.example.com)
      if (parts.length > 2 && parts[0] !== 'www') {
        const subdomain = parts[0];
        
        // Query tenant by subdomain
        const result = await pool.query(
          'SELECT tenant_id FROM tenants WHERE subdomain = ? AND status = ?',
          [subdomain, 'active']
        );
        
        if (result.rows.length > 0) {
          tenant_id = result.rows[0].tenant_id;
        }
      }
    }
    
    // 3. From URL parameters
    if (!tenant_id && req.params && req.params.tenant_id) {
      tenant_id = req.params.tenant_id;
    }
    
    // 4. From query parameter (for testing/development)
    if (!tenant_id && req.query && req.query.tenant_id) {
      tenant_id = req.query.tenant_id;
    }
    
    // 5. From request body (for customer creation, etc.)
    if (!tenant_id && req.body && req.body.tenant_id) {
      tenant_id = req.body.tenant_id;
    }
    
    // Attach tenant_id to request
    req.tenant_id = tenant_id;
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ 
      error: 'Error determining tenant',
      message: error.message 
    });
  }
};

/**
 * Require Tenant Middleware
 * Ensures tenant_id is present in the request
 */
const requireTenant = (req, res, next) => {
  const tenant_id = extractTenantId(req);
  
  if (!tenant_id) {
    return res.status(400).json({ 
      error: 'Tenant identification required',
      message: 'tenant_id must be provided in the request'
    });
  }
  
  req.tenant_id = tenant_id;
  next();
};

/**
 * Enforce Tenant Isolation Middleware
 * Ensures users can only access data from their own tenant
 * Super admins can access any tenant
 */
const enforceTenantIsolation = async (req, res, next) => {
  try {
    const tenant_id = extractTenantId(req);
    
    if (!tenant_id) {
      return res.status(400).json({ 
        error: 'Tenant identification required',
        message: 'tenant_id must be provided'
      });
    }
    
    // Validate tenant access if user is authenticated
    if (req.user) {
      try {
        await validateTenantAccess(tenant_id, req.user);
      } catch (error) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: error.message
        });
      }
    }
    
    // Ensure admin/customer can only access their own tenant data
    if (req.user && req.user.role === 'admin') {
      // Override tenant_id to user's tenant for extra safety
      req.tenant_id = req.user.tenant_id;
    } else if (req.user && req.user.role === 'customer') {
      // Override tenant_id to user's tenant for extra safety
      req.tenant_id = req.user.tenant_id;
    } else {
      // Super admin or unauthenticated - use provided tenant_id
      req.tenant_id = tenant_id;
    }
    
    next();
  } catch (error) {
    console.error('Tenant isolation error:', error);
    return res.status(500).json({ 
      error: 'Tenant validation failed',
      message: error.message
    });
  }
};

/**
 * Verify Tenant Active Middleware
 * Ensures the tenant is in active status
 */
const verifyTenantActive = async (req, res, next) => {
  try {
    const tenant_id = extractTenantId(req);
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant identification required' });
    }
    
    const result = await pool.query(
      'SELECT status FROM tenants WHERE tenant_id = ?',
      [tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (result.rows[0].status !== 'active') {
      return res.status(403).json({ 
        error: 'Tenant not active',
        status: result.rows[0].status
      });
    }
    
    next();
  } catch (error) {
    console.error('Verify tenant active error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify tenant status',
      message: error.message
    });
  }
};

module.exports = { 
  tenantMiddleware, 
  requireTenant, 
  enforceTenantIsolation,
  tenantContext: tenantMiddleware // Alias for compatibility
};
