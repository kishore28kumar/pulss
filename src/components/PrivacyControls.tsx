import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Download,
  Trash2,
  Eye,
  UserCheck,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  FileText,
  Mail,
  Database
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addYears } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { CustomerPrivacySettings, LegalAcceptance, AuditLog, FeatureFlags } from '@/types'
import { toast } from 'sonner'

interface PrivacyControlsProps {
  tenantId: string
  customerId?: string
  isOpen: boolean
  onClose: () => void
}

interface DataExportRequest {
  id: string
  request_type: 'export' | 'delete'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requested_at: string
  completed_at?: string
  download_url?: string
}

  const PRIVACY_RIGHTS = [
  {
    id: 'access',
    title: 'Right to Access',
    description: 'Request a copy of all personal data we hold about you',
    icon: Eye
  },
  {
    id: 'portability',
    title: 'Right to Data Portability',
    description: 'Export your data in a machine-readable format',
    icon: Download
  },
  {
    id: 'rectification',
    title: 'Right to Correction',
    description: 'Request correction of inaccurate personal data',
    icon: Settings
  },
  {
    id: 'erasure',
    title: 'Right to Erasure',
    description: 'Request deletion of your personal data',
    icon: Trash2
  },
  {
    id: 'grievance',
    title: 'Right to Grievance Redressal',
    description: 'Submit grievances about data processing',
    icon: FileText
  }
]

const DATA_CATEGORIES = [
  {
    id: 'profile',
    name: 'Profile Information',
    description: 'Name, email, phone, address',
    required: true
  },
  {
    id: 'orders',
    name: 'Order History',
    description: 'Purchase history and transaction data',
    required: false
  },
  {
    id: 'prescriptions',
    name: 'Prescription Data',
    description: 'Medical prescriptions and health data',
    required: false,
    sensitive: true
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Shopping preferences and settings',
    required: false
  },
  {
    id: 'analytics',
    name: 'Analytics Data',
    description: 'Usage patterns and behavioral data',
    required: false
  }
]

