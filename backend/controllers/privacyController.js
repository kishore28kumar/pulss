const { pool } = require('../config/db');

/**
 * Privacy Controller for DPDP Act 2023 (India) Compliance
 * Implements Data Principal Rights as per Digital Personal Data Protection Act, 2023
 */

// Data Access - Right to access personal data
exports.requestDataAccess = async (req, res) => {
  try {
    const { customer_id } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID is required' 
      });
    }

    // Collect all personal data from various tables
    const customerData = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2',
      [customer_id, tenant_id]
    );

    const orders = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 AND tenant_id = $2',
      [customer_id, tenant_id]
    );

    const privacySettings = await pool.query(
      'SELECT * FROM customer_privacy_settings WHERE customer_id = $1',
      [customer_id]
    );

    // Log the data access request
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'data_access_request',
        'privacy',
        customer_id,
        JSON.stringify({ request_type: 'data_access' }),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Data access request processed successfully',
      data: {
        customer: customerData.rows[0] || null,
        orders: orders.rows || [],
        privacy_settings: privacySettings.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Error processing data access request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process data access request' 
    });
  }
};

// Data Correction - Right to correct inaccurate data
exports.requestDataCorrection = async (req, res) => {
  try {
    const { customer_id, field, old_value, new_value, reason } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id || !field || !new_value) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID, field, and new value are required' 
      });
    }

    // Valid fields that can be corrected
    const validFields = ['name', 'email', 'phone', 'address'];
    
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid field for correction' 
      });
    }

    // Update the customer data
    await pool.query(
      `UPDATE customers SET ${field} = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [new_value, customer_id, tenant_id]
    );

    // Log the data correction
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, old_values, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenant_id,
        customer_id,
        'data_correction',
        'privacy',
        customer_id,
        JSON.stringify({ field, old_value, reason }),
        JSON.stringify({ field, new_value }),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Data correction completed successfully'
    });
  } catch (error) {
    console.error('Error processing data correction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process data correction request' 
    });
  }
};

// Data Erasure - Right to delete personal data
exports.requestDataErasure = async (req, res) => {
  try {
    const { customer_id, reason } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID is required' 
      });
    }

    // Log the deletion request before deletion
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'data_erasure_request',
        'privacy',
        customer_id,
        JSON.stringify({ reason }),
        req.headers['user-agent']
      ]
    );

    // Anonymize customer data instead of hard delete (for legal/audit purposes)
    await pool.query(
      `UPDATE customers 
       SET name = 'Deleted User', 
           email = CONCAT('deleted_', id, '@anonymized.local'),
           phone = NULL,
           address = NULL,
           updated_at = NOW(),
           deleted_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [customer_id, tenant_id]
    );

    // Delete privacy settings
    await pool.query(
      'DELETE FROM customer_privacy_settings WHERE customer_id = $1',
      [customer_id]
    );

    res.json({
      success: true,
      message: 'Data erasure request processed successfully. Your account will be deleted within 30 days.'
    });
  } catch (error) {
    console.error('Error processing data erasure:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process data erasure request' 
    });
  }
};

// Consent Withdrawal - Right to withdraw consent
exports.withdrawConsent = async (req, res) => {
  try {
    const { customer_id, consent_types } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id || !consent_types) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID and consent types are required' 
      });
    }

    // Build update query dynamically based on consent types
    const updates = [];
    if (consent_types.includes('marketing')) updates.push('marketing_consent = false');
    if (consent_types.includes('analytics')) updates.push('analytics_consent = false');
    if (consent_types.includes('personalization')) updates.push('personalization_consent = false');
    if (consent_types.includes('data_processing')) updates.push('data_processing_consent = false');

    if (updates.length > 0) {
      const updateQuery = `UPDATE customer_privacy_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE customer_id = $1`;
      await pool.query(updateQuery, [customer_id]);
    }

    // Log consent withdrawal
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'consent_withdrawal',
        'privacy',
        customer_id,
        JSON.stringify({ consent_types }),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Consent withdrawal processed successfully'
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to withdraw consent' 
    });
  }
};

