const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { triggerWebhook } = require('../utils/webhookTrigger');

/**
 * Generate verification token for domain
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get all custom domains for a tenant
 */
const getCustomDomains = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if custom domain feature is enabled
    const flagsResult = await pool.query(
      'SELECT custom_domain_enabled FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (flagsResult.rows.length === 0 || !flagsResult.rows[0].custom_domain_enabled) {
      return res.status(403).json({ 
        error: 'Custom domains feature not enabled for this tenant',
        feature_enabled: false
      });
    }
    
    const result = await pool.query(
      `SELECT cd.*, a.email as created_by_email, a.full_name as created_by_name
       FROM custom_domains cd
       LEFT JOIN admins a ON cd.created_by = a.admin_id
       WHERE cd.tenant_id = $1
       ORDER BY cd.is_primary DESC, cd.created_at DESC`,
      [tenant_id]
    );
    
    res.json({ domains: result.rows, feature_enabled: true });
    
  } catch (error) {
    console.error('Get custom domains error:', error);
    res.status(500).json({ error: 'Failed to fetch custom domains' });
  }
};

/**
 * Add a new custom domain
 */
const addCustomDomain = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req.params;
    const { domain_name, is_primary = false } = req.body;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if custom domain feature is enabled
    const flagsResult = await pool.query(
      'SELECT custom_domain_enabled FROM branding_feature_flags WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (flagsResult.rows.length === 0 || !flagsResult.rows[0].custom_domain_enabled) {
      return res.status(403).json({ error: 'Custom domains feature not enabled for this tenant' });
    }
    
    // Validate domain name
    if (!domain_name || !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain_name)) {
      return res.status(400).json({ error: 'Invalid domain name format' });
    }
    
    await client.query('BEGIN');
    
    // Check if domain already exists
    const existingResult = await client.query(
      'SELECT domain_id FROM custom_domains WHERE domain_name = $1',
      [domain_name.toLowerCase()]
    );
    
    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Domain already exists' });
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    // Generate required DNS records
    const dnsRecords = {
      txt: {
        host: `_pulss-verification.${domain_name}`,
        value: verificationToken,
        type: 'TXT'
      },
      cname: {
        host: domain_name,
        value: process.env.PLATFORM_DOMAIN || 'app.pulss.io',
        type: 'CNAME'
      },
      a: {
        host: domain_name,
        value: process.env.PLATFORM_IP || '0.0.0.0',
        type: 'A'
      }
    };
    
    // If setting as primary, unset other primary domains
    if (is_primary) {
      await client.query(
        'UPDATE custom_domains SET is_primary = false WHERE tenant_id = $1',
        [tenant_id]
      );
    }
    
    // Insert new domain
    const insertResult = await client.query(
      `INSERT INTO custom_domains 
       (tenant_id, domain_name, is_primary, verification_token, verification_method, 
        dns_records, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW()))
       RETURNING *`,
      [
        tenant_id,
        domain_name.toLowerCase(),
        is_primary,
        verificationToken,
        'txt',
        JSON.stringify(dnsRecords),
        req.user.id
      ]
    );
    
    const newDomain = insertResult.rows[0];
    
    // Record in history
    await client.query(
      `INSERT INTO branding_change_history 
       (tenant_id, change_type, entity_type, entity_id, new_values, changed_by, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        'domain_added',
        'custom_domains',
        newDomain.domain_id,
        JSON.stringify(newDomain),
        req.user.id,
        req.ip
      ]
    );
    
    await client.query('COMMIT');
    
    // Trigger webhooks asynchronously
    triggerWebhook(tenant_id, 'domain.added', {
      tenant_id,
      domain: newDomain
    }).catch(err => console.error('Webhook trigger error:', err));
    
    res.status(201).json({
      domain: newDomain,
      message: 'Domain added successfully. Please configure DNS records to verify ownership.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add custom domain error:', error);
    res.status(500).json({ error: 'Failed to add custom domain' });
  } finally {
    client.release();
  }
};

/**
 * Verify domain ownership
 */
const verifyCustomDomain = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id, domain_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query('BEGIN');
    
    // Get domain details
    const domainResult = await client.query(
      'SELECT * FROM custom_domains WHERE domain_id = $1 AND tenant_id = $2',
      [domain_id, tenant_id]
    );
    
    if (domainResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    const domain = domainResult.rows[0];
    
    // In a real implementation, you would:
    // 1. Query DNS records for the domain
    // 2. Check if TXT record matches verification_token
    // 3. Check if CNAME/A record points to your platform
    
    // For this implementation, we'll simulate verification
    // In production, integrate with DNS lookup libraries or services
    
    const dns = require('dns').promises;
    let verified = false;
    let errorMessage = null;
    
    try {
      // Try to resolve TXT records
      const txtRecords = await dns.resolveTxt(`_pulss-verification.${domain.domain_name}`);
      const flatRecords = txtRecords.map(r => r.join(''));
      
      if (flatRecords.includes(domain.verification_token)) {
        verified = true;
      } else {
        errorMessage = 'Verification token not found in DNS TXT records';
      }
    } catch (dnsError) {
      errorMessage = `DNS verification failed: ${dnsError.message}`;
      console.error('DNS verification error:', dnsError);
    }
    
    // Update domain status
    const updateResult = await client.query(
      `UPDATE custom_domains
       SET verification_status = $1,
           verified_at = $2,
           last_error = $3,
           updated_at = TIMEZONE('utc'::text, NOW())
       WHERE domain_id = $4
       RETURNING *`,
      [
        verified ? 'verified' : 'failed',
        verified ? new Date() : null,
        errorMessage,
        domain_id
      ]
    );
    
    const updatedDomain = updateResult.rows[0];
    
    // If verified, activate the domain
    if (verified) {
      await client.query(
        `UPDATE custom_domains
         SET is_active = true
         WHERE domain_id = $1`,
        [domain_id]
      );
      
      // Trigger SSL certificate generation (would integrate with Let's Encrypt in production)
      await client.query(
        `UPDATE custom_domains
         SET ssl_status = 'pending'
         WHERE domain_id = $1`,
        [domain_id]
      );
    }
    
    // Record in history
    await client.query(
      `INSERT INTO branding_change_history 
       (tenant_id, change_type, entity_type, entity_id, new_values, changed_by, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        verified ? 'domain_verified' : 'domain_verification_failed',
        'custom_domains',
        domain_id,
        JSON.stringify(updatedDomain),
        req.user.id,
        req.ip
      ]
    );
    
    await client.query('COMMIT');
    
    if (verified) {
      // Trigger webhooks asynchronously
      triggerWebhook(tenant_id, 'domain.verified', {
        tenant_id,
        domain: updatedDomain
      }).catch(err => console.error('Webhook trigger error:', err));
    }
    
    res.json({
      verified,
      domain: updatedDomain,
      message: verified 
        ? 'Domain verified successfully' 
        : `Verification failed: ${errorMessage}`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify custom domain error:', error);
    res.status(500).json({ error: 'Failed to verify custom domain' });
  } finally {
    client.release();
  }
};

