import { Router } from 'express';
import {
  getOrderReport,
  getProductReport,
  getCustomerReport,
} from '../controllers/reportController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticateUser);
router.use(requireAdminOrStaff);
router.use(requireTenant);
router.use(ensureTenantAccess);

// Report routes (ADMIN only)
router.get('/orders', requirePermission(Permission.REPORTS_VIEW), getOrderReport);
router.get('/products', requirePermission(Permission.REPORTS_VIEW), getProductReport);
router.get('/customers', requirePermission(Permission.REPORTS_VIEW), getCustomerReport);

export default router;

