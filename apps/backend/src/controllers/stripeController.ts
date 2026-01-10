import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreatePaymentIntentDTO } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// ============================================
// CREATE PAYMENT INTENT
// ============================================

export const createPaymentIntent = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const { orderId, amount, currency = 'usd' } = req.body as CreatePaymentIntentDTO;

    if (!orderId || !amount) {
      throw new AppError('Order ID and amount are required', 400);
    }

    // Verify order belongs to customer
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        customerId: req.customerId,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new AppError('Order is already paid', 400);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: req.customerId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        paymentId: paymentIntent.id,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };

    res.json(response);
  }
);

// ============================================
// STRIPE WEBHOOK HANDLER
// ============================================

export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw new AppError('Webhook signature verification failed', 400);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// ============================================
// HELPER: Handle Payment Success
// ============================================

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('Order ID not found in payment intent metadata');
    return;
  }

  await prisma.orders.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'COMPLETED',
      status: 'CONFIRMED',
    },
  });

  console.log(`✅ Payment successful for order: ${orderId}`);

  // TODO: Send order confirmation email
}

// ============================================
// HELPER: Handle Payment Failure
// ============================================

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('Order ID not found in payment intent metadata');
    return;
  }

  await prisma.orders.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'FAILED',
    },
  });

  console.log(`❌ Payment failed for order: ${orderId}`);

  // TODO: Send payment failed email
}

// ============================================
// GET PUBLISHABLE KEY
// ============================================

export const getPublishableKey = asyncHandler(
  async (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    };

    res.json(response);
  }
);