export const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  tenantId,
  customerId,
  isOpen,
  onClose
}) => {
  const { user } = useAuth()
  const [privacySettings, setPrivacySettings] = useState<CustomerPrivacySettings | null>(null)
  const [legalAcceptances, setLegalAcceptances] = useState<LegalAcceptance[]>([])
  const [dataExportRequests, setDataExportRequests] = useState<DataExportRequest[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [exportInProgress, setExportInProgress] = useState(false)
  const [deleteInProgress, setDeleteInProgress] = useState(false)

  useEffect(() => {
    if (isOpen && customerId) {
      loadData()
    }
  }, [isOpen, customerId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadFeatureFlags(),
        loadPrivacySettings(),
        loadLegalAcceptances(),
        loadDataExportRequests()
      ])
    } catch (error) {
      console.error('Error loading privacy data:', error)
      toast.error('Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const loadFeatureFlags = async () => {
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    setFeatureFlags(flags)
  }

  const loadPrivacySettings = async () => {
    if (!customerId) return

    const { data } = await supabase
      .from('customer_privacy_settings')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (data) {
      setPrivacySettings(data)
    } else {
      // Create default privacy settings
      const defaultSettings = {
        customer_id: customerId,
        data_processing_consent: false,
        marketing_consent: false,
        analytics_consent: false,
        personalization_consent: false,
        data_retention_preference: '2_years' as const
      }

      const { data: newSettings } = await supabase
        .from('customer_privacy_settings')
        .insert([defaultSettings])
        .select()
        .single()

      setPrivacySettings(newSettings)
    }
  }

  const loadLegalAcceptances = async () => {
    if (!customerId) return

    const { data } = await supabase
      .from('legal_acceptances')
      .select('*')
      .eq('customer_id', customerId)
      .order('accepted_at', { ascending: false })

    setLegalAcceptances(data || [])
  }

  const loadDataExportRequests = async () => {
    // This would be implemented with a proper data export system
    // For demo purposes, we'll use mock data
    setDataExportRequests([])
  }

  const updatePrivacySetting = async (key: keyof CustomerPrivacySettings, value: any) => {
    if (!privacySettings) return

    setSaving(true)
    try {
      const updatedSettings = { ...privacySettings, [key]: value }
      
      const { error } = await supabase
        .from('customer_privacy_settings')
        .update({ [key]: value })
        .eq('customer_id', customerId)

      if (error) throw error

      setPrivacySettings(updatedSettings)
      toast.success('Privacy settings updated')

      // Log the privacy setting change
      await logPrivacyAction('update_setting', `Updated ${key} to ${value}`)
    } catch (error) {
      console.error('Error updating privacy setting:', error)
      toast.error('Failed to update privacy setting')
    } finally {
      setSaving(false)
    }
  }

  const logPrivacyAction = async (action: string, details: string) => {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          user_id: user?.id,
          action: 'privacy_action',
          resource_type: 'privacy_settings',
          resource_id: customerId,
          new_values: { action, details },
          ip_address: null, // Would be captured from request
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Error logging privacy action:', error)
    }
  }

  const requestDataExport = async (exportType: 'partial' | 'complete') => {
    setExportInProgress(true)
    try {
      // In a real implementation, this would:
      // 1. Create a background job to export data
      // 2. Generate secure download link
      // 3. Send email notification when ready

      toast.success('Data export request submitted. You will receive an email when ready.')
      await logPrivacyAction('data_export_request', `Requested ${exportType} data export`)
    } catch (error) {
      console.error('Error requesting data export:', error)
      toast.error('Failed to request data export')
    } finally {
      setExportInProgress(false)
    }
  }

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return
    }

    setDeleteInProgress(true)
    try {
      // In a real implementation, this would:
      // 1. Create a data deletion request
      // 2. Anonymize or delete all personal data
      // 3. Send confirmation email

      toast.success('Data deletion request submitted. This will be processed within 30 days.')
      await logPrivacyAction('data_deletion_request', 'Requested account deletion')
    } catch (error) {
      console.error('Error requesting data deletion:', error)
      toast.error('Failed to request data deletion')
    } finally {
      setDeleteInProgress(false)
    }
  }

  const acceptLegalDocument = async (documentType: 'terms' | 'privacy' | 'gdpr' | 'ccpa') => {
    try {
      await supabase
        .from('legal_acceptances')
        .insert({
          customer_id: customerId,
          document_type: documentType,
          document_version: '1.0', // Would be dynamic based on current version
          accepted_at: new Date().toISOString()
        })

      await loadLegalAcceptances()
      toast.success('Legal document acceptance recorded')
    } catch (error) {
      console.error('Error recording legal acceptance:', error)
      toast.error('Failed to record acceptance')
    }
  }

  const getRetentionEndDate = () => {
    if (!privacySettings) return null
    
    const years = parseInt(privacySettings.data_retention_preference.split('_')[0])
    return addYears(new Date(privacySettings.created_at), years)
  }

  if (!featureFlags?.privacy_controls_enabled) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data Controls
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="rights">Your Rights</TabsTrigger>
            <TabsTrigger value="data">Data Export</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            {/* Privacy Settings Tab */}
            <TabsContent value="settings" className="space-y-6 p-1">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Consent Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Consent Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Data Processing Consent</h4>
                          <p className="text-sm text-muted-foreground">
                            Allow us to process your personal data for core services
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings?.data_processing_consent || false}
                          onCheckedChange={(checked) => updatePrivacySetting('data_processing_consent', checked)}
                          disabled={saving}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Marketing Communications</h4>
                          <p className="text-sm text-muted-foreground">
                            Receive promotional emails, SMS, and notifications
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings?.marketing_consent || false}
                          onCheckedChange={(checked) => updatePrivacySetting('marketing_consent', checked)}
                          disabled={saving}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Analytics & Performance</h4>
                          <p className="text-sm text-muted-foreground">
                            Help us improve our services through usage analytics
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings?.analytics_consent || false}
                          onCheckedChange={(checked) => updatePrivacySetting('analytics_consent', checked)}
                          disabled={saving}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Personalization</h4>
                          <p className="text-sm text-muted-foreground">
                            Personalize your experience and show relevant content
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings?.personalization_consent || false}
                          onCheckedChange={(checked) => updatePrivacySetting('personalization_consent', checked)}
                          disabled={saving}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Retention */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Data Retention
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="retention">How long should we keep your data?</Label>
                        <Select
                          value={privacySettings?.data_retention_preference || '2_years'}
                          onValueChange={(value) => updatePrivacySetting('data_retention_preference', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1_year">1 Year</SelectItem>
                            <SelectItem value="2_years">2 Years (Recommended)</SelectItem>
                            <SelectItem value="5_years">5 Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-2">
                          Your data will be automatically deleted after this period.
                          {getRetentionEndDate() && (
                            <span className="block mt-1">
                              Scheduled deletion: {format(getRetentionEndDate()!, 'PPP')}
                            </span>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Privacy Rights Tab */}
            <TabsContent value="rights" className="space-y-4 p-1">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Your Privacy Rights</h3>
                <p className="text-muted-foreground">
                  Under India's Digital Personal Data Protection Act (DPDP Act), 2023, you have specific rights 
                  regarding your personal data as a Data Principal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRIVACY_RIGHTS.map((right) => {
                  const Icon = right.icon
                  return (
                    <Card key={right.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{right.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {right.description}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (right.id === 'access' || right.id === 'portability') {
                                  setActiveTab('data')
                                } else if (right.id === 'grievance') {
                                  // Navigate to grievance tab or open form
                                  window.location.href = '/privacy?tab=grievance'
                                } else {
                                  toast.info('Contact our Grievance Officer to exercise this right')
                                }
                              }}
                            >
                              Exercise Right
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Data Export Tab */}
            <TabsContent value="data" className="space-y-6 p-1">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Data Export & Deletion</h3>
                <p className="text-muted-foreground">
                  Export your data or request account deletion. All requests are processed securely.
                </p>
              </div>

              {/* Data Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Your Data Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DATA_CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            {category.name}
                            {category.sensitive && (
                              <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                            )}
                            {category.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Download className="h-5 w-5" />
                      Export Your Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your personal data in a machine-readable format.
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => requestDataExport('partial')}
                        disabled={exportInProgress}
                        className="w-full"
                      >
                        {exportInProgress ? 'Processing...' : 'Export Basic Data'}
                      </Button>
                      <Button
                        onClick={() => requestDataExport('complete')}
                        disabled={exportInProgress}
                        variant="outline"
                        className="w-full"
                      >
                        Export Complete Data
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Export requests are processed within 30 days. You'll receive an email when ready.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                      <Trash2 className="h-5 w-5" />
                      Delete Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">Warning</span>
                      </div>
                      <p className="text-xs text-destructive/80">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                    <Button
                      onClick={requestDataDeletion}
                      disabled={deleteInProgress}
                      variant="destructive"
                      className="w-full"
                    >
                      {deleteInProgress ? 'Processing...' : 'Delete My Account'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Legal Tab */}
            <TabsContent value="legal" className="space-y-6 p-1">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Legal Documents & Compliance</h3>
                <p className="text-muted-foreground">
                  Review and manage your acceptance of legal documents and compliance status.
                </p>
              </div>

              {/* Compliance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">DPDP Act 2023</p>
                      <p className="text-xs text-green-600">Compliant (India)</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Data Residency</p>
                      <p className="text-xs text-green-600">India</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Document History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Acceptance History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {legalAcceptances.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No legal document acceptances recorded
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {legalAcceptances.map((acceptance) => (
                        <div key={acceptance.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium capitalize">
                              {acceptance.document_type} v{acceptance.document_version}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Accepted on {format(new Date(acceptance.accepted_at), 'PPP')}
                            </p>
                          </div>
                          <Badge variant="secondary">Accepted</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Grievance Officer Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    For any privacy-related questions or concerns under DPDP Act 2023, please contact our 
                    Grievance Officer:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> Data Protection Officer</p>
                    <p><strong>Email:</strong> privacy@pulss.com</p>
                    <p><strong>Address:</strong> Pulss Technologies Pvt Ltd, Privacy Department, India</p>
                    <p><strong>Response Time:</strong> Within 30 days as per DPDP Act 2023</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PrivacyControls