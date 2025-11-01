const rbacService = require('../services/rbacService');

/**
 * RBAC Middleware
 * Permission and role checking middleware
 */

/**
 * Check if user has specific permission
 * @param {string} permission - Permission name (e.g., 'products:create')
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
const requirePermission = (permission, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Determine user type
      const userType = req.user.role === 'customer' ? 'customer' : 'admin';
      const tenantId = req.user.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      // Check if RBAC is enabled for this tenant
      if (tenantId && !options.skipFeatureCheck) {
        const flags = await rbacService.getRBACFeatureFlags(tenantId);
        
        // If RBAC is not enabled, fall back to simple role check
        if (!flags || !flags.rbac_enabled) {
          // Use legacy role-based check
          return legacyRoleCheck(req, res, next, permission);
        }
      }
      
      // Check permission using RBAC
      const hasPermission = await rbacService.hasPermission(
        req.user.id,
        userType,
        permission,
        tenantId
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required_permission: permission
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} permissions - Array of permission names
 * @returns {Function} Middleware function
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userType = req.user.role === 'customer' ? 'customer' : 'admin';
      const tenantId = req.user.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      // Check each permission
      for (const permission of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.id,
          userType,
          permission,
          tenantId
        );
        
        if (hasPermission) {
          req.grantedPermission = permission;
          return next();
        }
      }
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required_permissions: permissions
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has all of the specified permissions
 * @param {Array<string>} permissions - Array of permission names
 * @returns {Function} Middleware function
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userType = req.user.role === 'customer' ? 'customer' : 'admin';
      const tenantId = req.user.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      // Check all permissions
      for (const permission of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.id,
          userType,
          permission,
          tenantId
        );
        
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required_permissions: permissions,
            missing_permission: permission
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has specific role
 * @param {string|Array<string>} roles - Role name(s)
 * @returns {Function} Middleware function
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const roleArray = Array.isArray(roles) ? roles : [roles];
      const userType = req.user.role === 'customer' ? 'customer' : 'admin';
      const tenantId = req.user.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      // Get user roles
      const userRoles = await rbacService.getUserRoles(req.user.id, userType, tenantId);
      const userRoleNames = userRoles.map(r => r.name);
      
      // Check if user has any of the required roles
      const hasRole = roleArray.some(role => userRoleNames.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role',
          required_roles: roleArray,
          user_roles: userRoleNames
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user is super admin
 * @returns {Function} Middleware function
 */
const requireSuperAdmin = () => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }
    next();
  };
};

/**
 * Check if user is admin or super admin
 * @returns {Function} Middleware function
 */
const requireAdmin = () => {
  return (req, res, next) => {
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  };
};

/**
 * Attach user permissions to request object
 * Useful for checking permissions in controller logic
 * @returns {Function} Middleware function
 */
const attachUserPermissions = () => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next();
      }
      
      const userType = req.user.role === 'customer' ? 'customer' : 'admin';
      const tenantId = req.user.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      // Get user permissions
      const permissions = await rbacService.getUserPermissions(req.user.id, userType, tenantId);
      req.userPermissions = permissions.map(p => p.name);
      
      // Helper function to check permission
      req.hasPermission = (permission) => req.userPermissions.includes(permission);
      
      next();
    } catch (error) {
      console.error('Error attaching permissions:', error);
      next(); // Continue even if there's an error
    }
  };
};

/**
 * Check tenant isolation
 * Ensures users can only access resources within their tenant
 * @returns {Function} Middleware function
 */
const checkTenantIsolation = () => {
  return (req, res, next) => {
    // Super admin can access all tenants
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    const userTenantId = req.user.tenant_id;
    const requestTenantId = req.body.tenant_id || req.query.tenant_id || req.params.tenant_id;
    
    if (requestTenantId && userTenantId !== requestTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Tenant isolation violation'
      });
    }
    
    // Attach tenant ID to request for queries
    req.tenantId = userTenantId;
    
    next();
  };
};

/**
 * Legacy role-based check (fallback when RBAC is disabled)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 * @param {string} permission - Permission to check
 */
