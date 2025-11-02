import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getCustomerOrders,
} from '../controllers/orderController';
import { authenticateUser, authenticateCustomer, authorize } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Customer routes
router.post('/', authenticateCustomer, requireTenant, createOrder);
router.get('/my-orders', authenticateCustomer, getCustomerOrders);

// Admin routes
router.get('/', authenticateUser, authorize('ADMIN', 'MANAGER', 'STAFF'), requireTenant, getOrders);
router.get('/:id', authenticateUser, authorize('ADMIN', 'MANAGER', 'STAFF'), requireTenant, getOrder);
router.patch('/:id/status', authenticateUser, authorize('ADMIN', 'MANAGER', 'STAFF'), requireTenant, updateOrderStatus);

export default router;

