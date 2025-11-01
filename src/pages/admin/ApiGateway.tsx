import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  KeyRound,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  TrendingUp,
  Globe,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ApiKey {
  key_id: string;
  key_name: string;
  api_key_prefix: string;
  key_type: string;
  scopes: string[];
  status: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface ApiScope {
  scope_id: string;
  scope_name: string;
  scope_group: string;
  description: string;
}

export default function ApiGateway() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [availableScopes, setAvailableScopes] = useState<Record<string, ApiScope[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newApiSecret, setNewApiSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // New key form state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [rateLimitMinute, setRateLimitMinute] = useState('60');
  const [rateLimitHour, setRateLimitHour] = useState('1000');
  const [rateLimitDay, setRateLimitDay] = useState('10000');

  useEffect(() => {
    loadApiKeys();
    loadScopes();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gateway/keys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const loadScopes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gateway/scopes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableScopes(data.data || {});
      }
    } catch (error) {
      console.error('Error loading scopes:', error);
    }
  };

  const generateApiKey = async () => {
    if (!keyName.trim() || selectedScopes.length === 0) {
      toast.error('Please provide a key name and select at least one scope');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gateway/keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key_name: keyName,
          scopes: selectedScopes,
          description,
          rate_limit_per_minute: parseInt(rateLimitMinute),
          rate_limit_per_hour: parseInt(rateLimitHour),
          rate_limit_per_day: parseInt(rateLimitDay)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.data.api_key);
        setNewApiSecret(data.data.api_secret);
        toast.success('API key generated successfully');
        loadApiKeys();
        
        // Reset form
        setKeyName('');
        setSelectedScopes([]);
        setDescription('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gateway/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('API key revoked successfully');
        loadApiKeys();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'revoked':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Gateway</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys, monitor usage, and configure integrations
          </p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific permissions and rate limits
              </DialogDescription>
            </DialogHeader>

            {newApiKey ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Save your API key and secret now!
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        For security reasons, you won't be able to see them again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newApiKey} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newApiKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>API Secret</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type={showSecret ? 'text' : 'password'}
                        value={newApiSecret || ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newApiSecret || '')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setNewApiKey(null);
                    setNewApiSecret(null);
                    setShowNewKeyDialog(false);
                    setShowSecret(false);
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name *</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <Label>Scopes * (Select at least one)</Label>
                  <div className="mt-2 space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {Object.entries(availableScopes).map(([group, scopes]) => (
                      <div key={group}>
                        <h4 className="font-medium text-sm mb-2 capitalize">{group}</h4>
                        <div className="space-y-2 ml-4">
                          {scopes.map((scope) => (
                            <div key={scope.scope_id} className="flex items-start space-x-2">
                              <Checkbox
                                id={scope.scope_id}
                                checked={selectedScopes.includes(scope.scope_name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedScopes([...selectedScopes, scope.scope_name]);
                                  } else {
                                    setSelectedScopes(selectedScopes.filter(s => s !== scope.scope_name));
                                  }
                                }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={scope.scope_id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {scope.scope_name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {scope.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rateLimitMinute">Rate Limit (per minute)</Label>
                    <Input
                      id="rateLimitMinute"
                      type="number"
                      value={rateLimitMinute}
                      onChange={(e) => setRateLimitMinute(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rateLimitHour">Rate Limit (per hour)</Label>
                    <Input
                      id="rateLimitHour"
                      type="number"
                      value={rateLimitHour}
                      onChange={(e) => setRateLimitHour(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rateLimitDay">Rate Limit (per day)</Label>
                    <Input
                      id="rateLimitDay"
                      type="number"
                      value={rateLimitDay}
                      onChange={(e) => setRateLimitDay(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateApiKey} className="flex-1">
                    Generate Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewKeyDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">
            <KeyRound className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Globe className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <KeyRound className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No API Keys Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate your first API key to start integrating with external services
                </p>
                <Button onClick={() => setShowNewKeyDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card key={key.key_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {key.key_name}
                          <Badge className={getStatusColor(key.status)}>
                            {key.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="font-mono text-sm">
                          {key.api_key_prefix}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeApiKey(key.key_id)}
                        disabled={key.status === 'revoked'}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Requests</p>
                        <p className="font-medium text-lg">{key.total_requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium text-lg">
                          {key.total_requests > 0
                            ? Math.round((key.successful_requests / key.total_requests) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Used</p>
                        <p className="font-medium">
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Scopes</p>
                        <p className="font-medium">{key.scopes.length} permissions</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Monitor API usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate with the API Gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the Authorization header:
                </p>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  <code>Authorization: ApiKey YOUR_API_KEY</code>
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Rate Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Rate limits are enforced per API key. Check response headers for current limits:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>X-RateLimit-Limit-Minute</li>
                  <li>X-RateLimit-Remaining-Minute</li>
                  <li>X-RateLimit-Limit-Hour</li>
                  <li>X-RateLimit-Remaining-Hour</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Base URL</h3>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  <code>{import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
