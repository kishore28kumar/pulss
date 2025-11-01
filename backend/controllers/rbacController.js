const rbacService = require('../services/rbacService');
const { pool } = require('../config/db');

/**
 * RBAC Controller
 * Handles all RBAC-related HTTP requests
 */

// ============================================================================
// Role Management
// ============================================================================

/**
 * Get all roles
 */
exports.getRoles = async (req, res) => {
  try {
    const { tenant_id, include_system, include_custom } = req.query;
    
    let query = 'SELECT * FROM roles WHERE is_active = true';
    const params = [];
    let paramIndex = 1;
    
    if (tenant_id) {
      query += ` AND (tenant_id = $${paramIndex} OR tenant_id IS NULL)`;
      params.push(tenant_id);
      paramIndex++;
    }
    
    if (include_system === 'false') {
      query += ' AND is_system = false';
    }
    
    if (include_custom === 'false') {
      query += ' AND is_custom = false';
    }
    
    query += ' ORDER BY priority DESC, name ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: error.message
    });
  }
};

/**
 * Get role by ID
 */
exports.getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM roles WHERE role_id = $1',
      [roleId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Get permissions for this role
    const permissions = await rbacService.getRolePermissions(roleId);
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        permissions
      }
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role',
      error: error.message
    });
  }
};

/**
 * Create custom role
 */
exports.createRole = async (req, res) => {
  try {
    const { name, display_name, description, tenant_id, partner_id, parent_role_id, permissions } = req.body;
    
    // Validate required fields
    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'Name and display name are required'
      });
    }
    
    // Check RBAC feature flags
    const flags = await rbacService.getRBACFeatureFlags(tenant_id);
    if (!flags?.rbac_enabled || !flags?.custom_roles_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Custom roles feature is not enabled for this tenant'
      });
    }
    
    // Check custom role limit
    const roleCount = await pool.query(
      'SELECT COUNT(*) FROM roles WHERE tenant_id = $1 AND is_custom = true',
      [tenant_id]
    );
    
    if (parseInt(roleCount.rows[0].count) >= flags.max_custom_roles) {
      return res.status(403).json({
        success: false,
        message: `Maximum custom roles limit (${flags.max_custom_roles}) reached`
      });
    }
    
    // Create role
    const role = await rbacService.createRole({
      name,
      displayName: display_name,
      description,
      tenantId: tenant_id,
      partnerId: partner_id,
      parentRoleId: parent_role_id,
      createdBy: req.user.id
    });
    
    // Grant permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const permissionId of permissions) {
        await rbacService.grantPermission(role.role_id, permissionId, req.user.id);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

/**
 * Update role
 */
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { display_name, description, is_active } = req.body;
    
    const role = await rbacService.updateRole(
      roleId,
      { displayName: display_name, description, isActive: is_active },
      req.user.id
    );
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found or cannot be modified'
      });
    }
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