/**
 * Update custom domain configuration
 */
const updateCustomDomain = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id, domain_id } = req.params;
    const { is_primary, redirect_to_primary, notes } = req.body;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query('BEGIN');
    
    // If setting as primary, unset other primary domains
    if (is_primary === true) {
      await client.query(
        'UPDATE custom_domains SET is_primary = false WHERE tenant_id = $1 AND domain_id != $2',
        [tenant_id, domain_id]
      );
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (is_primary !== undefined) {
      updates.push(`is_primary = $${paramIndex}`);
      values.push(is_primary);
      paramIndex++;
    }
    
    if (redirect_to_primary !== undefined) {
      updates.push(`redirect_to_primary = $${paramIndex}`);
      values.push(redirect_to_primary);
      paramIndex++;
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    values.push(domain_id);
    values.push(tenant_id);
    
    const updateQuery = `
      UPDATE custom_domains
      SET ${updates.join(', ')}
      WHERE domain_id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    await client.query('COMMIT');
    
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update custom domain error:', error);
    res.status(500).json({ error: 'Failed to update custom domain' });
  } finally {
    client.release();
  }
};

/**
 * Delete custom domain
 */
const deleteCustomDomain = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id, domain_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query('BEGIN');
    
    // Get domain before deleting
    const domainResult = await client.query(
      'SELECT * FROM custom_domains WHERE domain_id = $1 AND tenant_id = $2',
      [domain_id, tenant_id]
    );
    
    if (domainResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    const domain = domainResult.rows[0];
    
    // Delete domain
    await client.query(
      'DELETE FROM custom_domains WHERE domain_id = $1',
      [domain_id]
    );
    
    // Record in history
    await client.query(
      `INSERT INTO branding_change_history 
       (tenant_id, change_type, entity_type, entity_id, old_values, changed_by, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        'domain_removed',
        'custom_domains',
        domain_id,
        JSON.stringify(domain),
        req.user.id,
        req.ip
      ]
    );
    
    await client.query('COMMIT');
    
    // Trigger webhooks asynchronously
    triggerWebhook(tenant_id, 'domain.removed', {
      tenant_id,
      domain
    }).catch(err => console.error('Webhook trigger error:', err));
    
    res.json({ message: 'Domain deleted successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete custom domain error:', error);
    res.status(500).json({ error: 'Failed to delete custom domain' });
  } finally {
    client.release();
  }
};

/**
 * Check SSL certificate status
 */
const checkSSLStatus = async (req, res) => {
  try {
    const { tenant_id, domain_id } = req.params;
    
    // Permission check: tenant admin or super admin
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT domain_name, ssl_status, ssl_provider, ssl_expires_at, ssl_last_checked
       FROM custom_domains
       WHERE domain_id = $1 AND tenant_id = $2`,
      [domain_id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    const domain = result.rows[0];
    
    // In production, you would check SSL certificate validity here
    // For now, return current status
    
    res.json({
      domain_name: domain.domain_name,
      ssl_status: domain.ssl_status,
      ssl_provider: domain.ssl_provider,
      ssl_expires_at: domain.ssl_expires_at,
      ssl_last_checked: domain.ssl_last_checked,
      message: domain.ssl_status === 'active' 
        ? 'SSL certificate is active' 
        : 'SSL certificate is not active'
    });
    
  } catch (error) {
    console.error('Check SSL status error:', error);
    res.status(500).json({ error: 'Failed to check SSL status' });
  }
};

module.exports = {
  getCustomDomains,
  addCustomDomain,
  verifyCustomDomain,
  updateCustomDomain,
  deleteCustomDomain,
  checkSSLStatus
};
