import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { 
  Workflow, 
  Activity, 
  Settings, 
  History, 
  TestTube,
  Check,
  X,
  AlertCircle,
  TrendingUp
} from '@phosphor-icons/react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface WorkflowTrigger {
  id: string
  tenant_id: string
  event_type: string
  enabled: boolean
  webhook_url?: string
  config: any
  created_at: string
  updated_at: string
}

interface WebhookEvent {
  key: string
  value: string
  name: string
}

interface WebhookLog {
  id: string
  tenant_id: string
  event_type: string
  payload: any
  response: any
  success: boolean
  error_message?: string
  triggered_at: string
  duration_ms?: number
}

export const N8nWorkflows: React.FC = () => {
  const { profile, token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // Fetch n8n health status
  const { data: health } = useQuery({
    queryKey: ['n8n-health'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/n8n/health`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch n8n health')
      return res.json()
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch available events
  const { data: events } = useQuery<{ events: WebhookEvent[] }>({
    queryKey: ['n8n-events'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/n8n/events`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    }
  })

  // Fetch workflow triggers
  const { data: triggers, isLoading: triggersLoading } = useQuery<{ triggers: WorkflowTrigger[] }>({
    queryKey: ['n8n-triggers', profile?.tenant_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/n8n/triggers?tenant_id=${profile?.tenant_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch triggers')
      return res.json()
    },
    enabled: !!profile?.tenant_id
  })

  // Fetch webhook logs
  const { data: logs } = useQuery<{ logs: WebhookLog[], pagination: any }>({
    queryKey: ['n8n-logs', profile?.tenant_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/n8n/logs?tenant_id=${profile?.tenant_id}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    enabled: !!profile?.tenant_id
  })

  // Fetch webhook stats
  const { data: stats } = useQuery({
    queryKey: ['n8n-stats', profile?.tenant_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/n8n/stats?tenant_id=${profile?.tenant_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: !!profile?.tenant_id
  })

  // Update trigger mutation
  const updateTrigger = useMutation({
    mutationFn: async ({ event_type, enabled }: { event_type: string, enabled: boolean }) => {
      const res = await fetch(`${API_URL}/api/n8n/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: profile?.tenant_id,
          event_type,
          enabled,
          config: {}
        })
      })
      if (!res.ok) throw new Error('Failed to update trigger')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n-triggers'] })
      toast.success('Workflow trigger updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update trigger: ${error.message}`)
    }
  })

  // Test webhook mutation
  const testWebhook = useMutation({
    mutationFn: async (event_type: string) => {
      const res = await fetch(`${API_URL}/api/n8n/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: profile?.tenant_id,
          event_type,
          test_data: { message: 'Test webhook from Pulss admin' }
        })
      })
      if (!res.ok) throw new Error('Failed to test webhook')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Test webhook triggered successfully')
      queryClient.invalidateQueries({ queryKey: ['n8n-logs'] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to test webhook: ${error.message}`)
    }
  })

  const getTriggerStatus = (event_type: string): boolean => {
    const trigger = triggers?.triggers?.find(t => t.event_type === event_type)
    return trigger?.enabled || false
  }

  const getHealthBadge = () => {
    if (!health) return null
    
    const statusColors = {
      healthy: 'bg-green-500',
      unhealthy: 'bg-red-500',
      disabled: 'bg-gray-500'
    }

    return (
      <Badge className={`${statusColors[health.status as keyof typeof statusColors]} text-white`}>
        {health.status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">n8n Workflow Automation</h1>
          <p className="text-gray-600 mt-1">
            Manage workflow triggers and monitor webhook activity
          </p>
        </div>
        {getHealthBadge()}
      </div>

      <Tabs defaultValue="triggers" className="w-full">
        <TabsList>
          <TabsTrigger value="triggers">
            <Workflow className="w-4 h-4 mr-2" />
            Workflow Triggers
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="w-4 h-4 mr-2" />
            Webhook Logs
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Webhook Events</CardTitle>
              <CardDescription>
                Enable or disable webhook triggers for different events in your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {health?.status === 'disabled' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">n8n Integration Disabled</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        The n8n integration is currently disabled. Contact your administrator to enable it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {triggersLoading ? (
                <div className="text-center py-8">Loading triggers...</div>
              ) : (
                <div className="space-y-3">
                  {events?.events?.map((event) => {
                    const isEnabled = getTriggerStatus(event.value)
                    return (
                      <div
                        key={event.value}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-gray-500">{event.value}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testWebhook.mutate(event.value)}
                            disabled={!isEnabled || health?.status !== 'healthy'}
                          >
                            <TestTube className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) =>
                              updateTrigger.mutate({ event_type: event.value, enabled: checked })
                            }
                            disabled={health?.status !== 'healthy'}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Activity</CardTitle>
              <CardDescription>
                View recent webhook triggers and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs?.logs?.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{log.event_type}</span>
                        {log.success ? (
                          <Badge className="bg-green-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">
                            <X className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(log.triggered_at).toLocaleString()}
                        {log.duration_ms && ` • ${log.duration_ms}ms`}
                      </div>
                      {log.error_message && (
                        <div className="text-sm text-red-600 mt-1">{log.error_message}</div>
                      )}
                    </div>
                  </div>
                ))}
                {!logs?.logs?.length && (
                  <div className="text-center py-8 text-gray-500">
                    No webhook activity yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.stats?.map((stat: any) => (
              <Card key={stat.event_type}>
                <CardHeader>
                  <CardTitle className="text-sm">{stat.event_type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Triggers:</span>
                    <span className="font-semibold">{stat.total_triggers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Successful:</span>
                    <span className="font-semibold text-green-600">{stat.successful}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed:</span>
                    <span className="font-semibold text-red-600">{stat.failed}</span>
                  </div>
                  {stat.avg_duration_ms && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Duration:</span>
                      <span className="font-semibold">{Math.round(stat.avg_duration_ms)}ms</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!stats?.stats?.length && (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No statistics available yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default N8nWorkflows
