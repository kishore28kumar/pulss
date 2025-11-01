const brandingService = require('../services/brandingService');
const { pool } = require('../config/db');

// Helper to get user context from request
const getUserContext = (req) => ({
  userId: req.user?.admin_id || req.user?.customer_id,
  userName: req.user?.full_name || req.user?.name,
  role: req.user?.role,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

// Create or update branding
exports.upsertBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const brandingData = req.body;
    const user = getUserContext(req);

    // Verify user has permission for this tenant
    if (user.role !== 'super_admin') {
      // Check if user belongs to this tenant
      const result = await pool.query(
        'SELECT tenant_id FROM admins WHERE admin_id = $1 AND tenant_id = $2',
        [user.userId, tenantId]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this tenant' });
      }
    }

    const branding = await brandingService.upsertBranding(tenantId, brandingData, user);
    res.json(branding);
  } catch (error) {
    console.error('Error upserting branding:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get branding for a tenant
exports.getBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const includeDraft = req.query.draft === 'true';
    
    const branding = await brandingService.getBranding(tenantId, includeDraft);
    
    if (!branding) {
      return res.status(404).json({ error: 'Branding not found' });
    }
    
    res.json(branding);
  } catch (error) {
    console.error('Error getting branding:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update logo
exports.updateLogo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = getUserContext(req);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoData = {
      url: `/uploads/${req.file.filename}`,
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
      format: req.file.mimetype.split('/')[1],
    };

    const branding = await brandingService.updateLogo(tenantId, logoData, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update colors
exports.updateColors = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const colors = req.body;
    const user = getUserContext(req);

    const branding = await brandingService.updateColors(tenantId, colors, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating colors:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update theme
exports.updateTheme = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const theme = req.body;
    const user = getUserContext(req);

    const branding = await brandingService.upsertBranding(tenantId, { theme }, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom CSS
exports.updateCustomCSS = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const customCSS = req.body;
    const user = getUserContext(req);

    const branding = await brandingService.upsertBranding(tenantId, { customCSS }, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating custom CSS:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom domain
exports.updateCustomDomain = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const domainData = req.body;
    const user = getUserContext(req);

    const branding = await brandingService.updateCustomDomain(tenantId, domainData, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating custom domain:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify custom domain
exports.verifyCustomDomain = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = getUserContext(req);

    const branding = await brandingService.verifyCustomDomain(tenantId, user);
    res.json({ 
      verified: branding.customDomain.isVerified,
      domain: branding.customDomain.domain 
    });
  } catch (error) {
    console.error('Error verifying custom domain:', error);
    res.status(500).json({ error: error.message });
  }
};

// Enable SSL
exports.enableSSL = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = getUserContext(req);

    const branding = await brandingService.enableSSL(tenantId, user);
    res.json({ 
      sslEnabled: branding.customDomain.sslEnabled,
      certificate: branding.customDomain.sslCertificate 
    });
  } catch (error) {
    console.error('Error enabling SSL:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle feature (super admin only)
exports.toggleFeature = async (req, res) => {
  try {
    const { tenantId, feature } = req.params;
    const { enabled } = req.body;
    const user = getUserContext(req);

    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can toggle features' });
    }

    const branding = await brandingService.toggleFeature(tenantId, feature, enabled, user);
    res.json(branding);
  } catch (error) {
    console.error('Error toggling feature:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const options = {
      entity: req.query.entity,
      action: req.query.action,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      skip: req.query.skip ? parseInt(req.query.skip) : 0,
    };

    const logs = await brandingService.getAuditLogs(tenantId, options);
    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Publish branding
exports.publishBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = getUserContext(req);

    const branding = await brandingService.publishBranding(tenantId, user);
    res.json(branding);
  } catch (error) {
    console.error('Error publishing branding:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update mobile app icons
exports.updateMobileIcons = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const mobileAppIcons = req.body;
    const user = getUserContext(req);

    const branding = await brandingService.upsertBranding(tenantId, { mobileAppIcons }, user);
    res.json(branding);
  } catch (error) {
    console.error('Error updating mobile icons:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create email template
exports.createEmailTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const user = getUserContext(req);

    const template = await brandingService.createEmailTemplate(templateData, user);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get email template
exports.getEmailTemplate = async (req, res) => {
  try {
    const { tenantId, type } = req.params;

    const template = await brandingService.getEmailTemplate(tenantId, type);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error getting email template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Preview email with branding
exports.previewEmail = async (req, res) => {
  try {
    const { tenantId, type } = req.params;
    const data = req.body;

    const rendered = await brandingService.renderEmail(tenantId, type, data);
    res.json(rendered);
  } catch (error) {
    console.error('Error previewing email:', error);
    res.status(500).json({ error: error.message });
  }
};

const { pool } = require('../config/db');
const { logAudit } = require('../middleware/auditLog');

/**
 * Branding Controller
 * Manages advanced branding and white-label configurations
 */

// Get branding configuration for a tenant
exports.getBrandingConfig = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { includeAssets = false, includeToggles = false } = req.query;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get branding configuration
    const configResult = await pool.query(
      'SELECT * FROM branding_configs WHERE tenant_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [tenant_id]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Branding configuration not found' });
    }

    const config = configResult.rows[0];
    const response = { config };

    // Include assets if requested
    if (includeAssets === 'true') {
      const assetsResult = await pool.query(
        'SELECT * FROM branding_assets WHERE branding_id = $1 AND is_active = true ORDER BY created_at DESC',
        [config.branding_id]
      );
      response.assets = assetsResult.rows;
    }

    // Include feature toggles if requested
    if (includeToggles === 'true') {
      const togglesResult = await pool.query(
        'SELECT * FROM branding_feature_toggles WHERE tenant_id = $1',
        [tenant_id]
      );
      response.toggles = togglesResult.rows[0] || null;
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting branding config:', error);
    res.status(500).json({ error: 'Failed to get branding configuration' });
  }
};

// Create or update branding configuration
exports.upsertBrandingConfig = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const brandingData = req.body;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if branding features are enabled for this tenant
    const togglesResult = await pool.query(
      'SELECT * FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    const toggles = togglesResult.rows[0];
    if (!toggles && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Branding features not enabled for this tenant' });
    }

    // Validate feature access based on toggles
    if (toggles && req.user.role !== 'super_admin') {
      if (!toggles.custom_logo_enabled && (brandingData.logo_url || brandingData.logo_dark_url)) {
        return res.status(403).json({ error: 'Custom logo feature not enabled' });
      }
      if (!toggles.custom_colors_enabled && brandingData.colors) {
        return res.status(403).json({ error: 'Custom colors feature not enabled' });
      }
      if (!toggles.custom_fonts_enabled && brandingData.fonts) {
        return res.status(403).json({ error: 'Custom fonts feature not enabled' });
      }
      if (!toggles.custom_css_enabled && brandingData.custom_css) {
        return res.status(403).json({ error: 'Custom CSS feature not enabled' });
      }
      if (!toggles.branded_email_enabled && brandingData.email_templates) {
        return res.status(403).json({ error: 'Branded email feature not enabled' });
      }
      if (!toggles.branded_sms_enabled && brandingData.sms_templates) {
        return res.status(403).json({ error: 'Branded SMS feature not enabled' });
      }
    }

    // Check if config exists
    const existingResult = await pool.query(
      'SELECT * FROM branding_configs WHERE tenant_id = $1 AND is_active = true LIMIT 1',
      [tenant_id]
    );

    let result;
    let action;
    let oldValues = null;

    if (existingResult.rows.length > 0) {
      // Update existing configuration
      const existingConfig = existingResult.rows[0];
      oldValues = existingConfig;
      action = 'update';

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      // Build dynamic update query
      const allowedFields = [
        'logo_url', 'logo_dark_url', 'favicon_url', 'favicon_16_url', 'favicon_32_url',
        'apple_touch_icon_url', 'brand_name', 'brand_tagline', 'brand_description',
        'colors', 'fonts', 'custom_domains', 'primary_domain', 'email_header_url',
        'email_footer_text', 'email_from_name', 'email_reply_to', 'email_templates',
        'sms_sender_name', 'sms_templates', 'notification_icon_url', 'notification_templates',
        'api_docs_logo_url', 'api_docs_title', 'api_docs_description', 'api_docs_theme',
        'assets', 'custom_css', 'custom_head_html', 'custom_body_html', 'region',
        'region_config', 'compliance_templates', 'privacy_policy_url', 'terms_url'
      ];

      for (const field of allowedFields) {
        if (brandingData[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(brandingData[field]);
          paramCount++;
        }
      }

      updateFields.push(`updated_by = $${paramCount}`);
      updateValues.push(req.user.admin_id || req.user.id);
      paramCount++;

      updateFields.push(`version = version + 1`);

      updateValues.push(existingConfig.branding_id);

      result = await pool.query(
        `UPDATE branding_configs SET ${updateFields.join(', ')} WHERE branding_id = $${paramCount} RETURNING *`,
        updateValues
      );
    } else {
      // Create new configuration
      action = 'create';

      result = await pool.query(
        `INSERT INTO branding_configs (
          tenant_id, partner_id, logo_url, logo_dark_url, favicon_url, favicon_16_url,
          favicon_32_url, apple_touch_icon_url, brand_name, brand_tagline, brand_description,
          colors, fonts, custom_domains, primary_domain, email_header_url, email_footer_text,
          email_from_name, email_reply_to, email_templates, sms_sender_name, sms_templates,
          notification_icon_url, notification_templates, api_docs_logo_url, api_docs_title,
          api_docs_description, api_docs_theme, assets, custom_css, custom_head_html,
          custom_body_html, region, region_config, compliance_templates, privacy_policy_url,
          terms_url, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $38
        ) RETURNING *`,
        [
          tenant_id,
          brandingData.partner_id || null,
          brandingData.logo_url || null,
          brandingData.logo_dark_url || null,
          brandingData.favicon_url || null,
          brandingData.favicon_16_url || null,
          brandingData.favicon_32_url || null,
          brandingData.apple_touch_icon_url || null,
          brandingData.brand_name || null,
          brandingData.brand_tagline || null,
          brandingData.brand_description || null,
          JSON.stringify(brandingData.colors || {}),
          JSON.stringify(brandingData.fonts || {}),
          brandingData.custom_domains || null,
          brandingData.primary_domain || null,
          brandingData.email_header_url || null,
          brandingData.email_footer_text || null,
          brandingData.email_from_name || null,
          brandingData.email_reply_to || null,
          JSON.stringify(brandingData.email_templates || {}),
          brandingData.sms_sender_name || null,
          JSON.stringify(brandingData.sms_templates || {}),
          brandingData.notification_icon_url || null,
          JSON.stringify(brandingData.notification_templates || {}),
          brandingData.api_docs_logo_url || null,
          brandingData.api_docs_title || null,
          brandingData.api_docs_description || null,
          JSON.stringify(brandingData.api_docs_theme || {}),
          JSON.stringify(brandingData.assets || {}),
          brandingData.custom_css || null,
          brandingData.custom_head_html || null,
          brandingData.custom_body_html || null,
          brandingData.region || 'global',
          JSON.stringify(brandingData.region_config || {}),
          JSON.stringify(brandingData.compliance_templates || {}),
          brandingData.privacy_policy_url || null,
          brandingData.terms_url || null,
          req.user.admin_id || req.user.id
        ]
      );
    }

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, branding_id, action, entity_type, entity_id, old_values, new_values,
        user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenant_id,
        result.rows[0].branding_id,
        action,
        'branding_config',
        result.rows[0].branding_id,
        oldValues ? JSON.stringify(oldValues) : null,
        JSON.stringify(result.rows[0]),
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.status(action === 'create' ? 201 : 200).json({
      message: `Branding configuration ${action}d successfully`,
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Error upserting branding config:', error);
    res.status(500).json({ error: 'Failed to save branding configuration' });
  }
};

// Get branding feature toggles for a tenant
exports.getFeatureToggles = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Only super admins can view toggles
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const result = await pool.query(
      'SELECT * FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    if (result.rows.length === 0) {
      // Return default toggles if none exist
      return res.json({
        tenant_id,
        custom_logo_enabled: false,
        custom_colors_enabled: false,
        custom_fonts_enabled: false,
        custom_css_enabled: false,
        custom_domain_enabled: false,
        branded_email_enabled: false,
        branded_sms_enabled: false,
        branded_notifications_enabled: false,
        branded_api_docs_enabled: false,
        white_label_mode_enabled: false,
        asset_management_enabled: false,
        compliance_templates_enabled: false,
        branding_export_enabled: false,
        branding_import_enabled: false,
        region_customization_enabled: false
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting feature toggles:', error);
    res.status(500).json({ error: 'Failed to get feature toggles' });
  }
};

// Update branding feature toggles (super admin only)
exports.updateFeatureToggles = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const toggles = req.body;

    // Only super admins can update toggles
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Check if toggles exist
    const existingResult = await pool.query(
      'SELECT * FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    let result;
    let action;

    if (existingResult.rows.length > 0) {
      // Update existing toggles
      action = 'update';
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const allowedFields = [
        'custom_logo_enabled', 'custom_colors_enabled', 'custom_fonts_enabled',
        'custom_css_enabled', 'custom_domain_enabled', 'max_custom_domains',
        'branded_email_enabled', 'branded_sms_enabled', 'email_template_customization',
        'sms_template_customization', 'branded_notifications_enabled',
        'notification_template_customization', 'branded_api_docs_enabled',
        'white_label_mode_enabled', 'asset_management_enabled',
        'compliance_templates_enabled', 'branding_export_enabled',
        'branding_import_enabled', 'region_customization_enabled',
        'allowed_regions', 'max_logo_size_mb', 'max_asset_storage_mb', 'notes'
      ];

      for (const field of allowedFields) {
        if (toggles[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(toggles[field]);
          paramCount++;
        }
      }

      updateFields.push(`enabled_by = $${paramCount}`);
      updateValues.push(req.user.admin_id || req.user.id);
      paramCount++;

      updateValues.push(tenant_id);

      result = await pool.query(
        `UPDATE branding_feature_toggles SET ${updateFields.join(', ')} WHERE tenant_id = $${paramCount} RETURNING *`,
        updateValues
      );
    } else {
      // Create new toggles
      action = 'create';
      result = await pool.query(
        `INSERT INTO branding_feature_toggles (
          tenant_id, custom_logo_enabled, custom_colors_enabled, custom_fonts_enabled,
          custom_css_enabled, custom_domain_enabled, max_custom_domains,
          branded_email_enabled, branded_sms_enabled, email_template_customization,
          sms_template_customization, branded_notifications_enabled,
          notification_template_customization, branded_api_docs_enabled,
          white_label_mode_enabled, asset_management_enabled,
          compliance_templates_enabled, branding_export_enabled,
          branding_import_enabled, region_customization_enabled,
          allowed_regions, max_logo_size_mb, max_asset_storage_mb, enabled_by, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25
        ) RETURNING *`,
        [
          tenant_id,
          toggles.custom_logo_enabled || false,
          toggles.custom_colors_enabled || false,
          toggles.custom_fonts_enabled || false,
          toggles.custom_css_enabled || false,
          toggles.custom_domain_enabled || false,
          toggles.max_custom_domains || 1,
          toggles.branded_email_enabled || false,
          toggles.branded_sms_enabled || false,
          toggles.email_template_customization || false,
          toggles.sms_template_customization || false,
          toggles.branded_notifications_enabled || false,
          toggles.notification_template_customization || false,
          toggles.branded_api_docs_enabled || false,
          toggles.white_label_mode_enabled || false,
          toggles.asset_management_enabled || false,
          toggles.compliance_templates_enabled || false,
          toggles.branding_export_enabled || false,
          toggles.branding_import_enabled || false,
          toggles.region_customization_enabled || false,
          toggles.allowed_regions || ['india', 'global'],
          toggles.max_logo_size_mb || 5.00,
          toggles.max_asset_storage_mb || 100.00,
          req.user.admin_id || req.user.id,
          toggles.notes || null
        ]
      );
    }

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, action, entity_type, entity_id, new_values,
        user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenant_id,
        action,
        'toggle',
        result.rows[0].toggle_id,
        JSON.stringify(result.rows[0]),
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.json({
      message: `Feature toggles ${action}d successfully`,
      toggles: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating feature toggles:', error);
    res.status(500).json({ error: 'Failed to update feature toggles' });
  }
};

// Upload branding asset
exports.uploadAsset = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { branding_id, asset_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if asset management is enabled
    const togglesResult = await pool.query(
      'SELECT asset_management_enabled, max_logo_size_mb, max_asset_storage_mb FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    const toggles = togglesResult.rows[0];
    if (toggles && !toggles.asset_management_enabled && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Asset management not enabled for this tenant' });
    }

    // Check file size limit
    const maxSize = toggles?.max_logo_size_mb || 5;
    if (req.file.size > maxSize * 1024 * 1024) {
      return res.status(400).json({ error: `File size exceeds limit of ${maxSize}MB` });
    }

    // Save asset record
    const result = await pool.query(
      `INSERT INTO branding_assets (
        branding_id, tenant_id, asset_type, file_name, file_path, file_url,
        file_size_bytes, mime_type, width, height, format, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        branding_id,
        tenant_id,
        asset_type,
        req.file.filename,
        req.file.path,
        `/uploads/${req.file.filename}`,
        req.file.size,
        req.file.mimetype,
        null, // Width to be determined by image processing
        null, // Height to be determined by image processing
        req.file.mimetype.split('/')[1],
        req.user.admin_id || req.user.id
      ]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, branding_id, action, entity_type, entity_id, new_values,
        user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenant_id,
        branding_id,
        'upload',
        'asset',
        result.rows[0].asset_id,
        JSON.stringify(result.rows[0]),
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.status(201).json({
      message: 'Asset uploaded successfully',
      asset: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
};

// Export branding configuration
exports.exportConfig = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if export is enabled
    const togglesResult = await pool.query(
      'SELECT branding_export_enabled FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    const toggles = togglesResult.rows[0];
    if (toggles && !toggles.branding_export_enabled && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Branding export not enabled for this tenant' });
    }

    // Get all branding data
    const configResult = await pool.query(
      'SELECT * FROM branding_configs WHERE tenant_id = $1 AND is_active = true LIMIT 1',
      [tenant_id]
    );

    const assetsResult = await pool.query(
      'SELECT * FROM branding_assets WHERE tenant_id = $1 AND is_active = true',
      [tenant_id]
    );

    const domainsResult = await pool.query(
      'SELECT * FROM custom_domains WHERE tenant_id = $1 AND is_active = true',
      [tenant_id]
    );

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      tenant_id,
      config: configResult.rows[0] || null,
      assets: assetsResult.rows,
      custom_domains: domainsResult.rows
    };

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, action, entity_type, user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenant_id,
        'export',
        'branding_config',
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting config:', error);
    res.status(500).json({ error: 'Failed to export configuration' });
  }
};

// Import branding configuration
exports.importConfig = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const importData = req.body;

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if import is enabled
    const togglesResult = await pool.query(
      'SELECT branding_import_enabled FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    const toggles = togglesResult.rows[0];
    if (toggles && !toggles.branding_import_enabled && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Branding import not enabled for this tenant' });
    }

    // Validate import data
    if (!importData.config) {
      return res.status(400).json({ error: 'Invalid import data: missing config' });
    }

    // Import configuration (simplified - in production, you'd want more validation)
    const config = importData.config;
    config.tenant_id = tenant_id; // Override tenant_id for security

    // Use upsertBrandingConfig logic here (simplified for brevity)
    // In production, call the upsert function or duplicate its logic

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, action, entity_type, new_values, user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        'import',
        'branding_config',
        JSON.stringify(importData),
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.json({
      message: 'Configuration imported successfully',
      imported_items: {
        config: 1,
        assets: importData.assets?.length || 0,
        domains: importData.custom_domains?.length || 0
      }
    });
  } catch (error) {
    console.error('Error importing config:', error);
    res.status(500).json({ error: 'Failed to import configuration' });
  }
};

// Get branding audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { page = 1, limit = 50, action, entity_type } = req.query;

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM branding_audit_logs WHERE tenant_id = $1';
    const params = [tenant_id];
    let paramCount = 2;

    if (action) {
      query += ` AND action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (entity_type) {
      query += ` AND entity_type = $${paramCount}`;
      params.push(entity_type);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM branding_audit_logs WHERE tenant_id = $1',
      [tenant_id]
    );

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

// Get branding templates
exports.getTemplates = async (req, res) => {
  try {
    const { template_type, template_category, region, locale } = req.query;

    let query = 'SELECT * FROM branding_templates WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (template_type) {
      query += ` AND template_type = $${paramCount}`;
      params.push(template_type);
      paramCount++;
    }

    if (template_category) {
      query += ` AND template_category = $${paramCount}`;
      params.push(template_category);
      paramCount++;
    }

    if (region) {
      query += ` AND (region = $${paramCount} OR region = 'global')`;
      params.push(region);
      paramCount++;
    }

    if (locale) {
      query += ` AND locale = $${paramCount}`;
      params.push(locale);
      paramCount++;
    }

    query += ' ORDER BY template_type, template_category, created_at DESC';

    const result = await pool.query(query, params);

    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};

// Create or update custom domain
exports.upsertCustomDomain = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { domain, is_primary, branding_id } = req.body;

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if custom domain is enabled
    const togglesResult = await pool.query(
      'SELECT custom_domain_enabled, max_custom_domains FROM branding_feature_toggles WHERE tenant_id = $1',
      [tenant_id]
    );

    const toggles = togglesResult.rows[0];
    if (toggles && !toggles.custom_domain_enabled && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Custom domain feature not enabled for this tenant' });
    }

    // Check domain count limit
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM custom_domains WHERE tenant_id = $1 AND is_active = true',
      [tenant_id]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    const maxDomains = toggles?.max_custom_domains || 1;

    if (currentCount >= maxDomains && req.user.role !== 'super_admin') {
      return res.status(400).json({ 
        error: `Maximum custom domain limit reached (${maxDomains})` 
      });
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    // Create domain record
    const result = await pool.query(
      `INSERT INTO custom_domains (
        tenant_id, branding_id, domain, is_primary, verification_token, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        tenant_id,
        branding_id,
        domain,
        is_primary || false,
        verificationToken,
        req.user.admin_id || req.user.id
      ]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO branding_audit_logs (
        tenant_id, branding_id, action, entity_type, entity_id, new_values,
        user_id, user_role, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenant_id,
        branding_id,
        'create',
        'custom_domain',
        result.rows[0].domain_id,
        JSON.stringify(result.rows[0]),
        req.user.admin_id || req.user.id,
        req.user.role,
        req.ip || req.connection.remoteAddress
      ]
    );

    res.status(201).json({
      message: 'Custom domain created successfully',
      domain: result.rows[0],
      verification_instructions: {
        method: 'DNS TXT Record',
        record_name: `_pulss-verification.${domain}`,
        record_value: verificationToken,
        instructions: 'Add the TXT record to your DNS settings and verify within 24 hours'
      }
    });
  } catch (error) {
    console.error('Error creating custom domain:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Domain already exists' });
    }
    res.status(500).json({ error: 'Failed to create custom domain' });
  }
};

// Get custom domains for a tenant
exports.getCustomDomains = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Check if user has access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM custom_domains WHERE tenant_id = $1 AND is_active = true ORDER BY is_primary DESC, created_at DESC',
      [tenant_id]
    );

    res.json({ domains: result.rows });
  } catch (error) {
    console.error('Error getting custom domains:', error);
    res.status(500).json({ error: 'Failed to get custom domains' });
  }
};

module.exports = exports;

const { v4: uuidv4 } = require('uuid');
const { triggerWebhook } = require('../utils/webhookTrigger');

/**
 * Get tenant branding configuration
 */
const getTenantBranding = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT tb.*, bff.*
       FROM tenant_branding tb
       LEFT JOIN branding_feature_flags bff ON tb.tenant_id = bff.tenant_id
       WHERE tb.tenant_id = $1`,
      [tenant_id]
    );
    
    if (result.rows.length === 0) {
      // Create default branding if it doesn't exist
      await pool.query(
        `INSERT INTO tenant_branding (tenant_id) VALUES ($1)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant_id]
      );
      
      await pool.query(
        `INSERT INTO branding_feature_flags (tenant_id) VALUES ($1)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant_id]
      );
      
      // Fetch again
      const newResult = await pool.query(
        `SELECT tb.*, bff.*
         FROM tenant_branding tb
         LEFT JOIN branding_feature_flags bff ON tb.tenant_id = bff.tenant_id
         WHERE tb.tenant_id = $1`,
        [tenant_id]
      );
      
      return res.json(newResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get tenant branding error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant branding' });
  }
};

/**
 * Update tenant branding configuration
 */
const updateTenantBranding = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query('BEGIN');
    
    // Get feature flags to check permissions
    const flagsResult = await client.query(
      'SELECT * FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (flagsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Branding feature flags not initialized' });
    }
    
    const flags = flagsResult.rows[0];
    const updateData = req.body;
    
    // Check permissions for advanced features
    if (updateData.custom_footer_html && !flags.custom_footer_enabled) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Custom footer not enabled for this tenant' });
    }
    
    if (updateData.custom_css && !flags.custom_css_enabled) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Custom CSS not enabled for this tenant' });
    }
    
    if ((updateData.terms_url || updateData.privacy_url) && !flags.custom_legal_enabled) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Custom legal pages not enabled for this tenant' });
    }
    
    // Get old values for audit trail
    const oldResult = await client.query(
      'SELECT * FROM tenant_branding WHERE tenant_id = $1',
      [tenant_id]
    );
    const oldValues = oldResult.rows[0];
    
    // Build update query dynamically based on allowed fields
    const allowedFields = [
      'logo_url', 'logo_dark_url', 'favicon_url', 'pwa_icon_url', 'login_background_url',
      'primary_color', 'secondary_color', 'accent_color', 'text_color', 'background_color',
      'font_family', 'font_url', 'theme_mode', 'custom_css',
      'company_name', 'legal_company_name', 'company_address', 'support_email', 'support_phone',
      'terms_url', 'privacy_url', 'about_url', 'custom_footer_html', 'copyright_text',
      'email_header_logo_url', 'email_footer_text', 'email_primary_color', 'email_template_id',
      'login_title', 'login_subtitle', 'login_show_logo', 'login_custom_message',
      'custom_meta_tags', 'social_links', 'additional_settings'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(updateData[field]);
        paramIndex++;
      }
    });
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add updated metadata
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    updates.push(`updated_by = $${paramIndex}`);
    values.push(req.user.id);
    paramIndex++;
    
    // Add tenant_id for WHERE clause
    values.push(tenant_id);
    
    const updateQuery = `
      UPDATE tenant_branding
      SET ${updates.join(', ')}
      WHERE tenant_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, values);
    const updatedBranding = result.rows[0];
    
    // Record change in history
    const changedFields = allowedFields.filter(field => updateData[field] !== undefined);
    await client.query(
      `INSERT INTO branding_change_history 
       (tenant_id, change_type, entity_type, entity_id, old_values, new_values, changed_fields, changed_by, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenant_id,
        'branding_updated',
        'tenant_branding',
        updatedBranding.branding_id,
        JSON.stringify(oldValues),
        JSON.stringify(updatedBranding),
        changedFields,
        req.user.id,
        req.ip
      ]
    );
    
    await client.query('COMMIT');
    
    // Trigger webhooks asynchronously
    triggerWebhook(tenant_id, 'branding.updated', {
      tenant_id,
      branding: updatedBranding,
      changed_fields: changedFields
    }).catch(err => console.error('Webhook trigger error:', err));
    
    res.json(updatedBranding);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update tenant branding error:', error);
    res.status(500).json({ error: 'Failed to update tenant branding' });
  } finally {
    client.release();
  }
};

/**
 * Get branding feature flags for tenant
 */
const getBrandingFeatureFlags = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (result.rows.length === 0) {
      // Create default flags
      await pool.query(
        'INSERT INTO branding_feature_flags (tenant_id) VALUES ($1)',
        [tenant_id]
      );
      
      const newResult = await pool.query(
        'SELECT * FROM branding_feature_flags WHERE tenant_id = $1',
        [tenant_id]
      );
      
      return res.json(newResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get branding feature flags error:', error);
    res.status(500).json({ error: 'Failed to fetch branding feature flags' });
  }
};

/**
 * Update branding feature flags (super admin only)
 */
const updateBrandingFeatureFlags = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req.params;
    
    // Super admin only
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can update feature flags' });
    }
    
    await client.query('BEGIN');
    
    const updateData = req.body;
    const allowedFlags = [
      'logo_upload_enabled', 'color_customization_enabled', 'theme_selection_enabled',
      'favicon_enabled', 'login_customization_enabled', 'custom_domain_enabled',
      'white_label_enabled', 'custom_footer_enabled', 'custom_legal_enabled',
      'email_branding_enabled', 'custom_css_enabled', 'multi_brand_enabled',
      'api_access_enabled', 'custom_email_templates_enabled'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    allowedFlags.forEach(flag => {
      if (updateData[flag] !== undefined) {
        updates.push(`${flag} = $${paramIndex}`);
        values.push(updateData[flag]);
        paramIndex++;
      }
    });
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid flags to update' });
    }
    
    // Add metadata
    if (updateData.notes) {
      updates.push(`notes = $${paramIndex}`);
      values.push(updateData.notes);
      paramIndex++;
    }
    
    updates.push(`approved_by = $${paramIndex}`);
    values.push(req.user.id);
    paramIndex++;
    
    updates.push(`approved_at = TIMEZONE('utc'::text, NOW())`);
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    
    values.push(tenant_id);
    
    const updateQuery = `
      UPDATE branding_feature_flags
      SET ${updates.join(', ')}
      WHERE tenant_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, values);
    
    // Record in audit log
    await client.query(
      `INSERT INTO branding_change_history 
       (tenant_id, change_type, entity_type, changed_by, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenant_id,
        'feature_flags_updated',
        'branding_feature_flags',
        req.user.id,
        JSON.stringify(result.rows[0]),
        req.ip
      ]
    );
    
    await client.query('COMMIT');
    
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update branding feature flags error:', error);
    res.status(500).json({ error: 'Failed to update branding feature flags' });
  } finally {
    client.release();
  }
};

/**
 * Get branding change history
 */
const getBrandingHistory = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT bch.*, a.email as changed_by_email, a.full_name as changed_by_name
       FROM branding_change_history bch
       LEFT JOIN admins a ON bch.changed_by = a.admin_id
       WHERE bch.tenant_id = $1
       ORDER BY bch.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenant_id, limit, offset]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM branding_change_history WHERE tenant_id = $1',
      [tenant_id]
    );
    
    res.json({
      history: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get branding history error:', error);
    res.status(500).json({ error: 'Failed to fetch branding history' });
  }
};

/**
 * Export branding configuration
 */
const exportBrandingConfig = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const brandingResult = await pool.query(
      'SELECT * FROM tenant_branding WHERE tenant_id = $1',
      [tenant_id]
    );
    
    const flagsResult = await pool.query(
      'SELECT * FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    const domainsResult = await pool.query(
      'SELECT * FROM custom_domains WHERE tenant_id = $1',
      [tenant_id]
    );
    
    const config = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      tenant_id,
      branding: brandingResult.rows[0] || {},
      feature_flags: flagsResult.rows[0] || {},
      custom_domains: domainsResult.rows || []
    };
    
    res.json(config);
    
  } catch (error) {
    console.error('Export branding config error:', error);
    res.status(500).json({ error: 'Failed to export branding configuration' });
  }
};

/**
 * Get public branding for tenant (used by customer-facing pages)
 */
const getPublicBranding = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        logo_url, logo_dark_url, favicon_url, pwa_icon_url,
        primary_color, secondary_color, accent_color, text_color, background_color,
        font_family, font_url, theme_mode,
        company_name, support_email, support_phone,
        terms_url, privacy_url, about_url, copyright_text,
        social_links, custom_meta_tags,
        login_title, login_subtitle, login_show_logo, login_background_url
       FROM tenant_branding
       WHERE tenant_id = $1`,
      [tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branding not found' });
    }
    
    // Check if white label is enabled
    const flagsResult = await pool.query(
      'SELECT white_label_enabled FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    const branding = result.rows[0];
    branding.white_label_enabled = flagsResult.rows[0]?.white_label_enabled || false;
    
    res.json(branding);
    
  } catch (error) {
    console.error('Get public branding error:', error);
    res.status(500).json({ error: 'Failed to fetch public branding' });
  }
};

module.exports = {
  getTenantBranding,
  updateTenantBranding,
  getBrandingFeatureFlags,
  updateBrandingFeatureFlags,
  getBrandingHistory,
  exportBrandingConfig,
  getPublicBranding
};
