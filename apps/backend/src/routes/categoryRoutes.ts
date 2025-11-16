import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// Public routes (storefront)
router.get('/', requireTenant, getCategories);
router.get('/:id', requireTenant, getCategory);

// Protected routes - Admin only (STAFF can only view via public routes)
router.post(
  '/',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.CATEGORIES_CREATE),
  createCategory
);

router.put(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.CATEGORIES_UPDATE),
  updateCategory
);

router.delete(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.CATEGORIES_DELETE),
  deleteCategory
);

export default router;