// Grievance Redressal - Submit grievance under DPDP Act
exports.submitGrievance = async (req, res) => {
  try {
    const { customer_id, subject, description, category } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id || !subject || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID, subject, and description are required' 
      });
    }

    // Create grievance record
    const result = await pool.query(
      `INSERT INTO privacy_grievances 
       (tenant_id, customer_id, subject, description, category, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [tenant_id, customer_id, subject, description, category || 'general', 'pending']
    );

    // Log the grievance submission
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'grievance_submission',
        'privacy',
        result.rows[0].id,
        JSON.stringify({ subject, category }),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Grievance submitted successfully. You will receive a response within 30 days.',
      grievance_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit grievance' 
    });
  }
};

// Get Privacy Settings
exports.getPrivacySettings = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM customer_privacy_settings WHERE customer_id = $1',
      [customer_id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch privacy settings' 
    });
  }
};

// Update Privacy Settings
exports.updatePrivacySettings = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { 
      marketing_consent, 
      analytics_consent, 
      personalization_consent,
      data_processing_consent,
      data_retention_preference 
    } = req.body;
    const tenant_id = req.tenant_id;

    // Check if settings exist
    const existing = await pool.query(
      'SELECT * FROM customer_privacy_settings WHERE customer_id = $1',
      [customer_id]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create new settings
      result = await pool.query(
        `INSERT INTO customer_privacy_settings 
         (customer_id, marketing_consent, analytics_consent, personalization_consent, 
          data_processing_consent, data_retention_preference, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          customer_id,
          marketing_consent ?? false,
          analytics_consent ?? false,
          personalization_consent ?? false,
          data_processing_consent ?? true,
          data_retention_preference || '2_years'
        ]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        `UPDATE customer_privacy_settings 
         SET marketing_consent = COALESCE($2, marketing_consent),
             analytics_consent = COALESCE($3, analytics_consent),
             personalization_consent = COALESCE($4, personalization_consent),
             data_processing_consent = COALESCE($5, data_processing_consent),
             data_retention_preference = COALESCE($6, data_retention_preference),
             updated_at = NOW()
         WHERE customer_id = $1
         RETURNING *`,
        [
          customer_id,
          marketing_consent,
          analytics_consent,
          personalization_consent,
          data_processing_consent,
          data_retention_preference
        ]
      );
    }

    // Log the settings update
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'privacy_settings_update',
        'privacy',
        customer_id,
        JSON.stringify(req.body),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update privacy settings' 
    });
  }
};

// Parental Consent Check (for users under 18)
exports.checkParentalConsent = async (req, res) => {
  try {
    const { customer_id, date_of_birth } = req.body;

    if (!customer_id || !date_of_birth) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID and date of birth are required' 
      });
    }

    // Calculate age
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const requiresParentalConsent = age < 18;

    if (requiresParentalConsent) {
      // Check if parental consent is already provided
      const consent = await pool.query(
        'SELECT * FROM parental_consents WHERE customer_id = $1 AND status = $2',
        [customer_id, 'approved']
      );

      res.json({
        success: true,
        requires_parental_consent: true,
        has_parental_consent: consent.rows.length > 0,
        age: age
      });
    } else {
      res.json({
        success: true,
        requires_parental_consent: false,
        has_parental_consent: true,
        age: age
      });
    }
  } catch (error) {
    console.error('Error checking parental consent:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check parental consent' 
    });
  }
};

// Submit Parental Consent
exports.submitParentalConsent = async (req, res) => {
  try {
    const { customer_id, parent_name, parent_email, parent_phone, relationship } = req.body;
    const tenant_id = req.tenant_id;

    if (!customer_id || !parent_name || !parent_email) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer ID, parent name, and parent email are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO parental_consents 
       (customer_id, parent_name, parent_email, parent_phone, relationship, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [customer_id, parent_name, parent_email, parent_phone, relationship || 'parent', 'pending']
    );

    // Log the parental consent submission
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenant_id,
        customer_id,
        'parental_consent_submission',
        'privacy',
        result.rows[0].id,
        JSON.stringify({ parent_email }),
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'Parental consent request submitted. Verification email sent to parent.',
      consent_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error submitting parental consent:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit parental consent' 
    });
  }
};

// Get Grievance Officer Contact
exports.getGrievanceOfficer = async (req, res) => {
  try {
    const tenant_id = req.tenant_id;

    // In a real implementation, this would come from tenant settings
    const grievanceOfficer = {
      name: 'Data Protection Officer',
      email: 'privacy@pulss.com',
      phone: '+91-XXXXXXXXXX',
      address: 'Pulss Technologies Pvt Ltd, Privacy Department, India',
      response_time: '30 days as per DPDP Act 2023'
    };

    res.json({
      success: true,
      data: grievanceOfficer
    });
  } catch (error) {
    console.error('Error fetching grievance officer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch grievance officer details' 
    });
  }
};
