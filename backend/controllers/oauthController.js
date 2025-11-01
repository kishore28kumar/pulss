const oauthService = require('../services/oauthService');
const apiGatewayService = require('../services/apiGatewayService');
const { pool } = require('../config/db');

/**
 * OAuth2 Controller
 * Handles OAuth2 authentication flows
 */

/**
 * OAuth2 Authorization endpoint
 * GET /api/oauth/authorize
 */
exports.authorize = async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, response_type } = req.query;

    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    if (response_type !== 'code') {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Only authorization code flow is supported'
      });
    }

    // Validate client_id (API key)
    const apiKey = await apiGatewayService.validateApiKey(client_id);
    if (!apiKey || !apiKey.partner_id) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client_id'
      });
    }

    // Check if OAuth2 is enabled for the tenant
    const featureCheck = await pool.query(
      `SELECT api_oauth2_enabled FROM feature_flags WHERE tenant_id = $1`,
      [apiKey.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_oauth2_enabled) {
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'OAuth2 not enabled for this tenant'
      });
    }

    // Parse requested scopes
    const requestedScopes = scope ? scope.split(' ') : [];

    // Validate scopes
    const availableScopes = apiKey.scopes || [];
    const invalidScopes = requestedScopes.filter(s => !availableScopes.includes(s));

    if (invalidScopes.length > 0) {
      return res.status(400).json({
        error: 'invalid_scope',
        error_description: `Invalid scopes: ${invalidScopes.join(', ')}`
      });
    }

    // Generate authorization code
    const authCode = oauthService.generateAuthorizationCode(
      apiKey.partner_id,
      requestedScopes,
      state
    );

    // Redirect back to client with authorization code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', authCode);
    if (state) {
      redirectUrl.searchParams.append('state', state);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth authorization error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during authorization'
    });
  }
};

/**
 * OAuth2 Token endpoint
 * POST /api/oauth/token
 */
exports.token = async (req, res) => {
  try {
    const { grant_type, code, client_id, client_secret, refresh_token } = req.body;

    // Validate grant type
    if (!['authorization_code', 'refresh_token'].includes(grant_type)) {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code and refresh_token grants are supported'
      });
    }

    // Validate client credentials
    if (!client_id || !client_secret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed'
      });
    }

    // Validate API key
    const apiKey = await apiGatewayService.validateApiKey(client_id);
    if (!apiKey || !apiKey.partner_id) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Check if OAuth2 is enabled
    const featureCheck = await pool.query(
      `SELECT api_oauth2_enabled FROM feature_flags WHERE tenant_id = $1`,
      [apiKey.tenant_id]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_oauth2_enabled) {
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'OAuth2 not enabled'
      });
    }

    if (grant_type === 'authorization_code') {
      // Exchange authorization code for tokens
      if (!code) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing authorization code'
        });
      }

      const tokens = await oauthService.exchangeAuthorizationCode(code, apiKey.key_id);

      res.json({
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: 3600,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope
      });
    } else if (grant_type === 'refresh_token') {
      // Refresh access token
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing refresh token'
        });
      }

      const newAccessToken = await oauthService.refreshAccessToken(refresh_token);

      res.json({
        access_token: newAccessToken.access_token,
        token_type: newAccessToken.token_type,
        expires_in: 3600
      });
    }
  } catch (error) {
    console.error('OAuth token error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: error.message
      });
    }

    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred while processing the token request'
    });
  }
};

/**
 * OAuth2 Token Revocation endpoint
 * POST /api/oauth/revoke
 */
exports.revoke = async (req, res) => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing token parameter'
      });
    }

    // Revoke token
    const revoked = await oauthService.revokeToken(token);

    if (revoked) {
      res.status(200).json({
        success: true,
        message: 'Token revoked successfully'
      });
    } else {
      // According to OAuth2 spec, return 200 even if token not found
      res.status(200).json({
        success: true,
        message: 'Token revoked or not found'
      });
    }
  } catch (error) {
    console.error('OAuth revoke error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred while revoking the token'
    });
  }
};

/**
 * OAuth2 Token Introspection endpoint
 * POST /api/oauth/introspect
 */
