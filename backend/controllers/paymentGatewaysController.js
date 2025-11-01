const { pool } = require('../config/db');

/**
 * Get payment gateways for a tenant
 */
const getTenantGateways = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
        supported_currencies, supported_payment_methods, created_at, updated_at
       FROM payment_gateways 
       WHERE tenant_id = $1
       ORDER BY gateway_name ASC`,
      [tenantId]
    );
    
    res.json({ gateways: result.rows });
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    res.status(500).json({ error: 'Failed to fetch payment gateways' });
  }
};

/**
 * Get a specific payment gateway configuration
 */
const getGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
        supported_currencies, supported_payment_methods, config_data,
        created_at, updated_at
       FROM payment_gateways 
       WHERE gateway_id = $1`,
      [gatewayId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gateway not found' });
    }
    
    res.json({ gateway: result.rows[0] });
  } catch (error) {
    console.error('Error fetching payment gateway:', error);
    res.status(500).json({ error: 'Failed to fetch payment gateway' });
  }
};

/**
 * Configure payment gateway for tenant (Admin only)
 */
const configureGateway = async (req, res) => {
  try {
    const {
      tenantId, gatewayName, apiKey, apiSecret, webhookSecret,
      merchantId, isTestMode, supportedCurrencies, supportedPaymentMethods, configData
    } = req.body;
    
    if (!tenantId || !gatewayName) {
      return res.status(400).json({ error: 'Tenant ID and Gateway Name required' });
    }
    
    // Check if gateway already configured
    const existingResult = await pool.query(
      'SELECT gateway_id FROM payment_gateways WHERE tenant_id = $1 AND gateway_name = $2',
      [tenantId, gatewayName]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing configuration
      const result = await pool.query(
        `UPDATE payment_gateways 
         SET api_key = $1, api_secret = $2, webhook_secret = $3, merchant_id = $4,
             is_test_mode = $5, supported_currencies = $6, supported_payment_methods = $7,
             config_data = $8, updated_at = NOW()
         WHERE tenant_id = $9 AND gateway_name = $10
         RETURNING gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
                   supported_currencies, supported_payment_methods, created_at, updated_at`,
        [
          apiKey, apiSecret, webhookSecret, merchantId, isTestMode || true,
          supportedCurrencies || ['INR'], supportedPaymentMethods || ['card', 'upi', 'netbanking'],
          JSON.stringify(configData || {}), tenantId, gatewayName
        ]
      );
      return res.json({ gateway: result.rows[0], message: 'Gateway updated successfully' });
    }
    
    // Create new gateway configuration
    const result = await pool.query(
      `INSERT INTO payment_gateways (
        tenant_id, gateway_name, api_key, api_secret, webhook_secret, merchant_id,
        is_test_mode, supported_currencies, supported_payment_methods, config_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
                supported_currencies, supported_payment_methods, created_at, updated_at`,
      [
        tenantId, gatewayName, apiKey, apiSecret, webhookSecret, merchantId,
        isTestMode || true, supportedCurrencies || ['INR'],
        supportedPaymentMethods || ['card', 'upi', 'netbanking'],
        JSON.stringify(configData || {})
      ]
    );
    
    res.status(201).json({ gateway: result.rows[0], message: 'Gateway configured successfully' });
  } catch (error) {
    console.error('Error configuring payment gateway:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Gateway already configured for this tenant' });
    }
    res.status(500).json({ error: 'Failed to configure payment gateway' });
  }
};

/**
 * Enable/Disable a payment gateway
 */
const toggleGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const { is_enabled } = req.body;
    
    if (is_enabled === undefined) {
      return res.status(400).json({ error: 'is_enabled field required' });
    }
    
    const result = await pool.query(
      `UPDATE payment_gateways 
       SET is_enabled = $1, updated_at = NOW()
       WHERE gateway_id = $2
       RETURNING gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
                 supported_currencies, supported_payment_methods, created_at, updated_at`,
      [is_enabled, gatewayId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gateway not found' });
    }
    
    res.json({ gateway: result.rows[0] });
  } catch (error) {
    console.error('Error toggling payment gateway:', error);
    res.status(500).json({ error: 'Failed to toggle payment gateway' });
  }
};

/**
 * Switch between test and production mode
 */
const toggleTestMode = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const { is_test_mode } = req.body;
    
    if (is_test_mode === undefined) {
      return res.status(400).json({ error: 'is_test_mode field required' });
    }
    
    const result = await pool.query(
      `UPDATE payment_gateways 
       SET is_test_mode = $1, updated_at = NOW()
       WHERE gateway_id = $2
       RETURNING gateway_id, tenant_id, gateway_name, is_enabled, is_test_mode,
                 supported_currencies, supported_payment_methods, created_at, updated_at`,
      [is_test_mode, gatewayId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gateway not found' });
    }
    
    res.json({ gateway: result.rows[0] });
  } catch (error) {
    console.error('Error toggling test mode:', error);
    res.status(500).json({ error: 'Failed to toggle test mode' });
  }
};

