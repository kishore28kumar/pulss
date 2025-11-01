import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Megaphone,
  ChatCircleDots,
  Book,
  DiscordLogo,
  Link,
  Plus,
  Trash,
  Check,
  Warning
} from '@phosphor-icons/react'

interface ChangelogEntry {
  id: string
  version: string
  date: string
  type: 'feature' | 'improvement' | 'bugfix'
  title: string
  description: string
}

interface FeedbackConfig {
  enabled: boolean
  email: string
  webhook?: string
  categories: string[]
}

interface IntegrationConfig {
  discord?: {
    enabled: boolean
    webhookUrl: string
    channelId?: string
  }
  slack?: {
    enabled: boolean
    webhookUrl: string
    channelId?: string
  }
  docs?: {
    enabled: boolean
    url: string
  }
}

export const CommunityFeatures: React.FC = () => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([
    {
      id: '1',
      version: '2.0.0',
      date: '2025-10-16',
      type: 'feature',
      title: 'Dynamic Theming System',
      description: 'Added comprehensive theming with light/dark mode and custom color schemes'
    },
    {
      id: '2',
      version: '2.0.0',
      date: '2025-10-16',
      type: 'feature',
      title: 'Branding Manager',
      description: 'New admin panel for logo, favicon, and custom font configuration'
    },
    {
      id: '3',
      version: '2.0.0',
      date: '2025-10-16',
      type: 'improvement',
      title: 'Community Features',
      description: 'Added changelog, feedback widget, and Discord/Slack integration'
    }
  ])

  const [newEntry, setNewEntry] = useState<Partial<ChangelogEntry>>({
    type: 'feature'
  })

  const [feedbackConfig, setFeedbackConfig] = useState<FeedbackConfig>({
    enabled: true,
    email: 'feedback@pulss.app',
    categories: ['Bug Report', 'Feature Request', 'Improvement', 'General']
  })

  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    discord: {
      enabled: false,
      webhookUrl: ''
    },
    slack: {
      enabled: false,
      webhookUrl: ''
    },
    docs: {
      enabled: false,
      url: ''
    }
  })

  const handleAddChangelogEntry = () => {
    if (!newEntry.version || !newEntry.title) {
      toast.error('Please fill in version and title')
      return
    }

    const entry: ChangelogEntry = {
      id: Date.now().toString(),
      version: newEntry.version,
      date: new Date().toISOString().split('T')[0],
      type: newEntry.type || 'feature',
      title: newEntry.title,
      description: newEntry.description || ''
    }

    setChangelog([entry, ...changelog])
    setNewEntry({ type: 'feature' })
    toast.success('Changelog entry added!')
  }

  const handleDeleteEntry = (id: string) => {
    setChangelog(changelog.filter(e => e.id !== id))
    toast.success('Entry deleted')
  }

  const handleSaveIntegrations = () => {
    // Save integrations to backend/localStorage
    localStorage.setItem('pulss-integrations', JSON.stringify(integrations))
    toast.success('Integration settings saved!')
  }

  const typeColors = {
    feature: 'bg-blue-500',
    improvement: 'bg-green-500',
    bugfix: 'bg-red-500'
  }

  const typeIcons = {
    feature: '✨',
    improvement: '🚀',
    bugfix: '🐛'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Community & Ecosystem Features</h2>
        <p className="text-muted-foreground">
          Manage changelog, feedback system, and community integrations
        </p>
      </div>

      <Tabs defaultValue="changelog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="changelog">
            <Megaphone className="mr-2" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <ChatCircleDots className="mr-2" />
            Feedback Widget
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link className="mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Book className="mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changelog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Changelog Entry</CardTitle>
              <CardDescription>
                Document new features, improvements, and bug fixes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 2.1.0"
                    value={newEntry.version || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, version: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newEntry.type}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, type: e.target.value as any })
                    }
                  >
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="bugfix">Bug Fix</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the change"
                  value={newEntry.title || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the change"
                  value={newEntry.description || ''}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddChangelogEntry}>
                <Plus className="mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
              <CardDescription>Public changelog visible to all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {changelog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          typeColors[entry.type]
                        } flex items-center justify-center text-white`}
                      >
                        {typeIcons[entry.type]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{entry.version}</Badge>
                        <span className="text-sm text-muted-foreground">{entry.date}</span>
                      </div>
                      <h4 className="font-semibold">{entry.title}</h4>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Widget Configuration</CardTitle>
              <CardDescription>
                Collect user feedback and feature requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="feedbackEnabled">Enable Feedback Widget</Label>
                  <p className="text-sm text-muted-foreground">
                    Show feedback button on all pages
                  </p>
                </div>
                <Switch
                  id="feedbackEnabled"
                  checked={feedbackConfig.enabled}
                  onCheckedChange={(checked) =>
                    setFeedbackConfig({ ...feedbackConfig, enabled: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="feedbackEmail">Feedback Email</Label>
                <Input
                  id="feedbackEmail"
                  type="email"
                  placeholder="feedback@yourdomain.com"
                  value={feedbackConfig.email}
                  onChange={(e) =>
                    setFeedbackConfig({ ...feedbackConfig, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="webhook">Webhook URL (Optional)</Label>
                <Input
                  id="webhook"
                  placeholder="https://your-webhook-url.com"
                  value={feedbackConfig.webhook || ''}
                  onChange={(e) =>
                    setFeedbackConfig({ ...feedbackConfig, webhook: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Receive real-time feedback notifications
                </p>
              </div>
              <div>
                <Label>Feedback Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {feedbackConfig.categories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => toast.success('Feedback settings saved!')}>
                <Check className="mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <DiscordLogo className="inline mr-2" />
                Discord Integration
              </CardTitle>
              <CardDescription>
                Connect your Discord community for real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="discordEnabled">Enable Discord Integration</Label>
                <Switch
                  id="discordEnabled"
                  checked={integrations.discord?.enabled}
                  onCheckedChange={(checked) =>
                    setIntegrations({
                      ...integrations,
                      discord: { ...integrations.discord!, enabled: checked }
                    })
                  }
                />
              </div>
              {integrations.discord?.enabled && (
                <>
                  <div>
                    <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                    <Input
                      id="discordWebhook"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={integrations.discord.webhookUrl}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          discord: { ...integrations.discord!, webhookUrl: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>How to get a webhook:</strong>
                    </p>
                    <ol className="text-sm text-blue-600 dark:text-blue-400 mt-2 ml-4 space-y-1">
                      <li>1. Go to your Discord server settings</li>
                      <li>2. Navigate to Integrations → Webhooks</li>
                      <li>3. Click "New Webhook" and copy the URL</li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>
                Connect your Slack workspace for team notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="slackEnabled">Enable Slack Integration</Label>
                <Switch
                  id="slackEnabled"
                  checked={integrations.slack?.enabled}
                  onCheckedChange={(checked) =>
                    setIntegrations({
                      ...integrations,
                      slack: { ...integrations.slack!, enabled: checked }
                    })
                  }
                />
              </div>
              {integrations.slack?.enabled && (
                <div>
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={integrations.slack.webhookUrl}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        slack: { ...integrations.slack!, webhookUrl: e.target.value }
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveIntegrations}>
              <Check className="mr-2" />
              Save Integrations
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Site</CardTitle>
              <CardDescription>
                Configure link to your documentation and help center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="docsEnabled">Enable Documentation Link</Label>
                <Switch
                  id="docsEnabled"
                  checked={integrations.docs?.enabled}
                  onCheckedChange={(checked) =>
                    setIntegrations({
                      ...integrations,
                      docs: { ...integrations.docs!, enabled: checked }
                    })
                  }
                />
              </div>
              {integrations.docs?.enabled && (
                <div>
                  <Label htmlFor="docsUrl">Documentation URL</Label>
                  <Input
                    id="docsUrl"
                    placeholder="https://docs.yourdomain.com"
                    value={integrations.docs.url}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        docs: { ...integrations.docs!, url: e.target.value }
                      })
                    }
                  />
                </div>
              )}
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Warning className="text-amber-600 dark:text-amber-400 mt-1" />
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Recommended Documentation Structure:</strong>
                    </p>
                    <ul className="text-sm text-amber-600 dark:text-amber-400 mt-2 ml-4 space-y-1">
                      <li>• Getting Started Guide</li>
                      <li>• Feature Documentation</li>
                      <li>• API Reference</li>
                      <li>• FAQ Section</li>
                      <li>• Troubleshooting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
