# Email Service Provider Guide

## Overview

The Pulss platform uses a flexible email service abstraction that supports multiple email providers. This guide explains how to configure existing providers and extend the system to support additional ones.

## Supported Providers

### 1. Nodemailer (SMTP)

**Use Case:** Local development, testing, custom SMTP servers, Gmail, Outlook, etc.

**Configuration:**

```env
EMAIL_PROVIDER=nodemailer
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASS=your_password
```

**Common SMTP Configurations:**

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

_Note: You need to generate an App Password from Google Account settings_

#### Outlook/Office 365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=admin@yourdomain.com
SMTP_PASS=your-secure-password
```

### 2. SendGrid

**Use Case:** Production email delivery with high reliability and advanced analytics.

**Configuration:**

```env
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Getting Started:**

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key in Settings → API Keys
3. Verify your sender domain in Settings → Sender Authentication
4. Add the API key to your `.env` file

**Features:**

- High deliverability rates
- Email analytics and tracking
- Template management
- Webhook support for events
- Bounce and spam management

## Extending to Other Providers

### Adding a New Provider (e.g., AWS SES)

#### Step 1: Install the Provider SDK

```bash
npm install @aws-sdk/client-ses --save
```

#### Step 2: Create the Provider Class

Add this to `backend/services/emailService.js`:

```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

/**
 * AWS SES Provider
 * Amazon Simple Email Service for scalable email delivery
 */
class SESProvider extends EmailProvider {
  constructor() {
    super();
    this.client = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(options) {
    try {
      const params = {
        Source: options.from || process.env.EMAIL_FROM || 'noreply@pulss.app',
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
          },
          Body: {
            Text: {
              Data: options.text,
            },
            Html: {
              Data: options.html,
            },
          },
        },
      };

      const command = new SendEmailCommand(params);
      const result = await this.client.send(command);

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'ses',
        details: result,
      };
    } catch (error) {
      console.error('AWS SES send error:', error);
      return {
        success: false,
        provider: 'ses',
        error: error.message,
      };
    }
  }
}
```

#### Step 3: Register the Provider

Update the `getProvider()` method in the `EmailService` class:

```javascript
getProvider() {
  const providerName = process.env.EMAIL_PROVIDER || 'nodemailer';

  switch (providerName.toLowerCase()) {
    case 'sendgrid':
      return new SendGridProvider();
    case 'ses':
      return new SESProvider();
    case 'nodemailer':
    default:
      return new NodemailerProvider();
  }
}
```

#### Step 4: Update Environment Configuration

Add to `backend/.env.example`:

```env
# AWS SES Configuration
# EMAIL_PROVIDER=ses
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### Step 5: Test Your Implementation

```javascript
// Test script example
const emailService = require('./services/emailService');

async function testEmail() {
  const result = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<p>This is a test email</p>',
  });

  console.log('Email sent:', result);
}

testEmail();
```

## Example: Adding Mailgun

### Installation

```bash
npm install mailgun.js form-data --save
```

### Implementation

```javascript
const formData = require('form-data');
const Mailgun = require('mailgun.js');

class MailgunProvider extends EmailProvider {
  constructor() {
    super();
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
    });
    this.domain = process.env.MAILGUN_DOMAIN;
  }

  async sendEmail(options) {
    try {
      const result = await this.client.messages.create(this.domain, {
        from: options.from || process.env.EMAIL_FROM || 'noreply@pulss.app',
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
        details: result,
      };
    } catch (error) {
      console.error('Mailgun send error:', error);
      return {
        success: false,
        provider: 'mailgun',
        error: error.message,
      };
    }
  }
}
```

### Environment Variables

```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_URL=https://api.mailgun.net
```

## Testing Email Providers

### Local Development with Mailhog

For local testing without sending real emails:

1. **Install Mailhog:**

```bash
# Using Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or download binary from https://github.com/mailhog/MailHog
```

2. **Configure Nodemailer:**

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

3. **Access Web UI:**
   Open http://localhost:8025 to view all sent emails.

### Using Ethereal Email (Online Test Service)

For temporary testing without installation:

```javascript
// Generate test account at https://ethereal.email/
const testAccount = await nodemailer.createTestAccount();

// Use these credentials:
SMTP_HOST = smtp.ethereal.email;
SMTP_PORT = 587;
SMTP_USER = test_account_username;
SMTP_PASS = test_account_password;
```

## Best Practices

### 1. Environment-Specific Configuration

**Development:**

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025
```

**Staging:**

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_test_api_key
```

**Production:**

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_production_api_key
```

### 2. Error Handling

Always handle email failures gracefully:

```javascript
const result = await emailService.sendEmail(options);
if (!result.success) {
  console.error('Email failed:', result.error);
  // Queue for retry or notify admin
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// In your controller
const rateLimit = require('express-rate-limit');

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
});

app.post('/api/auth/request-password-reset', emailLimiter, authController.requestPasswordReset);
```

### 4. Email Verification

For production, verify sender domains:

- **SendGrid:** Settings → Sender Authentication
- **AWS SES:** Verify email/domain in SES console
- **Mailgun:** Add and verify domain in Mailgun dashboard

### 5. Monitoring and Logging

Log email send attempts for debugging:

```javascript
async sendEmail(options) {
  console.log('Sending email:', {
    to: options.to,
    subject: options.subject,
    provider: this.provider,
    timestamp: new Date().toISOString(),
  });

  const result = await this.provider.sendEmail(options);

  if (!result.success) {
    console.error('Email send failed:', result);
  }

  return result;
}
```

## Security Considerations

1. **Never commit API keys** - Always use environment variables
2. **Use App Passwords** for Gmail instead of account passwords
3. **Implement rate limiting** to prevent email spam
4. **Validate email addresses** before sending
5. **Use TLS/SSL** for SMTP connections when possible
6. **Monitor bounce rates** and remove invalid addresses
7. **Implement DMARC, SPF, and DKIM** for better deliverability

## Troubleshooting

### Common Issues

**1. SMTP Connection Timeout**

- Check firewall settings
- Verify SMTP host and port
- Try different ports (587, 465, 25)

**2. Authentication Failed**

- Verify username and password
- For Gmail, use App Password
- Check if 2FA is enabled

**3. Emails Going to Spam**

- Set up SPF, DKIM, and DMARC records
- Use a verified sender domain
- Avoid spam trigger words in subject/body

**4. SendGrid API Errors**

- Verify API key is correct
- Check sender email is verified
- Review SendGrid dashboard for blocks

## Migration Guide

### From Direct SMTP to Email Service

**Before:**

```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  /* config */
});
await transporter.sendMail({
  /* options */
});
```

**After:**

```javascript
const emailService = require('./services/emailService');
await emailService.sendEmail({
  /* options */
});
```

### Switching Providers

No code changes needed! Just update environment variables:

```bash
# Switch from Nodemailer to SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key
```

## Support and Resources

- **Nodemailer:** https://nodemailer.com/
- **SendGrid:** https://docs.sendgrid.com/
- **AWS SES:** https://docs.aws.amazon.com/ses/
- **Mailgun:** https://documentation.mailgun.com/
- **Postmark:** https://postmarkapp.com/developer
- **Resend:** https://resend.com/docs

## Contributing

When adding a new provider:

1. Implement the `EmailProvider` interface
2. Add configuration to `.env.example`
3. Update this documentation
4. Add tests for the new provider
5. Submit a pull request

---

**Need help?** Open an issue on GitHub or contact the Pulss team.
