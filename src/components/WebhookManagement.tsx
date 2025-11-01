import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Webhook, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Activity,
  Play,
  Clock,
  ArrowRight
} from '@phosphor-icons/react'
import { useAuth } from '@/lib/useAuth'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  is_verified: boolean
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_triggered_at: string | null
  description: string
  created_at: string
}

interface WebhookDelivery {
  id: string
  event_type: string
  status: string
  http_status_code: number | null
  error_message: string | null
  attempt_number: number
  created_at: string
  delivered_at: string | null
}

export const WebhookManagement = () => {
  const { user } = useAuth()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    retry_attempts: 3,
    timeout_seconds: 30
  })

  const availableEvents = [
    { value: 'order.created', label: 'Order Created', description: 'Triggered when a new order is placed' },
    { value: 'order.updated', label: 'Order Updated', description: 'Triggered when order status changes' },
    { value: 'order.cancelled', label: 'Order Cancelled', description: 'Triggered when an order is cancelled' },
    { value: 'customer.created', label: 'Customer Created', description: 'Triggered when a new customer signs up' },
    { value: 'customer.updated', label: 'Customer Updated', description: 'Triggered when customer details change' },
    { value: 'product.created', label: 'Product Created', description: 'Triggered when a new product is added' },
    { value: 'product.updated', label: 'Product Updated', description: 'Triggered when product details change' },
    { value: 'product.inventory_low', label: 'Low Inventory', description: 'Triggered when product stock is low' }
  ]

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/api-management/webhooks', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.data)
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      toast.error('Failed to fetch webhooks')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async (webhookId: string) => {
    setLoadingDeliveries(true)
    try {
      const response = await fetch(`/api/api-management/webhooks/${webhookId}/deliveries`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeliveries(data.data)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      toast.error('Failed to fetch deliveries')
    } finally {
      setLoadingDeliveries(false)
    }
  }

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/api-management/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Webhook created successfully')
        setIsCreateDialogOpen(false)
        fetchWebhooks()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create webhook')
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      toast.error('Failed to create webhook')
    }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return
    }

    try {
      const response = await fetch(`/api/api-management/webhooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        toast.success('Webhook deleted successfully')
        fetchWebhooks()
      } else {
        toast.error('Failed to delete webhook')
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
      toast.error('Failed to delete webhook')
    }
  }

  const testWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/api-management/webhooks/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Webhook test successful')
        } else {
          toast.error('Webhook test failed')
        }
      } else {
        toast.error('Failed to test webhook')
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast.error('Failed to test webhook')
    }
  }

  const toggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/api-management/webhooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        toast.success(`Webhook ${!isActive ? 'enabled' : 'disabled'}`)
        fetchWebhooks()
      } else {
        toast.error('Failed to update webhook')
      }
    } catch (error) {
      console.error('Error updating webhook:', error)
      toast.error('Failed to update webhook')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      events: [],
      retry_attempts: 3,
      timeout_seconds: 30
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhook Management
          </h2>
          <p className="text-muted-foreground">
            Receive real-time notifications for events in your store
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive real-time event notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                  id="name"
                  placeholder="Production Webhook"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/webhooks"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Webhook for order notifications"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Events to Subscribe *</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {availableEvents.map((event) => (
                    <div key={event.value} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, events: [...formData.events, event.value] })
                            } else {
                              setFormData({ ...formData, events: formData.events.filter(e => e !== event.value) })
                            }
                          }}
                        />
                        <Label className="text-sm font-medium cursor-pointer">{event.label}</Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-8">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry_attempts">Retry Attempts</Label>
                  <Input
                    id="retry_attempts"
                    type="number"
                    value={formData.retry_attempts}
                    onChange={(e) => setFormData({ ...formData, retry_attempts: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createWebhook} disabled={!formData.name || !formData.url || formData.events.length === 0}>
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No webhooks configured</p>
            <p className="text-muted-foreground mb-4">Create your first webhook to receive event notifications</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {webhook.name}
                      {webhook.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {webhook.description || 'No description provided'}
                    </CardDescription>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => toggleWebhook(webhook.id, webhook.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stats">
                  <TabsList>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="deliveries" onClick={() => fetchDeliveries(webhook.id)}>
                      Deliveries
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          Total Deliveries
                        </p>
                        <p className="text-2xl font-bold">{webhook.total_deliveries}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Successful
                        </p>
                        <p className="text-2xl font-bold text-green-600">{webhook.successful_deliveries}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Failed
                        </p>
                        <p className="text-2xl font-bold text-red-600">{webhook.failed_deliveries}</p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Last triggered: {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleString()
                        : 'Never'}
                    </div>
                  </TabsContent>

                  <TabsContent value="events">
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="deliveries">
                    {loadingDeliveries ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : deliveries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No deliveries yet</p>
                    ) : (
                      <div className="space-y-2">
                        {deliveries.slice(0, 5).map((delivery) => (
                          <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{delivery.event_type}</span>
                                {getStatusBadge(delivery.status)}
                                {delivery.http_status_code && (
                                  <Badge variant="outline">{delivery.http_status_code}</Badge>
                                )}
                              </div>
                              {delivery.error_message && (
                                <p className="text-xs text-red-600">{delivery.error_message}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(delivery.created_at).toLocaleString()}
                                {delivery.attempt_number > 1 && ` • Attempt ${delivery.attempt_number}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
