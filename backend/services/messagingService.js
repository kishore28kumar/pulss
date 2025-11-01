/**
 * Messaging Service
 * Handles SMS and WhatsApp messaging via Twilio and WhatsApp Business API
 */

const db = require('../config/db');

class MessagingService {
  constructor() {
    // Twilio configuration
    this.twilioEnabled = process.env.TWILIO_ENABLED === 'true';
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    // WhatsApp Business API configuration
    this.whatsappEnabled = process.env.WHATSAPP_BUSINESS_ENABLED === 'true';
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL;
    this.whatsappApiKey = process.env.WHATSAPP_API_KEY;
    this.whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(phoneNumber, message) {
    if (!this.twilioEnabled) {
      console.log('Twilio SMS not enabled, skipping');
      return { success: false, reason: 'Twilio not enabled' };
    }

    try {
      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: this.twilioPhoneNumber,
            Body: message,
          }),
        }
      );

      const result = await response.json();
      
      // Log the message
      await this.logMessage({
        type: 'sms',
        phoneNumber,
        message,
        status: response.ok ? 'sent' : 'failed',
        provider: 'twilio',
        providerId: result.sid,
      });

      return { success: response.ok, result };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message via Twilio
   */
  async sendWhatsAppViaTwilio(phoneNumber, message) {
    if (!this.twilioEnabled || !this.twilioWhatsAppNumber) {
      console.log('Twilio WhatsApp not enabled, skipping');
      return { success: false, reason: 'Twilio WhatsApp not enabled' };
    }

    try {
      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: `whatsapp:${phoneNumber}`,
            From: `whatsapp:${this.twilioWhatsAppNumber}`,
            Body: message,
          }),
        }
      );

      const result = await response.json();
      
      await this.logMessage({
        type: 'whatsapp',
        phoneNumber,
        message,
        status: response.ok ? 'sent' : 'failed',
        provider: 'twilio',
        providerId: result.sid,
      });

      return { success: response.ok, result };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message via WhatsApp Business API
   */
  async sendWhatsAppViaBusinessAPI(phoneNumber, message, templateName = null) {
    if (!this.whatsappEnabled) {
      console.log('WhatsApp Business API not enabled, skipping');
      return { success: false, reason: 'WhatsApp Business API not enabled' };
    }

    try {
      const payload = templateName
        ? {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: { body: message },
          };

      const response = await fetch(
        `${this.whatsappApiUrl}/${this.whatsappPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.whatsappApiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      
      await this.logMessage({
        type: 'whatsapp',
        phoneNumber,
        message,
        status: response.ok ? 'sent' : 'failed',
        provider: 'whatsapp_business',
        providerId: result.messages?.[0]?.id,
      });

      return { success: response.ok, result };
    } catch (error) {
      console.error('WhatsApp Business API error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message (auto-select provider)
   */
  async sendWhatsApp(phoneNumber, message, templateName = null) {
    // Prefer WhatsApp Business API over Twilio
    if (this.whatsappEnabled) {
      return this.sendWhatsAppViaBusinessAPI(phoneNumber, message, templateName);
    } else if (this.twilioEnabled) {
      return this.sendWhatsAppViaTwilio(phoneNumber, message);
    } else {
      return { success: false, reason: 'No WhatsApp provider enabled' };
    }
  }

  /**
   * Log message to database
   */
  async logMessage(messageData) {
    try {
      await db.query(
        `INSERT INTO message_logs (type, phone_number, message, status, provider, provider_id, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          messageData.type,
          messageData.phoneNumber,
          messageData.message,
          messageData.status,
          messageData.provider,
          messageData.providerId,
        ]
      );
    } catch (error) {
      console.error('Log message error:', error);
    }
  }

  /**
   * Send order confirmation via SMS/WhatsApp
   */
  async sendOrderConfirmation(orderId, phoneNumber, customerName, preferredMethod = 'whatsapp') {
    const message = `Hi ${customerName},\n\nYour order #${orderId} has been confirmed! We'll notify you when it's ready.\n\nThank you for shopping with us!`;

    if (preferredMethod === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message, 'order_confirmation');
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send order status update via SMS/WhatsApp
   */
  async sendOrderStatusUpdate(orderId, phoneNumber, status, preferredMethod = 'whatsapp') {
    const statusMessages = {
      pending: 'Your order is being processed.',
      confirmed: 'Your order has been confirmed.',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready for pickup/delivery!',
      out_for_delivery: 'Your order is out for delivery.',
      delivered: 'Your order has been delivered. Thank you!',
      cancelled: 'Your order has been cancelled.',
    };

    const message = `Order #${orderId} Update:\n\n${statusMessages[status] || 'Status updated.'}`;

    if (preferredMethod === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send delivery tracking link via SMS/WhatsApp
   */
  async sendTrackingLink(orderId, phoneNumber, trackingUrl, preferredMethod = 'whatsapp') {
    const message = `Track your order #${orderId}:\n${trackingUrl}`;

    if (preferredMethod === 'whatsapp') {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  /**
   * Send admin broadcast message
   */
  async sendBroadcastMessage(tenantId, message, phoneNumbers, preferredMethod = 'whatsapp') {
    const results = [];

    for (const phoneNumber of phoneNumbers) {
      const result = preferredMethod === 'whatsapp'
        ? await this.sendWhatsApp(phoneNumber, message)
        : await this.sendSMS(phoneNumber, message);
      
      results.push({ phoneNumber, ...result });
    }

    return { success: true, results };
  }
}

module.exports = new MessagingService();
