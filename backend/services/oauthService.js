const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * OAuth2 Service
 * Handles OAuth2 authentication flows for partners
 */

class OAuthService {
  /**
   * Generate OAuth2 access token
   */
  async generateAccessToken(partnerId, keyId, scopes = []) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    // Access tokens expire in 1 hour by default
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await pool.query(
      `INSERT INTO oauth_tokens
       (partner_id, key_id, token_type, token_hash, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [partnerId, keyId, 'access', tokenHash, scopes, expiresAt]
    );

    return { access_token: token, expires_at: expiresAt, token_type: 'Bearer' };
  }

  /**
   * Generate OAuth2 refresh token
   */
  async generateRefreshToken(partnerId, keyId, scopes = []) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    // Refresh tokens expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await pool.query(
      `INSERT INTO oauth_tokens
       (partner_id, key_id, token_type, token_hash, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [partnerId, keyId, 'refresh', tokenHash, scopes, expiresAt]
    );

    return { refresh_token: token, expires_at: expiresAt };
  }

  /**
   * Validate OAuth2 token
   */
  async validateToken(token, tokenType = 'access') {
    // Get all active tokens of the specified type
    const tokens = await pool.query(
      `SELECT t.token_id, t.partner_id, t.key_id, t.token_hash, t.scopes,
              t.expires_at, p.name as partner_name, p.status as partner_status
       FROM oauth_tokens t
       JOIN partners p ON t.partner_id = p.partner_id
       WHERE t.token_type = $1
       AND t.revoked = false
       AND t.expires_at > NOW()
       AND p.status = 'active'`,
      [tokenType]
    );

    // Find matching token by comparing hashes
    for (const tokenData of tokens.rows) {
      const isMatch = await bcrypt.compare(token, tokenData.token_hash);
      if (isMatch) {
        return {
          token_id: tokenData.token_id,
          partner_id: tokenData.partner_id,
          key_id: tokenData.key_id,
          scopes: tokenData.scopes,
          partner_name: tokenData.partner_name
        };
      }
    }

    return null;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    const tokenData = await this.validateToken(refreshToken, 'refresh');

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = await this.generateAccessToken(
      tokenData.partner_id,
      tokenData.key_id,
      tokenData.scopes
    );

    return accessToken;
  }

  /**
   * Revoke OAuth2 token
   */
  async revokeToken(token) {
    // Get all active tokens
    const tokens = await pool.query(
      `SELECT token_id, token_hash FROM oauth_tokens
       WHERE revoked = false`
    );

    // Find and revoke matching token
    for (const tokenData of tokens.rows) {
      const isMatch = await bcrypt.compare(token, tokenData.token_hash);
      if (isMatch) {
        await pool.query(
          `UPDATE oauth_tokens SET revoked = true WHERE token_id = $1`,
          [tokenData.token_id]
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Revoke all tokens for a partner
   */
  async revokeAllPartnerTokens(partnerId) {
    await pool.query(
      `UPDATE oauth_tokens SET revoked = true WHERE partner_id = $1`,
      [partnerId]
    );
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const result = await pool.query(
      `DELETE FROM oauth_tokens
       WHERE expires_at < NOW() - INTERVAL '30 days'
       RETURNING token_id`
    );

    return result.rowCount;
  }

  /**
   * Generate authorization code for OAuth2 flow
   */
  generateAuthorizationCode(partnerId, scopes, state) {
    const code = crypto.randomBytes(32).toString('hex');
    
    // Create JWT with short expiration (10 minutes)
    const token = jwt.sign(
      {
        code,
        partner_id: partnerId,
        scopes,
        state,
        type: 'authorization_code'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '10m' }
    );

    return token;
  }

  /**
   * Verify and exchange authorization code for tokens
   */
  async exchangeAuthorizationCode(code, keyId) {
    try {
      // Verify JWT
      const decoded = jwt.verify(code, process.env.JWT_SECRET || 'default-secret');

      if (decoded.type !== 'authorization_code') {
        throw new Error('Invalid code type');
      }

      // Generate access and refresh tokens
      const accessToken = await this.generateAccessToken(
        decoded.partner_id,
        keyId,
        decoded.scopes
      );

      const refreshToken = await this.generateRefreshToken(
        decoded.partner_id,
        keyId,
        decoded.scopes
      );

      return {
        ...accessToken,
        ...refreshToken,
        scope: decoded.scopes.join(' ')
      };
    } catch (error) {
      throw new Error('Invalid or expired authorization code');
    }
  }

  /**
   * Initiate SSO login for partner
   */
  async initiateSSOLogin(partnerId, redirectUri) {
    const partner = await pool.query(
      `SELECT partner_id, name, sso_enabled, sso_provider, sso_config
       FROM partners
       WHERE partner_id = $1 AND status = 'active'`,
      [partnerId]
    );

    if (partner.rows.length === 0) {
      throw new Error('Partner not found');
    }

    const partnerData = partner.rows[0];

    if (!partnerData.sso_enabled) {
      throw new Error('SSO not enabled for this partner');
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state temporarily (in production, use Redis or similar)
    await pool.query(
      `INSERT INTO global_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [`sso_state_${state}`, JSON.stringify({ partner_id: partnerId, redirect_uri: redirectUri, expires_at: Date.now() + 600000 })]
    );

    // Return SSO configuration for the client
    return {
      provider: partnerData.sso_provider,
      config: partnerData.sso_config,
      state
    };
  }

  /**
   * Complete SSO callback
   */
  async completeSSOCallback(state, code) {
    // Retrieve state data
    const stateResult = await pool.query(
      `SELECT value FROM global_settings WHERE key = $1`,
      [`sso_state_${state}`]
    );

    if (stateResult.rows.length === 0) {
      throw new Error('Invalid state parameter');
    }

    const stateData = stateResult.rows[0].value;

    // Verify state hasn't expired
    if (stateData.expires_at < Date.now()) {
      throw new Error('State parameter expired');
    }

    // Clean up state
    await pool.query(
      `DELETE FROM global_settings WHERE key = $1`,
      [`sso_state_${state}`]
    );

    // In production, exchange code with SSO provider for user info
    // For now, return partner info
    return {
      partner_id: stateData.partner_id,
      redirect_uri: stateData.redirect_uri
    };
  }
}

module.exports = new OAuthService();
