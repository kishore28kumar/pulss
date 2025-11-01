const { pool } = require('../config/db');
const { logAudit } = require('../middleware/auditLog');

/**
 * GDPR Privacy Controllers
 * Handles user consent, data export, and data deletion requests
 */

/**
 * Get user consent settings
 */
const getUserConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';

    const query = `
      SELECT * FROM user_consents
      WHERE user_id = $1 AND user_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId, userType]);

    if (result.rows.length === 0) {
      // Create default consent record
      const defaultConsent = {
        user_id: userId,
        user_type: userType,
        tenant_id: req.user.tenant_id,
        marketing_consent: false,
        analytics_consent: false,
        data_processing_consent: true,
        third_party_sharing_consent: false
      };

      const insertQuery = `
        INSERT INTO user_consents (
          user_id, user_type, tenant_id, marketing_consent, 
          analytics_consent, data_processing_consent, third_party_sharing_consent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const insertResult = await pool.query(insertQuery, [
        defaultConsent.user_id,
        defaultConsent.user_type,
        defaultConsent.tenant_id,
        defaultConsent.marketing_consent,
        defaultConsent.analytics_consent,
        defaultConsent.data_processing_consent,
        defaultConsent.third_party_sharing_consent
      ]);

      return res.json({ consent: insertResult.rows[0] });
    }

    res.json({ consent: result.rows[0] });
  } catch (error) {
    console.error('Get user consent error:', error);
    res.status(500).json({ error: 'Failed to retrieve consent settings' });
  }
};

/**
 * Update user consent settings
 */
const updateUserConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';
    const {
      marketing_consent,
      analytics_consent,
      data_processing_consent,
      third_party_sharing_consent,
      privacy_policy_version,
      terms_version
    } = req.body;

    // Get current consent for audit log
    const currentQuery = `
      SELECT * FROM user_consents
      WHERE user_id = $1 AND user_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const currentResult = await pool.query(currentQuery, [userId, userType]);
    const oldValues = currentResult.rows[0] || null;

    const query = `
      INSERT INTO user_consents (
        user_id, user_type, tenant_id, marketing_consent, 
        analytics_consent, data_processing_consent, third_party_sharing_consent,
        privacy_policy_version, privacy_policy_accepted_at,
        terms_version, terms_accepted_at,
        ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      userId,
      userType,
      req.user.tenant_id,
      marketing_consent !== undefined ? marketing_consent : false,
      analytics_consent !== undefined ? analytics_consent : false,
      data_processing_consent !== undefined ? data_processing_consent : true,
      third_party_sharing_consent !== undefined ? third_party_sharing_consent : false,
      privacy_policy_version || null,
      privacy_policy_version ? new Date() : null,
      terms_version || null,
      terms_version ? new Date() : null,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    ];

    const result = await pool.query(query, values);

    // Audit log
    await logAudit(
      req,
      'update',
      'user_consent',
      result.rows[0].consent_id,
      'User updated privacy consent settings',
      oldValues,
      result.rows[0]
    );

    res.json({ 
      success: true,
      consent: result.rows[0],
      message: 'Consent settings updated successfully'
    });
  } catch (error) {
    console.error('Update user consent error:', error);
    res.status(500).json({ error: 'Failed to update consent settings' });
  }
};

/**
 * Request data export (GDPR Article 20 - Data Portability)
 */
const requestDataExport = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';
    const { format = 'json' } = req.body;

    // Check for pending requests
    const checkQuery = `
      SELECT * FROM data_export_requests
      WHERE user_id = $1 AND user_type = $2 AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId, userType]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: 'A data export request is already in progress',
        request: checkResult.rows[0]
      });
    }

    // Create new export request
    const query = `
      INSERT INTO data_export_requests (
        user_id, user_type, tenant_id, email, export_format,
        ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      userType,
      req.user.tenant_id,
      req.user.email,
      format,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    ];

    const result = await pool.query(query, values);

    // Audit log
    await logAudit(
      req,
      'create',
      'data_export_request',
      result.rows[0].request_id,
      'User requested data export',
      null,
      result.rows[0]
    );

    res.json({
      success: true,
      request: result.rows[0],
      message: 'Data export request created. You will receive an email when your data is ready for download.'
    });
  } catch (error) {
    console.error('Request data export error:', error);
    res.status(500).json({ error: 'Failed to create data export request' });
  }
};

/**
 * Get data export status
 */
const getDataExportStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';
    const { requestId } = req.params;

    const query = `
      SELECT * FROM data_export_requests
      WHERE request_id = $1 AND user_id = $2 AND user_type = $3
    `;

    const result = await pool.query(query, [requestId, userId, userType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export request not found' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Get data export status error:', error);
    res.status(500).json({ error: 'Failed to retrieve export status' });
  }
};

/**
 * Request data deletion (GDPR Article 17 - Right to be Forgotten)
 */
const requestDataDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';
    const { reason, phone } = req.body;

    // Check for pending requests
    const checkQuery = `
      SELECT * FROM data_deletion_requests
      WHERE user_id = $1 AND user_type = $2 AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId, userType]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: 'A data deletion request is already in progress',
        request: checkResult.rows[0]
      });
    }

    // Create new deletion request
    const query = `
      INSERT INTO data_deletion_requests (
        user_id, user_type, tenant_id, email, phone, reason,
        ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId,
      userType,
      req.user.tenant_id,
      req.user.email,
      phone || null,
      reason || null,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    ];

    const result = await pool.query(query, values);

    // Audit log
    await logAudit(
      req,
      'create',
      'data_deletion_request',
      result.rows[0].request_id,
      'User requested data deletion',
      null,
      result.rows[0]
    );

    res.json({
      success: true,
      request: result.rows[0],
      message: 'Data deletion request created. An administrator will review your request.'
    });
  } catch (error) {
    console.error('Request data deletion error:', error);
    res.status(500).json({ error: 'Failed to create data deletion request' });
  }
};

/**
 * Get data deletion status
 */
const getDataDeletionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'super_admin' || req.user.role === 'admin' ? 'admin' : 'customer';
    const { requestId } = req.params;

    const query = `
      SELECT * FROM data_deletion_requests
      WHERE request_id = $1 AND user_id = $2 AND user_type = $3
    `;

    const result = await pool.query(query, [requestId, userId, userType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Get data deletion status error:', error);
    res.status(500).json({ error: 'Failed to retrieve deletion status' });
  }
};

/**
 * Admin: List all data deletion requests
 */
const listDataDeletionRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM data_deletion_requests
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filter by tenant for admins (not super admins)
    if (req.user.role === 'admin') {
      query += ` AND tenant_id = $${paramCount}`;
      values.push(req.user.tenant_id);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM data_deletion_requests WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (req.user.role === 'admin') {
      countQuery += ` AND tenant_id = $${countParamCount}`;
      countValues.push(req.user.tenant_id);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      requests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List data deletion requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve deletion requests' });
  }
};

/**
 * Admin: Process data deletion request
 */
const processDataDeletionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, rejection_reason } = req.body; // action: 'approve' or 'reject'

    // Get request details
    const getQuery = `
      SELECT * FROM data_deletion_requests
      WHERE request_id = $1
    `;
    const getResult = await pool.query(getQuery, [requestId]);

    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    const request = getResult.rows[0];

    if (action === 'reject') {
      const updateQuery = `
        UPDATE data_deletion_requests
        SET status = 'rejected',
            processed_at = NOW(),
            processed_by = $1,
            rejection_reason = $2
        WHERE request_id = $3
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [req.user.id, rejection_reason, requestId]);

      await logAudit(
        req,
        'reject',
        'data_deletion_request',
        requestId,
        `Data deletion request rejected: ${rejection_reason}`,
        request,
        result.rows[0]
      );

      return res.json({
        success: true,
        request: result.rows[0],
        message: 'Data deletion request rejected'
      });
    }

    if (action === 'approve') {
      // Update status to processing
      const updateQuery = `
        UPDATE data_deletion_requests
        SET status = 'processing',
            processed_at = NOW(),
            processed_by = $1
        WHERE request_id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [req.user.id, requestId]);

      await logAudit(
        req,
        'approve',
        'data_deletion_request',
        requestId,
        'Data deletion request approved and processing',
        request,
        result.rows[0]
      );

      return res.json({
        success: true,
        request: result.rows[0],
        message: 'Data deletion request approved. Processing will begin shortly.'
      });
    }

    res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
  } catch (error) {
    console.error('Process data deletion request error:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
};

module.exports = {
  getUserConsent,
  updateUserConsent,
  requestDataExport,
  getDataExportStatus,
  requestDataDeletion,
  getDataDeletionStatus,
  listDataDeletionRequests,
  processDataDeletionRequest
};
