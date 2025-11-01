import { 
  PaymentProvider, 
  PaymentOrderData, 
  PaymentOrder, 
  PaymentVerificationData, 
  PaymentStatus 
} from './index'

export class PaytmProvider implements PaymentProvider {
  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrder> {
    const response = await fetch('/functions/payments-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paytm',
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.orderId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create Paytm order')
    }

    const data = await response.json()
    
    return {
      id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      receipt: orderData.orderId,
      status: 'created',
      redirectUrl: data.redirectUrl,
      paymentData: data
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<boolean> {
    const response = await fetch('/functions/payments-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paytm',
        ...paymentData
      })
    })

    return response.ok
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    const response = await fetch(`/functions/payments-status?provider=paytm&orderId=${orderId}`)
    const data = await response.json()
    
    return {
      status: data.status,
      amount: data.amount,
      paidAmount: data.amount,
      refundedAmount: data.refund_amount || 0
    }
  }
}