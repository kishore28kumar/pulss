const { pool } = require('../config/db');

/**
 * RBAC Service
 * Handles all role-based access control operations
 */

class RBACService {
  /**
   * Check if a user has a specific permission
   * @param {string} userId - User ID
   * @param {string} userType - 'admin' or 'customer'
   * @param {string} permission - Permission name (e.g., 'products:create')
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, userType, permission, tenantId = null) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.permission_id
          JOIN roles r ON ur.role_id = r.role_id
          WHERE ur.user_id = $1
            AND ur.user_type = $2
            AND p.name = $3
            AND ur.is_active = true
            AND r.is_active = true
            AND p.is_active = true
            AND (ur.tenant_id = $4 OR ur.tenant_id IS NULL)
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ) AS has_permission
      `;
      
      const result = await pool.query(query, [userId, userType, permission, tenantId]);
      return result.rows[0]?.has_permission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   * @param {string} userId - User ID
   * @param {string} userType - 'admin' or 'customer'
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>}
   */
  async getUserPermissions(userId, userType, tenantId = null) {
    try {
      const query = `
        SELECT DISTINCT p.permission_id, p.name, p.description, p.action, 
               r.name as resource_name, r.description as resource_description
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        JOIN resources r ON p.resource_id = r.resource_id
        JOIN roles ro ON ur.role_id = ro.role_id
        WHERE ur.user_id = $1
          AND ur.user_type = $2
          AND ur.is_active = true
          AND ro.is_active = true
          AND p.is_active = true
          AND r.is_active = true
          AND (ur.tenant_id = $3 OR ur.tenant_id IS NULL)
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.name, p.action
      `;
      
      const result = await pool.query(query, [userId, userType, tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Get all roles for a user
   * @param {string} userId - User ID
   * @param {string} userType - 'admin' or 'customer'
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>}
   */
  async getUserRoles(userId, userType, tenantId = null) {
    try {
      const query = `
        SELECT r.role_id, r.name, r.display_name, r.description, r.priority,
               ur.assigned_at, ur.expires_at, ur.assigned_by
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1
          AND ur.user_type = $2
          AND ur.is_active = true
          AND r.is_active = true
          AND (ur.tenant_id = $3 OR ur.tenant_id IS NULL)
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.priority DESC
      `;
      
      const result = await pool.query(query, [userId, userType, tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} userType - 'admin' or 'customer'
   * @param {string} roleId - Role ID
   * @param {string} tenantId - Tenant ID
   * @param {string} assignedBy - Admin ID who assigned the role
   * @param {Date} expiresAt - Optional expiration date
   * @returns {Promise<Object>}
   */
  async assignRole(userId, userType, roleId, tenantId, assignedBy, expiresAt = null) {
    try {
      const query = `
        INSERT INTO user_roles (user_id, user_type, role_id, tenant_id, assigned_by, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, role_id, tenant_id) 
        DO UPDATE SET is_active = true, assigned_at = NOW(), expires_at = $6
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId, userType, roleId, tenantId, assignedBy, expiresAt]);
      
      // Log the assignment
      await this.logAuditAction({
        tenantId,
        actionType: 'role_assigned',
        entityType: 'user_role',
        entityId: result.rows[0].user_role_id,
        performedBy: assignedBy,
        affectedUserId: userId,
        newValue: { roleId, userId, userType, expiresAt }
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @param {string} tenantId - Tenant ID
   * @param {string} revokedBy - Admin ID who revoked the role
   * @returns {Promise<boolean>}
   */
  async revokeRole(userId, roleId, tenantId, revokedBy) {
    try {
      const query = `
        UPDATE user_roles
        SET is_active = false
        WHERE user_id = $1 AND role_id = $2 AND tenant_id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId, roleId, tenantId]);
      
      if (result.rows.length > 0) {
        await this.logAuditAction({
          tenantId,
          actionType: 'role_revoked',
          entityType: 'user_role',
          entityId: result.rows[0].user_role_id,
          performedBy: revokedBy,
          affectedUserId: userId,
          oldValue: { roleId, userId }
        });
      }
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error revoking role:', error);
      throw error;
    }
  }

  /**
   * Create custom role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>}
   */
  async createRole(roleData) {
    const { name, displayName, description, tenantId, partnerId, parentRoleId, createdBy } = roleData;
    
    try {
      const query = `
        INSERT INTO roles (name, display_name, description, tenant_id, partner_id, parent_role_id, is_custom, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7)
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, displayName, description, tenantId, partnerId, parentRoleId, createdBy]);
      
      await this.logAuditAction({
        tenantId,
        actionType: 'role_created',
        entityType: 'role',
        entityId: result.rows[0].role_id,
        entityName: name,
        performedBy: createdBy,
        newValue: roleData
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   * @param {string} roleId - Role ID
   * @param {Object} updates - Fields to update
   * @param {string} updatedBy - Admin ID who updated the role
   * @returns {Promise<Object>}
   */
  async updateRole(roleId, updates, updatedBy) {
    try {
      // Get old values first
      const oldRole = await pool.query('SELECT * FROM roles WHERE role_id = $1', [roleId]);
      
      const { displayName, description, isActive } = updates;
      const query = `
        UPDATE roles
        SET display_name = COALESCE($1, display_name),
            description = COALESCE($2, description),
            is_active = COALESCE($3, is_active),
            updated_at = NOW()
        WHERE role_id = $4 AND is_system = false
        RETURNING *
      `;
      
      const result = await pool.query(query, [displayName, description, isActive, roleId]);
      
      if (result.rows.length > 0) {
        await this.logAuditAction({
          tenantId: result.rows[0].tenant_id,
          actionType: 'role_updated',
          entityType: 'role',
          entityId: roleId,
          entityName: result.rows[0].name,
          performedBy: updatedBy,
          oldValue: oldRole.rows[0],
          newValue: result.rows[0],
          changes: updates
        });
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete custom role
   * @param {string} roleId - Role ID
   * @param {string} deletedBy - Admin ID who deleted the role
   * @returns {Promise<boolean>}
   */
  async deleteRole(roleId, deletedBy) {
    try {
      const role = await pool.query('SELECT * FROM roles WHERE role_id = $1', [roleId]);
      
      const query = `
        DELETE FROM roles
        WHERE role_id = $1 AND is_system = false
        RETURNING *
      `;
      
      const result = await pool.query(query, [roleId]);
      
      if (result.rows.length > 0) {
        await this.logAuditAction({
          tenantId: result.rows[0].tenant_id,
          actionType: 'role_deleted',
          entityType: 'role',
          entityId: roleId,
          entityName: result.rows[0].name,
          performedBy: deletedBy,
          oldValue: role.rows[0]
        });
      }
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Grant permission to role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @param {string} grantedBy - Admin ID who granted the permission
   * @returns {Promise<Object>}
   */
  async grantPermission(roleId, permissionId, grantedBy) {
    try {
      const query = `
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_id, permission_id) DO NOTHING
        RETURNING *
      `;
      
      const result = await pool.query(query, [roleId, permissionId, grantedBy]);
      
      if (result.rows.length > 0) {
        const role = await pool.query('SELECT * FROM roles WHERE role_id = $1', [roleId]);
        const permission = await pool.query('SELECT * FROM permissions WHERE permission_id = $1', [permissionId]);
        
        await this.logAuditAction({
          tenantId: role.rows[0]?.tenant_id,
          actionType: 'permission_granted',
          entityType: 'role_permission',
          entityId: result.rows[0].role_permission_id,
          performedBy: grantedBy,
          newValue: { roleId, roleName: role.rows[0]?.name, permissionId, permissionName: permission.rows[0]?.name }
        });
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @param {string} revokedBy - Admin ID who revoked the permission
   * @returns {Promise<boolean>}
   */
  async revokePermission(roleId, permissionId, revokedBy) {
    try {
      const role = await pool.query('SELECT * FROM roles WHERE role_id = $1', [roleId]);
      const permission = await pool.query('SELECT * FROM permissions WHERE permission_id = $1', [permissionId]);
      
      const query = `
        DELETE FROM role_permissions
        WHERE role_id = $1 AND permission_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [roleId, permissionId]);
      
      if (result.rows.length > 0) {
        await this.logAuditAction({
          tenantId: role.rows[0]?.tenant_id,
          actionType: 'permission_revoked',
          entityType: 'role_permission',
          entityId: result.rows[0].role_permission_id,
          performedBy: revokedBy,
          oldValue: { roleId, roleName: role.rows[0]?.name, permissionId, permissionName: permission.rows[0]?.name }
        });
      }
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>}
   */
  async getRolePermissions(roleId) {
    try {
      const query = `
        SELECT p.permission_id, p.name, p.description, p.action,
               r.name as resource_name, r.description as resource_description,
               rp.granted_at, rp.granted_by
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.permission_id
        JOIN resources r ON p.resource_id = r.resource_id
        WHERE rp.role_id = $1
        ORDER BY r.name, p.action
      `;
      
      const result = await pool.query(query, [roleId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  /**
   * Bulk assign roles to multiple users
   * @param {Array} assignments - Array of {userId, userType, roleId, tenantId}
   * @param {string} assignedBy - Admin ID who performed bulk assignment
   * @returns {Promise<Object>}
   */
  async bulkAssignRoles(assignments, assignedBy) {
    const results = { success: [], failed: [] };
    
    for (const assignment of assignments) {
      try {
        const result = await this.assignRole(
          assignment.userId,
          assignment.userType,
          assignment.roleId,
          assignment.tenantId,
          assignedBy,
          assignment.expiresAt
        );
        results.success.push({ ...assignment, result });
      } catch (error) {
        results.failed.push({ ...assignment, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Create role from template
   * @param {string} templateId - Template ID
   * @param {string} tenantId - Tenant ID
   * @param {string} createdBy - Admin ID
   * @returns {Promise<Object>}
   */
  async createRoleFromTemplate(templateId, tenantId, createdBy) {
    try {
      // Get template
      const template = await pool.query(
        'SELECT * FROM role_templates WHERE template_id = $1',
        [templateId]
      );
      
      if (template.rows.length === 0) {
        throw new Error('Template not found');
      }
      
      const templateData = template.rows[0];
      
      // Create role
      const role = await this.createRole({
        name: `${templateData.name}_${Date.now()}`,
        displayName: templateData.display_name,
        description: templateData.description,
        tenantId,
        createdBy
      });
      
      // Grant permissions from template
      const permissions = templateData.permissions;
      for (const permissionName of permissions) {
        const permission = await pool.query(
          'SELECT permission_id FROM permissions WHERE name = $1',
          [permissionName]
        );
        
        if (permission.rows.length > 0) {
          await this.grantPermission(role.role_id, permission.rows[0].permission_id, createdBy);
        }
      }
      
      return role;
    } catch (error) {
      console.error('Error creating role from template:', error);
      throw error;
    }
  }

  /**
   * Get RBAC feature flags for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>}
   */
  async getRBACFeatureFlags(tenantId) {
    try {
      const query = 'SELECT * FROM rbac_feature_flags WHERE tenant_id = $1';
      const result = await pool.query(query, [tenantId]);
      
      if (result.rows.length === 0) {
        // Initialize default flags
        await pool.query('INSERT INTO rbac_feature_flags (tenant_id) VALUES ($1)', [tenantId]);
        return await this.getRBACFeatureFlags(tenantId);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting RBAC feature flags:', error);
      return null;
    }
  }

  /**
   * Update RBAC feature flags (super admin only)
   * @param {string} tenantId - Tenant ID
   * @param {Object} flags - Flags to update
   * @param {string} updatedBy - Admin ID
   * @returns {Promise<Object>}
   */
  async updateRBACFeatureFlags(tenantId, flags, updatedBy) {
    try {
      const fields = Object.keys(flags)
        .map((key, idx) => `${key} = $${idx + 2}`)
        .join(', ');
      
      const values = Object.values(flags);
      
      const query = `
        UPDATE rbac_feature_flags
        SET ${fields}, updated_at = NOW()
        WHERE tenant_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [tenantId, ...values]);
      
      await this.logAuditAction({
        tenantId,
        actionType: 'rbac_flags_updated',
        entityType: 'rbac_feature_flags',
        entityId: tenantId,
        performedBy: updatedBy,
        newValue: flags
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating RBAC feature flags:', error);
      throw error;
    }
  }

  /**
   * Log audit action
   * @param {Object} auditData - Audit data
   * @returns {Promise<void>}
   */
  async logAuditAction(auditData) {
    try {
      const query = `
        INSERT INTO rbac_audit_logs (
          tenant_id, action_type, entity_type, entity_id, entity_name,
          performed_by, performed_by_name, affected_user_id, affected_user_name,
          old_value, new_value, changes, ip_address, user_agent, reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;
      
      await pool.query(query, [
        auditData.tenantId || null,
        auditData.actionType,
        auditData.entityType,
        auditData.entityId,
        auditData.entityName || null,
        auditData.performedBy,
        auditData.performedByName || null,
        auditData.affectedUserId || null,
        auditData.affectedUserName || null,
        auditData.oldValue ? JSON.stringify(auditData.oldValue) : null,
        auditData.newValue ? JSON.stringify(auditData.newValue) : null,
        auditData.changes ? JSON.stringify(auditData.changes) : null,
        auditData.ipAddress || null,
        auditData.userAgent || null,
        auditData.reason || null
      ]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  /**
   * Get audit logs
   * @param {Object} filters - Filter options
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Promise<Object>}
   */
  async getAuditLogs(filters = {}, limit = 50, offset = 0) {
    try {
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;
      
      if (filters.tenantId) {
        whereConditions.push(`tenant_id = $${paramIndex}`);
        params.push(filters.tenantId);
        paramIndex++;
      }
      
      if (filters.actionType) {
        whereConditions.push(`action_type = $${paramIndex}`);
        params.push(filters.actionType);
        paramIndex++;
      }
      
      if (filters.entityType) {
        whereConditions.push(`entity_type = $${paramIndex}`);
        params.push(filters.entityType);
        paramIndex++;
      }
      
      if (filters.performedBy) {
        whereConditions.push(`performed_by = $${paramIndex}`);
        params.push(filters.performedBy);
        paramIndex++;
      }
      
      if (filters.startDate) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        params.push(filters.endDate);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const countQuery = `SELECT COUNT(*) FROM rbac_audit_logs ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      const query = `
        SELECT *
        FROM rbac_audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const result = await pool.query(query, params);
      
      return {
        logs: result.rows,
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return { logs: [], total: 0, limit, offset, pages: 0 };
    }

/**
 * RBAC Service
 * Handles role-based access control logic
 */

const pool = require('../config/database');

class RBACService {
  /**
   * Get user's roles and permissions
   */
  async getUserPermissions(adminId) {
    const query = `
      SELECT DISTINCT p.name, p.display_name, p.category, p.description
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.permission_id
      WHERE ur.admin_id = $1 AND p.is_active = true
    `;
    const result = await pool.query(query, [adminId]);
    return result.rows;
  }

  /**
   * Get user's roles
   */
  async getUserRoles(adminId) {
    const query = `
      SELECT r.role_id, r.name, r.display_name, r.description, r.is_system_role, r.tenant_id
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.role_id
      WHERE ur.admin_id = $1 AND r.is_active = true
    `;
    const result = await pool.query(query, [adminId]);
    return result.rows;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(adminId, permissionName) {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.permission_id
        WHERE ur.admin_id = $1 AND p.name = $2 AND p.is_active = true
      ) as has_permission
    `;
    const result = await pool.query(query, [adminId, permissionName]);
    return result.rows[0].has_permission;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(adminId, permissionNames) {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.permission_id
        WHERE ur.admin_id = $1 AND p.name = ANY($2) AND p.is_active = true
      ) as has_permission
    `;
    const result = await pool.query(query, [adminId, permissionNames]);
    return result.rows[0].has_permission;
  }

  /**
   * Check if user has role
   */
  async hasRole(adminId, roleName) {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.role_id
        WHERE ur.admin_id = $1 AND r.name = $2 AND r.is_active = true
      ) as has_role
    `;
    const result = await pool.query(query, [adminId, roleName]);
    return result.rows[0].has_role;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(category = null) {
    let query = 'SELECT * FROM public.permissions WHERE is_active = true';
    const params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, name';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get all roles for a tenant (or system roles)
   */
  async getRoles(tenantId = null) {
    let query = `
      SELECT r.*, 
        (SELECT COUNT(*) FROM public.user_roles WHERE role_id = r.role_id) as user_count
      FROM public.roles r
      WHERE r.is_active = true
    `;
    const params = [];
    
    if (tenantId) {
      query += ' AND (r.tenant_id = $1 OR r.tenant_id IS NULL)';
      params.push(tenantId);
    } else {
      query += ' AND r.tenant_id IS NULL';
    }
    
    query += ' ORDER BY r.is_system_role DESC, r.name';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(roleId) {
    const roleQuery = 'SELECT * FROM public.roles WHERE role_id = $1';
    const roleResult = await pool.query(roleQuery, [roleId]);
    
    if (roleResult.rows.length === 0) {
      return null;
    }
    
    const role = roleResult.rows[0];
    
    const permissionsQuery = `
      SELECT p.*
      FROM public.role_permissions rp
      JOIN public.permissions p ON rp.permission_id = p.permission_id
      WHERE rp.role_id = $1 AND p.is_active = true
      ORDER BY p.category, p.name
    `;
    const permissionsResult = await pool.query(permissionsQuery, [roleId]);
    
    role.permissions = permissionsResult.rows;
    return role;
  }

  /**
   * Create a new custom role
   */
  async createRole(tenantId, name, displayName, description, permissionIds, createdBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create role
      const roleQuery = `
        INSERT INTO public.roles (tenant_id, name, display_name, description, is_system_role)
        VALUES ($1, $2, $3, $4, false)
        RETURNING *
      `;
      const roleResult = await client.query(roleQuery, [tenantId, name, displayName, description]);
      const role = roleResult.rows[0];
      
      // Add permissions
      if (permissionIds && permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await client.query(
            'INSERT INTO public.role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [role.role_id, permissionId]
          );
        }
      }
      
      // Log audit
      await client.query(
        `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, changes, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, role.role_id, 'role_created', JSON.stringify({ role, permissionIds }), createdBy]
      );
      
      await client.query('COMMIT');
      return role;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId, permissionIds, updatedBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get role info
      const roleResult = await client.query('SELECT * FROM public.roles WHERE role_id = $1', [roleId]);
      if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
      }
      const role = roleResult.rows[0];
      
      // System roles cannot be modified this way (only via admin interface with special handling)
      if (role.is_system_role) {
        throw new Error('Cannot modify system role permissions directly');
      }
      
      // Get old permissions for audit
      const oldPermsResult = await client.query(
        'SELECT permission_id FROM public.role_permissions WHERE role_id = $1',
        [roleId]
      );
      const oldPermissionIds = oldPermsResult.rows.map(r => r.permission_id);
      
      // Delete existing permissions
      await client.query('DELETE FROM public.role_permissions WHERE role_id = $1', [roleId]);
      
      // Add new permissions
      for (const permissionId of permissionIds) {
        await client.query(
          'INSERT INTO public.role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, permissionId]
        );
      }
      
      // Log audit
      await client.query(
        `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, changes, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          role.tenant_id,
          roleId,
          'permission_updated',
          JSON.stringify({ old: oldPermissionIds, new: permissionIds }),
          updatedBy
        ]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(adminId, roleId, assignedBy, tenantId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if assignment already exists
      const existingResult = await client.query(
        'SELECT * FROM public.user_roles WHERE admin_id = $1 AND role_id = $2',
        [adminId, roleId]
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error('Role already assigned to user');
      }
      
      // Assign role
      const assignResult = await client.query(
        'INSERT INTO public.user_roles (admin_id, role_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
        [adminId, roleId, assignedBy]
      );
      
      // Log audit
      await client.query(
        `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, target_admin_id, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, roleId, 'role_assigned', adminId, assignedBy]
      );
      
      await client.query('COMMIT');
      return assignResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(adminId, roleId, revokedBy, tenantId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Revoke role
      const result = await client.query(
        'DELETE FROM public.user_roles WHERE admin_id = $1 AND role_id = $2',
        [adminId, roleId]
      );
      
      if (result.rowCount === 0) {
        throw new Error('Role assignment not found');
      }
      
      // Log audit
      await client.query(
        `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, target_admin_id, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, roleId, 'role_revoked', adminId, revokedBy]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a custom role
   */
  async deleteRole(roleId, deletedBy) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get role info
      const roleResult = await client.query('SELECT * FROM public.roles WHERE role_id = $1', [roleId]);
      if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
      }
      const role = roleResult.rows[0];
      
      // Cannot delete system roles
      if (role.is_system_role) {
        throw new Error('Cannot delete system role');
      }
      
      // Soft delete (set inactive)
      await client.query('UPDATE public.roles SET is_active = false WHERE role_id = $1', [roleId]);
      
      // Log audit
      await client.query(
        `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, changes, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [role.tenant_id, roleId, 'role_deleted', JSON.stringify({ role }), deletedBy]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(tenantId = null, filters = {}) {
    let query = `
      SELECT 
        ral.*,
        r.name as role_name,
        r.display_name as role_display_name,
        a.full_name as performed_by_name,
        ta.full_name as target_admin_name
      FROM public.role_audit_logs ral
      LEFT JOIN public.roles r ON ral.role_id = r.role_id
      LEFT JOIN public.admins a ON ral.performed_by = a.admin_id
      LEFT JOIN public.admins ta ON ral.target_admin_id = ta.admin_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (tenantId) {
      query += ` AND ral.tenant_id = $${paramIndex}`;
      params.push(tenantId);
      paramIndex++;
    }
    
    if (filters.action) {
      query += ` AND ral.action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }
    
    if (filters.startDate) {
      query += ` AND ral.created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      query += ` AND ral.created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }
    
    query += ' ORDER BY ral.created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get feature flags for role/tenant
   */
  async getFeatureFlags(tenantId, roleId = null) {
    let query = `
      SELECT * FROM public.role_feature_flags
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    
    if (roleId) {
      query += ' AND role_id = $2';
      params.push(roleId);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(tenantId, roleId, featureName, isEnabled, updatedBy) {
    const query = `
      INSERT INTO public.role_feature_flags (tenant_id, role_id, feature_name, is_enabled)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, role_id, feature_name)
      DO UPDATE SET is_enabled = $4, updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, roleId, featureName, isEnabled]);
    
    // Log audit
    await pool.query(
      `INSERT INTO public.role_audit_logs (tenant_id, role_id, action, changes, performed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, roleId, 'feature_flag_updated', JSON.stringify({ featureName, isEnabled }), updatedBy]
    );
    
    return result.rows[0];
  }
}

module.exports = new RBACService();
