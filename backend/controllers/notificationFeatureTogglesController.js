const db = require('../config/db');

/**
 * Notification Feature Toggles Controller
 * Manages super admin controls for notification features per tenant/partner
 */

/**
 * Get feature toggles for a tenant
 */
exports.getFeatureToggles = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can access feature toggles'
      });
    }

    const result = await db.query(
      `SELECT * FROM notification_feature_toggles WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Create default toggles if they don't exist
      const defaultToggles = await db.query(
        `INSERT INTO notification_feature_toggles (tenant_id, configured_by)
         VALUES ($1, $2)
         RETURNING *`,
        [tenantId, req.user.id]
      );

      return res.json({
        success: true,
        data: defaultToggles.rows[0]
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching feature toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature toggles'
    });
  }
};

/**
 * Update feature toggles for a tenant
 */
exports.updateFeatureToggles = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can update feature toggles'
      });
    }

    const allowedFields = [
      'notifications_enabled',
      'push_notifications_enabled',
      'sms_notifications_enabled',
      'email_notifications_enabled',
      'whatsapp_notifications_enabled',
      'campaigns_enabled',
      'campaign_automation_enabled',
      'campaign_scheduling_enabled',
      'ab_testing_enabled',
      'custom_templates_enabled',
      'template_editor_enabled',
      'branded_templates_enabled',
      'analytics_enabled',
      'advanced_analytics_enabled',
      'export_enabled',
      'compliance_mode',
      'gdpr_enabled',
      'dpdp_enabled',
      'opt_in_required',
      'api_access_enabled',
      'webhook_enabled',
      'third_party_integration_enabled',
      'max_campaigns_per_month',
      'max_notifications_per_day',
      'max_templates',
      'notes'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(req.body[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push(`configured_by = $${paramIndex}`, `updated_at = NOW()`);
    values.push(userId, tenantId);

    const result = await db.query(
      `UPDATE notification_feature_toggles 
       SET ${updates.join(', ')}
       WHERE tenant_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feature toggles not found'
      });
    }

    // Log the change in audit logs
    await db.query(
      `INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, resource_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        userId,
        'update',
        'notification_feature_toggles',
        tenantId,
        JSON.stringify(req.body),
        req.ip,
        req.get('user-agent')
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Feature toggles updated successfully'
    });
  } catch (error) {
    console.error('Error updating feature toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feature toggles'
    });
  }
};

/**
 * Get all tenants with their feature toggle status
 */
exports.getAllTenantsToggles = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can access this endpoint'
      });
    }

    const result = await db.query(
      `SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.status as tenant_status,
        nft.notifications_enabled,
        nft.push_notifications_enabled,
        nft.sms_notifications_enabled,
        nft.email_notifications_enabled,
        nft.campaigns_enabled,
        nft.analytics_enabled,
        nft.custom_templates_enabled,
        nft.compliance_mode,
        nft.max_campaigns_per_month,
        nft.max_notifications_per_day,
        nft.updated_at
      FROM tenants t
      LEFT JOIN notification_feature_toggles nft ON t.id = nft.tenant_id
      ORDER BY t.name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all tenant toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant toggles'
    });
  }
};

/**
 * Bulk update feature toggles for multiple tenants
 */
exports.bulkUpdateToggles = async (req, res) => {
  try {
    const { tenantIds, updates } = req.body;
    const userId = req.user.id;

    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can perform bulk updates'
      });
    }

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant IDs'
      });
    }

    const allowedFields = [
      'notifications_enabled',
      'push_notifications_enabled',
      'sms_notifications_enabled',
      'email_notifications_enabled',
      'whatsapp_notifications_enabled',
      'campaigns_enabled',
      'analytics_enabled',
      'custom_templates_enabled'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push(`configured_by = $${paramIndex}`, `updated_at = NOW()`);
    values.push(userId);

    // Build query for multiple tenants
    const placeholders = tenantIds.map((_, i) => `$${paramIndex + 1 + i}`).join(',');
    values.push(...tenantIds);

    const result = await db.query(
      `UPDATE notification_feature_toggles 
       SET ${updateFields.join(', ')}
       WHERE tenant_id IN (${placeholders})
       RETURNING tenant_id`,
      values
    );

    res.json({
      success: true,
      message: `Updated feature toggles for ${result.rowCount} tenants`,
      updatedTenants: result.rows.map(r => r.tenant_id)
    });
  } catch (error) {
    console.error('Error bulk updating toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update toggles'
    });
  }
};

/**
 * Get feature toggle history/audit log
 */
exports.getToggleHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can access toggle history'
      });
    }

    const result = await db.query(
      `SELECT 
        al.*,
        p.email as user_email,
        p.full_name as user_name
      FROM audit_logs al
      LEFT JOIN profiles p ON al.user_id = p.id
      WHERE al.tenant_id = $1 
        AND al.resource_type = 'notification_feature_toggles'
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching toggle history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch toggle history'
    });
  }
};

/**
 * Reset feature toggles to default
 */
exports.resetToggles = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can reset feature toggles'
      });
    }

    const result = await db.query(
      `UPDATE notification_feature_toggles 
       SET 
         notifications_enabled = true,
         push_notifications_enabled = false,
         sms_notifications_enabled = false,
         email_notifications_enabled = false,
         whatsapp_notifications_enabled = false,
         campaigns_enabled = false,
         campaign_automation_enabled = false,
         campaign_scheduling_enabled = false,
         ab_testing_enabled = false,
         custom_templates_enabled = false,
         template_editor_enabled = false,
         branded_templates_enabled = true,
         analytics_enabled = false,
         advanced_analytics_enabled = false,
         export_enabled = false,
         compliance_mode = 'standard',
         gdpr_enabled = false,
         dpdp_enabled = false,
         opt_in_required = false,
         api_access_enabled = false,
         webhook_enabled = false,
         third_party_integration_enabled = false,
         max_campaigns_per_month = NULL,
         max_notifications_per_day = NULL,
         max_templates = 10,
         configured_by = $1,
         updated_at = NOW()
       WHERE tenant_id = $2
       RETURNING *`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Log the reset
    await db.query(
      `INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, resource_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        userId,
        'reset',
        'notification_feature_toggles',
        tenantId,
        JSON.stringify({ action: 'reset_to_defaults' }),
        req.ip,
        req.get('user-agent')
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Feature toggles reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset feature toggles'
    });
  }
};

module.exports = exports;
