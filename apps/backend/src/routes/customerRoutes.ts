import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getCustomerStats,
} from '../controllers/customerController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// All routes require authentication and admin/staff role
router.use(authenticateUser);
router.use(requireAdminOrStaff);
router.use(requireTenant);
router.use(ensureTenantAccess);

// Customer management routes
router.get('/', requirePermission(Permission.CUSTOMERS_VIEW), getCustomers);
router.get('/stats', requirePermission(Permission.CUSTOMERS_VIEW), getCustomerStats);
router.get('/:id', requirePermission(Permission.CUSTOMERS_VIEW), getCustomer);
router.put('/:id', requirePermission(Permission.CUSTOMERS_EDIT), updateCustomer);
router.patch('/:id/status', requirePermission(Permission.CUSTOMERS_EDIT), toggleCustomerStatus);

export default router;

