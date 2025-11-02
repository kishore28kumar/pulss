import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { authenticateCustomer } from '../middleware/authMiddleware';

const router = Router();

// All cart routes require customer authentication
router.get('/', authenticateCustomer, getCart);
router.post('/', authenticateCustomer, addToCart);
router.put('/:id', authenticateCustomer, updateCartItem);
router.delete('/:id', authenticateCustomer, removeFromCart);
router.delete('/', authenticateCustomer, clearCart);

export default router;

