import { NotificationProvider, PushNotification } from './index'

export class MockNotificationProvider implements NotificationProvider {
  async sendPushNotification(token: string, notification: PushNotification): Promise<boolean> {
    console.log(`[Mock FCM] Sending notification to token: ${token.substring(0, 20)}...`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Log notification details
    console.table({
      'Title': notification.title,
      'Body': notification.body,
      'Data': JSON.stringify(notification.data || {}),
      'Image': notification.imageUrl || 'None',
      'Action': notification.clickAction || 'None',
      'Status': 'Sent (Mock)'
    })
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.imageUrl || '/favicon.ico'
      })
    }
    
    return true
  }

  async sendToTopic(topic: string, notification: PushNotification): Promise<boolean> {
    console.log(`[Mock FCM] Sending notification to topic: ${topic}`)
    
    await new Promise(resolve => setTimeout(resolve, 400))
    
    console.table({
      'Topic': topic,
      'Title': notification.title,
      'Body': notification.body,
      'Status': 'Sent to Topic (Mock)'
    })
    
    return true
  }

  isConfigured(): boolean {
    return true // Mock provider is always "configured"
  }

  // Helper method to request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
}