const legacyRoleCheck = (req, res, next, permission) => {
  const role = req.user.role;
  
  // Super admin has all permissions
  if (role === 'super_admin') {
    return next();
  }
  
  // Simple permission mapping for legacy support
  const rolePermissions = {
    admin: ['products', 'orders', 'customers', 'reports', 'settings', 'users'],
    partner: ['products', 'orders', 'customers', 'reports'],
    reseller: ['products', 'orders', 'customers'],
    support: ['orders', 'customers'],
    user: ['products:read', 'orders:create', 'orders:read']
  };
  
  const [resource] = permission.split(':');
  const allowedResources = rolePermissions[role] || [];
  
  if (allowedResources.includes(resource) || allowedResources.includes(permission)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Insufficient permissions (legacy mode)',
    required_permission: permission
  });
};

/**
 * Enforce least privilege principle
 * Logs access attempts for compliance
 * @returns {Function} Middleware function
 */
const enforceLeastPrivilege = () => {
  return async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id || req.query.tenant_id;
      
      if (tenantId) {
        const flags = await rbacService.getRBACFeatureFlags(tenantId);
        
        if (flags?.least_privilege_enforcement) {
          // Log access attempt
          const accessLog = {
            userId: req.user.id,
            userRole: req.user.role,
            method: req.method,
            path: req.path,
            tenantId,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('user-agent')
          };
          
          // Store in audit log (async, don't wait)
          rbacService.logAuditAction({
            tenantId,
            actionType: 'access_attempt',
            entityType: 'api_endpoint',
            entityId: req.path,
            performedBy: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            newValue: accessLog
          }).catch(err => console.error('Failed to log access attempt:', err));
        }
      }
      
      next();
    } catch (error) {
      console.error('Least privilege enforcement error:', error);
      next(); // Continue even if there's an error
    }
  };

/**
 * RBAC Middleware
 * Enforces role-based access control on routes
 */

const rbacService = require('../services/rbacService');

/**
 * Middleware to check if user has required permission
 * @param {string} permissionName - The permission required (e.g., 'users.manage')
 */
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.admin_id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await rbacService.hasPermission(req.user.admin_id, permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissionName
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param {string[]} permissionNames - Array of permissions (user needs at least one)
 */
const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.admin_id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await rbacService.hasAnyPermission(req.user.admin_id, permissionNames);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissionNames
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Middleware to check if user has required role
 * @param {string} roleName - The role required (e.g., 'super_admin')
 */
const requireRoleName = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.admin_id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasRole = await rbacService.hasRole(req.user.admin_id, roleName);
      
      if (!hasRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required_role: roleName
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Middleware to attach user permissions to request
 * Useful for conditional UI rendering
 */
const attachPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.admin_id) {
      req.permissions = [];
      req.roles = [];
      return next();
    }

    const [permissions, roles] = await Promise.all([
      rbacService.getUserPermissions(req.user.admin_id),
      rbacService.getUserRoles(req.user.admin_id)
    ]);
    
    req.permissions = permissions;
    req.roles = roles;
    
    next();
  } catch (error) {
    console.error('Attach permissions error:', error);
    req.permissions = [];
    req.roles = [];
    next();
  }
};

/**
 * Helper function to check tenant isolation
 * Ensures users can only access their own tenant's data
 */
const requireTenantAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Super admins can access all tenants
    const isSuperAdmin = await rbacService.hasRole(req.user.admin_id, 'super_admin');
    if (isSuperAdmin) {
      return next();
    }

    // Check if the requested tenant matches user's tenant
    const requestedTenantId = req.params.tenant_id || req.query.tenant_id || req.body.tenant_id;
    
    if (requestedTenantId && requestedTenantId !== req.user.tenant_id) {
      return res.status(403).json({ 
        error: 'Cannot access other tenant data'
      });
    }

    next();
  } catch (error) {
    console.error('Tenant access check error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  attachUserPermissions,
  checkTenantIsolation,
  enforceLeastPrivilege

  requireRoleName,
  attachPermissions,
  requireTenantAccess
};