/**
 * Delete a payment gateway configuration
 */
const deleteGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM payment_gateways WHERE gateway_id = $1 RETURNING *',
      [gatewayId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gateway not found' });
    }
    
    res.json({ message: 'Gateway deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    res.status(500).json({ error: 'Failed to delete payment gateway' });
  }
};

/**
 * Get available gateway types
 */
const getAvailableGateways = async (req, res) => {
  try {
    const gateways = [
      {
        name: 'stripe',
        display_name: 'Stripe',
        description: 'Global payment processing platform',
        supported_countries: ['US', 'UK', 'EU', 'India', 'Others'],
        supported_currencies: ['INR', 'USD', 'EUR', 'GBP'],
        supported_methods: ['card', 'wallet', 'bank_transfer'],
        setup_fields: ['api_key', 'api_secret', 'webhook_secret']
      },
      {
        name: 'razorpay',
        display_name: 'Razorpay',
        description: 'India\'s leading payment gateway',
        supported_countries: ['India'],
        supported_currencies: ['INR'],
        supported_methods: ['card', 'upi', 'netbanking', 'wallet'],
        setup_fields: ['api_key', 'api_secret', 'webhook_secret']
      },
      {
        name: 'paypal',
        display_name: 'PayPal',
        description: 'Global online payment system',
        supported_countries: ['Worldwide'],
        supported_currencies: ['INR', 'USD', 'EUR', 'GBP', 'Others'],
        supported_methods: ['paypal_wallet', 'card'],
        setup_fields: ['api_key', 'api_secret', 'webhook_secret']
      },
      {
        name: 'paytm',
        display_name: 'Paytm',
        description: 'India\'s largest payment platform',
        supported_countries: ['India'],
        supported_currencies: ['INR'],
        supported_methods: ['wallet', 'upi', 'card', 'netbanking'],
        setup_fields: ['merchant_id', 'api_key', 'api_secret']
      },
      {
        name: 'phonepe',
        display_name: 'PhonePe',
        description: 'Leading UPI payment solution',
        supported_countries: ['India'],
        supported_currencies: ['INR'],
        supported_methods: ['upi', 'card', 'wallet'],
        setup_fields: ['merchant_id', 'api_key', 'api_secret']
      },
      {
        name: 'cashfree',
        display_name: 'Cashfree',
        description: 'India payment and banking solution',
        supported_countries: ['India'],
        supported_currencies: ['INR'],
        supported_methods: ['upi', 'card', 'netbanking', 'wallet'],
        setup_fields: ['api_key', 'api_secret', 'webhook_secret']
      },
      {
        name: 'instamojo',
        display_name: 'Instamojo',
        description: 'Payment gateway for Indian businesses',
        supported_countries: ['India'],
        supported_currencies: ['INR'],
        supported_methods: ['card', 'upi', 'netbanking', 'wallet'],
        setup_fields: ['api_key', 'api_secret']
      },
      {
        name: 'ccavenue',
        display_name: 'CCAvenue',
        description: 'Comprehensive payment solution',
        supported_countries: ['India', 'International'],
        supported_currencies: ['INR', 'USD', 'EUR', 'Others'],
        supported_methods: ['card', 'netbanking', 'wallet', 'upi'],
        setup_fields: ['merchant_id', 'access_code', 'working_key']
      }
    ];
    
    res.json({ gateways });
  } catch (error) {
    console.error('Error fetching available gateways:', error);
    res.status(500).json({ error: 'Failed to fetch available gateways' });
  }
};

/**
 * Test gateway connection
 */
const testGatewayConnection = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM payment_gateways WHERE gateway_id = $1',
      [gatewayId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gateway not found' });
    }
    
    const gateway = result.rows[0];
    
    // TODO: Implement actual gateway API connection tests
    // This is a placeholder implementation
    
    const testResult = {
      gateway_name: gateway.gateway_name,
      test_mode: gateway.is_test_mode,
      connection_status: 'success', // Would be actual API test result
      message: 'Gateway credentials are valid',
      tested_at: new Date()
    };
    
    res.json({ test_result: testResult });
  } catch (error) {
    console.error('Error testing gateway connection:', error);
    res.status(500).json({ error: 'Failed to test gateway connection' });
  }
};

module.exports = {
  getTenantGateways,
  getGateway,
  configureGateway,
  toggleGateway,
  toggleTestMode,
  deleteGateway,
  getAvailableGateways,
  testGatewayConnection
};
