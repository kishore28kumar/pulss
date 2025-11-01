import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  Shield
} from '@phosphor-icons/react'
import { useAuth } from '@/lib/useAuth'

interface ApiKey {
  id: string
  key_name: string
  key_prefix: string
  scopes: string[]
  permissions: Record<string, string[]>
  rate_limit_per_hour: number
  rate_limit_per_day: number
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  total_requests: number
  description: string
  environment: string
  created_at: string
}

export const ApiKeyManagement = () => {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [showFullKey, setShowFullKey] = useState(false)

  // Form state for creating new API key
  const [formData, setFormData] = useState({
    key_name: '',
    description: '',
    environment: 'production',
    scopes: [] as string[],
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000,
    expires_in_days: 365
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-management/keys', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.data)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('Failed to fetch API keys')
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/api-management/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setNewApiKey(data.data.api_key)
        toast.success('API key created successfully')
        fetchApiKeys()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Failed to create API key')
    }
  }

  const revokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-management/keys/${id}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        toast.success('API key revoked successfully')
        fetchApiKeys()
      } else {
        toast.error('Failed to revoke API key')
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error('Failed to revoke API key')
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-management/keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (response.ok) {
        toast.success('API key deleted successfully')
        fetchApiKeys()
      } else {
        toast.error('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false)
    setNewApiKey(null)
    setFormData({
      key_name: '',
      description: '',
      environment: 'production',
      scopes: [],
      rate_limit_per_hour: 1000,
      rate_limit_per_day: 10000,
      expires_in_days: 365
    })
  }

  const availableScopes = [
    { value: 'read:products', label: 'Read Products' },
    { value: 'write:products', label: 'Write Products' },
    { value: 'read:orders', label: 'Read Orders' },
    { value: 'write:orders', label: 'Write Orders' },
    { value: 'read:customers', label: 'Read Customers' },
    { value: 'write:customers', label: 'Write Customers' },
    { value: 'read:analytics', label: 'Read Analytics' }
  ]

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
            <Key className="h-6 w-6" />
            API Key Management
          </h2>
          <p className="text-muted-foreground">
            Generate and manage API keys for programmatic access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for accessing the Pulss API programmatically
              </DialogDescription>
            </DialogHeader>

            {newApiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Save your API key securely
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        This key will only be shown once. Make sure to copy it now and store it in a safe place.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newApiKey}
                      readOnly
                      type={showFullKey ? 'text' : 'password'}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowFullKey(!showFullKey)}
                    >
                      {showFullKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="key_name">Key Name *</Label>
                    <Input
                      id="key_name"
                      placeholder="Production API Key"
                      value={formData.key_name}
                      onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Used for production integrations"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={formData.environment}
                        onValueChange={(value) => setFormData({ ...formData, environment: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires_in_days">Expires In (Days)</Label>
                      <Input
                        id="expires_in_days"
                        type="number"
                        value={formData.expires_in_days}
                        onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate_limit_hour">Hourly Rate Limit</Label>
                      <Input
                        id="rate_limit_hour"
                        type="number"
                        value={formData.rate_limit_per_hour}
                        onChange={(e) => setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate_limit_day">Daily Rate Limit</Label>
                      <Input
                        id="rate_limit_day"
                        type="number"
                        value={formData.rate_limit_per_day}
                        onChange={(e) => setFormData({ ...formData, rate_limit_per_day: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableScopes.map((scope) => (
                        <div key={scope.value} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.scopes.includes(scope.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, scopes: [...formData.scopes, scope.value] })
                              } else {
                                setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope.value) })
                              }
                            }}
                          />
                          <Label className="text-sm cursor-pointer">{scope.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {newApiKey ? (
                <Button onClick={handleCreateDialogClose}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCreateDialogClose}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey} disabled={!formData.key_name}>
                    Generate API Key
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No API keys yet</p>
            <p className="text-muted-foreground mb-4">Create your first API key to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {apiKey.key_name}
                      {apiKey.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Revoked
                        </Badge>
                      )}
                      <Badge variant="outline">{apiKey.environment}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {apiKey.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {apiKey.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeApiKey(apiKey.id)}
                      >
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Key prefix */}
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1 bg-muted rounded font-mono text-sm">
                      {apiKey.key_prefix}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key_prefix)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Total Requests
                      </p>
                      <p className="text-2xl font-bold">{apiKey.total_requests.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Hourly Limit</p>
                      <p className="text-2xl font-bold">{apiKey.rate_limit_per_hour.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Daily Limit</p>
                      <p className="text-2xl font-bold">{apiKey.rate_limit_per_day.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Last Used
                      </p>
                      <p className="text-sm font-medium">
                        {apiKey.last_used_at
                          ? new Date(apiKey.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Scopes */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                    {apiKey.expires_at && (
                      <span>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
