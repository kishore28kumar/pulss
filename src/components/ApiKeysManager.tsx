import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Key, Copy, Trash, Plus, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  tenant_id: string
  key_name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface ApiKeysManagerProps {
  apiUrl: string
  authToken: string
  tenantId?: string
}

export const ApiKeysManager: React.FC<ApiKeysManagerProps> = ({
  apiUrl,
  authToken,
  tenantId
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({})

  // Form state
  const [keyName, setKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])

  const availableScopes = [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'customers:read',
    'customers:write',
    'inventory:read',
    'inventory:write',
    'analytics:read'
  ]

  // Load API keys
  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const url = tenantId 
        ? `${apiUrl}/super-admin/api-keys?tenant_id=${tenantId}`
        : `${apiUrl}/super-admin/api-keys`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to load API keys')

      const data = await response.json()
      setApiKeys(data.data || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  // Generate new API key
  const generateApiKey = async () => {
    try {
      if (!keyName) {
        toast.error('Please enter a key name')
        return
      }

      if (selectedScopes.length === 0) {
        toast.error('Please select at least one scope')
        return
      }

      const response = await fetch(`${apiUrl}/super-admin/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key_name: keyName,
          scopes: selectedScopes,
          tenant_id: tenantId
        })
      })

      if (!response.ok) throw new Error('Failed to generate API key')

      const data = await response.json()
      setNewKey(data.data.api_key)
      
      // Reset form
      setKeyName('')
      setSelectedScopes([])
      
      // Reload keys
      await loadApiKeys()
      
      toast.success('API key generated successfully')
    } catch (error) {
      console.error('Error generating API key:', error)
      toast.error('Failed to generate API key')
    }
  }

  // Revoke API key
  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}/super-admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to revoke API key')

      await loadApiKeys()
      toast.success('API key revoked')
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error('Failed to revoke API key')
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for partner integrations
            </CardDescription>
          </div>
          <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Generate New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for partner integrations
                </DialogDescription>
              </DialogHeader>

              {newKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      ⚠️ Save this key securely - it will not be shown again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white rounded text-sm font-mono break-all">
                        {newKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewKey(null)
                      setShowNewKeyDialog(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g., Production API, Inventory Sync"
                    />
                  </div>

                  <div>
                    <Label>Scopes (Permissions)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableScopes.map(scope => (
                        <label
                          key={scope}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, scope])
                              } else {
                                setSelectedScopes(selectedScopes.filter(s => s !== scope))
                              }
                            }}
                          />
                          <span className="text-sm">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" onClick={generateApiKey}>
                    Generate API Key
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API keys generated yet
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map(key => (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{key.key_name}</h4>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {key.key_prefix}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key_prefix)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {key.scopes.map(scope => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDate(key.created_at)} • 
                        Last used: {formatDate(key.last_used_at)}
                      </div>
                    </div>
                    {key.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeApiKey(key.id)}
                      >
                        <Trash className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
