const { pool } = require('../config/db');

/**
 * Tax Service
 * Handles tax calculations and compliance
 */

/**
 * GST rates in India
 */
const GST_RATES = {
  STANDARD: 18, // Standard rate for most services
  REDUCED: 12,  // Reduced rate
  ZERO: 0       // Zero-rated supplies
};

/**
 * Calculate GST for Indian transactions
 * @param {number} amount - Base amount
 * @param {string} state - Tenant state
 * @param {string} businessState - Business/Platform state
 * @returns {object} Tax breakdown
 */
const calculateGST = (amount, state, businessState = 'Karnataka') => {
  const baseAmount = parseFloat(amount);
  const rate = GST_RATES.STANDARD;
  
  // Determine if intra-state or inter-state
  const isIntraState = state === businessState;
  
  if (isIntraState) {
    // Intra-state: CGST + SGST
    const cgst = (baseAmount * (rate / 2)) / 100;
    const sgst = (baseAmount * (rate / 2)) / 100;
    const totalTax = cgst + sgst;
    
    return {
      type: 'GST (CGST + SGST)',
      rate: rate,
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      taxable_amount: baseAmount,
      total_amount: parseFloat((baseAmount + totalTax).toFixed(2))
    };
  } else {
    // Inter-state: IGST
    const igst = (baseAmount * rate) / 100;
    
    return {
      type: 'GST (IGST)',
      rate: rate,
      igst: parseFloat(igst.toFixed(2)),
      total_tax: parseFloat(igst.toFixed(2)),
      taxable_amount: baseAmount,
      total_amount: parseFloat((baseAmount + igst).toFixed(2))
    };
  }
};

/**
 * Calculate tax based on tenant location
 * @param {number} amount - Base amount
 * @param {string} tenantId - Tenant ID
 * @returns {object} Tax details
 */
