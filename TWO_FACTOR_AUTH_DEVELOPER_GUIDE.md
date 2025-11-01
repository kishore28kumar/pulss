# Two-Factor Authentication (2FA) Developer Guide

## Overview

This guide provides technical documentation for the 2FA implementation in the Pulss platform, including API endpoints, database schema, and integration instructions.

## Architecture

### Technology Stack

- **TOTP Generation**: `speakeasy` (v2.0.0)
- **QR Code Generation**: `qrcode` (v1.5.4)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT tokens
- **Rate Limiting**: Built-in via speakeasy's time window validation

### Security Features

1. **TOTP Algorithm**: Time-based One-Time Password (RFC 6238)
2. **Secret Length**: 32 characters (base32 encoded)
3. **Time Window**: 30 seconds per code
4. **Validation Window**: ±2 time windows (prevents timing issues)
5. **Backup Codes**: 10 codes, bcrypt hashed, single-use
6. **Password Verification**: Required for disabling 2FA

## Database Schema

### SQLite (Development)

```sql
-- Add 2FA fields to users table
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled);
```

### PostgreSQL (Production)

```sql
-- Add 2FA fields to admins table
ALTER TABLE admins ADD COLUMN two_factor_secret TEXT;
ALTER TABLE admins ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE admins ADD COLUMN two_factor_backup_codes TEXT;

-- Add 2FA fields to customers table
ALTER TABLE customers ADD COLUMN two_factor_secret TEXT;
ALTER TABLE customers ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN two_factor_backup_codes TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admins_2fa_enabled ON admins(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_customers_2fa_enabled ON customers(two_factor_enabled);
```

## API Endpoints

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication

All 2FA endpoints (except login) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

### 1. Enable 2FA

**Endpoint:** `POST /auth/2fa/enable`

**Description:** Generates a TOTP secret and QR code for the user to scan with their authenticator app.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:** None

**Response:** `200 OK`
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Scan the QR code with your authenticator app..."
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/2fa/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 2. Verify and Activate 2FA

**Endpoint:** `POST /auth/2fa/verify`

**Description:** Verifies the TOTP code and activates 2FA for the user. Returns backup codes.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully.",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2",
    "..."
  ],
  "warning": "Save these backup codes in a secure location. Each can only be used once."
}
```

**Error Responses:**
- `400 Bad Request`: Token not provided or 2FA not initiated
- `401 Unauthorized`: Invalid token or not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/2fa/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

---

### 3. Disable 2FA

**Endpoint:** `POST /auth/2fa/disable`

**Description:** Disables 2FA for the user. Requires password verification.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "password": "user_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Two-factor authentication disabled successfully."
}
```

**Error Responses:**
- `400 Bad Request`: Password not provided
- `401 Unauthorized`: Incorrect password or not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/2fa/disable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "SecurePass123!"}'
```

---

### 4. Check 2FA Status

**Endpoint:** `GET /auth/2fa/status`

**Description:** Returns whether 2FA is enabled for the authenticated user.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Request Body:** None

**Response:** `200 OK`
```json
{
  "enabled": true
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:5000/api/auth/2fa/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Login with 2FA

**Endpoint:** `POST /auth/login`

**Description:** Modified login endpoint that handles 2FA verification.

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Initial Login):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA Required):** `200 OK`
```json
{
  "requires2FA": true,
  "message": "Two-factor authentication required."
}
```

**Request Body (With 2FA Token):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorToken": "123456"
}
```

**Response (Success):** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin",
    "tenant_id": "tenant_id",
    "name": "User Name",
    "two_factor_enabled": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials or 2FA token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

## Frontend Integration

### Components

#### TwoFactorAuth Component

Full-featured 2FA management component with:
- Enable/disable 2FA
- QR code display
- Verification input
- Backup codes display and download
- Status indicator

**Usage:**
```tsx
import TwoFactorAuth from '@/components/TwoFactorAuth';

function SettingsPage() {
  return (
    <div>
      <TwoFactorAuth apiBaseUrl="http://localhost:5000/api" />
    </div>
  );
}
```

**Props:**
```typescript
interface TwoFactorAuthProps {
  apiBaseUrl?: string; // Default: 'http://localhost:5000/api'
}
```

#### TwoFactorVerification Component

Login-specific 2FA verification component:

**Usage:**
```tsx
import TwoFactorVerification from '@/components/TwoFactorVerification';

