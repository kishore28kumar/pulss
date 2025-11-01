const db = require('../config/db');
const QRCode = require('qrcode');

/**
 * GST Invoice Service
 * Handles GST-compliant invoice generation, e-invoicing, and receipts
 */

class GSTInvoiceService {
  /**
   * Generate GST-compliant invoice data
   */
  async generateGSTInvoice(invoiceId) {
    const client = await db.connect();

    try {
      // Get invoice with all details
      const invoiceResult = await client.query(
        `SELECT i.*, 
                t.name as tenant_name,
                ss.business_name, ss.address, ss.phone,
                ss.city, ss.state, ss.country
         FROM invoices i
         JOIN tenants t ON i.tenant_id = t.tenant_id
         LEFT JOIN store_settings ss ON i.tenant_id = ss.tenant_id
         WHERE i.invoice_id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Get invoice items
      const itemsResult = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [
        invoiceId,
      ]);

      const items = itemsResult.rows;

      // Generate QR code for invoice
      const qrData = this.generateInvoiceQRData(invoice);
      const qrCodeUrl = await QRCode.toDataURL(qrData);

      // Update invoice with QR code
      await client.query('UPDATE invoices SET qr_code = $1 WHERE invoice_id = $2', [
        qrCodeUrl,
        invoiceId,
      ]);

      // Format invoice data
      const gstInvoice = {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,

        // Supplier details (Platform)
        supplier: {
          name: 'Pulss Platform',
          address: 'Your Business Address',
          gstin: 'YOUR_GSTIN_NUMBER', // Configure from environment
          state: 'Your State',
          state_code: '00', // Configure based on state
        },

        // Recipient details (Tenant)
        recipient: {
          name: invoice.billing_name,
          address: invoice.billing_address,
          gstin: invoice.billing_gstin || 'N/A',
          email: invoice.billing_email,
          phone: invoice.billing_phone,
          state: invoice.state || 'Unknown',
          place_of_supply: invoice.place_of_supply || invoice.state,
        },

        // Items
        items: items.map((item, index) => ({
          sr_no: index + 1,
          description: item.description,
          hsn_sac: '998314', // HSN/SAC for IT/Software services
          quantity: parseFloat(item.quantity),
          unit: 'Service',
          rate: parseFloat(item.unit_price),
          amount: parseFloat(item.amount),
          period:
            item.period_start && item.period_end
              ? {
                  start: item.period_start,
                  end: item.period_end,
                }
              : null,
        })),

        // Amounts
        subtotal: parseFloat(invoice.subtotal),
        discount: parseFloat(invoice.discount_amount || 0),
        taxable_value: parseFloat(invoice.subtotal) - parseFloat(invoice.discount_amount || 0),

        // GST Details
        gst: {
          rate: parseFloat(invoice.gst_rate || 18),
          cgst_rate: invoice.cgst_amount > 0 ? parseFloat(invoice.gst_rate || 18) / 2 : 0,
          cgst_amount: parseFloat(invoice.cgst_amount || 0),
          sgst_rate: invoice.sgst_amount > 0 ? parseFloat(invoice.gst_rate || 18) / 2 : 0,
          sgst_amount: parseFloat(invoice.sgst_amount || 0),
          igst_rate: invoice.igst_amount > 0 ? parseFloat(invoice.gst_rate || 18) : 0,
          igst_amount: parseFloat(invoice.igst_amount || 0),
          total_gst:
            parseFloat(invoice.cgst_amount || 0) +
            parseFloat(invoice.sgst_amount || 0) +
            parseFloat(invoice.igst_amount || 0),
        },

        // Total
        total_amount: parseFloat(invoice.total_amount),
        amount_in_words: this.numberToWords(parseFloat(invoice.total_amount)),

        // Payment details
        payment_status: invoice.payment_status,
        amount_paid: parseFloat(invoice.amount_paid || 0),
        balance_due: parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0),

        // Additional
        currency: invoice.currency || 'INR',
        notes: invoice.notes,
        qr_code: qrCodeUrl,

        // E-invoice details (if applicable)
        e_invoice: invoice.irn
          ? {
              irn: invoice.irn,
              ack_no: invoice.ack_no,
              ack_date: invoice.ack_date,
              status: invoice.e_invoice_status,
            }
          : null,
      };

      return gstInvoice;
    } finally {
      client.release();
    }
  }

  /**
   * Generate QR code data for invoice (as per GST requirements)
   */
  generateInvoiceQRData(invoice) {
    // Format: GSTIN~Invoice No~Invoice Date~Total Invoice Value~CGST~SGST~IGST
    const parts = [
      invoice.gstin || 'N/A',
      invoice.invoice_number,
      invoice.invoice_date,
      invoice.total_amount.toFixed(2),
      (invoice.cgst_amount || 0).toFixed(2),
      (invoice.sgst_amount || 0).toFixed(2),
      (invoice.igst_amount || 0).toFixed(2),
    ];

    return parts.join('~');
  }

  /**
   * Generate e-invoice IRN (Invoice Reference Number)
   * Note: In production, this should call the actual GSTN API
   */
  async generateEInvoice(invoiceId) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const invoice = await this.generateGSTInvoice(invoiceId);

      // In production, call GSTN e-invoice API here
      // For now, generate mock IRN
      const irn = this.generateMockIRN(invoice);
      const ackNo = `ACK${Date.now()}`;
      const ackDate = new Date();

      // Update invoice with e-invoice details
      await client.query(
        `UPDATE invoices 
         SET irn = $1, ack_no = $2, ack_date = $3, 
             irn_date = NOW(), e_invoice_status = 'generated'
         WHERE invoice_id = $4`,
        [irn, ackNo, ackDate, invoiceId]
      );

      await client.query('COMMIT');

      return {
        irn,
        ackNo,
        ackDate,
        status: 'generated',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate mock IRN (for testing)
   * In production, this will come from GSTN API
   */
  generateMockIRN(invoice) {
    const crypto = require('crypto');
    const data = `${invoice.invoice_number}${invoice.invoice_date}${invoice.total_amount}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 64);
  }

  /**
   * Generate GST receipt for payment
   */
  async generateGSTReceipt(transactionId) {
    const client = await db.connect();

    try {
      // Get transaction and invoice details
      const result = await client.query(
        `SELECT pt.*, i.invoice_number, i.subtotal, i.cgst_amount, 
                i.sgst_amount, i.igst_amount, i.gst_rate, i.total_amount,
                i.billing_name, i.billing_address, i.billing_gstin
         FROM payment_transactions pt
         JOIN invoices i ON pt.invoice_id = i.invoice_id
         WHERE pt.transaction_id = $1 AND pt.status = 'success'`,
        [transactionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found or not successful');
      }

      const transaction = result.rows[0];

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(client);

      // Calculate GST components
      const taxableValue = parseFloat(transaction.subtotal);
      const gstRate = parseFloat(transaction.gst_rate || 18);
      const cgstAmount = parseFloat(transaction.cgst_amount || 0);
      const sgstAmount = parseFloat(transaction.sgst_amount || 0);
      const igstAmount = parseFloat(transaction.igst_amount || 0);
      const totalTax = cgstAmount + sgstAmount + igstAmount;

      // Create GST receipt
      const receiptResult = await client.query(
        `INSERT INTO gst_receipts 
         (invoice_id, transaction_id, tenant_id, receipt_number, receipt_date,
          hsn_sac_code, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
          igst_rate, igst_amount, total_tax, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          transaction.invoice_id,
          transactionId,
          transaction.tenant_id,
          receiptNumber,
          new Date(),
          '998314',
          taxableValue,
          cgstAmount > 0 ? gstRate / 2 : 0,
          cgstAmount,
          sgstAmount > 0 ? gstRate / 2 : 0,
          sgstAmount,
          igstAmount > 0 ? gstRate : 0,
          igstAmount,
          totalTax,
          transaction.amount,
        ]
      );

      return receiptResult.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique receipt number
   */
  async generateReceiptNumber(client) {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    const result = await client.query(
      `SELECT receipt_number FROM gst_receipts 
       WHERE receipt_number LIKE $1 
       ORDER BY created_at DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].receipt_number;
      const lastSequence = parseInt(lastNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Calculate GST for inter-state vs intra-state
   */
  calculateGST(amount, supplierState, recipientState, gstRate = 18) {
    const taxableValue = parseFloat(amount);
    const rate = parseFloat(gstRate);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (supplierState === recipientState) {
      // Intra-state: CGST + SGST
      cgst = taxableValue * (rate / 2 / 100);
      sgst = taxableValue * (rate / 2 / 100);
    } else {
      // Inter-state: IGST
      igst = taxableValue * (rate / 100);
    }

    return {
      taxable_value: taxableValue,
      gst_rate: rate,
      cgst_rate: cgst > 0 ? rate / 2 : 0,
      cgst_amount: cgst,
      sgst_rate: sgst > 0 ? rate / 2 : 0,
      sgst_amount: sgst,
      igst_rate: igst > 0 ? rate : 0,
      igst_amount: igst,
      total_tax: cgst + sgst + igst,
      total_amount: taxableValue + cgst + sgst + igst,
    };
  }

  /**
   * Convert number to words (for Indian numbering system)
   */
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    const numToWords = (n) => {
      if (n === 0) return 'Zero';

      const crore = Math.floor(n / 10000000);
      const lakh = Math.floor((n % 10000000) / 100000);
      const thousand = Math.floor((n % 100000) / 1000);
      const hundred = Math.floor((n % 1000) / 100);
      const remainder = n % 100;

      let words = '';

      if (crore > 0) {
        words += numToWords(crore) + ' Crore ';
      }
      if (lakh > 0) {
        words += numToWords(lakh) + ' Lakh ';
      }
      if (thousand > 0) {
        words += numToWords(thousand) + ' Thousand ';
      }
      if (hundred > 0) {
        words += ones[hundred] + ' Hundred ';
      }

      if (remainder >= 20) {
        words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
      } else if (remainder >= 10) {
        words += teens[remainder - 10];
      } else if (remainder > 0) {
        words += ones[remainder];
      }

      return words.trim();
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = numToWords(rupees) + ' Rupees';

    if (paise > 0) {
      words += ' and ' + numToWords(paise) + ' Paise';
    }

    return words + ' Only';
  }

  /**
   * Validate GSTIN format
   */
  validateGSTIN(gstin) {
    // GSTIN format: 22AAAAA0000A1Z5
    // 2 chars state code + 10 chars PAN + 1 char entity type + 1 char default 'Z' + 1 char checksum
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Get HSN/SAC code for service
   */
  getHSNSACCode(serviceType) {
    const codes = {
      software: '998314', // Information technology software services
      subscription: '998314',
      consulting: '998313', // Information technology consulting services
      maintenance: '998315', // Maintenance of software
      hosting: '998316', // Web hosting services
    };

    return codes[serviceType] || '998314';
  }
}

module.exports = new GSTInvoiceService();
