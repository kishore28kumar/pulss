# Email Service Usage Examples

This document provides practical examples of how to use the email service in different scenarios.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Password Reset Flow](#password-reset-flow)
3. [User Registration Flow](#user-registration-flow)
4. [Team Invitations](#team-invitations)
5. [Custom Emails](#custom-emails)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Basic Setup

### Environment Configuration

Create or update your `.env` file:

```env
# Email Service Configuration
EMAIL_PROVIDER=nodemailer
EMAIL_FROM=noreply@pulss.app

# For Development (using SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# For Production (using SendGrid)
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.your_api_key_here
```

### Import the Service

```javascript
const emailService = require('./services/emailService');
```

---

## Password Reset Flow

### Complete Implementation

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('./config/db');
const emailService = require('./services/emailService');

// Step 1: User requests password reset
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const user = result.rows[0];

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store token in database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Generate reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const emailResult = await emailService.sendPasswordResetEmail(
      email,
      resetToken,
      resetUrl
    );

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return res.status(500).json({
        error: 'Failed to send password reset email. Please try again.',
      });
    }

    res.json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Step 2: User confirms password reset
router.post('/confirm-password-reset', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Validate inputs
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        error: 'Email, token, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // Find user with valid token
    const result = await pool.query(
      `SELECT id, email, reset_token, reset_token_expiry 
       FROM users 
       WHERE email = $1 
         AND is_active = true 
         AND reset_token IS NOT NULL 
         AND reset_token_expiry > NOW()`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }

    const user = result.rows[0];

    // Verify token
    const validToken = await bcrypt.compare(token, user.reset_token);
    if (!validToken) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
```

---

## User Registration Flow

### Send Welcome Email on Registration

```javascript
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate inputs
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    const user = result.rows[0];

    // Send welcome email (don't block response)
    emailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    });

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

## Team Invitations

### Send Team Invitation Email

```javascript
router.post('/invite-team-member', async (req, res) => {
  try {
    const { email, role } = req.body;
    const inviter = req.user; // From auth middleware

    // Validate inputs
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = await bcrypt.hash(inviteToken, 10);
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 3600000); // 7 days

    // Store invitation
    await pool.query(
      'INSERT INTO invitations (email, role, invited_by, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [email, role, inviter.id, inviteTokenHash, inviteExpiry]
    );

    // Generate invitation URL
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}`;

    // Send invitation email
    const emailResult = await emailService.sendInviteEmail(
      email,
      inviter.name,
      inviteUrl
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation:', emailResult.error);
      return res.status(500).json({
        error: 'Failed to send invitation email',
      });
    }

    res.json({
      message: 'Invitation sent successfully',
      inviteUrl,
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});
```

---

## Custom Emails

### Send Order Confirmation Email

```javascript
async function sendOrderConfirmation(order) {
  const subject = `Order Confirmation #${order.id}`;

  const text = `
Thank you for your order!

Order ID: ${order.id}
Total: $${order.total}
Status: ${order.status}

View your order: ${process.env.FRONTEND_URL}/orders/${order.id}

Best regards,
The Pulss Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .order-details { background: #f9fafb; padding: 20px; border-radius: 5px; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background: #4F46E5; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Thank you for your order!</h1>
    <div class="order-details">
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total:</strong> $${order.total}</p>
      <p><strong>Status:</strong> ${order.status}</p>
    </div>
    <p>
      <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">
        View Order
      </a>
    </p>
    <p>Best regards,<br>The Pulss Team</p>
  </div>
</body>
</html>
  `.trim();

  return await emailService.sendEmail({
    to: order.customerEmail,
    subject,
    text,
    html,
  });
}

// Usage
router.post('/orders', async (req, res) => {
  try {
    // Create order...
    const order = await createOrder(req.body);

    // Send confirmation email (don't block response)
    sendOrderConfirmation(order).catch((error) => {
      console.error('Failed to send order confirmation:', error);
    });

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

---

## Error Handling

### Best Practices for Error Handling

```javascript
// 1. Log errors but don't expose details to users
async function sendEmailWithErrorHandling(emailOptions) {
  try {
    const result = await emailService.sendEmail(emailOptions);

    if (!result.success) {
      // Log the error
      console.error('Email send failed:', {
        to: emailOptions.to,
        error: result.error,
        provider: result.provider,
        timestamp: new Date().toISOString(),
      });

      // Return user-friendly error
      return {
        success: false,
        message: 'Failed to send email. Please try again later.',
      };
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      message: 'Email service temporarily unavailable',
    };
  }
}

// 2. Implement retry logic for critical emails
async function sendEmailWithRetry(emailOptions, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailService.sendEmail(emailOptions);

      if (result.success) {
        return result;
      }

      // If not last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  return { success: false, error: 'Max retry attempts reached' };
}

// 3. Queue emails for background processing
const emailQueue = [];

async function queueEmail(emailOptions) {
  emailQueue.push({
    options: emailOptions,
    attempts: 0,
    createdAt: new Date(),
  });
}

async function processEmailQueue() {
  while (emailQueue.length > 0) {
    const item = emailQueue.shift();

    try {
      const result = await emailService.sendEmail(item.options);

      if (!result.success && item.attempts < 3) {
        // Re-queue failed emails
        emailQueue.push({ ...item, attempts: item.attempts + 1 });
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    }

    // Wait between emails to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Start queue processor
setInterval(processEmailQueue, 5000); // Process every 5 seconds
```

---

## Testing

### Unit Test Example

```javascript
// __tests__/emailService.test.js
const emailService = require('../services/emailService');

describe('Email Service', () => {
  beforeAll(() => {
    // Set up test environment
    process.env.EMAIL_PROVIDER = 'nodemailer';
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_PORT = '1025';
  });

  test('should send password reset email', async () => {
    const result = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-token',
      'http://localhost:5173/reset'
    );

    expect(result).toBeDefined();
    expect(result.provider).toBe('nodemailer');
  });

  test('should send welcome email', async () => {
    const result = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User'
    );

    expect(result).toBeDefined();
    expect(result.provider).toBe('nodemailer');
  });
});
```

### Integration Test with Mailhog

```bash
# 1. Start Mailhog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# 2. Configure .env.test
echo "EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=" > .env.test

# 3. Run tests
npm test

# 4. View sent emails at http://localhost:8025
```

### Manual Testing Script

```javascript
// scripts/test-email.js
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmails() {
  console.log('Testing email service...\n');

  // Test password reset
  console.log('1. Testing password reset email...');
  const resetResult = await emailService.sendPasswordResetEmail(
    'test@example.com',
    'test-token-123',
    'http://localhost:5173/reset-password?token=test-token-123'
  );
  console.log('Result:', resetResult.success ? '✓' : '✗');

  // Test welcome email
  console.log('\n2. Testing welcome email...');
  const welcomeResult = await emailService.sendWelcomeEmail(
    'test@example.com',
    'Test User'
  );
  console.log('Result:', welcomeResult.success ? '✓' : '✗');

  // Test invite email
  console.log('\n3. Testing invite email...');
  const inviteResult = await emailService.sendInviteEmail(
    'test@example.com',
    'Admin User',
    'http://localhost:5173/invite?token=invite-token-123'
  );
  console.log('Result:', inviteResult.success ? '✓' : '✗');

  console.log('\nTests complete!');
  process.exit(0);
}

testEmails();
```

Run with:

```bash
node scripts/test-email.js
```

---

## More Examples

For more examples and detailed guides, see:

- [EMAIL_PROVIDERS_GUIDE.md](./EMAIL_PROVIDERS_GUIDE.md) - How to add new providers
- [README.md](./README.md) - Service overview
- Backend controllers for real-world usage

---

**Last Updated**: 2025-10-20