exports.introspect = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        active: false
      });
    }

    // Validate token
    const tokenData = await oauthService.validateToken(token, 'access');

    if (!tokenData) {
      return res.json({
        active: false
      });
    }

    // Get token expiration
    const tokenInfo = await pool.query(
      `SELECT expires_at, scopes FROM oauth_tokens WHERE token_id = $1`,
      [tokenData.token_id]
    );

    if (tokenInfo.rows.length === 0) {
      return res.json({
        active: false
      });
    }

    const { expires_at, scopes } = tokenInfo.rows[0];

    res.json({
      active: true,
      scope: scopes.join(' '),
      client_id: tokenData.key_id,
      partner_id: tokenData.partner_id,
      exp: Math.floor(new Date(expires_at).getTime() / 1000)
    });
  } catch (error) {
    console.error('OAuth introspect error:', error);
    res.json({
      active: false
    });
  }
};

/**
 * Get OAuth2 configuration (for .well-known/oauth-authorization-server)
 * GET /api/oauth/.well-known/oauth-authorization-server
 */
exports.getConfiguration = (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    revocation_endpoint: `${baseUrl}/api/oauth/revoke`,
    introspection_endpoint: `${baseUrl}/api/oauth/introspect`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    scopes_supported: [
      'orders:read',
      'orders:write',
      'products:read',
      'products:write',
      'customers:read',
      'customers:write',
      'inventory:read',
      'inventory:write',
      'analytics:read'
    ]
  });

const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * OAuth 2.0 Controller
 * Implements OAuth 2.0 authorization code flow
 */

// ============================================================================
// OAUTH APPLICATIONS MANAGEMENT
// ============================================================================

// Get OAuth applications
exports.getOAuthApplications = async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    // Check if OAuth is enabled
    const featureCheck = await db.query(
      'SELECT oauth_enabled FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].oauth_enabled) {
      return res.status(403).json({
        success: false,
        message: 'OAuth is not enabled for this tenant'
      });
    }

    const result = await db.query(
      `SELECT id, tenant_id, name, description, client_id, redirect_uris, 
              allowed_scopes, grant_types, is_active, is_trusted, 
              logo_url, website_url, created_at
       FROM oauth_applications 
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching OAuth applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OAuth applications'
    });
  }
};

// Create OAuth application
exports.createOAuthApplication = async (req, res) => {
  try {
    const {
      name,
      description,
      redirect_uris,
      allowed_scopes,
      grant_types = ['authorization_code', 'refresh_token'],
      logo_url,
      website_url,
      privacy_policy_url,
      terms_of_service_url
    } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Validate required fields
    if (!name || !redirect_uris || redirect_uris.length === 0 || !allowed_scopes) {
      return res.status(400).json({
        success: false,
        message: 'Name, redirect URIs, and scopes are required'
      });
    }

    // Check if OAuth is enabled
    const featureCheck = await db.query(
      'SELECT oauth_enabled FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].oauth_enabled) {
      return res.status(403).json({
        success: false,
        message: 'OAuth is not enabled for this tenant'
      });
    }

    // Generate client ID and secret
    const clientId = `oauth_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const clientSecretHash = await bcrypt.hash(clientSecret, 10);

    // Insert application
    const result = await db.query(
      `INSERT INTO oauth_applications 
       (tenant_id, name, description, client_id, client_secret, redirect_uris, 
        allowed_scopes, grant_types, logo_url, website_url, privacy_policy_url, terms_of_service_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, tenant_id, name, description, client_id, redirect_uris, 
                 allowed_scopes, grant_types, logo_url, website_url, created_at`,
      [
        tenantId, name, description, clientId, clientSecretHash, redirect_uris,
        allowed_scopes, grant_types, logo_url, website_url, privacy_policy_url, terms_of_service_url
      ]
    );

    res.status(201).json({
      success: true,
      message: 'OAuth application created successfully. Save the client secret securely - it will not be shown again.',
      data: {
        ...result.rows[0],
        client_secret: clientSecret // Only shown once
      }
    });
  } catch (error) {
    console.error('Error creating OAuth application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create OAuth application'
    });
  }
};

