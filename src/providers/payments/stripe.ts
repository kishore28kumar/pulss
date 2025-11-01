import { 
  PaymentProvider, 
  PaymentOrderData, 
  PaymentOrder, 
  PaymentVerificationData, 
  PaymentStatus 
} from './index'

export class StripeProvider implements PaymentProvider {
  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrder> {
    const response = await fetch('/functions/payments-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'stripe',
        amount: orderData.amount * 100, // Stripe expects amount in cents
        currency: orderData.currency,
        receipt: orderData.orderId,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create Stripe payment intent')
    }

    const data = await response.json()
    
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: orderData.orderId,
      status: data.status,
      paymentData: {
        client_secret: data.client_secret
      }
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<boolean> {
    const response = await fetch('/functions/payments-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'stripe',
        ...paymentData
      })
    })

    return response.ok
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    const response = await fetch(`/functions/payments-status?provider=stripe&orderId=${orderId}`)
    const data = await response.json()
    
    return {
      status: data.status,
      amount: data.amount,
      paidAmount: data.amount_received,
      refundedAmount: data.amount_refunded
    }
  }
}