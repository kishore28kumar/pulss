import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
} from '../controllers/productController';
import { authenticateUser, optionalAuthenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission, canUpdateProduct } from '../middleware/permissionMiddleware';

const router = Router();

// Public routes (storefront) - require tenant for storefront access
// Optional authentication allows SUPER_ADMIN to bypass tenant requirement
router.get('/', optionalAuthenticateUser, requireTenant, getProducts);
router.get('/:id', optionalAuthenticateUser, requireTenant, getProduct);

// Protected routes - Admin/Staff only
// Note: requireTenant allows SUPER_ADMIN to bypass tenant requirement
router.post(
  '/',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant, // Optional for SUPER_ADMIN
  ensureTenantAccess, // Allows SUPER_ADMIN to access any tenant
  requirePermission(Permission.PRODUCTS_CREATE),
  createProduct
);

router.post(
  '/bulk',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant, // Optional for SUPER_ADMIN
  ensureTenantAccess, // Allows SUPER_ADMIN to access any tenant
  requirePermission(Permission.PRODUCTS_CREATE),
  bulkCreateProducts
);

router.put(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant, // Optional for SUPER_ADMIN
  ensureTenantAccess, // Allows SUPER_ADMIN to access any tenant
  requirePermission(Permission.PRODUCTS_UPDATE),
  canUpdateProduct,
  updateProduct
);

router.delete(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant, // Optional for SUPER_ADMIN
  ensureTenantAccess, // Allows SUPER_ADMIN to access any tenant
  requirePermission(Permission.PRODUCTS_DELETE),
  deleteProduct
);

export default router;

