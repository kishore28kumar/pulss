# Advanced Notifications System - Developer Extension Guide

## Overview

This guide helps developers extend the Advanced Notifications System with new features, channels, templates, and integrations.

## Table of Contents

1. [Adding New Notification Channels](#adding-new-notification-channels)
2. [Creating Custom Template Variables](#creating-custom-template-variables)
3. [Extending Campaign Types](#extending-campaign-types)
4. [Adding New Analytics Metrics](#adding-new-analytics-metrics)
5. [Integrating with External Services](#integrating-with-external-services)
6. [Adding Feature Toggles](#adding-feature-toggles)
7. [Custom Event Triggers](#custom-event-triggers)
8. [Testing Guidelines](#testing-guidelines)

---

## Adding New Notification Channels

### Step 1: Define Channel Interface

Create a new channel delivery class:

```javascript
// backend/services/channels/TelegramChannel.js

class TelegramChannel {
  constructor(config) {
    this.botToken = config.botToken;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send notification via Telegram
   * @param {Object} notification - Notification object
   * @returns {Promise<Object>} Delivery result
   */
  async send(notification) {
    try {
      const chatId = notification.recipient_phone; // Or telegram user ID
      const message = this.formatMessage(notification);

      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
        deliveryStatus: 'sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        deliveryStatus: 'failed'
      };
    }
  }

  /**
   * Format notification for Telegram
   */
  formatMessage(notification) {
    let message = `<b>${notification.title}</b>\n\n`;
    message += notification.message;
    if (notification.action_url) {
      message += `\n\n<a href="${notification.action_url}">View Details</a>`;
    }
    return message;
  }

  /**
   * Check delivery status
   */
  async checkStatus(messageId, chatId) {
    // Implement if Telegram API supports it
    return { delivered: true };
  }

  /**
   * Handle webhooks from Telegram
   */
  async handleWebhook(payload) {
    // Process delivery reports, read receipts, etc.
    return {
      notificationId: payload.notification_id,
      status: payload.status,
      timestamp: new Date(payload.timestamp * 1000)
    };
  }
}

module.exports = TelegramChannel;
```

### Step 2: Register Channel

Add to notification service:

```javascript
// backend/services/notificationService.js

const TelegramChannel = require('./channels/TelegramChannel');

class NotificationService {
  constructor() {
    this.channels = {
      push: new PushChannel(),
      sms: new SMSChannel(),
      email: new EmailChannel(),
      whatsapp: new WhatsAppChannel(),
      telegram: new TelegramChannel({
        botToken: process.env.TELEGRAM_BOT_TOKEN
      })
    };
  }

  async sendNotification(notification) {
    const channel = this.channels[notification.channel];
    if (!channel) {
      throw new Error(`Channel ${notification.channel} not supported`);
    }
    return await channel.send(notification);
  }
}
```

### Step 3: Update Database Schema

Add channel to allowed values:

```sql
-- Migration file: 12_add_telegram_channel.sql

-- Update notification_templates channels
ALTER TABLE notification_templates 
  DROP CONSTRAINT IF EXISTS notification_templates_channels_check;

-- Add telegram to allowed channels
-- (PostgreSQL array constraints are complex, use application validation)

-- Add feature toggle
ALTER TABLE notification_feature_toggles 
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN DEFAULT false;

-- Add to notification preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false;
```

### Step 4: Add API Endpoints

```javascript
// backend/routes/advancedNotifications.js

// Test Telegram delivery
router.post(
  '/test/telegram',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { recipient, message } = req.body;
    
    const telegram = new TelegramChannel({
      botToken: process.env.TELEGRAM_BOT_TOKEN
    });

    const result = await telegram.send({
      recipient_phone: recipient,
      title: 'Test Message',
      message: message
    });

    res.json({ success: result.success, result });
  }
);
```

### Step 5: Add Feature Toggle UI

Update super admin panel to include toggle for Telegram channel.

---

## Creating Custom Template Variables

### Step 1: Define Variable Schema

```javascript
// backend/models/templateVariables.js

const STANDARD_VARIABLES = {
  // Customer variables
  customer_name: {
    type: 'string',
    description: 'Customer full name',
    example: 'John Doe',
    required: false
  },
  customer_email: {
    type: 'email',
    description: 'Customer email address',
    example: 'john@example.com',
    required: false
  },

  // Order variables
  order_number: {
    type: 'string',
    description: 'Order number',
    example: 'ORD-12345',
    required: true
  },
  order_total: {
    type: 'currency',
    description: 'Order total amount',
    example: '₹1,999.00',
    formatter: (value, currency = 'INR') => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
      }).format(value);
    }
  },

  // Custom business variables
  loyalty_points: {
    type: 'number',
    description: 'Customer loyalty points',
    example: '500',
    formatter: (value) => value.toLocaleString()
  }
};

module.exports = { STANDARD_VARIABLES };
```

### Step 2: Create Variable Renderer

```javascript
// backend/utils/templateRenderer.js

class TemplateRenderer {
  /**
   * Render template with variables
   */
  static render(template, variables) {
    let rendered = template;

    // Replace all #{variable} patterns
    const variablePattern = /#\{([a-zA-Z0-9_]+)\}/g;
    
    rendered = rendered.replace(variablePattern, (match, varName) => {
      const value = variables[varName];
      
      if (value === undefined || value === null) {
        console.warn(`Variable ${varName} not provided`);
        return match; // Keep original if not found
      }

      // Get variable definition
      const varDef = STANDARD_VARIABLES[varName];
      
      // Apply formatter if available
      if (varDef && varDef.formatter) {
        return varDef.formatter(value, variables.currency);
      }

      return value;
    });

    return rendered;
  }

  /**
   * Validate required variables
   */
  static validate(template, variables) {
    const variablePattern = /#\{([a-zA-Z0-9_]+)\}/g;
    const matches = template.matchAll(variablePattern);
    const errors = [];

    for (const match of matches) {
      const varName = match[1];
      const varDef = STANDARD_VARIABLES[varName];

      if (varDef && varDef.required && !variables[varName]) {
        errors.push(`Required variable '${varName}' is missing`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Extract variables from template
   */
  static extractVariables(template) {
    const variablePattern = /#\{([a-zA-Z0-9_]+)\}/g;
    const matches = template.matchAll(variablePattern);
    const variables = [];

    for (const match of matches) {
      const varName = match[1];
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }
}

module.exports = TemplateRenderer;
```

### Step 3: Use in Notification Sending

```javascript
// Example usage
const template = await getTemplate(templateId);
const variables = {
  customer_name: 'Jane Doe',
  order_number: 'ORD-67890',
  order_total: 2499.99,
  currency: 'INR',
  loyalty_points: 1250
};

// Validate
const validation = TemplateRenderer.validate(
  template.body_template,
  variables
);

if (!validation.valid) {
  throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
}

// Render
const renderedMessage = TemplateRenderer.render(
  template.body_template,
  variables
);
```

---

## Extending Campaign Types

### Step 1: Define New Campaign Type

```javascript
// backend/services/campaigns/BirthdayCampaign.js

class BirthdayCampaign {
  /**
   * Get recipients for birthday campaign
   */
  async getRecipients(config) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const result = await db.query(
      `SELECT id, email, full_name, phone, birth_date
       FROM customers
       WHERE EXTRACT(MONTH FROM birth_date) = $1
         AND EXTRACT(DAY FROM birth_date) = $2
         AND tenant_id = $3`,
      [month, day, config.tenantId]
    );

    return result.rows;
  }

  /**
   * Prepare notification for each recipient
   */
  prepareNotification(recipient, template, config) {
    // Calculate age
    const birthDate = new Date(recipient.birth_date);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    return {
      user_id: recipient.id,
      recipient_email: recipient.email,
      recipient_phone: recipient.phone,
      template_id: template.id,
      template_variables: {
        customer_name: recipient.full_name,
        age: age,
        discount_code: this.generateBirthdayCode(recipient.id),
        store_name: config.storeName
      }
    };
  }

  /**
   * Generate birthday discount code
   */
  generateBirthdayCode(customerId) {
    return `BDAY${customerId.substring(0, 8).toUpperCase()}`;
  }
}

module.exports = BirthdayCampaign;
```

### Step 2: Register Campaign Type

```javascript
// backend/services/campaignService.js

const BirthdayCampaign = require('./campaigns/BirthdayCampaign');

class CampaignService {
  constructor() {
    this.campaignTypes = {
      one_time: new OneTimeCampaign(),
      recurring: new RecurringCampaign(),
      triggered: new TriggeredCampaign(),
      drip: new DripCampaign(),
      birthday: new BirthdayCampaign()
    };
  }

  async processCampaign(campaign) {
    const handler = this.campaignTypes[campaign.campaign_type];
    if (!handler) {
      throw new Error(`Campaign type ${campaign.campaign_type} not supported`);
    }

    // Get recipients
    const recipients = await handler.getRecipients(campaign);

    // Get template
    const template = await this.getTemplate(campaign.template_id);

    // Process each recipient
    for (const recipient of recipients) {
      const notification = handler.prepareNotification(
        recipient,
        template,
        campaign
      );

      await this.queueNotification(notification);
    }

    // Update campaign stats
    await this.updateCampaignStats(campaign.id, recipients.length);
  }
}
```

### Step 3: Schedule Campaign

```javascript
// Setup cron job for birthday campaigns
const cron = require('node-cron');

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Processing birthday campaigns...');
  
  const campaigns = await db.query(
    `SELECT * FROM notification_campaigns
     WHERE campaign_type = 'birthday'
       AND status = 'active'`
  );

  for (const campaign of campaigns.rows) {
    await campaignService.processCampaign(campaign);
  }
});
```

---

## Adding New Analytics Metrics

### Step 1: Define Metric

```javascript
// backend/services/analytics/EngagementMetrics.js

class EngagementMetrics {
  /**
   * Calculate engagement score
   */
  async calculateEngagementScore(tenantId, dateRange) {
    const metrics = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE metric_type = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE metric_type = 'opened') as opened,
        COUNT(*) FILTER (WHERE metric_type = 'clicked') as clicked,
        COUNT(*) FILTER (WHERE metric_type = 'converted') as converted
       FROM notification_analytics
       WHERE tenant_id = $1
         AND recorded_at BETWEEN $2 AND $3`,
      [tenantId, dateRange.start, dateRange.end]
    );

    const row = metrics.rows[0];
    
    // Weighted engagement score
    const score = (
      (row.delivered * 1) +
      (row.opened * 2) +
      (row.clicked * 5) +
      (row.converted * 10)
    ) / row.delivered;

    return {
      score: score.toFixed(2),
      breakdown: {
        delivered: parseInt(row.delivered),
        opened: parseInt(row.opened),
        clicked: parseInt(row.clicked),
        converted: parseInt(row.converted)
      }
    };
  }

  /**
   * Track conversion
   */
  async trackConversion(notificationId, metadata) {
    await db.query(
      `INSERT INTO notification_analytics (
        notification_id, 
        metric_type, 
        metric_value,
        metadata,
        tenant_id
      )
      SELECT 
        $1,
        'converted',
        1,
        $2,
        tenant_id
      FROM notifications
      WHERE id = $1`,
      [notificationId, JSON.stringify(metadata)]
    );
  }
}
```

### Step 2: Add API Endpoint

```javascript
// backend/routes/advancedNotifications.js

router.get(
  '/tenants/:tenantId/analytics/engagement',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = new EngagementMetrics();
    const score = await metrics.calculateEngagementScore(tenantId, {
      start: startDate,
      end: endDate
    });

    res.json({
      success: true,
      data: score
    });
  }
);
```

---

## Integrating with External Services

### Example: Webhook Integration

```javascript
// backend/services/webhooks/WebhookService.js

class WebhookService {
  /**
   * Send webhook for notification event
   */
  async sendWebhook(event, payload) {
    // Get tenant webhook configuration
    const config = await db.query(
      `SELECT webhook_url, webhook_secret
       FROM notification_feature_toggles
       WHERE tenant_id = $1
         AND webhook_enabled = true`,
      [payload.tenant_id]
    );

    if (config.rows.length === 0) {
      return; // Webhooks not enabled
    }

    const { webhook_url, webhook_secret } = config.rows[0];

    // Create signature
    const signature = this.generateSignature(payload, webhook_secret);

    try {
      await axios.post(webhook_url, {
        event: event,
        timestamp: new Date().toISOString(),
        data: payload
      }, {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        }
      });

      console.log(`Webhook sent for event: ${event}`);
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      // Log webhook failure for retry
      await this.logWebhookFailure(event, payload, error);
    }
  }

  /**
   * Generate HMAC signature
   */
  generateSignature(payload, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
```

---

## Adding Feature Toggles

### Step 1: Add to Database Schema

```sql
-- Migration: 13_add_new_feature_toggle.sql

ALTER TABLE notification_feature_toggles
  ADD COLUMN IF NOT EXISTS ai_powered_send_time_optimization BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS predictive_engagement_scoring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sentiment_analysis_enabled BOOLEAN DEFAULT false;
```

### Step 2: Update Controller

```javascript
// backend/controllers/notificationFeatureTogglesController.js

// Add new fields to allowedFields array
const allowedFields = [
  // ... existing fields ...
  'ai_powered_send_time_optimization',
  'predictive_engagement_scoring',
  'sentiment_analysis_enabled'
];
```

### Step 3: Enforce in Code

```javascript
// Check before using feature
async function optimizeSendTime(notification) {
  const toggles = await getFeatureToggles(notification.tenant_id);
  
  if (!toggles.ai_powered_send_time_optimization) {
    // Use default send time
    return notification.scheduled_at || new Date();
  }

  // Use AI to optimize send time
  return await aiService.predictBestSendTime(notification);
}
```

---

## Custom Event Triggers

### Step 1: Define Event Schema

```javascript
// backend/events/notificationEvents.js

const EventEmitter = require('events');

class NotificationEvents extends EventEmitter {
  // Event types
  static EVENTS = {
    ORDER_CREATED: 'order.created',
    PAYMENT_RECEIVED: 'payment.received',
    DELIVERY_STARTED: 'delivery.started',
    CART_ABANDONED: 'cart.abandoned',
    PRODUCT_BACK_IN_STOCK: 'product.back_in_stock',
    PRICE_DROP: 'product.price_drop'
  };

  /**
   * Emit notification event
   */
  emit(eventType, data) {
    console.log(`Event triggered: ${eventType}`);
    super.emit(eventType, data);
  }
}

const notificationEvents = new NotificationEvents();
module.exports = notificationEvents;
```

### Step 2: Listen for Events

```javascript
// backend/services/eventTriggerService.js

const notificationEvents = require('../events/notificationEvents');

class EventTriggerService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    // Listen for cart abandonment
    notificationEvents.on(
      NotificationEvents.EVENTS.CART_ABANDONED,
      async (data) => {
        await this.handleCartAbandoned(data);
      }
    );

    // Listen for price drops
    notificationEvents.on(
      NotificationEvents.EVENTS.PRICE_DROP,
      async (data) => {
        await this.handlePriceDrop(data);
      }
    );
  }

  async handleCartAbandoned(data) {
    // Find triggered campaigns
    const campaigns = await db.query(
      `SELECT * FROM notification_campaigns
       WHERE trigger_event = $1
         AND status = 'active'
         AND tenant_id = $2`,
      [NotificationEvents.EVENTS.CART_ABANDONED, data.tenant_id]
    );

    for (const campaign of campaigns.rows) {
      await this.processCampaign(campaign, data);
    }
  }
}
```

### Step 3: Trigger from Code

```javascript
// In your application code
const notificationEvents = require('./events/notificationEvents');

// When cart is abandoned
setTimeout(() => {
  notificationEvents.emit(
    NotificationEvents.EVENTS.CART_ABANDONED,
    {
      tenant_id: 'uuid',
      customer_id: 'uuid',
      cart_id: 'uuid',
      cart_value: 1999.99,
      items: [/* ... */]
    }
  );
}, 30 * 60 * 1000); // 30 minutes
```

---

## Testing Guidelines

### Unit Tests

```javascript
// tests/services/templateRenderer.test.js

const TemplateRenderer = require('../../utils/templateRenderer');

describe('TemplateRenderer', () => {
  describe('render', () => {
    it('should replace variables correctly', () => {
      const template = 'Hello #{customer_name}, your order #{order_number} is ready!';
      const variables = {
        customer_name: 'John Doe',
        order_number: 'ORD-123'
      };

      const result = TemplateRenderer.render(template, variables);
      
      expect(result).toBe('Hello John Doe, your order ORD-123 is ready!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello #{customer_name}';
      const variables = {};

      const result = TemplateRenderer.render(template, variables);
      
      expect(result).toBe('Hello #{customer_name}');
    });

    it('should apply formatters', () => {
      const template = 'Total: #{order_total}';
      const variables = {
        order_total: 1999.99,
        currency: 'INR'
      };

      const result = TemplateRenderer.render(template, variables);
      
      expect(result).toContain('₹');
      expect(result).toContain('1,999');
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/campaigns.test.js

const request = require('supertest');
const app = require('../../app');

describe('Campaign API', () => {
  let authToken;
  let tenantId;

  beforeAll(async () => {
    // Setup: Create test tenant and get auth token
    authToken = await getTestAuthToken();
    tenantId = await createTestTenant();
  });

  describe('POST /api/advanced-notifications/tenants/:tenantId/campaigns', () => {
    it('should create a campaign', async () => {
      const response = await request(app)
        .post(`/api/advanced-notifications/tenants/${tenantId}/campaigns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Campaign',
          campaign_type: 'one_time',
          target_type: 'all',
          template_id: 'uuid',
          channels: ['email'],
          schedule_type: 'immediate'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should reject campaign if feature disabled', async () => {
      // Disable campaigns for tenant
      await disableCampaignsForTenant(tenantId);

      const response = await request(app)
        .post(`/api/advanced-notifications/tenants/${tenantId}/campaigns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({/* ... */});

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not enabled');
    });
  });
});
```

### Load Tests

```javascript
// tests/load/notifications.load.js

const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/notifications',
    connections: 100,
    duration: 60,
    headers: {
      'Authorization': 'Bearer test_token'
    }
  });

  console.log(autocannon.printResult(result));
}

runLoadTest();
```

---

## Best Practices

### 1. Error Handling

Always wrap operations in try-catch:

```javascript
exports.sendNotification = async (req, res) => {
  try {
    // Your logic
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      // Include error details in development only
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
```

### 2. Input Validation

Use validation library:

```javascript
const Joi = require('joi');

const campaignSchema = Joi.object({
  name: Joi.string().required().max(255),
  campaign_type: Joi.string().valid('one_time', 'recurring', 'triggered'),
  channels: Joi.array().items(
    Joi.string().valid('push', 'sms', 'email', 'whatsapp', 'in_app')
  ).min(1)
});

// In controller
const { error, value } = campaignSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### 3. Database Transactions

Use transactions for multi-step operations:

```javascript
const client = await db.getClient();
try {
  await client.query('BEGIN');

  // Create campaign
  const campaign = await client.query(
    'INSERT INTO notification_campaigns (...) VALUES (...)',
    [...]
  );

  // Create notifications
  await client.query(
    'INSERT INTO notifications (...) VALUES (...)',
    [...]
  );

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 4. Caching

Cache frequently accessed data:

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getFeatureToggles(tenantId) {
  const cacheKey = `toggles:${tenantId}`;
  
  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const result = await db.query(
    'SELECT * FROM notification_feature_toggles WHERE tenant_id = $1',
    [tenantId]
  );

  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(result.rows[0]));

  return result.rows[0];
}
```

### 5. Logging

Use structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// In code
logger.info('Campaign created', {
  campaignId: campaign.id,
  tenantId: campaign.tenant_id,
  userId: req.user.id
});

logger.error('Notification delivery failed', {
  notificationId: notification.id,
  channel: notification.channel,
  error: error.message
});
```

---

## Deployment Checklist

- [ ] Run migrations on production database
- [ ] Update environment variables
- [ ] Test all endpoints with Postman/curl
- [ ] Verify feature toggles work correctly
- [ ] Check monitoring and alerting
- [ ] Update API documentation
- [ ] Notify stakeholders of new features
- [ ] Monitor error logs for first 24 hours

---

## Support

For questions or issues with extending the notification system:
- Email: dev-support@pulss.app
- Slack: #notifications-dev
- Documentation: https://docs.pulss.app/dev/notifications

---

## Changelog

### v1.0.0 (January 2025)
- Initial release
- Core notification system
- Multi-channel support
- Campaign management
- Feature toggles
- Analytics

### Future Roadmap
- AI-powered send time optimization
- Predictive engagement scoring
- A/B testing framework
- Advanced personalization
- Multi-language templates