/**
 * Delete role
 */
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const deleted = await rbacService.deleteRole(roleId, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Role not found or cannot be deleted'
      });
    }
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Get all permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const { resource_name, action } = req.query;
    
    let query = `
      SELECT p.*, r.name as resource_name, r.description as resource_description, r.resource_type
      FROM permissions p
      JOIN resources r ON p.resource_id = r.resource_id
      WHERE p.is_active = true AND r.is_active = true
    `;
    const params = [];
    let paramIndex = 1;
    
    if (resource_name) {
      query += ` AND r.name = $${paramIndex}`;
      params.push(resource_name);
      paramIndex++;
    }
    
    if (action) {
      query += ` AND p.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    
    query += ' ORDER BY r.name, p.action';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve permissions',
      error: error.message
    });
  }
};

/**
 * Get all resources
 */
exports.getResources = async (req, res) => {
  try {
    const query = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM permissions WHERE resource_id = r.resource_id) as permission_count
      FROM resources r
      WHERE r.is_active = true
      ORDER BY r.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resources',
      error: error.message
    });
  }
};

/**
 * Grant permission to role
 */
exports.grantPermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    
    if (!roleId || !permissionId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID and Permission ID are required'
      });
    }
    
    const result = await rbacService.grantPermission(roleId, permissionId, req.user.id);
    
    res.json({
      success: true,
      message: 'Permission granted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error granting permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grant permission',
      error: error.message
    });
  }
};

/**
 * Revoke permission from role
 */
exports.revokePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    
    if (!roleId || !permissionId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID and Permission ID are required'
      });
    }
    
    const revoked = await rbacService.revokePermission(roleId, permissionId, req.user.id);
    
    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found for this role'
      });
    }
    
    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke permission',
      error: error.message
    });
  }
};

// ============================================================================
// User Role Assignment
// ============================================================================

/**
 * Get user roles
 */
exports.getUserRoles = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const { tenant_id } = req.query;
    
    const roles = await rbacService.getUserRoles(userId, userType, tenant_id);
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user roles',
      error: error.message
    });
  }
};

/**
 * Get user permissions
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const { tenant_id } = req.query;
    
    const permissions = await rbacService.getUserPermissions(userId, userType, tenant_id);
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user permissions',
      error: error.message
    });
  }
};

/**
 * Assign role to user
 */
exports.assignRole = async (req, res) => {
  try {
    const { user_id, user_type, role_id, tenant_id, expires_at } = req.body;
    
    if (!user_id || !user_type || !role_id || !tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID, user type, role ID, and tenant ID are required'
      });
    }
    
    const result = await rbacService.assignRole(
      user_id,
      user_type,
      role_id,
      tenant_id,
      req.user.id,
      expires_at
    );
    
    res.json({
      success: true,
      message: 'Role assigned successfully',
      data: result
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

/**
 * Revoke role from user
 */
exports.revokeRole = async (req, res) => {
  try {
    const { user_id, role_id, tenant_id } = req.body;
    
    if (!user_id || !role_id || !tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID, role ID, and tenant ID are required'
      });
    }
    
    const revoked = await rbacService.revokeRole(user_id, role_id, tenant_id, req.user.id);
    
    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: 'Role assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Role revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke role',
      error: error.message
    });
  }
};

/**
 * Bulk assign roles
 */
exports.bulkAssignRoles = async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'Assignments array is required'
      });
    }
    
    // Check if bulk assignment is enabled
    const tenantId = assignments[0]?.tenant_id;
    if (tenantId) {
      const flags = await rbacService.getRBACFeatureFlags(tenantId);
      if (!flags?.bulk_assignment_enabled) {
        return res.status(403).json({
          success: false,
          message: 'Bulk assignment feature is not enabled for this tenant'
        });
      }
    }
    
    const results = await rbacService.bulkAssignRoles(assignments, req.user.id);
    
    res.json({
      success: true,
      message: `Bulk assignment completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk assigning roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign roles',
      error: error.message
    });
  }
};

// ============================================================================
// Role Templates
// ============================================================================

/**
 * Get role templates
 */
exports.getRoleTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM role_templates WHERE is_system = true';
    const params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting role templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role templates',
      error: error.message
    });
  }
};

/**
 * Create role from template
 */
exports.createRoleFromTemplate = async (req, res) => {
  try {
    const { template_id, tenant_id } = req.body;
    
    if (!template_id || !tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Template ID and tenant ID are required'
      });
    }
    
    // Check if role templates are enabled
    const flags = await rbacService.getRBACFeatureFlags(tenant_id);
    if (!flags?.role_templates_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Role templates feature is not enabled for this tenant'
      });
    }
    
    const role = await rbacService.createRoleFromTemplate(template_id, tenant_id, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Role created from template successfully',
      data: role
    });
  } catch (error) {
    console.error('Error creating role from template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role from template',
      error: error.message
    });
  }
};

// ============================================================================
// RBAC Feature Flags (Super Admin Only)
// ============================================================================

/**
 * Get RBAC feature flags
 */
exports.getRBACFeatureFlags = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }
    
    const flags = await rbacService.getRBACFeatureFlags(tenant_id);
    
    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    console.error('Error getting RBAC feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve RBAC feature flags',
      error: error.message
    });
  }
};

/**
 * Update RBAC feature flags (Super Admin only)
 */
