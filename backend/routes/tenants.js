const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { uploadImage, handleUploadError } = require('../middleware/upload');
const tenantsController = require('../controllers/tenantsController');
const { generateStoreQR, generateUPIQR } = require('../utils/qrGenerator');
const { pool } = require('../config/db');

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     tags: [Tenants]
 *     summary: Create a new tenant (Super Admin only)
 *     description: Create a new business tenant with all initial settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subdomain
 *               - business_type
 *             properties:
 *               name:
 *                 type: string
 *                 example: City Pharmacy
 *               subdomain:
 *                 type: string
 *                 example: citypharmacy
 *               business_type:
 *                 type: string
 *                 enum: [pharmacy, retail, grocery, restaurant, services]
 *                 example: pharmacy
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (Super Admin required)
 *       400:
 *         description: Invalid input data
 */
router.post('/', authMiddleware, requireRole('super_admin'), tenantsController.createTenant);

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: Get all tenants (Super Admin only)
 *     description: Retrieve a list of all tenants with their metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: List of tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', authMiddleware, requireRole('super_admin'), tenantsController.getAllTenants);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     tags: [Tenants]
 *     summary: Get tenant by ID
 *     description: Retrieve detailed information about a specific tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', authMiddleware, tenantsController.getTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: Update tenant profile
 *     description: Update tenant information and settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               contact_email:
 *                 type: string
 *                 format: email
 *               contact_phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Tenant not found
 */
router.put('/:id', authMiddleware, tenantsController.updateTenant);

/**
 * @swagger
 * /api/tenants/{id}/status:
 *   patch:
 *     tags: [Tenants]
 *     summary: Update tenant status (Super Admin only)
 *     description: Activate or deactivate a tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tenant status updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Tenant not found
 */
router.patch('/:id/status', authMiddleware, requireRole('super_admin'), tenantsController.updateTenantStatus);

/**
 * @swagger
 * /api/tenants/{id}/settings:
 *   get:
 *     tags: [Tenants]
 *     summary: Get tenant public settings
 *     description: Get public tenant settings for customer portal (no auth required)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tenant settings retrieved successfully
 *       404:
 *         description: Tenant not found
 */
router.get('/:id/settings', tenantsController.getTenantSettings);

// Get advanced tenant settings (admin only)
router.get('/:id/advanced-settings', authMiddleware, tenantsController.getAdvancedSettings);

// Update advanced tenant settings (admin only)
router.put('/:id/advanced-settings', authMiddleware, tenantsController.updateAdvancedSettings);

// Get tenant subscription info (admin only)
router.get('/:id/subscription', authMiddleware, tenantsController.getSubscription);

// Upload tenant logo
router.put(
  '/:id/logo',
  authMiddleware,
  uploadImage.single('logo'),
  handleUploadError,
  tenantsController.uploadLogo
);

// Upload PWA icon
router.put(
  '/:id/pwa-icon',
  authMiddleware,
  uploadImage.single('pwa_icon'),
  handleUploadError,
  tenantsController.uploadPWAIcon
);

// Upload favicon
router.put(
  '/:id/favicon',
  authMiddleware,
  uploadImage.single('favicon'),
  handleUploadError,
  tenantsController.uploadFavicon
);

// Get dynamic manifest.json for tenant (public)
router.get('/:id/manifest.json', tenantsController.getManifest);

// Go live endpoint - activate store and generate QR codes
router.post('/:id/go-live', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: tenant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query('BEGIN');
    
    // Get tenant details
    const tenantResult = await client.query(
      'SELECT * FROM tenants WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (tenantResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenant = tenantResult.rows[0];
    
    // Generate PWA URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const pwaUrl = tenant.subdomain 
      ? `https://${tenant.subdomain}.${baseUrl.replace(/https?:\/\//, '')}`
      : `${baseUrl}/store/${tenant_id}`;
    
    // Generate store QR code
    const qrImageUrl = await generateStoreQR(pwaUrl, tenant_id);
    
    // Get UPI details if available
    const storeSettings = await client.query(
      'SELECT upi_id FROM store_settings WHERE tenant_id = $1',
      [tenant_id]
    );
    
    let upiQRUrl = null;
    if (storeSettings.rows.length > 0 && storeSettings.rows[0].upi_id) {
      upiQRUrl = await generateUPIQR({
        upiId: storeSettings.rows[0].upi_id,
        merchantName: tenant.shop_name || tenant.name
      }, tenant_id);
      
      // Update store settings with UPI QR
      await client.query(
        'UPDATE store_settings SET upi_qr_code_url = $1 WHERE tenant_id = $2',
        [upiQRUrl, tenant_id]
      );
    }
    
    // Update tenant to live status
    await client.query(
      `UPDATE tenants 
       SET is_live = true, pwa_url = $1, qr_image_url = $2, updated_at = TIMEZONE('utc'::text, NOW())
       WHERE tenant_id = $3`,
      [pwaUrl, qrImageUrl, tenant_id]
    );
    
    // Record in QR codes table
    await client.query(
      `INSERT INTO tenant_qr_codes (tenant_id, qr_code_url, app_download_url, created_by)
       VALUES ($1, $2, $3, $4)`,
      [tenant_id, qrImageUrl, pwaUrl, req.user.id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Store is now live!',
      pwa_url: pwaUrl,
      qr_image_url: qrImageUrl,
      upi_qr_url: upiQRUrl
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Go live error:', error);
    res.status(500).json({ error: 'Failed to activate store' });
  } finally {
    client.release();
  }
});

// Generate new QR code
router.post('/:id/generate-qr', authMiddleware, async (req, res) => {
  try {
    const { id: tenant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const tenantResult = await pool.query(
      'SELECT pwa_url FROM tenants WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const pwaUrl = tenantResult.rows[0].pwa_url;
    
    if (!pwaUrl) {
      return res.status(400).json({ error: 'Store must be live first. Use /go-live endpoint.' });
    }
    
    const qrImageUrl = await generateStoreQR(pwaUrl, tenant_id);
    
    await pool.query(
      'UPDATE tenants SET qr_image_url = $1 WHERE tenant_id = $2',
      [qrImageUrl, tenant_id]
    );
    
    res.json({
      message: 'QR code generated successfully',
      qr_image_url: qrImageUrl,
      pwa_url: pwaUrl
    });
    
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;
