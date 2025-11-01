const db = require('../config/db');
const emailService = require('./emailService');

/**
 * Billing Notification Service
 * Handles email notifications for billing events
 */

class BillingNotificationService {
  /**
   * Send notification email using emailService
   */
  async sendEmail(to, subject, body, tenantId = null) {
    try {
      // Validate input
      if (!to || !subject || !body) {
        throw new Error('Email requires to, subject, and body parameters');
      }

      // Use emailService to send the email
      const result = await emailService.sendEmail({
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'), // Simple text to HTML conversion
        tenantId
      });

      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending billing notification email:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check email service configuration (SMTP/SendGrid/SES)'
      };
    }
  }

  /**
   * Queue notification for sending
   */
  async queueNotification(tenantId, invoiceId, notificationType, recipientEmail, subject, body) {
    const result = await db.query(
      `INSERT INTO billing_notifications 
       (tenant_id, invoice_id, notification_type, recipient_email, subject, body, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, invoiceId, notificationType, recipientEmail, subject, body, 'pending']
    );

    return result.rows[0];
  }

  /**
   * Send invoice created notification
   */
  async sendInvoiceCreated(invoiceId) {
    try {
      const invoiceResult = await db.query(
        `SELECT i.*, t.name as tenant_name
         FROM invoices i
         JOIN tenants t ON i.tenant_id = t.tenant_id
         WHERE i.invoice_id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      const subject = `Invoice ${invoice.invoice_number} - ${invoice.tenant_name}`;
      const body = `
Dear ${invoice.billing_name},

Your invoice has been generated for ${invoice.tenant_name}.

Invoice Number: ${invoice.invoice_number}
Invoice Date: ${invoice.invoice_date}
Due Date: ${invoice.due_date}
Total Amount: ₹${invoice.total_amount}

Please login to your account to view and pay the invoice.

Thank you,
Pulss Team
      `.trim();

      await this.queueNotification(
        invoice.tenant_id,
        invoiceId,
        'invoice_created',
        invoice.billing_email,
        subject,
        body
      );

      // Try to send immediately
      const emailResult = await this.sendEmail(invoice.billing_email, subject, body, invoice.tenant_id);

      if (emailResult.success) {
        // Mark as sent
        await db.query(
          'UPDATE billing_notifications SET status = $1, sent_at = NOW() WHERE invoice_id = $2 AND notification_type = $3',
          ['sent', invoiceId, 'invoice_created']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        // Mark as failed
        await db.query(
          'UPDATE billing_notifications SET status = $1, failure_reason = $2 WHERE invoice_id = $3 AND notification_type = $4',
          ['failed', emailResult.error, invoiceId, 'invoice_created']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending invoice notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(transactionId) {
    try {
      const result = await db.query(
        `SELECT pt.*, i.invoice_number, i.total_amount, i.billing_email, i.billing_name,
                t.name as tenant_name
         FROM payment_transactions pt
         JOIN invoices i ON pt.invoice_id = i.invoice_id
         JOIN tenants t ON pt.tenant_id = t.tenant_id
         WHERE pt.transaction_id = $1`,
        [transactionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = result.rows[0];

      const subject = `Payment Received - Invoice ${transaction.invoice_number}`;
      const body = `
Dear ${transaction.billing_name},

We have received your payment for invoice ${transaction.invoice_number}.

Payment Details:
- Amount: ₹${transaction.amount}
- Transaction ID: ${transaction.gateway_transaction_id}
- Payment Method: ${transaction.payment_method}
- Date: ${transaction.completed_at}

Thank you for your payment!

Pulss Team
      `.trim();

      await this.queueNotification(
        transaction.tenant_id,
        transaction.invoice_id,
        'payment_success',
        transaction.billing_email,
        subject,
        body
      );

      const emailResult = await this.sendEmail(transaction.billing_email, subject, body, transaction.tenant_id);

      if (emailResult.success) {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, sent_at = NOW() 
           WHERE tenant_id = $2 AND notification_type = $3 AND status = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['sent', transaction.tenant_id, 'payment_success', 'pending']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, failure_reason = $2
           WHERE tenant_id = $3 AND notification_type = $4 AND status = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['failed', emailResult.error, transaction.tenant_id, 'payment_success', 'pending']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending payment success notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailed(transactionId) {
    try {
      const result = await db.query(
        `SELECT pt.*, i.invoice_number, i.total_amount, i.billing_email, i.billing_name,
                t.name as tenant_name
         FROM payment_transactions pt
         JOIN invoices i ON pt.invoice_id = i.invoice_id
         JOIN tenants t ON pt.tenant_id = t.tenant_id
         WHERE pt.transaction_id = $1`,
        [transactionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = result.rows[0];

      const subject = `Payment Failed - Invoice ${transaction.invoice_number}`;
      const body = `
Dear ${transaction.billing_name},

Your payment for invoice ${transaction.invoice_number} has failed.

Invoice Amount: ₹${transaction.total_amount}
Failure Reason: ${transaction.failure_reason || 'Unknown'}

Please try again or contact support if you need assistance.

Pulss Team
      `.trim();

      await this.queueNotification(
        transaction.tenant_id,
        transaction.invoice_id,
        'payment_failed',
        transaction.billing_email,
        subject,
        body
      );

      const emailResult = await this.sendEmail(transaction.billing_email, subject, body, transaction.tenant_id);

      if (emailResult.success) {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, sent_at = NOW() 
           WHERE tenant_id = $2 AND notification_type = $3 AND status = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['sent', transaction.tenant_id, 'payment_failed', 'pending']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, failure_reason = $2
           WHERE tenant_id = $3 AND notification_type = $4 AND status = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['failed', emailResult.error, transaction.tenant_id, 'payment_failed', 'pending']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Send subscription renewal reminder
   */
  async sendRenewalReminder(subscriptionId, daysUntilRenewal) {
    try {
      const result = await db.query(
        `SELECT ts.*, t.name as tenant_name, sp.name as plan_name, sp.base_price
         FROM tenant_subscriptions ts
         JOIN tenants t ON ts.tenant_id = t.tenant_id
         JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
         WHERE ts.subscription_id = $1`,
        [subscriptionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = result.rows[0];

      const subject = `Subscription Renewal Reminder - ${subscription.tenant_name}`;
      const body = `
Dear ${subscription.tenant_name},

Your subscription (${subscription.plan_name}) will renew in ${daysUntilRenewal} days.

Renewal Date: ${subscription.current_period_end}
Plan: ${subscription.plan_name}
Amount: ₹${subscription.base_price}

Please ensure your payment method is up to date.

Pulss Team
      `.trim();

      await this.queueNotification(
        subscription.tenant_id,
        null,
        'renewal_reminder',
        subscription.billing_email,
        subject,
        body
      );

      const emailResult = await this.sendEmail(subscription.billing_email, subject, body, subscription.tenant_id);

      if (emailResult.success) {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, sent_at = NOW() 
           WHERE tenant_id = $2 AND notification_type = $3 AND status = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['sent', subscription.tenant_id, 'renewal_reminder', 'pending']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, failure_reason = $2
           WHERE tenant_id = $3 AND notification_type = $4 AND status = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['failed', emailResult.error, subscription.tenant_id, 'renewal_reminder', 'pending']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending renewal reminder:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Send trial ending notification
   */
  async sendTrialEnding(subscriptionId, daysRemaining) {
    try {
      const result = await db.query(
        `SELECT ts.*, t.name as tenant_name, sp.name as plan_name, sp.base_price
         FROM tenant_subscriptions ts
         JOIN tenants t ON ts.tenant_id = t.tenant_id
         JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
         WHERE ts.subscription_id = $1`,
        [subscriptionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = result.rows[0];

      const subject = `Trial Ending Soon - ${subscription.tenant_name}`;
      const body = `
Dear ${subscription.tenant_name},

Your trial period will end in ${daysRemaining} days.

Trial End Date: ${subscription.trial_end}
Plan: ${subscription.plan_name}
Price after trial: ₹${subscription.base_price}/${subscription.billing_period}

To continue using our services, please add a payment method before the trial ends.

Pulss Team
      `.trim();

      await this.queueNotification(
        subscription.tenant_id,
        null,
        'trial_ending',
        subscription.billing_email,
        subject,
        body
      );

      const emailResult = await this.sendEmail(subscription.billing_email, subject, body, subscription.tenant_id);

      if (emailResult.success) {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, sent_at = NOW() 
           WHERE tenant_id = $2 AND notification_type = $3 AND status = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['sent', subscription.tenant_id, 'trial_ending', 'pending']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, failure_reason = $2
           WHERE tenant_id = $3 AND notification_type = $4 AND status = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['failed', emailResult.error, subscription.tenant_id, 'trial_ending', 'pending']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending trial ending notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Send subscription cancelled notification
   */
  async sendSubscriptionCancelled(subscriptionId) {
    try {
      const result = await db.query(
        `SELECT ts.*, t.name as tenant_name, sp.name as plan_name
         FROM tenant_subscriptions ts
         JOIN tenants t ON ts.tenant_id = t.tenant_id
         JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
         WHERE ts.subscription_id = $1`,
        [subscriptionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = result.rows[0];

      const subject = `Subscription Cancelled - ${subscription.tenant_name}`;
      const body = `
Dear ${subscription.tenant_name},

Your subscription (${subscription.plan_name}) has been cancelled.

${
  subscription.cancel_at_period_end
    ? `Your subscription will remain active until ${subscription.current_period_end}.`
    : 'Your subscription has been cancelled immediately.'
}

We're sorry to see you go. If you change your mind, you can reactivate anytime.

Pulss Team
      `.trim();

      await this.queueNotification(
        subscription.tenant_id,
        null,
        'subscription_cancelled',
        subscription.billing_email,
        subject,
        body
      );

      const emailResult = await this.sendEmail(subscription.billing_email, subject, body, subscription.tenant_id);

      if (emailResult.success) {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, sent_at = NOW() 
           WHERE tenant_id = $2 AND notification_type = $3 AND status = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['sent', subscription.tenant_id, 'subscription_cancelled', 'pending']
        );
        return { success: true, messageId: emailResult.messageId };
      } else {
        await db.query(
          `UPDATE billing_notifications 
           SET status = $1, failure_reason = $2
           WHERE tenant_id = $3 AND notification_type = $4 AND status = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['failed', emailResult.error, subscription.tenant_id, 'subscription_cancelled', 'pending']
        );
        return emailResult;
      }
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and email service configuration'
      };
    }
  }

  /**
   * Process pending notifications (can be called by a cron job)
   */
  async processPendingNotifications(limit = 10) {
    try {
      const result = await db.query(
        `SELECT * FROM billing_notifications 
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT $1`,
        [limit]
      );

      const notifications = result.rows;
      const processed = [];
      const failed = [];

      for (const notification of notifications) {
        try {
          const emailResult = await this.sendEmail(
            notification.recipient_email,
            notification.subject,
            notification.body,
            notification.tenant_id
          );

          if (emailResult.success) {
            await db.query(
              'UPDATE billing_notifications SET status = $1, sent_at = NOW() WHERE notification_id = $2',
              ['sent', notification.notification_id]
            );
            processed.push(notification.notification_id);
          } else {
            throw new Error(emailResult.error || 'Email sending failed');
          }
        } catch (error) {
          console.error(`Failed to send notification ${notification.notification_id}:`, error);

          await db.query(
            'UPDATE billing_notifications SET status = $1, failure_reason = $2, updated_at = NOW() WHERE notification_id = $3',
            ['failed', error.message, notification.notification_id]
          );
          failed.push({ id: notification.notification_id, error: error.message });
        }
      }

      return { 
        success: true, 
        processed: processed.length,
        failed: failed.length,
        details: { processed, failed }
      };
    } catch (error) {
      console.error('Error processing pending notifications:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and ensure billing_notifications table exists'
      };
    }
  }
}

module.exports = new BillingNotificationService();
