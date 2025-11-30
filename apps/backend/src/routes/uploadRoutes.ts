import { Router } from 'express';
import { uploadFile, uploadMiddleware } from '../controllers/uploadController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Upload route - Admin/Staff only
router.post(
  '/',
  authenticateUser,
  requireAdminOrStaff,
  requireTenant, // Optional for SUPER_ADMIN
  uploadMiddleware,
  uploadFile
);

export default router;

