import { Router } from 'express';
import {
  getStaff,
  inviteStaff,
  updateStaff,
  deleteStaff,
  freezeStaff,
  unfreezeStaff,
} from '../controllers/staffController';
import { authenticateUser, requireAdminOrStaff, requireSuperAdmin } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// All routes require authentication and admin/staff role
router.use(authenticateUser);
router.use(requireAdminOrStaff);
router.use(requireTenant);
router.use(ensureTenantAccess);

// Staff management routes (ADMIN only)
router.get('/', requirePermission(Permission.STAFF_VIEW), getStaff);
router.post('/invite', requirePermission(Permission.STAFF_INVITE), inviteStaff);
router.put('/:id', requirePermission(Permission.STAFF_UPDATE), updateStaff);
router.delete('/:id', requirePermission(Permission.STAFF_DELETE), deleteStaff);

// Freeze/Unfreeze routes (SUPER_ADMIN only)
router.patch('/:id/freeze', requireSuperAdmin, freezeStaff);
router.patch('/:id/unfreeze', requireSuperAdmin, unfreezeStaff);

export default router;