exports.updateRBACFeatureFlags = async (req, res) => {
  try {
    const { tenant_id, ...flags } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }
    
    // Only super admin can update feature flags
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can update RBAC feature flags'
      });
    }
    
    const updated = await rbacService.updateRBACFeatureFlags(tenant_id, flags, req.user.id);
    
    res.json({
      success: true,
      message: 'RBAC feature flags updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating RBAC feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RBAC feature flags',
      error: error.message
    });
  }
};

// ============================================================================
// Audit Logs
// ============================================================================

/**
 * Get RBAC audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { tenant_id, action_type, entity_type, performed_by, start_date, end_date, limit, offset } = req.query;
    
    const filters = {
      tenantId: tenant_id,
      actionType: action_type,
      entityType: entity_type,
      performedBy: performed_by,
      startDate: start_date,
      endDate: end_date
    };
    
    const result = await rbacService.getAuditLogs(
      filters,
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: error.message
    });
  }
};

/**
 * Export roles and permissions
 */
exports.exportRolesAndPermissions = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    
    // Get all roles
    const rolesQuery = tenant_id
      ? 'SELECT * FROM roles WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY name'
      : 'SELECT * FROM roles ORDER BY name';
    
    const rolesResult = tenant_id
      ? await pool.query(rolesQuery, [tenant_id])
      : await pool.query(rolesQuery);
    
    // Get all permissions for each role
    const rolesWithPermissions = await Promise.all(
      rolesResult.rows.map(async (role) => {
        const permissions = await rbacService.getRolePermissions(role.role_id);
        return { ...role, permissions };
      })
    );
    
    // Get all permissions
    const permissionsResult = await pool.query(`
      SELECT p.*, r.name as resource_name
      FROM permissions p
      JOIN resources r ON p.resource_id = r.resource_id
      ORDER BY r.name, p.action
    `);
    
    // Get all resources
    const resourcesResult = await pool.query('SELECT * FROM resources ORDER BY name');
    
    const exportData = {
      roles: rolesWithPermissions,
      permissions: permissionsResult.rows,
      resources: resourcesResult.rows,
      exported_at: new Date().toISOString(),
      exported_by: req.user.email
    };
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting roles and permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export roles and permissions',
      error: error.message
    });
  }
};

/**
 * Check permission (utility endpoint)
 */
exports.checkPermission = async (req, res) => {
  try {
    const { user_id, user_type, permission, tenant_id } = req.query;
    
    if (!user_id || !user_type || !permission) {
      return res.status(400).json({
        success: false,
        message: 'User ID, user type, and permission are required'
      });
    }
    
    const hasPermission = await rbacService.hasPermission(user_id, user_type, permission, tenant_id);
    
    res.json({
      success: true,
      data: {
        has_permission: hasPermission,
        user_id,
        permission,
        tenant_id
      }
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permission',
      error: error.message
    });
  }
};

/**
 * RBAC Controller
 * Handles role and permission management endpoints
 */

const rbacService = require('../services/rbacService');

