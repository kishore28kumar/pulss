import { 
  PaymentProvider, 
  PaymentOrderData, 
  PaymentOrder, 
  PaymentVerificationData, 
  PaymentStatus 
} from './index'

export class MockPaymentProvider implements PaymentProvider {
  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrder> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      id: `mock_order_${Date.now()}`,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.orderId,
      status: 'created',
      redirectUrl: `/payment-mock?orderId=${orderData.orderId}&amount=${orderData.amount}`
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<boolean> {
    // Mock verification - always returns true in development
    await new Promise(resolve => setTimeout(resolve, 300))
    return true
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      status: 'paid',
      amount: 100,
      paidAmount: 100
    }
  }
}