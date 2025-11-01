import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Bell, ChatCircle, EnvelopeSimple, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MessageLog {
  message_log_id: string
  type: string
  phone_number: string
  message: string
  status: string
  sent_at: string
}

export const MessagingCenter = () => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([])
  const [config, setConfig] = useState({
    twilioEnabled: false,
    whatsappBusinessEnabled: false,
    twilioConfigured: false,
    whatsappConfigured: false,
  })
  const [activeTab, setActiveTab] = useState('broadcast')

  useEffect(() => {
    fetchConfig()
    fetchMessageLogs()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/messaging/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const fetchMessageLogs = async () => {
    try {
      const response = await fetch('/api/messaging/logs?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setMessageLogs(data.logs)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/messaging/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          method: 'whatsapp',
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Messages sent successfully!')
        setMessage('')
        fetchMessageLogs()
      } else {
        toast.error('Failed to send messages')
      }
    } catch (error) {
      console.error('Error sending messages:', error)
      toast.error('Failed to send messages')
    } finally {
      setSending(false)
    }
  }

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/messaging/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          method: 'sms',
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('SMS messages sent successfully!')
        setMessage('')
        fetchMessageLogs()
      } else {
        toast.error('Failed to send SMS messages')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast.error('Failed to send SMS messages')
    } finally {
      setSending(false)
    }
  }

  const handleSendPushNotification = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Push notifications sent successfully!')
        setMessage('')
      } else {
        toast.error('Failed to send push notifications')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Failed to send push notifications')
    } finally {
      setSending(false)
    }
  }

  const isMessagingConfigured = config.twilioConfigured || config.whatsappConfigured

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messaging Center</h1>
        <p className="text-muted-foreground">
          Send messages and notifications to your customers
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>
            Check which messaging services are configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <ChatCircle className="h-5 w-5" />
                <span className="font-medium">Twilio SMS</span>
              </div>
              <Badge variant={config.twilioEnabled && config.twilioConfigured ? 'default' : 'secondary'}>
                {config.twilioEnabled && config.twilioConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <EnvelopeSimple className="h-5 w-5" />
                <span className="font-medium">WhatsApp Business</span>
              </div>
              <Badge variant={config.whatsappBusinessEnabled && config.whatsappConfigured ? 'default' : 'secondary'}>
                {config.whatsappBusinessEnabled && config.whatsappConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="broadcast">Broadcast Message</TabsTrigger>
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
          <TabsTrigger value="logs">Message Logs</TabsTrigger>
        </TabsList>

        {/* Broadcast Message */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Broadcast Message</CardTitle>
              <CardDescription>
                Send a message to all your active customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 characters
                </p>
              </div>

              {!isMessagingConfigured && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No messaging service configured. Please configure Twilio or WhatsApp Business API in your environment settings.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSendWhatsApp}
                  disabled={sending || !isMessagingConfigured}
                  className="flex-1"
                >
                  <ChatCircle className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
                <Button
                  onClick={handleSendSMS}
                  disabled={sending || !isMessagingConfigured}
                  variant="outline"
                  className="flex-1"
                >
                  <EnvelopeSimple className="h-4 w-4 mr-2" />
                  Send via SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Push Notifications */}
        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
              <CardDescription>
                Send a push notification to customers who have enabled notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="push-message">Notification Message</Label>
                <Textarea
                  id="push-message"
                  placeholder="Enter your notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/200 characters (keep it short for better engagement)
                </p>
              </div>

              <Button
                onClick={handleSendPushNotification}
                disabled={sending}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Push Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                View the history of sent messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {messageLogs.length > 0 ? (
                  messageLogs.map((log) => (
                    <div key={log.message_log_id} className="p-3 border rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.type === 'whatsapp' ? 'default' : 'secondary'}>
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.phone_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.status === 'sent' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.sent_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No messages sent yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
