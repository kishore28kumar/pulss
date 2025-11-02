import { Router } from 'express';
import {
  createPaymentIntent,
  handleStripeWebhook,
  getPublishableKey,
} from '../controllers/stripeController';
import { authenticateCustomer } from '../middleware/authMiddleware';
import express from 'express';

const router = Router();

// Webhook (raw body required)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Public key
router.get('/config', getPublishableKey);

// Create payment intent (customer only)
router.post('/create-payment-intent', authenticateCustomer, createPaymentIntent);

export default router;