// Update OAuth application
exports.updateOAuthApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, redirect_uris, allowed_scopes, is_active, logo_url, website_url } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (redirect_uris !== undefined) {
      updates.push(`redirect_uris = $${paramCount++}`);
      values.push(redirect_uris);
    }
    if (allowed_scopes !== undefined) {
      updates.push(`allowed_scopes = $${paramCount++}`);
      values.push(allowed_scopes);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logo_url);
    }
    if (website_url !== undefined) {
      updates.push(`website_url = $${paramCount++}`);
      values.push(website_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id, tenantId);

    const result = await db.query(
      `UPDATE oauth_applications 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'OAuth application not found'
      });
    }

    res.json({
      success: true,
      message: 'OAuth application updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating OAuth application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update OAuth application'
    });
  }
};

// Delete OAuth application
exports.deleteOAuthApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    await db.query(
      'DELETE FROM oauth_applications WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'OAuth application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting OAuth application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete OAuth application'
    });
  }
};

// ============================================================================
// OAUTH AUTHORIZATION FLOW
// ============================================================================

// Authorization endpoint - initiate OAuth flow
exports.authorize = async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, response_type, code_challenge, code_challenge_method } = req.query;

    // Validate parameters
    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    if (response_type !== 'code') {
      return res.status(400).json({
        success: false,
        error: 'unsupported_response_type',
        error_description: 'Only authorization_code flow is supported'
      });
    }

    // Get application
    const appResult = await db.query(
      'SELECT * FROM oauth_applications WHERE client_id = $1 AND is_active = true',
      [client_id]
    );

    if (appResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'invalid_client',
        error_description: 'Invalid client_id'
      });
    }

    const app = appResult.rows[0];

    // Validate redirect URI
    if (!app.redirect_uris.includes(redirect_uri)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        error_description: 'Invalid redirect_uri'
      });
    }

    // Check if user is authenticated (in a real implementation, this would check session)
    if (!req.user || !req.user.customer_id) {
      // Redirect to login with return URL
      return res.status(401).json({
        success: false,
        error: 'login_required',
        error_description: 'User must be authenticated',
        login_url: `/login?return_to=/oauth/authorize?${new URLSearchParams(req.query)}`
      });
    }

    // If app is trusted, skip consent screen
    if (app.is_trusted) {
      return await generateAuthorizationCode(req, res, app, req.user.customer_id, scope, redirect_uri, state, code_challenge, code_challenge_method);
    }

    // Otherwise, show consent screen (in a real implementation)
    res.json({
      success: true,
      consent_required: true,
      application: {
        name: app.name,
        description: app.description,
        logo_url: app.logo_url,
        website_url: app.website_url
      },
      requested_scopes: scope ? scope.split(' ') : app.allowed_scopes
    });
  } catch (error) {
    console.error('OAuth authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      error_description: 'An error occurred during authorization'
    });
  }
};

// User grants consent
exports.grantConsent = async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, approved } = req.body;

    if (!approved) {
      return res.redirect(`${redirect_uri}?error=access_denied&state=${state}`);
    }

    // Get application
    const appResult = await db.query(
      'SELECT * FROM oauth_applications WHERE client_id = $1 AND is_active = true',
      [client_id]
    );

    if (appResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'invalid_client'
      });
    }

    const app = appResult.rows[0];

    return await generateAuthorizationCode(req, res, app, req.user.customer_id, scope, redirect_uri, state, code_challenge, code_challenge_method);
  } catch (error) {
    console.error('OAuth consent error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error'
    });
  }
};

// Generate authorization code
async function generateAuthorizationCode(req, res, app, customerId, scope, redirectUri, state, codeChallenge, codeChallengeMethod) {
  try {
    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Parse scopes
    const scopes = scope ? scope.split(' ') : app.allowed_scopes;

    // Insert authorization code
    await db.query(
      `INSERT INTO oauth_authorization_codes 
       (code, application_id, customer_id, scopes, redirect_uri, code_challenge, code_challenge_method, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [code, app.id, customerId, scopes, redirectUri, codeChallenge, codeChallengeMethod, expiresAt]
    );

    // Validate redirect URI is from allowed list before redirecting
    if (!app.redirect_uris.includes(redirectUri)) {
      throw new Error('Invalid redirect URI');
    }

    // Redirect back with code
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.append('code', code);
    if (state) redirectUrl.searchParams.append('state', state);

    res.json({
      success: true,
      redirect_url: redirectUrl.toString()
    });
  } catch (error) {
    console.error('Error generating authorization code:', error);
    throw error;
  }
}

// Token endpoint - exchange code for access token
exports.token = async (req, res) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret, refresh_token, code_verifier } = req.body;

    if (!grant_type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing grant_type'
      });
    }

    if (grant_type === 'authorization_code') {
      return await handleAuthorizationCodeGrant(req, res, code, redirect_uri, client_id, client_secret, code_verifier);
    } else if (grant_type === 'refresh_token') {
      return await handleRefreshTokenGrant(req, res, refresh_token, client_id, client_secret);
    } else {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code and refresh_token are supported'
      });
    }
  } catch (error) {
    console.error('OAuth token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during token generation'
    });
  }
};

