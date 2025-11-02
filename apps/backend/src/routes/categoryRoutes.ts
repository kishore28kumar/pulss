import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticateUser, authorize } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Public routes
router.get('/', requireTenant, getCategories);
router.get('/:id', requireTenant, getCategory);

// Protected routes (Admin, Manager)
router.post(
  '/',
  authenticateUser,
  authorize('ADMIN', 'MANAGER'),
  requireTenant,
  createCategory
);
router.put(
  '/:id',
  authenticateUser,
  authorize('ADMIN', 'MANAGER'),
  requireTenant,
  updateCategory
);
router.delete(
  '/:id',
  authenticateUser,
  authorize('ADMIN', 'MANAGER'),
  requireTenant,
  deleteCategory
);

export default router;

