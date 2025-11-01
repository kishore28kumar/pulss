import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Database, Trash, Archive, Shield, Warning } from '@phosphor-icons/react'

interface RetentionPolicy {
  category: string
  dataType: string
  retentionPeriod: string
  reason: string
  automaticDeletion: boolean
  legalBasis: string
  icon: React.ComponentType<any>
}

export const DataRetentionPolicy: React.FC = () => {
  const retentionPolicies: RetentionPolicy[] = [
    {
      category: 'Account Data',
      dataType: 'User profiles, preferences, settings',
      retentionPeriod: '3 years after account deletion',
      reason: 'Account recovery, customer service, legal compliance',
      automaticDeletion: true,
      legalBasis: 'Contract performance, Legitimate interest',
      icon: Database
    },
    {
      category: 'Transaction Records',
      dataType: 'Orders, payments, invoices',
      retentionPeriod: '7 years',
      reason: 'Tax obligations, financial auditing, dispute resolution',
      automaticDeletion: true,
      legalBasis: 'Legal obligation',
      icon: Archive
    },
    {
      category: 'Communication Logs',
      dataType: 'Customer support, chat history',
      retentionPeriod: '2 years from last interaction',
      reason: 'Customer service quality, dispute resolution',
      automaticDeletion: true,
      legalBasis: 'Legitimate interest',
      icon: Clock
    },
    {
      category: 'Analytics Data',
      dataType: 'Usage patterns, website analytics',
      retentionPeriod: '26 months',
      reason: 'Service improvement, performance optimization',
      automaticDeletion: true,
      legalBasis: 'Legitimate interest',
      icon: Shield
    },
    {
      category: 'Marketing Data',
      dataType: 'Email lists, campaign data',
      retentionPeriod: 'Until consent withdrawal',
      reason: 'Direct marketing communications',
      automaticDeletion: false,
      legalBasis: 'Consent',
      icon: Trash
    },
    {
      category: 'Health Records',
      dataType: 'Prescription images, medical data',
      retentionPeriod: '5 years',
      reason: 'Regulatory compliance, pharmacovigilance',
      automaticDeletion: true,
      legalBasis: 'Legal obligation',
      icon: Shield
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Data Retention Policy</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          We only keep your personal data for as long as necessary to provide our services 
          and comply with legal obligations. Here's how long we retain different types of data.
        </p>
      </div>

      {/* Retention Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {retentionPolicies.map((policy, index) => {
          const Icon = policy.icon
          
          return (
            <Card key={index} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{policy.category}</h4>
                      <p className="text-sm text-muted-foreground">{policy.dataType}</p>
                    </div>
                  </div>
                  <Badge variant={policy.automaticDeletion ? "default" : "secondary"}>
                    {policy.automaticDeletion ? 'Auto-Delete' : 'Manual'}
                  </Badge>
                </div>

                {/* Retention Period */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Retention Period:</span>
                  </div>
                  <p className="text-sm font-medium">{policy.retentionPeriod}</p>
                </div>

                {/* Reason */}
                <div>
                  <h5 className="text-sm font-medium mb-1">Purpose for Retention:</h5>
                  <p className="text-sm text-muted-foreground">{policy.reason}</p>
                </div>

                {/* Legal Basis */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Legal Basis:</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{policy.legalBasis}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Key Principles */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Our Retention Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Storage Limitation</h4>
            <p className="text-blue-700 dark:text-blue-300">
              Personal data is kept only for as long as necessary for the stated purpose.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Automatic Deletion</h4>
            <p className="text-blue-700 dark:text-blue-300">
              Most data is automatically deleted when retention periods expire.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Secure Disposal</h4>
            <p className="text-blue-700 dark:text-blue-300">
              Deleted data is securely overwritten and cannot be recovered.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Legal Compliance</h4>
            <p className="text-blue-700 dark:text-blue-300">
              Retention periods comply with applicable laws and regulations.
            </p>
          </div>
        </div>
      </Card>

      {/* Important Notice */}
      <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <Warning className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Right to Request Early Deletion
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have the right to request deletion of your personal data before the standard 
              retention period expires, unless we have a legal obligation to retain it. 
              Contact us through the GDPR rights section to make such requests.
            </p>
          </div>
        </div>
      </Card>

      {/* Deletion Schedule */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Automated Deletion Schedule
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b">
            <span>Daily cleanup of expired session data</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Monthly review of inactive accounts</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Quarterly deletion of old analytics data</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span>Annual review of all retention policies</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Legal hold management system</span>
            <Badge variant="secondary">Active</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}