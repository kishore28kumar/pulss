// WhatsApp Provider Interface
export interface WhatsAppProvider {
  sendMessage(to: string, message: string): Promise<boolean>
  sendTemplate(to: string, templateId: string, params: Record<string, any>): Promise<boolean>
  isConfigured(): boolean
}

import { MockWhatsAppProvider } from './mock'

// Provider factory
export const createWhatsAppProvider = (): WhatsAppProvider => {
  return new MockWhatsAppProvider()
}