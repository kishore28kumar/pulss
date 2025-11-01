import { WhatsAppProvider } from './index'

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, message: string): Promise<boolean> {
    console.log(`[Mock WhatsApp] Sending message to ${to}: ${message}`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Log to console for development
    console.table({
      'To': to,
      'Message': message,
      'Status': 'Sent (Mock)',
      'Timestamp': new Date().toISOString()
    })
    
    return true
  }

  async sendTemplate(to: string, templateId: string, params: Record<string, any>): Promise<boolean> {
    console.log(`[Mock WhatsApp] Sending template ${templateId} to ${to}`, params)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockMessage = this.generateTemplateMessage(templateId, params)
    
    console.table({
      'To': to,
      'Template': templateId,
      'Generated Message': mockMessage,
      'Status': 'Sent (Mock)',
      'Timestamp': new Date().toISOString()
    })
    
    return true
  }

  isConfigured(): boolean {
    return true // Mock provider is always "configured"
  }

  private generateTemplateMessage(templateId: string, params: Record<string, any>): string {
    const templates = {
      'order_confirmation': `Hi ${params.customerName}! Your order #${params.orderId} for ₹${params.amount} has been confirmed. We'll notify you when it's ready for delivery.`,
      'order_shipped': `Your order #${params.orderId} has been shipped and is on the way! Track your delivery or call us for updates.`,
      'order_delivered': `Your order #${params.orderId} has been delivered successfully. Thank you for choosing us!`,
      'payment_reminder': `Hi ${params.customerName}, your order #${params.orderId} payment of ₹${params.amount} is pending. Please complete the payment to process your order.`
    }
    
    return templates[templateId as keyof typeof templates] || `Template: ${templateId} - ${JSON.stringify(params)}`
  }
}