import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, User, MapPin, CreditCard, Phone, Envelope, Clock, Shield } from '@phosphor-icons/react'

interface DataCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  purpose: string
  dataTypes: string[]
  retention: string
  legalBasis: string
  required: boolean
  recipients?: string[]
}

export const DataProcessingNotice: React.FC = () => {
  const dataCategories: DataCategory[] = [
    {
      id: 'identity',
      name: 'Identity Information',
      icon: User,
      purpose: 'User account creation and authentication',
      dataTypes: ['Full name', 'Email address', 'Phone number', 'Profile picture'],
      retention: '3 years after account closure',
      legalBasis: 'Contract performance',
      required: true,
      recipients: ['Supabase (database hosting - India region)', 'Authentication service']
    },
    {
      id: 'orders',
      name: 'Order & Transaction Data',
      icon: CreditCard,
      purpose: 'Process orders, payments, and provide customer service',
      dataTypes: ['Order history', 'Payment information', 'Billing address', 'Purchase preferences'],
      retention: '7 years for tax and legal purposes',
      legalBasis: 'Contract performance, Legal obligation',
      required: true,
      recipients: ['Payment processors', 'Tax authorities (when required)']
    },
    {
      id: 'delivery',
      name: 'Delivery Information',
      icon: MapPin,
      purpose: 'Deliver products to your location',
      dataTypes: ['Delivery address', 'GPS location (if tracking enabled)', 'Delivery preferences'],
      retention: '1 year after delivery completion',
      legalBasis: 'Contract performance',
      required: false,
      recipients: ['Delivery partners', 'Mapping services (if tracking enabled)']
    },
    {
      id: 'communication',
      name: 'Communication Data',
      icon: Phone,
      purpose: 'Customer support and order updates',
      dataTypes: ['Support messages', 'Chat history', 'WhatsApp number (if provided)', 'Communication preferences'],
      retention: '2 years from last communication',
      legalBasis: 'Legitimate interest, Consent (for marketing)',
      required: false,
      recipients: ['Customer support tools', 'WhatsApp API (if enabled)']
    },
    {
      id: 'technical',
      name: 'Technical Information',
      icon: Database,
      purpose: 'Website functionality, security, and improvement',
      dataTypes: ['IP address', 'Browser information', 'Device information', 'Usage analytics'],
      retention: '13 months',
      legalBasis: 'Legitimate interest',
      required: true,
      recipients: ['Analytics services', 'CDN providers', 'Security services']
    },
    {
      id: 'health',
      name: 'Health Information',
      icon: Shield,
      purpose: 'Process prescription orders (pharmacy only)',
      dataTypes: ['Prescription images', 'Medical conditions (if disclosed)', 'Pharmacist approvals'],
      retention: '5 years (regulatory requirement)',
      legalBasis: 'Legal obligation, Vital interests',
      required: false,
      recipients: ['Licensed pharmacists', 'Healthcare authorities (if required)']
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Data Processing Notice</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          This notice explains what personal data we collect, why we collect it, 
          and how long we keep it in accordance with India's Digital Personal Data Protection Act 
          (DPDP Act), 2023.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dataCategories.map((category) => {
          const Icon = category.icon
          
          return (
            <Card key={category.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">{category.purpose}</p>
                    </div>
                  </div>
                  <Badge variant={category.required ? "default" : "secondary"}>
                    {category.required ? 'Required' : 'Optional'}
                  </Badge>
                </div>

                {/* Data Types */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Data Collected:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {category.dataTypes.map((type, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {type}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Legal Basis */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Legal Basis:</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.legalBasis}</p>
                </div>

                {/* Retention */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Data Retention:</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.retention}</p>
                </div>

                {/* Recipients */}
                {category.recipients && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Envelope className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Shared With:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.recipients.map((recipient, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Key Principles */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Our Data Protection Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Data Minimization</h4>
            <p className="text-muted-foreground">
              We only collect data that is necessary for the specific purpose stated.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Purpose Limitation</h4>
            <p className="text-muted-foreground">
              Your data is only used for the purposes we told you about when collecting it.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Storage Limitation</h4>
            <p className="text-muted-foreground">
              We don't keep your data longer than necessary for the stated purpose.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Security</h4>
            <p className="text-muted-foreground">
              All data is encrypted and protected with industry-standard security measures.
            </p>
          </div>
        </div>
      </Card>

      {/* Data Residency */}
      <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Data Residency & Cross-Border Transfers
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          As per India's DPDP Act 2023, your personal data is primarily stored in India. 
          Cross-border transfers are only made to countries approved by the Government of India:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Primary data storage: India-based servers</li>
          <li>Transfers only to whitelisted countries as per DPDP Act</li>
          <li>All transfers comply with data protection requirements</li>
          <li>Your data security is our top priority</li>
        </ul>
      </Card>
    </div>
  )
}