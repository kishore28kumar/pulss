import { 
  PaymentProvider, 
  PaymentOrderData, 
  PaymentOrder, 
  PaymentVerificationData, 
  PaymentStatus 
} from './index'

declare global {
  interface Window {
    Razorpay: any
  }
}

export class RazorpayProvider implements PaymentProvider {
  private async loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) return

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay script'))
      document.head.appendChild(script)
    })
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrder> {
    // This would typically call your backend function
    const response = await fetch('/functions/payments-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'razorpay',
        amount: orderData.amount * 100, // Razorpay expects amount in paise
        currency: orderData.currency,
        receipt: orderData.orderId,
        notes: orderData.notes
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order')
    }

    const data = await response.json()
    
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
      paymentData: data
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<boolean> {
    const response = await fetch('/functions/payments-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'razorpay',
        ...paymentData
      })
    })

    return response.ok
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    // This would call Razorpay API via your backend
    const response = await fetch(`/functions/payments-status?orderId=${orderId}`)
    const data = await response.json()
    
    return {
      status: data.status,
      amount: data.amount,
      paidAmount: data.amount_paid,
      refundedAmount: data.amount_refunded
    }
  }

  async openCheckout(order: PaymentOrder, options: {
    customerName: string
    customerEmail?: string
    customerPhone?: string
    onSuccess: (response: any) => void
    onError: (error: any) => void
  }): Promise<void> {
    await this.loadRazorpayScript()

    const razorpay = new window.Razorpay({
      key: 'YOUR_RAZORPAY_KEY_ID', // This should come from your backend
      amount: order.amount,
      currency: order.currency,
      name: 'Pulss Pharmacy',
      description: `Order #${order.receipt}`,
      order_id: order.id,
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone
      },
      handler: options.onSuccess,
      modal: {
        ondismiss: () => options.onError(new Error('Payment cancelled'))
      }
    })

    razorpay.open()
  }
}