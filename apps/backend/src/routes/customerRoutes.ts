import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getCustomerStats,
} from '../controllers/customerController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Customer management routes
router.get('/', getCustomers);
router.get('/stats', getCustomerStats);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/status', toggleCustomerStatus);

export default router;

