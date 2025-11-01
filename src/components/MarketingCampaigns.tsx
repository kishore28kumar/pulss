import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Mail,
  MessageSquare,
  Bell,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Send,
  Eye,
  MousePointer,
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, addDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { MarketingCampaign, FeatureFlags, Customer } from '@/types'
import { toast } from 'sonner'

interface MarketingCampaignsProps {
  tenantId: string
}

interface CampaignFormData {
  name: string
  campaign_type: 'buy_again' | 'new_arrivals' | 'refill_reminder' | 'abandoned_cart'
  message_template: string
  channel: 'email' | 'sms' | 'push' | 'whatsapp'
  target_audience: {
    customer_segment: 'all' | 'new' | 'returning' | 'vip' | 'inactive'
    min_order_value?: number
    days_since_last_order?: number
    purchase_category?: string[]
    location?: string[]
  }
  trigger_condition: {
    trigger_type: 'immediate' | 'scheduled' | 'behavior_based'
    schedule_date?: string
    behavior_event?: string
    delay_hours?: number
  }
  is_active: boolean
}

const CAMPAIGN_TYPES = [
  {
    id: 'buy_again',
    label: 'Buy Again',
    description: 'Remind customers to repurchase previous items',
    icon: ShoppingCart,
    color: 'bg-blue-500'
  },
  {
    id: 'new_arrivals',
    label: 'New Arrivals',
    description: 'Announce new products to interested customers',
    icon: Plus,
    color: 'bg-green-500'
  },
  {
    id: 'refill_reminder',
    label: 'Refill Reminder',
    description: 'Remind customers when medications need refilling',
    icon: Clock,
    color: 'bg-orange-500'
  },
  {
    id: 'abandoned_cart',
    label: 'Abandoned Cart',
    description: 'Follow up with customers who left items in cart',
    icon: ShoppingCart,
    color: 'bg-red-500'
  }
]

const CHANNEL_CONFIG = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-600' },
  sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-600' },
  push: { icon: Bell, label: 'Push Notification', color: 'text-purple-600' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-600' }
}

const MESSAGE_TEMPLATES = {
  buy_again: {
    email: "Hi {customer_name}, time to restock! Your favorite items from your last order are running low. Get {discount_percent}% off when you order again.",
    sms: "Hi {customer_name}! Time to restock your essentials. Get {discount_percent}% off your next order. Shop now: {store_link}",
    push: "Time to restock! Get {discount_percent}% off your favorite items",
    whatsapp: "Hi {customer_name}! 📦 Time to restock your essentials. Get {discount_percent}% off your next order!"
  },
  new_arrivals: {
    email: "Hi {customer_name}, exciting news! We've added new products in {category_name} that you might love. Check them out now!",
    sms: "New arrivals in {category_name}! Check out our latest products: {store_link}",
    push: "New arrivals in {category_name} just for you!",
    whatsapp: "🆕 New arrivals in {category_name}! Check out our latest products, {customer_name}!"
  },
  refill_reminder: {
    email: "Hi {customer_name}, it's time to refill your {medication_name}. Don't run out - order now for home delivery!",
    sms: "Refill reminder: {medication_name} needs refilling. Order now: {store_link}",
    push: "Time to refill {medication_name}",
    whatsapp: "💊 Refill reminder: {medication_name} needs refilling, {customer_name}!"
  },
  abandoned_cart: {
    email: "Hi {customer_name}, you left {items_count} items in your cart. Complete your order now and save {discount_percent}%!",
    sms: "You left items in your cart! Complete your order now: {store_link}",
    push: "Complete your order and save {discount_percent}%!",
    whatsapp: "🛒 You left {items_count} items in your cart, {customer_name}. Complete your order now!"
  }
}