// Handle authorization code grant
async function handleAuthorizationCodeGrant(req, res, code, redirectUri, clientId, clientSecret, codeVerifier) {
  // Verify client credentials
  const appResult = await db.query(
    'SELECT * FROM oauth_applications WHERE client_id = $1 AND is_active = true',
    [clientId]
  );

  if (appResult.rows.length === 0) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  const app = appResult.rows[0];

  // Verify client secret
  const validSecret = await bcrypt.compare(clientSecret, app.client_secret);
  if (!validSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  // Get authorization code
  const codeResult = await db.query(
    'SELECT * FROM oauth_authorization_codes WHERE code = $1 AND is_used = false',
    [code]
  );

  if (codeResult.rows.length === 0) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Invalid or expired authorization code'
    });
  }

  const authCode = codeResult.rows[0];

  // Check expiration
  if (new Date(authCode.expires_at) < new Date()) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Authorization code has expired'
    });
  }

  // Verify redirect URI matches
  if (authCode.redirect_uri !== redirectUri) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Redirect URI mismatch'
    });
  }

  // Verify PKCE if used
  if (authCode.code_challenge) {
    if (!codeVerifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code_verifier required for PKCE'
      });
    }

    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    if (hash !== authCode.code_challenge) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid code_verifier'
      });
    }
  }

  // Mark code as used
  await db.query(
    'UPDATE oauth_authorization_codes SET is_used = true WHERE code = $1',
    [code]
  );

  // Generate access token
  const accessToken = jwt.sign(
    {
      sub: authCode.customer_id,
      client_id: clientId,
      scopes: authCode.scopes
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Generate refresh token
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Store tokens
  await db.query(
    `INSERT INTO oauth_access_tokens 
     (token, application_id, customer_id, scopes, expires_at, refresh_token, refresh_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      accessToken,
      app.id,
      authCode.customer_id,
      authCode.scopes,
      new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      refreshToken,
      refreshTokenExpiresAt
    ]
  );

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scopes.join(' ')
  });
}

// Handle refresh token grant
async function handleRefreshTokenGrant(req, res, refreshToken, clientId, clientSecret) {
  // Verify client
  const appResult = await db.query(
    'SELECT * FROM oauth_applications WHERE client_id = $1 AND is_active = true',
    [clientId]
  );

  if (appResult.rows.length === 0) {
    return res.status(401).json({
      error: 'invalid_client'
    });
  }

  const app = appResult.rows[0];
  const validSecret = await bcrypt.compare(clientSecret, app.client_secret);
  if (!validSecret) {
    return res.status(401).json({
      error: 'invalid_client'
    });
  }

  // Get refresh token
  const tokenResult = await db.query(
    'SELECT * FROM oauth_access_tokens WHERE refresh_token = $1 AND is_revoked = false',
    [refreshToken]
  );

  if (tokenResult.rows.length === 0) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Invalid refresh token'
    });
  }

  const oldToken = tokenResult.rows[0];

  // Check expiration
  if (new Date(oldToken.refresh_token_expires_at) < new Date()) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Refresh token has expired'
    });
  }

  // Generate new access token
  const newAccessToken = jwt.sign(
    {
      sub: oldToken.customer_id,
      client_id: clientId,
      scopes: oldToken.scopes
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Store new token
  await db.query(
    `INSERT INTO oauth_access_tokens 
     (token, application_id, customer_id, scopes, expires_at, refresh_token, refresh_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      newAccessToken,
      app.id,
      oldToken.customer_id,
      oldToken.scopes,
      new Date(Date.now() + 60 * 60 * 1000),
      refreshToken,
      oldToken.refresh_token_expires_at
    ]
  );

  res.json({
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: oldToken.scopes.join(' ')
  });
}

// Revoke token
exports.revokeToken = async (req, res) => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing token'
      });
    }

    // Revoke the token
    if (token_type_hint === 'refresh_token') {
      await db.query(
        'UPDATE oauth_access_tokens SET is_revoked = true WHERE refresh_token = $1',
        [token]
      );
    } else {
      await db.query(
        'UPDATE oauth_access_tokens SET is_revoked = true WHERE token = $1',
        [token]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('OAuth revoke error:', error);
    res.status(500).json({
      error: 'server_error'
    });
  }
};

}
module.exports = exports;
