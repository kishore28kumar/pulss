const { pool } = require('../config/db');

/**
 * Get all partners
 */
const getPartners = async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = 'SELECT * FROM partners WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, params);
    res.json({ partners: result.rows });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
};

/**
 * Get a specific partner
 */
const getPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM partners WHERE partner_id = $1',
      [partnerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ partner: result.rows[0] });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
};

/**
 * Create a partner (Super Admin only)
 */
const createPartner = async (req, res) => {
  try {
    const {
      name, email, phone, commission_type, commission_value, bank_details
    } = req.body;
    
    if (!name || !email || !commission_type || commission_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      `INSERT INTO partners (
        name, email, phone, commission_type, commission_value, bank_details
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [name, email, phone, commission_type, commission_value, JSON.stringify(bank_details || {})]
    );
    
    res.status(201).json({ partner: result.rows[0] });
  } catch (error) {
    console.error('Error creating partner:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create partner' });
  }
};

/**
 * Update a partner (Super Admin only)
 */
const updatePartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      'name', 'email', 'phone', 'commission_type', 'commission_value',
      'bank_details', 'is_active', 'metadata'
    ];
    
    const setFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        const value = ['bank_details', 'metadata'].includes(key) 
          ? JSON.stringify(updates[key]) 
          : updates[key];
        values.push(value);
        setFields.push(`${key} = $${values.length}`);
      }
    });
    
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(partnerId);
    const query = `
      UPDATE partners 
      SET ${setFields.join(', ')}, updated_at = NOW()
      WHERE partner_id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ partner: result.rows[0] });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
};

/**
 * Link partner to tenant
 */
const linkPartnerToTenant = async (req, res) => {
  try {
    const { partnerId, tenantId, custom_commission_type, custom_commission_value } = req.body;
    
    if (!partnerId || !tenantId) {
      return res.status(400).json({ error: 'Partner ID and Tenant ID required' });
    }
    
    const result = await pool.query(
      `INSERT INTO partner_tenants (
        partner_id, tenant_id, custom_commission_type, custom_commission_value
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (partner_id, tenant_id) 
      DO UPDATE SET 
        custom_commission_type = EXCLUDED.custom_commission_type,
        custom_commission_value = EXCLUDED.custom_commission_value
      RETURNING *`,
      [partnerId, tenantId, custom_commission_type, custom_commission_value]
    );
    
    res.status(201).json({ link: result.rows[0] });
  } catch (error) {
    console.error('Error linking partner to tenant:', error);
    res.status(500).json({ error: 'Failed to link partner to tenant' });
  }
};

/**
 * Get partner's tenants
 */
const getPartnerTenants = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const result = await pool.query(
      `SELECT pt.*, t.name as tenant_name, t.status
       FROM partner_tenants pt
       JOIN tenants t ON pt.tenant_id = t.tenant_id
       WHERE pt.partner_id = $1
       ORDER BY t.name ASC`,
      [partnerId]
    );
    
    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('Error fetching partner tenants:', error);
    res.status(500).json({ error: 'Failed to fetch partner tenants' });
  }
};

/**
 * Get partner commissions
 */
const getPartnerCommissions = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, t.name as tenant_name, s.subscription_id, p.amount as payment_amount
      FROM commissions c
      JOIN tenants t ON c.tenant_id = t.tenant_id
      LEFT JOIN subscriptions s ON c.subscription_id = s.subscription_id
      LEFT JOIN payments p ON c.payment_id = p.payment_id
      WHERE c.partner_id = $1
    `;
    const params = [partnerId];
    
    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }
    
    if (startDate) {
      params.push(startDate);
      query += ` AND c.created_at >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND c.created_at <= $${params.length}`;
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_commissions,
        SUM(commission_amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_amount
      FROM commissions
      WHERE partner_id = $1
    `;
    
    const summaryResult = await pool.query(summaryQuery, [partnerId]);
    
    res.json({ 
      commissions: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching partner commissions:', error);
    res.status(500).json({ error: 'Failed to fetch partner commissions' });
  }
};

/**
 * Create commission (automated or manual)
 */
const createCommission = async (req, res) => {
  try {
    const {
      partnerId, tenantId, subscriptionId, paymentId,
      baseAmount, commissionRate, commissionAmount
    } = req.body;
    
    if (!partnerId || !tenantId || !baseAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate commission if not provided
    let finalCommissionAmount = commissionAmount;
    let finalCommissionRate = commissionRate;
    
    if (!finalCommissionAmount) {
      // Get partner commission settings
      const partnerResult = await pool.query(
        `SELECT pt.custom_commission_type, pt.custom_commission_value,
                p.commission_type, p.commission_value
         FROM partners p
         LEFT JOIN partner_tenants pt ON p.partner_id = pt.partner_id AND pt.tenant_id = $2
         WHERE p.partner_id = $1`,
        [partnerId, tenantId]
      );
      
      if (partnerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      
      const partner = partnerResult.rows[0];
      const commType = partner.custom_commission_type || partner.commission_type;
      const commValue = partner.custom_commission_value || partner.commission_value;
      
      if (commType === 'percentage') {
        finalCommissionRate = commValue;
        finalCommissionAmount = baseAmount * (commValue / 100);
      } else {
        finalCommissionAmount = commValue;
        finalCommissionRate = (commValue / baseAmount) * 100;
      }
    }
    
    const result = await pool.query(
      `INSERT INTO commissions (
        partner_id, tenant_id, subscription_id, payment_id,
        base_amount, commission_rate, commission_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [partnerId, tenantId, subscriptionId, paymentId, 
       baseAmount, finalCommissionRate, finalCommissionAmount]
    );
    
    res.status(201).json({ commission: result.rows[0] });
  } catch (error) {
    console.error('Error creating commission:', error);
    res.status(500).json({ error: 'Failed to create commission' });
  }
};

/**
 * Update commission status (approve, pay, cancel)
 */
const updateCommissionStatus = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { status, payout_reference } = req.body;
    
    const validStatuses = ['pending', 'approved', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { status };
    if (status === 'paid') {
      updates.payout_date = new Date();
      if (payout_reference) {
        updates.payout_reference = payout_reference;
      }
    }
    
    const setFields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`);
    const values = Object.values(updates);
    values.push(commissionId);
    
    const result = await pool.query(
      `UPDATE commissions 
       SET ${setFields.join(', ')}, updated_at = NOW()
       WHERE commission_id = $${values.length}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    
    res.json({ commission: result.rows[0] });
  } catch (error) {
    console.error('Error updating commission status:', error);
    res.status(500).json({ error: 'Failed to update commission status' });
  }
};

/**
 * Get commission analytics for partner
 */
const getPartnerAnalytics = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = `
      SELECT 
        COUNT(*) as total_commissions,
        COUNT(DISTINCT tenant_id) as total_tenants,
        SUM(commission_amount) as total_earnings,
        AVG(commission_amount) as avg_commission,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_earnings,
        SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_earnings,
        SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END) as approved_earnings
      FROM commissions
      WHERE partner_id = $1
        ${startDate ? 'AND created_at >= $2' : ''}
        ${endDate ? `AND created_at <= $${startDate ? '3' : '2'}` : ''}
    `;
    
    const params = [partnerId];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const result = await pool.query(query, params);
    res.json({ analytics: result.rows[0] });
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    res.status(500).json({ error: 'Failed to fetch partner analytics' });
  }
};

module.exports = {
  getPartners,
  getPartner,
  createPartner,
  updatePartner,
  linkPartnerToTenant,
  getPartnerTenants,
  getPartnerCommissions,
  createCommission,
  updateCommissionStatus,
  getPartnerAnalytics
};
