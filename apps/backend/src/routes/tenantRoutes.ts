import { Router } from 'express';
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateTenantStatus,
  freezeTenant,
  unfreezeTenant,
  deleteTenant,
  getTenantInfo,
} from '../controllers/tenantController';
import { authenticateUser, authorize, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// Public routes
router.get('/info', getTenantInfo);

// Protected routes - Super Admin only
router.get('/', authenticateUser, authorize('SUPER_ADMIN'), getTenants);
router.post('/', authenticateUser, authorize('SUPER_ADMIN'), createTenant);
router.patch('/:id/status', authenticateUser, authorize('SUPER_ADMIN'), updateTenantStatus);
router.post('/:id/freeze', authenticateUser, authorize('SUPER_ADMIN'), freezeTenant);
router.post('/:id/unfreeze', authenticateUser, authorize('SUPER_ADMIN'), unfreezeTenant);
router.delete('/:id', authenticateUser, authorize('SUPER_ADMIN'), deleteTenant);

// Tenant info - Admin/Staff can view their own tenant
router.get(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  getTenant
);

// Update tenant - Admin can update their own tenant, Super Admin can update any
router.put(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.SETTINGS_UPDATE),
  updateTenant
);

export default router;