const calculateTaxForTenant = async (amount, tenantId) => {
  try {
    // Get tenant details
    const tenantResult = await pool.query(
      `SELECT t.state, t.country, ss.business_name
       FROM tenants t
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       WHERE t.tenant_id = $1`,
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const tenant = tenantResult.rows[0];
    
    // Currently supporting India only
    if (tenant.country !== 'India') {
      return {
        type: 'No Tax',
        rate: 0,
        total_tax: 0,
        taxable_amount: parseFloat(amount),
        total_amount: parseFloat(amount)
      };
    }
    
    // Calculate GST
    return calculateGST(amount, tenant.state);
  } catch (error) {
    console.error('Error calculating tax for tenant:', error);
    throw error;
  }
};

/**
 * Validate GSTIN (GST Identification Number)
 * Format: 22AAAAA0000A1Z5
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} Is valid
 */
const validateGSTIN = (gstin) => {
  if (!gstin) return false;
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

/**
 * Extract state code from GSTIN
 * @param {string} gstin - GSTIN
 * @returns {string} State code
 */
const getStateCodeFromGSTIN = (gstin) => {
  if (!validateGSTIN(gstin)) {
    throw new Error('Invalid GSTIN');
  }
  return gstin.substring(0, 2);
};

/**
 * GST State Codes
 */
const GST_STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh'
};

/**
 * Get state name from GST state code
 * @param {string} code - State code
 * @returns {string} State name
 */
const getStateNameFromCode = (code) => {
  return GST_STATE_CODES[code] || 'Unknown';
};

/**
 * Generate tax invoice data
 * @param {object} invoice - Invoice object
 * @param {object} tenant - Tenant object
 * @returns {object} Tax invoice data
 */
const generateTaxInvoiceData = async (invoiceId) => {
  try {
    const result = await pool.query(
      `SELECT 
        i.*,
        t.name as tenant_name,
        ss.business_name,
        ss.address as tenant_address,
        ss.city as tenant_city,
        ss.state as tenant_state,
        s.gstin as tenant_gstin
       FROM invoices i
       JOIN tenants t ON i.tenant_id = t.tenant_id
       LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
       LEFT JOIN subscriptions s ON i.subscription_id = s.subscription_id
       WHERE i.invoice_id = $1`,
      [invoiceId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invoice not found');
    }
    
    const invoice = result.rows[0];
    
    // Get line items
    const lineItemsResult = await pool.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1',
      [invoiceId]
    );
    
    // Calculate tax breakdown if not already present
    let taxBreakdown = null;
    if (invoice.tax_amount > 0) {
      const isIntraState = invoice.tenant_state === 'Karnataka'; // Platform state
      
      if (isIntraState) {
        taxBreakdown = {
          type: 'CGST + SGST',
          cgst: invoice.tax_amount / 2,
          sgst: invoice.tax_amount / 2
        };
      } else {
        taxBreakdown = {
          type: 'IGST',
          igst: invoice.tax_amount
        };
      }
    }
    
    return {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      
      // Seller (Platform) details
      seller: {
        name: 'Pulss Platform',
        address: 'Platform Address', // TODO: Get from app settings
        gstin: 'PLATFORM_GSTIN', // TODO: Get from app settings
        state: 'Karnataka'
      },
      
      // Buyer (Tenant) details
      buyer: {
        name: invoice.business_name || invoice.tenant_name,
        address: invoice.tenant_address,
        city: invoice.tenant_city,
        state: invoice.tenant_state,
        gstin: invoice.tenant_gstin || 'N/A'
      },
      
      // Amounts
      subtotal: invoice.subtotal,
      discount: invoice.discount_amount,
      taxable_amount: invoice.subtotal - invoice.discount_amount,
      tax_rate: invoice.tax_rate,
      tax_type: invoice.tax_type,
      tax_breakdown: taxBreakdown,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      
      // Line items
      line_items: lineItemsResult.rows,
      
      // Notes
      notes: invoice.notes,
      terms: invoice.terms || 'Payment due within 15 days'
    };
  } catch (error) {
    console.error('Error generating tax invoice data:', error);
    throw error;
  }
};

/**
 * Apply tax to subscription
 * @param {object} subscription - Subscription data
 * @returns {object} Subscription with tax applied
 */
const applyTaxToSubscription = async (subscriptionData) => {
  const { tenantId, basePrice } = subscriptionData;
  
  try {
    const taxData = await calculateTaxForTenant(basePrice, tenantId);
    
    return {
      ...subscriptionData,
      tax_type: taxData.type,
      tax_rate: taxData.rate,
      tax_amount: taxData.total_tax,
      total_amount: taxData.total_amount
    };
  } catch (error) {
    console.error('Error applying tax to subscription:', error);
    // Return without tax on error
    return {
      ...subscriptionData,
      tax_type: 'No Tax',
      tax_rate: 0,
      tax_amount: 0,
      total_amount: basePrice
    };
  }
};

/**
 * Generate GST report for a period
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {string} tenantId - Optional tenant filter
 * @returns {object} GST report
 */
const generateGSTReport = async (startDate, endDate, tenantId = null) => {
  try {
    let query = `
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        i.tax_type,
        t.name as tenant_name,
        t.state as tenant_state
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.tenant_id
      WHERE i.invoice_date >= $1 
        AND i.invoice_date <= $2
        AND i.status IN ('paid', 'partially_paid')
    `;
    
    const params = [startDate, endDate];
    
    if (tenantId) {
      params.push(tenantId);
      query += ` AND i.tenant_id = $${params.length}`;
    }
    
    query += ' ORDER BY i.invoice_date';
    
    const result = await pool.query(query, params);
    
    // Aggregate by tax type
    const summary = {
      cgst_total: 0,
      sgst_total: 0,
      igst_total: 0,
      total_tax: 0,
      total_taxable: 0,
      total_invoice_value: 0,
      invoice_count: result.rows.length
    };
    
    result.rows.forEach(invoice => {
      summary.total_taxable += parseFloat(invoice.subtotal);
      summary.total_tax += parseFloat(invoice.tax_amount);
      summary.total_invoice_value += parseFloat(invoice.total_amount);
      
      if (invoice.tax_type && invoice.tax_type.includes('IGST')) {
        summary.igst_total += parseFloat(invoice.tax_amount);
      } else if (invoice.tax_type && invoice.tax_type.includes('CGST')) {
        summary.cgst_total += parseFloat(invoice.tax_amount) / 2;
        summary.sgst_total += parseFloat(invoice.tax_amount) / 2;
      }
    });
    
    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary,
      invoices: result.rows
    };
  } catch (error) {
    console.error('Error generating GST report:', error);
    throw error;
  }
};

module.exports = {
  calculateGST,
  calculateTaxForTenant,
  validateGSTIN,
  getStateCodeFromGSTIN,
  getStateNameFromCode,
  generateTaxInvoiceData,
  applyTaxToSubscription,
  generateGSTReport,
  GST_RATES,
  GST_STATE_CODES
};