class RBACController {
  /**
   * Get all permissions
   */
  async getAllPermissions(req, res) {
    try {
      const { category } = req.query;
      const permissions = await rbacService.getAllPermissions(category);
      res.json(permissions);
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  }

  /**
   * Get all roles for a tenant
   */
  async getRoles(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const roles = await rbacService.getRoles(tenantId);
      res.json(roles);
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(req, res) {
    try {
      const { role_id } = req.params;
      const role = await rbacService.getRoleById(role_id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      res.json(role);
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  }

  /**
   * Create a new custom role
   */
  async createRole(req, res) {
    try {
      const { name, display_name, description, permission_ids } = req.body;
      const tenantId = req.user.tenant_id;
      const createdBy = req.user.admin_id;

      if (!name || !display_name) {
        return res.status(400).json({ error: 'Name and display name are required' });
      }

      const role = await rbacService.createRole(
        tenantId,
        name,
        display_name,
        description,
        permission_ids || [],
        createdBy
      );

      res.status(201).json(role);
    } catch (error) {
      console.error('Create role error:', error);
      if (error.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Role name already exists' });
      }
      res.status(500).json({ error: 'Failed to create role' });
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req, res) {
    try {
      const { role_id } = req.params;
      const { permission_ids } = req.body;
      const updatedBy = req.user.admin_id;

      if (!permission_ids || !Array.isArray(permission_ids)) {
        return res.status(400).json({ error: 'Permission IDs array is required' });
      }

      await rbacService.updateRolePermissions(role_id, permission_ids, updatedBy);
      res.json({ message: 'Role permissions updated successfully' });
    } catch (error) {
      console.error('Update role permissions error:', error);
      res.status(500).json({ error: error.message || 'Failed to update role permissions' });
    }
  }

  /**
   * Delete a custom role
   */
  async deleteRole(req, res) {
    try {
      const { role_id } = req.params;
      const deletedBy = req.user.admin_id;

      await rbacService.deleteRole(role_id, deletedBy);
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete role' });
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(req, res) {
    try {
      const { admin_id, role_id } = req.body;
      const assignedBy = req.user.admin_id;
      const tenantId = req.user.tenant_id;

      if (!admin_id || !role_id) {
        return res.status(400).json({ error: 'Admin ID and role ID are required' });
      }

      const assignment = await rbacService.assignRole(admin_id, role_id, assignedBy, tenantId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({ error: error.message || 'Failed to assign role' });
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(req, res) {
    try {
      const { admin_id, role_id } = req.body;
      const revokedBy = req.user.admin_id;
      const tenantId = req.user.tenant_id;

      if (!admin_id || !role_id) {
        return res.status(400).json({ error: 'Admin ID and role ID are required' });
      }

      await rbacService.revokeRole(admin_id, role_id, revokedBy, tenantId);
      res.json({ message: 'Role revoked successfully' });
    } catch (error) {
      console.error('Revoke role error:', error);
      res.status(500).json({ error: error.message || 'Failed to revoke role' });
    }
  }

  /**
   * Get user's roles and permissions
   */
  async getUserRolesAndPermissions(req, res) {
    try {
      const { admin_id } = req.params;
      
      // Users can only view their own roles/permissions unless they have permission
      if (admin_id !== req.user.admin_id) {
        const hasPermission = await rbacService.hasPermission(req.user.admin_id, 'users.view');
        if (!hasPermission) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      const [roles, permissions] = await Promise.all([
        rbacService.getUserRoles(admin_id),
        rbacService.getUserPermissions(admin_id)
      ]);

      res.json({ roles, permissions });
    } catch (error) {
      console.error('Get user roles error:', error);
      res.status(500).json({ error: 'Failed to fetch user roles and permissions' });
    }
  }

  /**
   * Get current user's roles and permissions
   */
  async getMyRolesAndPermissions(req, res) {
    try {
      const adminId = req.user.admin_id;

      const [roles, permissions] = await Promise.all([
        rbacService.getUserRoles(adminId),
        rbacService.getUserPermissions(adminId)
      ]);

      res.json({ roles, permissions });
    } catch (error) {
      console.error('Get my roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles and permissions' });
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { action, start_date, end_date, limit = 100 } = req.query;

      const filters = {
        action,
        startDate: start_date,
        endDate: end_date,
        limit: parseInt(limit)
      };

      const logs = await rbacService.getAuditLogs(tenantId, filters);
      res.json(logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  /**
   * Get feature flags for tenant/role
   */
  async getFeatureFlags(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { role_id } = req.query;

      const flags = await rbacService.getFeatureFlags(tenantId, role_id);
      res.json(flags);
    } catch (error) {
      console.error('Get feature flags error:', error);
      res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(req, res) {
    try {
      const { role_id, feature_name, is_enabled } = req.body;
      const tenantId = req.user.tenant_id;
      const updatedBy = req.user.admin_id;

      if (!role_id || !feature_name || is_enabled === undefined) {
        return res.status(400).json({ 
          error: 'Role ID, feature name, and enabled status are required' 
        });
      }

      const flag = await rbacService.updateFeatureFlag(
        tenantId,
        role_id,
        feature_name,
        is_enabled,
        updatedBy
      );

      res.json(flag);
    } catch (error) {
      console.error('Update feature flag error:', error);
      res.status(500).json({ error: 'Failed to update feature flag' });
    }
  }
}

module.exports = new RBACController();
