// Notification Provider Interface
export interface NotificationProvider {
  sendPushNotification(token: string, notification: PushNotification): Promise<boolean>
  sendToTopic(topic: string, notification: PushNotification): Promise<boolean>
  isConfigured(): boolean
}

export interface PushNotification {
  title: string
  body: string
  data?: Record<string, any>
  imageUrl?: string
  clickAction?: string
}

import { MockNotificationProvider } from './mock'

// Provider factory
export const createNotificationProvider = (): NotificationProvider => {
  return new MockNotificationProvider()
}