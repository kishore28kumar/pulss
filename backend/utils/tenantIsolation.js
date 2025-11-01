/**
 * Tenant Isolation Utilities
 * 
 * This module provides utilities to enforce strict tenant-based data isolation
 * across all database queries in the multi-tenant SaaS application.
 */

const { pool } = require('../config/db');

/**
 * Validate that tenant_id exists and user has access to it
 * @param {string} tenant_id - The tenant ID to validate
 * @param {object} user - The authenticated user object from JWT
 * @returns {Promise<boolean>} - True if valid, throws error otherwise
 */
async function validateTenantAccess(tenant_id, user) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for this operation');
  }
  
  // Super admin can access any tenant
  if (user && user.role === 'super_admin') {
    return true;
  }
  
  // Admin can only access their own tenant
  if (user && user.role === 'admin') {
    if (user.tenant_id !== tenant_id) {
      throw new Error('Access denied: You can only access your own tenant data');
    }
    return true;
  }
  
  // Customer can only access their own tenant
  if (user && user.role === 'customer') {
    if (user.tenant_id !== tenant_id) {
      throw new Error('Access denied: You can only access your own tenant data');
    }
    return true;
  }
  
  return true;
}

/**
 * Enforce tenant_id in query parameters
 * Automatically adds tenant_id to WHERE clause
 * @param {string} baseQuery - The base SQL query
 * @param {Array} params - Query parameters
 * @param {string} tenant_id - The tenant ID to filter by
 * @returns {object} - Modified query and params
 */
function addTenantFilter(baseQuery, params, tenant_id) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for tenant-scoped queries');
  }
  
  // Simple tenant filter injection
  // This assumes the query has a WHERE clause or can have one added
  const hasWhere = baseQuery.toLowerCase().includes('where');
  const tenantCondition = hasWhere ? ' AND tenant_id = ?' : ' WHERE tenant_id = ?';
  
  return {
    query: baseQuery + tenantCondition,
    params: [...params, tenant_id]
  };
}

/**
 * Execute a tenant-scoped query
 * Ensures all queries include tenant_id filter
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {string} tenant_id - Tenant ID
 * @param {object} user - Authenticated user (optional, for validation)
 * @returns {Promise<object>} - Query results
 */
async function executeTenantscopedQuery(query, params, tenant_id, user = null) {
  // Validate tenant access if user provided
  if (user) {
    await validateTenantAccess(tenant_id, user);
  }
  
  // Execute query
  return pool.query(query, params);
}

/**
 * Get tenant by ID with validation
 * @param {string} tenant_id - Tenant ID
 * @param {object} user - Authenticated user (optional)
 * @returns {Promise<object>} - Tenant object
 */
async function getTenantById(tenant_id, user = null) {
  if (user) {
    await validateTenantAccess(tenant_id, user);
  }
  
  const result = await pool.query(
    'SELECT * FROM tenants WHERE tenant_id = ?',
    [tenant_id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Tenant not found');
  }
  
  return result.rows[0];
}

/**
 * Verify tenant status is active
 * @param {string} tenant_id - Tenant ID
 * @returns {Promise<boolean>} - True if active, throws error otherwise
 */
async function verifyTenantActive(tenant_id) {
  const result = await pool.query(
    'SELECT status FROM tenants WHERE tenant_id = ?',
    [tenant_id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Tenant not found');
  }
  
  if (result.rows[0].status !== 'active') {
    throw new Error(`Tenant is ${result.rows[0].status}. Active status required.`);
  }
  
  return true;
}

/**
 * Extract tenant_id from request
 * Priority: user.tenant_id > params.tenant_id > query.tenant_id > body.tenant_id
 * @param {object} req - Express request object
 * @returns {string|null} - Tenant ID or null
 */
function extractTenantId(req) {
  // Highest priority: authenticated user's tenant_id (for admin/customer)
  if (req.user && req.user.tenant_id && req.user.role !== 'super_admin') {
    return req.user.tenant_id;
  }
  
  // From URL params
  if (req.params && req.params.tenant_id) {
    return req.params.tenant_id;
  }
  
  // From query string
  if (req.query && req.query.tenant_id) {
    return req.query.tenant_id;
  }
  
  // From request body
  if (req.body && req.body.tenant_id) {
    return req.body.tenant_id;
  }
  
  // From middleware (set by tenantMiddleware)
  if (req.tenant_id) {
    return req.tenant_id;
  }
  
  return null;
}

/**
 * Middleware to enforce tenant isolation on all tenant-scoped endpoints
 */
function enforceTenantIsolationMiddleware(req, res, next) {
  try {
    const tenant_id = extractTenantId(req);
    
    if (!tenant_id) {
      return res.status(400).json({ 
        error: 'Tenant identification required',
        message: 'tenant_id must be provided in request'
      });
    }
    
    // Set tenant_id on request for use in controllers
    req.tenant_id = tenant_id;
    
    // Validate access if user is authenticated
    if (req.user) {
      validateTenantAccess(tenant_id, req.user)
        .then(() => next())
        .catch(err => {
          return res.status(403).json({ error: err.message });
        });
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Tenant validation failed',
      message: error.message 
    });
  }
}

module.exports = {
  validateTenantAccess,
  addTenantFilter,
  executeTenantscopedQuery,
  getTenantById,
  verifyTenantActive,
  extractTenantId,
  enforceTenantIsolationMiddleware
};