export const MarketingCampaigns: React.FC<MarketingCampaignsProps> = ({ tenantId }) => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    campaign_type: 'buy_again',
    message_template: '',
    channel: 'email',
    target_audience: {
      customer_segment: 'all'
    },
    trigger_condition: {
      trigger_type: 'immediate'
    },
    is_active: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [campaignStats, setCampaignStats] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    loadFeatureFlags()
    loadCampaigns()
  }, [tenantId])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const { data: campaignsData, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(campaignsData || [])

      // Load campaign statistics
      const stats: { [key: string]: any } = {}
      for (const campaign of campaignsData || []) {
        stats[campaign.id] = {
          sent: campaign.sent_count,
          opened: campaign.opened_count,
          clicked: campaign.clicked_count,
          conversion_rate: campaign.sent_count > 0 ? (campaign.clicked_count / campaign.sent_count * 100).toFixed(1) : 0
        }
      }
      setCampaignStats(stats)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = () => {
    setEditingCampaign(null)
    setFormData({
      name: '',
      campaign_type: 'buy_again',
      message_template: MESSAGE_TEMPLATES.buy_again.email,
      channel: 'email',
      target_audience: {
        customer_segment: 'all'
      },
      trigger_condition: {
        trigger_type: 'immediate'
      },
      is_active: true
    })
    setIsCreateModalOpen(true)
  }

  const handleEditCampaign = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      message_template: campaign.message_template,
      channel: campaign.channel,
      target_audience: campaign.target_audience,
      trigger_condition: campaign.trigger_condition,
      is_active: campaign.is_active
    })
    setIsCreateModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const campaignData = {
        ...formData,
        tenant_id: tenantId
      }

      if (editingCampaign) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id)

        if (error) throw error
        toast.success('Campaign updated successfully')
      } else {
        const { error } = await supabase
          .from('marketing_campaigns')
          .insert([campaignData])

        if (error) throw error
        toast.success('Campaign created successfully')
      }

      setIsCreateModalOpen(false)
      loadCampaigns()
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast.error('Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCampaign = async (campaignId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ is_active: isActive })
        .eq('id', campaignId)

      if (error) throw error
      
      toast.success(`Campaign ${isActive ? 'activated' : 'paused'}`)
      loadCampaigns()
    } catch (error) {
      console.error('Error toggling campaign:', error)
      toast.error('Failed to update campaign')
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      
      toast.success('Campaign deleted successfully')
      loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const updateMessageTemplate = (campaignType: string, channel: string) => {
    const template = MESSAGE_TEMPLATES[campaignType as keyof typeof MESSAGE_TEMPLATES]?.[channel as keyof typeof template] || ''
    setFormData(prev => ({ ...prev, message_template: template }))
  }

  const getCampaignTypeConfig = (type: string) => {
    return CAMPAIGN_TYPES.find(t => t.id === type) || CAMPAIGN_TYPES[0]
  }

  const getChannelConfig = (channel: string) => {
    return CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG] || CHANNEL_CONFIG.email
  }

  if (!featureFlags?.marketing_campaigns_enabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Marketing campaigns feature is not enabled</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Marketing Campaigns</h2>
          <p className="text-muted-foreground">Automate customer engagement and drive sales</p>
        </div>
        <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Sent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.opened_count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Opened</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MousePointer className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.clicked_count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Clicked</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">
              {campaigns.length > 0 ? 
                ((campaigns.reduce((sum, c) => sum + c.clicked_count, 0) / 
                  campaigns.reduce((sum, c) => sum + c.sent_count, 0) * 100) || 0).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Click Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No campaigns yet</p>
              <p className="text-muted-foreground mb-4">Create your first marketing campaign to engage customers</p>
              <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {campaigns.map((campaign) => {
                  const typeConfig = getCampaignTypeConfig(campaign.campaign_type)
                  const channelConfig = getChannelConfig(campaign.channel)
                  const TypeIcon = typeConfig.icon
                  const ChannelIcon = channelConfig.icon
                  const stats = campaignStats[campaign.id] || {}

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-3 rounded-full ${typeConfig.color} text-white`}>
                                <TypeIcon className="h-6 w-6" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                  <Badge 
                                    variant={campaign.is_active ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {campaign.is_active ? 'Active' : 'Paused'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1">
                                    <ChannelIcon className={`h-4 w-4 ${channelConfig.color}`} />
                                    <span>{channelConfig.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{campaign.target_audience.customer_segment}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">
                                  {typeConfig.description}
                                </p>

                                {/* Campaign Stats */}
                                <div className="grid grid-cols-4 gap-4 text-center">
                                  <div>
                                    <p className="text-lg font-semibold">{stats.sent || 0}</p>
                                    <p className="text-xs text-muted-foreground">Sent</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold">{stats.opened || 0}</p>
                                    <p className="text-xs text-muted-foreground">Opened</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold">{stats.clicked || 0}</p>
                                    <p className="text-xs text-muted-foreground">Clicked</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold">{stats.conversion_rate || 0}%</p>
                                    <p className="text-xs text-muted-foreground">Rate</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCampaign(campaign)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleCampaign(campaign.id, !campaign.is_active)}
                              >
                                {campaign.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign_type">Campaign Type</Label>
                    <Select
                      value={formData.campaign_type}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, campaign_type: value as any }))
                        updateMessageTemplate(value, formData.channel)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="channel">Channel</Label>
                    <Select
                      value={formData.channel}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, channel: value as any }))
                        updateMessageTemplate(formData.campaign_type, value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHANNEL_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Message Template */}
              <div>
                <Label htmlFor="message_template">Message Template</Label>
                <Textarea
                  id="message_template"
                  value={formData.message_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                  placeholder="Enter your message template"
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables like {'{customer_name}'}, {'{discount_percent}'}, {'{store_link}'}
                </p>
              </div>

              <Separator />

              {/* Target Audience */}
              <div className="space-y-4">
                <h4 className="font-semibold">Target Audience</h4>
                
                <div>
                  <Label htmlFor="customer_segment">Customer Segment</Label>
                  <Select
                    value={formData.target_audience.customer_segment}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      target_audience: { ...prev.target_audience, customer_segment: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="new">New Customers</SelectItem>
                      <SelectItem value="returning">Returning Customers</SelectItem>
                      <SelectItem value="vip">VIP Customers</SelectItem>
                      <SelectItem value="inactive">Inactive Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Trigger Conditions */}
              <div className="space-y-4">
                <h4 className="font-semibold">Trigger Conditions</h4>
                
                <div>
                  <Label htmlFor="trigger_type">Trigger Type</Label>
                  <Select
                    value={formData.trigger_condition.trigger_type}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      trigger_condition: { ...prev.trigger_condition, trigger_type: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      <SelectItem value="behavior_based">Behavior Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Campaign Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Campaign Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this campaign to start sending messages
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MarketingCampaigns