function LoginPage() {
  const [show2FA, setShow2FA] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleVerified = (token: string) => {
    // Store token and redirect
    localStorage.setItem('token', token);
    navigate('/dashboard');
  };

  if (show2FA) {
    return (
      <TwoFactorVerification
        email={credentials.email}
        password={credentials.password}
        onVerified={handleVerified}
        onCancel={() => setShow2FA(false)}
      />
    );
  }

  // ... rest of login form
}
```

**Props:**
```typescript
interface TwoFactorVerificationProps {
  email: string;
  password: string;
  onVerified: (token: string) => void;
  onCancel: () => void;
  apiBaseUrl?: string;
}
```

### Example: Complete Login Flow

```typescript
async function handleLogin(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.requires2FA) {
      // Show 2FA verification component
      setShow2FA(true);
      setCredentials({ email, password });
    } else if (data.token) {
      // Login successful
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

async function handleLoginWith2FA(email: string, password: string, token: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, twoFactorToken: token }),
    });

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('2FA verification failed:', error);
  }
}
```

## Testing

### Running the Test Suite

```bash
cd backend
node test-2fa.js
```

The test script will:
1. Register a test user
2. Login and get a token
3. Check initial 2FA status
4. Enable 2FA
5. Display QR code and secret
6. Prompt for verification code
7. Verify and complete setup
8. Display backup codes
9. Test login with 2FA

### Manual Testing with cURL

```bash
# 1. Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "admin",
    "tenant_id": "test-tenant-123"
  }'

# 2. Login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.token')

# 3. Enable 2FA
curl -X POST http://localhost:5000/api/auth/2fa/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 4. Verify with code from authenticator app
curl -X POST http://localhost:5000/api/auth/2fa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'

# 5. Check status
curl -X GET http://localhost:5000/api/auth/2fa/status \
  -H "Authorization: Bearer $TOKEN"
```

## Security Considerations

### Rate Limiting

Rate limiting is implemented through:
1. **speakeasy window parameter**: Set to 2, allows codes from previous/next time window
2. **Express rate limiter**: Limits authentication attempts (configured in middleware/security.js)

### Secret Storage

- 2FA secrets are stored in plain text in the database (base32 encoded)
- This is standard practice as the secret must be retrievable for verification
- Database should be encrypted at rest in production
- Consider implementing encryption at application level for additional security

### Backup Codes

- Backup codes are bcrypt hashed before storage
- Each code can only be used once
- Codes are stored as JSON array in database
- After use, code should be marked as used or removed

### Recommendations

1. **Production Deployment:**
   - Use HTTPS only
   - Set secure environment variables
   - Enable database encryption
   - Implement audit logging
   - Consider adding email notifications for 2FA changes

2. **Additional Security Measures:**
   - Implement account lockout after failed attempts
   - Add email verification for 2FA changes
   - Consider adding SMS/email backup methods
   - Implement session management improvements
   - Add device fingerprinting

3. **Monitoring:**
   - Log all 2FA events (enable, disable, failed attempts)
   - Monitor for suspicious patterns
   - Alert on multiple failed verification attempts
   - Track backup code usage

## Troubleshooting

### Common Issues

1. **"secretOrPrivateKey must have a value"**
   - Ensure `JWT_SECRET` is set in `.env` file
   - Restart the server after adding environment variables

2. **"Invalid verification token"**
   - Check device time synchronization
   - Verify the secret is correct
   - Ensure code hasn't expired (30-second window)

3. **Database errors**
   - Ensure migration has been run
   - Check database permissions
   - Verify table structure matches schema

4. **QR code not displaying**
   - Check QRCode library installation
   - Verify secret generation is working
   - Check network/CORS settings

## Environment Variables

```bash
# Backend .env file
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=5000
DATABASE_URL=your-database-url  # For production PostgreSQL
```

## Dependencies

### Backend
```json
{
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.4",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2"
}
```

### Frontend
```json
{
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-alert": "^1.1.15",
  "lucide-react": "^0.545.0"
}
```

## Migration Path

### From No 2FA to 2FA

1. Run database migration
2. Deploy backend code
3. Deploy frontend code
4. Announce feature to users
5. Consider making it mandatory for admin accounts

### Rollback Plan

If issues arise:
1. Disable 2FA endpoints in app.js
2. Database fields remain (no need to drop)
3. Users with 2FA enabled can still login with password only
4. Re-enable after fixing issues

## Support

For issues or questions:
- Check this documentation
- Review test-2fa.js for examples
- Check Swagger documentation at `/api/docs`
- Contact development team

---

**Last Updated:** October 2025
**Version:** 1.0
