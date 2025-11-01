const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

// Helper: sign JWT
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register (admin/customer)
exports.register = async (req, res) => {
  try {
    const { email, password, role, tenant_id, name, full_name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role required.' });
    }
    if (!['super_admin', 'admin', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    // Validate tenant_id for non-super_admin roles
    if (role !== 'super_admin' && !tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required for admin and customer roles.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Insert into users table (SQLite dev database)
    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, tenant_id, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, email, hash, role, tenant_id || null]
    );
    
    const result = await pool.query(
      `SELECT id, email, role, tenant_id FROM users WHERE id = ?`,
      [userId]
    );

    const user = { ...result.rows[0], name: name || full_name || email.split('@')[0] };
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    let user = null;
    let userRole = null;

    // Try to find user in users table (for SQLite dev database)
    const userResult = await pool.query(
      `SELECT id, email, password_hash, role, tenant_id, is_active, two_factor_secret, two_factor_enabled 
             FROM users WHERE email = ? AND is_active = 1`,
      [email]
    );

    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
      userRole = user.role;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      if (!twoFactorToken) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Two-factor authentication required.',
        });
      }

      // Verify 2FA token
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid two-factor authentication token.' });
      }
    }

    // Generate token with tenant_id
    const tokenUser = {
      id: user.id,
      email: user.email,
      role: userRole,
      tenant_id: user.tenant_id,
    };

    const token = signToken(tokenUser);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        tenant_id: user.tenant_id,
        name: user.full_name || user.name || email.split('@')[0],
        two_factor_enabled: user.two_factor_enabled || false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

// Get current user (from JWT)
exports.getCurrentUser = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user: req.user });
};

// Password reset request
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if user exists
    const result = await pool.query(
      `SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE`,
      [email]
    );

    // Always return success message to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the reset token in the database
    await pool.query(`UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`, [
      resetTokenHash,
      resetTokenExpiry,
      user.id,
    ]);

    // Generate password reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res
        .status(500)
        .json({ error: 'Failed to send password reset email. Please try again later.' });
    }

    res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// Password reset confirmation
exports.confirmPasswordReset = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Find user with valid reset token
    const result = await pool.query(
      `SELECT id, email, reset_token, reset_token_expiry FROM users 
             WHERE email = $1 AND is_active = TRUE AND reset_token IS NOT NULL AND reset_token_expiry > NOW()`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const user = result.rows[0];

    // Verify the reset token
    const validToken = await bcrypt.compare(token, user.reset_token);
    if (!validToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update the password and clear the reset token
    await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

// Enable Two-Factor Authentication
exports.enable2FA = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const userId = req.user.id;
    const email = req.user.email;

    // Generate a secret for the user
    const secret = speakeasy.generateSecret({
      name: `Pulss (${email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (not enabled yet) in users table
    await pool.query(`UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?`, [
      secret.base32,
      userId,
    ]);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message:
        'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and verify to enable 2FA.',
    });
  } catch (err) {
    console.error('Enable 2FA error:', err);
    res.status(500).json({ error: 'Failed to enable two-factor authentication.' });
  }
};

// Verify and activate Two-Factor Authentication
exports.verify2FA = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const userId = req.user.id;

    // Get the user's secret from users table
    const result = await pool.query(`SELECT two_factor_secret FROM users WHERE id = ?`, [userId]);

    if (result.rows.length === 0 || !result.rows[0].two_factor_secret) {
      return res.status(400).json({ error: 'Two-factor authentication not initiated.' });
    }

    const secret = result.rows[0].two_factor_secret;

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification token.' });
    }

    // Enable 2FA
    await pool.query(`UPDATE users SET two_factor_enabled = 1 WHERE id = ?`, [userId]);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Store backup codes (hashed)
    const hashedCodes = await Promise.all(backupCodes.map((code) => bcrypt.hash(code, 10)));
    await pool.query(`UPDATE users SET two_factor_backup_codes = ? WHERE id = ?`, [
      JSON.stringify(hashedCodes),
      userId,
    ]);

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully.',
      backupCodes: backupCodes,
      warning: 'Save these backup codes in a secure location. Each can only be used once.',
    });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ error: 'Failed to verify two-factor authentication.' });
  }
};

// Disable Two-Factor Authentication
exports.disable2FA = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable 2FA.' });
    }

    const userId = req.user.id;

    // Verify password from users table
    const result = await pool.query(`SELECT password_hash FROM users WHERE id = ?`, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Disable 2FA
    await pool.query(
      `UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully.',
    });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable two-factor authentication.' });
  }
};

// Get 2FA status
exports.get2FAStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const userId = req.user.id;

    const result = await pool.query(`SELECT two_factor_enabled FROM users WHERE id = ?`, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      enabled: result.rows[0].two_factor_enabled === 1,
    });
  } catch (err) {
    console.error('Get 2FA status error:', err);
    res.status(500).json({ error: 'Failed to get two-factor authentication status.' });
  }
};
