const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create new tenant (super admin only)
const createTenant = async (req, res) => {
  try {
    const { name, admin_email, business_type, theme_id } = req.body;
    
    if (!name || !admin_email || !business_type) {
      return res.status(400).json({ error: 'Name, admin email, and business type are required' });
    }
    
    // Generate tenant ID and setup code
    const tenant_id = uuidv4();
    const setup_code = Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // Create tenant (SQLite compatible)
    const tenantQuery = `
      INSERT INTO tenants (tenant_id, name, business_type, theme_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `;
    
    await pool.query(tenantQuery, [tenant_id, name, business_type, theme_id || 'medical']);
    
    // Create pending admin invite
    const inviteQuery = `
      INSERT INTO pending_admin_invites (email, tenant_id, setup_code, must_change_password, created_at)
      VALUES (?, ?, ?, 1, datetime('now'))
    `;
    
    await pool.query(inviteQuery, [admin_email, tenant_id, setup_code]);
    
    // Initialize feature flags for the tenant
    const flagsQuery = `
      INSERT INTO feature_flags (tenant_id, created_at) VALUES (?, datetime('now'))
    `;
    
    await pool.query(flagsQuery, [tenant_id]);
    
    // Return created tenant
    const tenant = {
      tenant_id,
      name,
      business_type,
      theme_id: theme_id || 'medical',
      status: 'pending',
      setup_code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.status(201).json({ tenant });
    
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};

// Get all tenants with metrics (super admin only)
const getAllTenants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        COALESCE(customer_counts.customers_count, 0) as customers_count,
        COALESCE(order_stats.orders_count, 0) as orders_count,
        COALESCE(order_stats.revenue, 0) as revenue,
        order_stats.last_order_date,
        COALESCE(feature_counts.feature_flags_enabled, 0) as feature_flags_enabled,
        COALESCE(feature_counts.total_feature_flags, 0) as total_feature_flags
      FROM tenants t
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as customers_count
        FROM customers 
        GROUP BY tenant_id
      ) customer_counts ON t.tenant_id = customer_counts.tenant_id
      LEFT JOIN (
        SELECT 
          tenant_id, 
          COUNT(*) as orders_count,
          SUM(total_amount) as revenue,
          MAX(created_at) as last_order_date
        FROM orders 
        GROUP BY tenant_id
      ) order_stats ON t.tenant_id = order_stats.tenant_id
      LEFT JOIN (
        SELECT 
          tenant_id,
          (CASE WHEN wallet_enabled THEN 1 ELSE 0 END +
           CASE WHEN loyalty_enabled THEN 1 ELSE 0 END +
           CASE WHEN prescription_required THEN 1 ELSE 0 END +
           CASE WHEN multi_warehouse THEN 1 ELSE 0 END +
           CASE WHEN tracking_enabled THEN 1 ELSE 0 END +
           CASE WHEN whatsapp_notifications THEN 1 ELSE 0 END +
           CASE WHEN push_notifications THEN 1 ELSE 0 END) as feature_flags_enabled,
          7 as total_feature_flags
        FROM feature_flags
      ) feature_counts ON t.tenant_id = feature_counts.tenant_id
      ORDER BY t.created_at DESC
    `);
    
    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('Get all tenants error:', error);
    res.status(500).json({ error: 'Failed to get tenants' });
  }
};

// Get tenant by ID
const getTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Super admin can view any tenant, admin can only view their own
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT t.*, ss.*, ts.*
       FROM tenants t
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       LEFT JOIN tenant_settings ts ON t.tenant_id = ts.tenant_id
       WHERE t.tenant_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({ tenant: result.rows[0] });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to get tenant' });
  }
};

// Update tenant status (super admin only)
const updateTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    await pool.query(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE tenant_id = $2',
      [status, id]
    );
    
    res.json({ message: 'Tenant status updated successfully' });
  } catch (error) {
    console.error('Update tenant status error:', error);
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
};

// Update tenant profile
const updateTenant = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      name,
      shop_name,
      street_address,
      city,
      state,
      pincode,
      drug_license_number,
      gst_number,
      business_type,
      // Store settings
      upi_id,
      razorpay_id,
      razorpay_key,
      whatsapp_number,
      cash_on_delivery_enabled,
      credit_on_delivery_enabled,
      credit_limit,
      credit_terms,
      self_pickup_enabled,
      delivery_enabled,
      min_order_amount,
      delivery_charge,
      free_delivery_above
    } = req.body;
    
    await client.query('BEGIN');
    
    // Update tenants table
    if (name || shop_name || street_address || city || state || pincode || drug_license_number || gst_number || business_type) {
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (name) { updates.push(`name = $${paramCount++}`); values.push(name); }
      if (shop_name) { updates.push(`shop_name = $${paramCount++}`); values.push(shop_name); }
      if (street_address) { updates.push(`street_address = $${paramCount++}`); values.push(street_address); }
      if (city) { updates.push(`city = $${paramCount++}`); values.push(city); }
      if (state) { updates.push(`state = $${paramCount++}`); values.push(state); }
      if (pincode) { updates.push(`pincode = $${paramCount++}`); values.push(pincode); }
      if (drug_license_number) { updates.push(`drug_license_number = $${paramCount++}`); values.push(drug_license_number); }
      if (gst_number) { updates.push(`gst_number = $${paramCount++}`); values.push(gst_number); }
      if (business_type) { updates.push(`business_type = $${paramCount++}`); values.push(business_type); }
      
      updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
      values.push(id);
      
      if (updates.length > 1) {
        await client.query(
          `UPDATE tenants SET ${updates.join(', ')} WHERE tenant_id = $${paramCount}`,
          values
        );
      }
    }
    
    // Update store_settings table
    const settingsUpdates = [];
    const settingsValues = [];
    let settingsParamCount = 1;
    
    if (upi_id !== undefined) { settingsUpdates.push(`upi_id = $${settingsParamCount++}`); settingsValues.push(upi_id); }
    if (razorpay_id !== undefined) { settingsUpdates.push(`razorpay_id = $${settingsParamCount++}`); settingsValues.push(razorpay_id); }
    if (razorpay_key !== undefined) { settingsUpdates.push(`razorpay_key = $${settingsParamCount++}`); settingsValues.push(razorpay_key); }
    if (whatsapp_number !== undefined) { settingsUpdates.push(`whatsapp_number = $${settingsParamCount++}`); settingsValues.push(whatsapp_number); }
    if (cash_on_delivery_enabled !== undefined) { settingsUpdates.push(`cash_on_delivery_enabled = $${settingsParamCount++}`); settingsValues.push(cash_on_delivery_enabled); }
    if (credit_on_delivery_enabled !== undefined) { settingsUpdates.push(`credit_on_delivery_enabled = $${settingsParamCount++}`); settingsValues.push(credit_on_delivery_enabled); }
    if (credit_limit !== undefined) { settingsUpdates.push(`credit_limit = $${settingsParamCount++}`); settingsValues.push(credit_limit); }
    if (credit_terms !== undefined) { settingsUpdates.push(`credit_terms = $${settingsParamCount++}`); settingsValues.push(credit_terms); }
    if (self_pickup_enabled !== undefined) { settingsUpdates.push(`self_pickup_enabled = $${settingsParamCount++}`); settingsValues.push(self_pickup_enabled); }
    if (delivery_enabled !== undefined) { settingsUpdates.push(`delivery_enabled = $${settingsParamCount++}`); settingsValues.push(delivery_enabled); }
    if (min_order_amount !== undefined) { settingsUpdates.push(`min_order_amount = $${settingsParamCount++}`); settingsValues.push(min_order_amount); }
    if (delivery_charge !== undefined) { settingsUpdates.push(`delivery_charge = $${settingsParamCount++}`); settingsValues.push(delivery_charge); }
    if (free_delivery_above !== undefined) { settingsUpdates.push(`free_delivery_above = $${settingsParamCount++}`); settingsValues.push(free_delivery_above); }
    
    if (settingsUpdates.length > 0) {
      settingsUpdates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
      settingsValues.push(id);
      
      await client.query(
        `UPDATE store_settings SET ${settingsUpdates.join(', ')} WHERE tenant_id = $${settingsParamCount}`,
        settingsValues
      );
    }
    
    await client.query('COMMIT');
    
    // Fetch updated tenant
    const result = await pool.query(
      `SELECT t.*, ss.*, ts.*
       FROM tenants t
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       LEFT JOIN tenant_settings ts ON t.tenant_id = ts.tenant_id
       WHERE t.tenant_id = $1`,
      [id]
    );
    
    res.json({
      message: 'Tenant updated successfully',
      tenant: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  } finally {
    client.release();
  }
};

// Get tenant settings (public endpoint for customer portal)
const getTenantSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        t.tenant_id,
        t.name,
        t.shop_name,
        t.subdomain,
        t.business_type,
        t.is_live,
        ss.logo_url,
        ss.pwa_icon_url,
        ss.favicon_url,
        ss.primary_color,
        ss.whatsapp_number,
        ss.upi_id,
        ss.upi_qr_code_url,
        ss.carousel_images,
        ss.hero_images,
        ts.theme_id,
        ts.welcome_message,
        ts.footer_text,
        ts.currency_symbol,
        ff.*
       FROM tenants t
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       LEFT JOIN tenant_settings ts ON t.tenant_id = ts.tenant_id
       LEFT JOIN feature_flags ff ON t.tenant_id = ff.tenant_id
       WHERE t.tenant_id = $1 AND t.is_live = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found or not live' });
    }
    
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get tenant settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Upload tenant logo
const uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const logo_url = `/uploads/${req.file.filename}`;
    
    await pool.query(
      'UPDATE store_settings SET logo_url = $1, updated_at = TIMEZONE(\'utc\'::text, NOW()) WHERE tenant_id = $2',
      [logo_url, id]
    );
    
    res.json({
      message: 'Logo uploaded successfully',
      logo_url
    });
    
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};

// Upload PWA icon
const uploadPWAIcon = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const pwa_icon_url = `/uploads/${req.file.filename}`;
    
    await pool.query(
      'UPDATE store_settings SET pwa_icon_url = $1, updated_at = TIMEZONE(\'utc\'::text, NOW()) WHERE tenant_id = $2',
      [pwa_icon_url, id]
    );
    
    res.json({
      message: 'PWA icon uploaded successfully',
      pwa_icon_url
    });
    
  } catch (error) {
    console.error('Upload PWA icon error:', error);
    res.status(500).json({ error: 'Failed to upload PWA icon' });
  }
};

// Upload favicon
const uploadFavicon = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const favicon_url = `/uploads/${req.file.filename}`;
    
    await pool.query(
      'UPDATE store_settings SET favicon_url = $1, updated_at = TIMEZONE(\'utc\'::text, NOW()) WHERE tenant_id = $2',
      [favicon_url, id]
    );
    
    res.json({
      message: 'Favicon uploaded successfully',
      favicon_url
    });
    
  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
};

// Generate dynamic manifest.json for tenant
const getManifest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tenant settings
    const result = await pool.query(
      `SELECT 
        t.tenant_id,
        t.name,
        t.shop_name,
        ss.logo_url,
        ss.pwa_icon_url,
        ss.favicon_url,
        ss.primary_color,
        ts.theme_id
       FROM tenants t
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       LEFT JOIN tenant_settings ts ON t.tenant_id = ts.tenant_id
       WHERE t.tenant_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenant = result.rows[0];
    
    // Build manifest with tenant-specific settings
    const appName = tenant.shop_name || tenant.name || 'Pulss Store';
    const themeColor = tenant.primary_color || '#6366F1';
    
    // Use custom icon if available, otherwise fall back to default
    const iconUrl = tenant.pwa_icon_url || tenant.logo_url;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    
    const manifest = {
      name: appName,
      short_name: appName.substring(0, 12),
      description: `Shop at ${appName} - Your trusted local store`,
      start_url: `/store/${id}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [],
      categories: ['business', 'shopping'],
      lang: 'en',
      scope: '/',
      orientation: 'portrait-primary'
    };
    
    // Add icons
    if (iconUrl) {
      // If it's a full URL, use it; otherwise, construct it
      const fullIconUrl = iconUrl.startsWith('http') ? iconUrl : `${baseUrl}${iconUrl}`;
      
      manifest.icons = [
        {
          src: fullIconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: fullIconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ];
    } else {
      // Use default SVG icon
      manifest.icons = [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236366F1;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%234F46E5;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='100' height='100' rx='20'/%3E%3Cpath fill='%23fff' d='M30 25h40v15H30zM25 45h50v30H25z'/%3E%3Ccircle fill='%236366F1' cx='35' cy='55' r='3'/%3E%3Ccircle fill='%236366F1' cx='50' cy='55' r='3'/%3E%3Ccircle fill='%236366F1' cx='65' cy='55' r='3'/%3E%3Cpath fill='%23fff' d='M30 65h40v5H30z'/%3E%3C/svg%3E",
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ];
    }
    
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
    
  } catch (error) {
    console.error('Get manifest error:', error);
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
};

// Get tenant settings (admin access)
const getAdvancedSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM tenant_settings WHERE tenant_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if they don't exist
      await pool.query(
        `INSERT INTO tenant_settings (tenant_id) VALUES ($1)`,
        [id]
      );
      
      const newResult = await pool.query(
        'SELECT * FROM tenant_settings WHERE tenant_id = $1',
        [id]
      );
      
      return res.json({ settings: newResult.rows[0] });
    }
    
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get advanced settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update tenant settings
const updateAdvancedSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      theme_id,
      welcome_message,
      footer_text,
      currency_symbol,
      timezone,
      language,
      date_format,
      time_format,
      business_hours,
      email_notifications_enabled,
      sms_notifications_enabled,
      push_notifications_enabled,
      custom_domain,
      api_rate_limit,
      api_enabled,
      metadata
    } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (theme_id !== undefined) { updates.push(`theme_id = $${paramCount++}`); values.push(theme_id); }
    if (welcome_message !== undefined) { updates.push(`welcome_message = $${paramCount++}`); values.push(welcome_message); }
    if (footer_text !== undefined) { updates.push(`footer_text = $${paramCount++}`); values.push(footer_text); }
    if (currency_symbol !== undefined) { updates.push(`currency_symbol = $${paramCount++}`); values.push(currency_symbol); }
    if (timezone !== undefined) { updates.push(`timezone = $${paramCount++}`); values.push(timezone); }
    if (language !== undefined) { updates.push(`language = $${paramCount++}`); values.push(language); }
    if (date_format !== undefined) { updates.push(`date_format = $${paramCount++}`); values.push(date_format); }
    if (time_format !== undefined) { updates.push(`time_format = $${paramCount++}`); values.push(time_format); }
    if (business_hours !== undefined) { updates.push(`business_hours = $${paramCount++}`); values.push(JSON.stringify(business_hours)); }
    if (email_notifications_enabled !== undefined) { updates.push(`email_notifications_enabled = $${paramCount++}`); values.push(email_notifications_enabled); }
    if (sms_notifications_enabled !== undefined) { updates.push(`sms_notifications_enabled = $${paramCount++}`); values.push(sms_notifications_enabled); }
    if (push_notifications_enabled !== undefined) { updates.push(`push_notifications_enabled = $${paramCount++}`); values.push(push_notifications_enabled); }
    if (custom_domain !== undefined) { updates.push(`custom_domain = $${paramCount++}`); values.push(custom_domain); }
    if (api_rate_limit !== undefined) { updates.push(`api_rate_limit = $${paramCount++}`); values.push(api_rate_limit); }
    if (api_enabled !== undefined) { updates.push(`api_enabled = $${paramCount++}`); values.push(api_enabled); }
    if (metadata !== undefined) { updates.push(`metadata = $${paramCount++}`); values.push(JSON.stringify(metadata)); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    values.push(id);
    
    await pool.query(
      `UPDATE tenant_settings SET ${updates.join(', ')} WHERE tenant_id = $${paramCount}`,
      values
    );
    
    // Fetch updated settings
    const result = await pool.query(
      'SELECT * FROM tenant_settings WHERE tenant_id = $1',
      [id]
    );
    
    res.json({
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update advanced settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get tenant subscription info
const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    
    res.json({ subscription: result.rows[0] });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

module.exports = {
  createTenant,
  getAllTenants,
  getTenant,
  updateTenant,
  updateTenantStatus,
  getTenantSettings,
  getAdvancedSettings,
  updateAdvancedSettings,
  getSubscription,
  uploadLogo,
  uploadPWAIcon,
  uploadFavicon,
  getManifest
};
