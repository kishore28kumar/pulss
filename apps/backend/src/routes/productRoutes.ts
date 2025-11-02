import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticateUser, authorize } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Public routes
router.get('/', requireTenant, getProducts);
router.get('/:id', requireTenant, getProduct);

// Protected routes (Admin, Manager, Staff)
router.post(
  '/',
  authenticateUser,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  requireTenant,
  createProduct
);
router.put(
  '/:id',
  authenticateUser,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  requireTenant,
  updateProduct
);
router.delete(
  '/:id',
  authenticateUser,
  authorize('ADMIN', 'MANAGER'),
  requireTenant,
  deleteProduct
);

export default router;

