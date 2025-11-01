const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadCSV, uploadMultipleImages, handleUploadError } = require('../middleware/upload');
const productsController = require('../controllers/productsController');

// Import products from CSV
router.post(
  '/tenants/:tenant_id/import-csv',
  authMiddleware,
  uploadCSV.single('csv'),
  handleUploadError,
  productsController.importCSV
);

// List products (optionally authenticated for customer browsing)
router.get(
  '/tenants/:tenant_id',
  optionalAuth,
  productsController.listProducts
);

// Create product
router.post(
  '/tenants/:tenant_id',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.createProduct
);

// Update product
router.put(
  '/:id',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.updateProduct
);

// Delete product
router.delete(
  '/:id',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.deleteProduct
);

// Upload product images
router.post(
  '/tenants/:tenant_id/:product_id/images',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  uploadMultipleImages.array('images', 10),
  handleUploadError,
  productsController.uploadImages
);

// ============================================================================
// PRODUCT VARIANTS ROUTES
// ============================================================================

// Get variants for a product
router.get(
  '/tenants/:tenant_id/:product_id/variants',
  optionalAuth,
  productsController.getProductVariants
);

// Create a product variant
router.post(
  '/tenants/:tenant_id/:product_id/variants',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.createProductVariant
);

// Update a product variant
router.put(
  '/tenants/:tenant_id/variants/:variant_id',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.updateProductVariant
);

// Delete a product variant
router.delete(
  '/tenants/:tenant_id/variants/:variant_id',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.deleteProductVariant
);

// Bulk upload images for multiple products
router.post(
  '/tenants/:tenant_id/bulk-upload-images',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  uploadMultipleImages.array('images', 100),
  handleUploadError,
  productsController.bulkUploadImages
);

// Delete product image
router.delete(
  '/:id/images',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.deleteProductImage
);

// Reorder product images
router.put(
  '/:id/images/reorder',
  authMiddleware,
  requireRole('super_admin', 'admin'),
  productsController.reorderProductImages
);

module.exports = router;
