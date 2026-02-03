import { Router } from 'express';
import {
  loginUser,
  loginCustomer,
  registerCustomer,
  getCurrentUser,
  updateUserProfile,
  getCurrentCustomer,
  updateCustomerProfile,
  refreshToken,
  generateLoginToken,
  verifyLoginToken,
  forgotPasswordCustomer,
  resetPasswordCustomer,
} from '../controllers/authController';
import { authenticateUser, authenticateCustomer } from '../middleware/authMiddleware';

const router = Router();

// Admin/Staff Authentication
router.post('/login', loginUser);
router.get('/me', authenticateUser, getCurrentUser);
router.put('/profile', authenticateUser, updateUserProfile);

// Customer Authentication
router.post('/customer/login', loginCustomer);
router.post('/customer/register', registerCustomer);
router.get('/customer/me', authenticateCustomer, getCurrentCustomer);
router.put('/customer/profile', authenticateCustomer, updateCustomerProfile);
router.post('/customer/forgot-password', forgotPasswordCustomer);
router.post('/customer/reset-password', resetPasswordCustomer);

// Token Refresh
router.post('/refresh', refreshToken);

// Generate temporary login token (SUPER_ADMIN only)
router.get('/login-token/:userId', authenticateUser, generateLoginToken);
// Verify login token and login
router.post('/login-token', verifyLoginToken);

export default router;

