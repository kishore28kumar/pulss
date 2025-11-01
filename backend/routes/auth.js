const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Register a new admin or customer account. Email must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [admin, customer]
 *                 default: customer
 *                 example: admin
 *               tenant_id:
 *                 type: string
 *                 format: uuid
 *                 description: Required for admin/customer registration
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate with email and password. Returns a JWT token for subsequent requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Get the currently authenticated user's information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/password-reset/request:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Initiate a password reset flow. Sends a reset token to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/password-reset/request', authController.requestPasswordReset);

/**
 * @swagger
 * /api/auth/password-reset/confirm:
 *   post:
 *     tags: [Authentication]
 *     summary: Confirm password reset
 *     description: Complete the password reset using the reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token received via email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/password-reset/confirm', authController.confirmPasswordReset);

/**
 * @swagger
 * /api/auth/super-admin-test:
 *   get:
 *     tags: [Authentication]
 *     summary: Super admin test endpoint
 *     description: Test endpoint to verify super admin access (development only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super admin access confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are a super admin!
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get('/super-admin-test', authMiddleware, requireRole('super_admin'), (req, res) => {
    res.json({ message: 'You are a super admin!' });
});

/**
 * @swagger
 * /api/auth/2fa/enable:
 *   post:
 *     tags: [Authentication, Two-Factor Authentication]
 *     summary: Enable Two-Factor Authentication
 *     description: Generate a secret and QR code for setting up 2FA. User must scan QR code with authenticator app and verify with a token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA secret and QR code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   description: Base32 encoded secret (for manual entry)
 *                   example: JBSWY3DPEHPK3PXP
 *                 qrCode:
 *                   type: string
 *                   description: Data URL of QR code image
 *                   example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 *                 message:
 *                   type: string
 *                   example: Scan the QR code with your authenticator app and verify to enable 2FA.
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/2fa/enable', authMiddleware, authController.enable2FA);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     tags: [Authentication, Two-Factor Authentication]
 *     summary: Verify and activate Two-Factor Authentication
 *     description: Verify the 2FA token to complete setup and enable 2FA for the account. Returns backup codes.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit token from authenticator app
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication enabled successfully.
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["A1B2C3D4", "E5F6G7H8", "I9J0K1L2"]
 *                 warning:
 *                   type: string
 *                   example: Save these backup codes in a secure location. Each can only be used once.
 *       400:
 *         description: Invalid input or 2FA not initiated
 *       401:
 *         description: Invalid verification token or not authenticated
 *       500:
 *         description: Server error
 */
router.post('/2fa/verify', authMiddleware, authController.verify2FA);

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     tags: [Authentication, Two-Factor Authentication]
 *     summary: Disable Two-Factor Authentication
 *     description: Disable 2FA for the account. Requires password confirmation for security.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's account password for verification
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication disabled successfully.
 *       400:
 *         description: Password is required
 *       401:
 *         description: Incorrect password or not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/2fa/disable', authMiddleware, authController.disable2FA);

/**
 * @swagger
 * /api/auth/2fa/status:
 *   get:
 *     tags: [Authentication, Two-Factor Authentication]
 *     summary: Get Two-Factor Authentication status
 *     description: Check if 2FA is enabled for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   description: Whether 2FA is enabled
 *                   example: true
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/2fa/status', authMiddleware, authController.get2FAStatus);

module.exports = router;