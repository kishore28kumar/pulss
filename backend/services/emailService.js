/**
 * Email Service
 * Handles email sending with tenant-specific SMTP configuration and branding
 */

const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

class EmailService {
  constructor() {
    // Default SMTP configuration from environment
    this.defaultConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    this.defaultFrom = {
      email: process.env.SMTP_FROM_EMAIL || 'noreply@pulss.app',
      name: process.env.SMTP_FROM_NAME || 'Pulss Platform'
    };

    // Cache for tenant transporters
    this.transporters = new Map();
  }

  /**
   * Get or create SMTP transporter for a tenant
   */
  async getTransporter(tenantId = null) {
    try {
      // If no tenant specified or tenant doesn't have custom SMTP, use default
      if (!tenantId) {
        return this.getDefaultTransporter();
      }

      // Check cache
      if (this.transporters.has(tenantId)) {
        return this.transporters.get(tenantId);
      }

      // Get tenant email configuration
      const result = await pool.query(
        'SELECT * FROM email_configurations WHERE tenant_id = $1',
        [tenantId]
      );

      if (result.rows.length === 0 || !result.rows[0].enable_custom_smtp) {
        return this.getDefaultTransporter();
      }

      const config = result.rows[0];

      // Decrypt password (in production, use proper encryption)
      const decryptedPassword = this.decryptPassword(config.smtp_password_encrypted);

      // Create custom transporter
      const transporter = nodemailer.createTransporter({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: decryptedPassword
        }
      });

      // Verify connection
      try {
        await transporter.verify();
        this.transporters.set(tenantId, transporter);
        return transporter;
      } catch (error) {
        console.error('Failed to verify custom SMTP for tenant:', tenantId, error);
        // Fall back to default
        return this.getDefaultTransporter();
      }
    } catch (error) {
      console.error('Error getting transporter:', error);
      return this.getDefaultTransporter();
    }
  }

  /**
   * Get default SMTP transporter
   */
  getDefaultTransporter() {
    if (!this._defaultTransporter) {
      // Only create if SMTP is configured
      if (this.defaultConfig.auth.user && this.defaultConfig.auth.pass) {
        this._defaultTransporter = nodemailer.createTransporter(this.defaultConfig);
      } else {
        // Return a test transporter for development
        console.warn('SMTP not configured, using test account');
        return this.createTestTransporter();
      }
    }
    return this._defaultTransporter;
  }

  /**
   * Create a test email account (for development)
   */
  async createTestTransporter() {
    if (this._testTransporter) {
      return this._testTransporter;
    }

    try {
      // Create a test account (this is async)
      const testAccount = await nodemailer.createTestAccount();
      
      this._testTransporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('Test email account created:', testAccount.user);
      return this._testTransporter;
    } catch (error) {
      console.error('Failed to create test account:', error);
      // Return a dummy transporter
      return {
        sendMail: async () => {
          console.log('Dummy transporter: email not sent');
          return { messageId: 'dummy-' + Date.now() };
        }
      };
    }
  }

  /**
   * Send an email
   */
  async sendEmail({
    to,
    subject,
    text,
    html,
    tenantId = null,
    from = null,
    replyTo = null,
    attachments = []
  }) {
    try {
      // Get transporter
      const transporter = await this.getTransporter(tenantId);

      // Get from email configuration
      let fromEmail, fromName;
      
      if (tenantId && !from) {
        const configResult = await pool.query(
          'SELECT from_email, from_name, reply_to_email FROM email_configurations WHERE tenant_id = $1',
          [tenantId]
        );

        if (configResult.rows.length > 0) {
          const config = configResult.rows[0];
          fromEmail = config.from_email || this.defaultFrom.email;
          fromName = config.from_name || this.defaultFrom.name;
          replyTo = replyTo || config.reply_to_email;
        } else {
          fromEmail = this.defaultFrom.email;
          fromName = this.defaultFrom.name;
        }
      } else if (from) {
        fromEmail = from;
        fromName = null;
      } else {
        fromEmail = this.defaultFrom.email;
        fromName = this.defaultFrom.name;
      }

      // Prepare email options
      const mailOptions = {
        from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
        to,
        subject,
        text,
        html,
        replyTo,
        attachments
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent:', info.messageId);

      // Log preview URL for test accounts
      if (transporter === this._testTransporter) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        metadata: {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response
        }
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          code: error.code,
          command: error.command
        }
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken, tenantId = null) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f7f7f7; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested to reset your password. Visit this link to reset: ${resetUrl}\n\nThis link will expire in 1 hour.`,
      html,
      tenantId
    });
  }

  /**
   * Send admin invite email
   */
  async sendAdminInviteEmail(email, tenantName, setupCode, tenantId = null) {
    const setupUrl = `${process.env.FRONTEND_URL}/admin-setup?code=${setupCode}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f7f7f7; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Welcome to ${tenantName}!</h2>
          <p>You've been invited to join <strong>${tenantName}</strong> as an administrator.</p>
          
          <p>Click the button below to set up your account:</p>
          
          <a href="${setupUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Set Up Account
          </a>
          
          <p style="color: #666; font-size: 14px;">Your setup code: <strong>${setupCode}</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${setupUrl}" style="color: #3b82f6; word-break: break-all;">${setupUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `You're invited to join ${tenantName}`,
      text: `You've been invited to join ${tenantName} as an administrator.\n\nSetup code: ${setupCode}\nSetup link: ${setupUrl}`,
      html,
      tenantId
    });
  }

  /**
   * Send billing invoice email
   */
  async sendBillingInvoiceEmail({
    email,
    tenantName,
    invoiceNumber,
    amount,
    currency,
    dueDate,
    invoiceUrl,
    tenantId = null
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f7f7f7; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Invoice ${invoiceNumber}</h2>
          <p>Dear ${tenantName},</p>
          <p>Your invoice for this billing period is ready.</p>
          
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                <td style="text-align: right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Amount:</strong></td>
                <td style="text-align: right; font-size: 18px; color: #3b82f6;"><strong>${currency} ${amount}</strong></td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Due Date:</strong></td>
                <td style="text-align: right;">${dueDate}</td>
              </tr>
            </table>
          </div>
          
          ${invoiceUrl ? `
            <a href="${invoiceUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              View Invoice
            </a>
          ` : ''}
          
          <p style="color: #666; font-size: 14px;">Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `Invoice ${invoiceNumber} - ${tenantName}`,
      text: `Invoice ${invoiceNumber}\nAmount: ${currency} ${amount}\nDue Date: ${dueDate}`,
      html,
      tenantId
    });
  }

  /**
   * Decrypt password (placeholder - implement proper encryption)
   */
  decryptPassword(encryptedPassword) {
    // TODO: Implement proper encryption/decryption
    // For now, just return as-is (assuming it's stored in plain text for development)
    return encryptedPassword;
  }

  /**
   * Encrypt password (placeholder - implement proper encryption)
   */
  encryptPassword(password) {
    // TODO: Implement proper encryption
    // For now, just return as-is
    return password;
  }
}

module.exports = new EmailService();
