import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getCustomerOrders,
  exportOrders,
} from '../controllers/orderController';
import { authenticateUser, authenticateCustomer, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// Customer routes (must come before admin routes)
router.post('/', authenticateCustomer, requireTenant, createOrder);
router.get('/my-orders', authenticateCustomer, requireTenant, getCustomerOrders);
router.get('/customer/:id', authenticateCustomer, requireTenant, getOrder);

// Admin/Staff routes
router.get(
  '/export',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.ORDERS_EXPORT),
  exportOrders
);

router.get(
  '/',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.ORDERS_VIEW),
  getOrders
);

router.get(
  '/:id',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.ORDERS_VIEW),
  getOrder
);

router.put(
  '/:id/status',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant,
  ensureTenantAccess,
  requirePermission(Permission.ORDERS_UPDATE),
  updateOrderStatus
);

export default router;

