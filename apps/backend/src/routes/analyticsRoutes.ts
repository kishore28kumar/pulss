import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
} from '../controllers/analyticsController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant, ensureTenantAccess } from '../middleware/tenantMiddleware';
import { requirePermission, Permission } from '../middleware/permissionMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateUser);
router.use(requireAdminOrStaff);
router.use(requireTenant);
router.use(ensureTenantAccess);

// Dashboard stats - ADMIN and STAFF (read-only for STAFF)
router.get('/dashboard', requirePermission(Permission.ANALYTICS_VIEW), getDashboardStats);

// Detailed analytics - ADMIN only
router.get('/revenue', requirePermission(Permission.ANALYTICS_VIEW), getRevenueAnalytics);
router.get('/products', requirePermission(Permission.ANALYTICS_VIEW), getProductAnalytics);
router.get('/customers', requirePermission(Permission.ANALYTICS_VIEW), getCustomerAnalytics);

export default router;

