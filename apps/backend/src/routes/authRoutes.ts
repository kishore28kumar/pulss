import { Router } from 'express';
import {
  loginUser,
  loginCustomer,
  registerCustomer,
  getCurrentUser,
  getCurrentCustomer,
  refreshToken,
} from '../controllers/authController';
import { authenticateUser, authenticateCustomer } from '../middleware/authMiddleware';

const router = Router();

// Admin/Staff Authentication
router.post('/login', loginUser);
router.get('/me', authenticateUser, getCurrentUser);

// Customer Authentication
router.post('/customer/login', loginCustomer);
router.post('/customer/register', registerCustomer);
router.get('/customer/me', authenticateCustomer, getCurrentCustomer);

// Token Refresh
router.post('/refresh', refreshToken);

export default router;

