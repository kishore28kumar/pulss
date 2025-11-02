import { Router } from 'express';
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
  getTenantInfo,
} from '../controllers/tenantController';
import { authenticateUser, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/info', getTenantInfo);

// Protected routes (Super Admin)
router.get('/', authenticateUser, authorize('SUPER_ADMIN'), getTenants);
router.get('/:id', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN'), getTenant);
router.post('/', authenticateUser, authorize('SUPER_ADMIN'), createTenant);
router.put('/:id', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN'), updateTenant);
router.patch('/:id/status', authenticateUser, authorize('SUPER_ADMIN'), updateTenantStatus);
router.delete('/:id', authenticateUser, authorize('SUPER_ADMIN'), deleteTenant);

export default router;

