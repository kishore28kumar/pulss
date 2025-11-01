// Payment Provider Interface
export interface PaymentProvider {
  createOrder(orderData: PaymentOrderData): Promise<PaymentOrder>
  verifyPayment(paymentData: PaymentVerificationData): Promise<boolean>
  getPaymentStatus(orderId: string): Promise<PaymentStatus>
}

export interface PaymentOrderData {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  notes?: Record<string, any>
}

export interface PaymentOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
  redirectUrl?: string
  paymentData?: any
}

export interface PaymentVerificationData {
  orderId: string
  paymentId: string
  signature: string
  amount: number
}

export interface PaymentStatus {
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount: number
  paidAmount?: number
  refundedAmount?: number
}

import { RazorpayProvider } from './razorpay'
import { StripeProvider } from './stripe'
import { PaytmProvider } from './paytm'
import { MockPaymentProvider } from './mock'

// Provider factory
export const createPaymentProvider = (provider: string): PaymentProvider => {
  switch (provider) {
    case 'razorpay':
      return new RazorpayProvider()
    case 'stripe':
      return new StripeProvider()
    case 'paytm':
      return new PaytmProvider()
    default:
      return new MockPaymentProvider()
  }
}