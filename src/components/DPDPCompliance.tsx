import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Download, Trash, Shield, Eye, User, FileText, Clock, CheckCircle, AlertCircle } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface DataRequest {
  id: string
  type: 'access' | 'deletion' | 'portability' | 'rectification'
  email: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  createdAt: string
  completedAt?: string
  reason?: string
}

export const DPDPCompliance: React.FC = () => {
  const [dataRequests, setDataRequests] = useKV<DataRequest[]>('dpdp-requests', [])
  const [requestType, setRequestType] = useState<DataRequest['type']>('access')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleSubmitRequest = async (type: DataRequest['type']) => {
    if (!email) {
      toast.error('Email address is required')
      return
    }

    setIsSubmitting(true)

    try {
      const newRequest: DataRequest = {
        id: Date.now().toString(),
        type,
        email,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      setDataRequests(prev => [...(prev || []), newRequest])
      
      // Show inline success message instead of popup
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      
      // Clear form
      setEmail('')
      setDescription('')
    } catch (error) {
      toast.error('Request submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRequestTypeInfo = (type: DataRequest['type']) => {
    switch (type) {
      case 'access':
        return {
          title: 'Data Access Request',
          description: 'Request a copy of all personal data we have about you',
          icon: Eye,
          color: 'bg-blue-100 text-blue-800',
          btnText: 'Request Data Access'
        }
      case 'deletion':
        return {
          title: 'Right to Erasure',
          description: 'Request deletion of your personal data',
          icon: Trash,
          color: 'bg-red-100 text-red-800',
          btnText: 'Request Data Deletion'
        }
      case 'portability':
        return {
          title: 'Data Portability',
          description: 'Download your data in a machine-readable format',
          icon: Download,
          color: 'bg-green-100 text-green-800',
          btnText: 'Download My Data'
        }
      case 'rectification':
        return {
          title: 'Data Correction',
          description: 'Request correction of inaccurate personal data',
          icon: FileText,
          color: 'bg-orange-100 text-orange-800',
          btnText: 'Request Correction'
        }
    }
  }

  const getStatusIcon = (status: DataRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Data Principal Rights</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Exercise your rights under India's Digital Personal Data Protection Act, 2023 (DPDP Act). 
          We are committed to protecting your privacy and providing transparency about your data.
        </p>
      </div>

      {/* Success Message Banner - Non-blocking */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-green-900">Request Submitted Successfully</h4>
            <p className="text-sm text-green-700 mt-1">
              We will process your request within 30 days as required by the DPDP Act, 2023.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['access', 'deletion', 'portability', 'rectification'] as const).map((type) => {
          const info = getRequestTypeInfo(type)
          const Icon = info.icon
          
          return (
            <Card key={type} className="p-6 border-2 hover:border-primary/20 hover:shadow-lg transition-all">
              <div className="text-center space-y-3">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${info.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">{info.title}</h3>
                <p className="text-sm text-muted-foreground">{info.description}</p>
                <Button
                  onClick={() => {
                    setRequestType(type)
                    // Scroll to form
                    document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {info.btnText}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Request Form */}
      <Card className="p-6" id="request-form">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Submit Data Request
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request-type">Request Type</Label>
            <select
              id="request-type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as DataRequest['type'])}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="access">Data Access Request</option>
              <option value="portability">Data Portability (Download)</option>
              <option value="rectification">Data Correction</option>
              <option value="deletion">Data Deletion (Right to Erasure)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Information (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional details about your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
            <p className="text-blue-900 font-medium">Processing Timeline</p>
            <p className="text-blue-700 mt-1">
              We will respond to your request within 30 days as required by India's DPDP Act, 2023.
            </p>
          </div>

          <Button 
            onClick={() => handleSubmitRequest(requestType)}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </Card>

      {/* Request History */}
      {dataRequests && dataRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Data Requests
          </h3>
          <div className="space-y-3">
            {dataRequests.map((request) => {
              const info = getRequestTypeInfo(request.type)
              const Icon = info.icon
              
              return (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{info.title}</span>
                        <Badge variant="outline" className={`${info.color} border-0`}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(request.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {request.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Your Rights Under DPDP Act 2023
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Right to Access:</strong> You can request information about what personal data we have about you.
            </div>
            <div>
              <strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.
            </div>
            <div>
              <strong>Right to Erasure:</strong> You can request deletion of your personal data.
            </div>
            <div>
              <strong>Right to Data Portability:</strong> You can request your data in a structured, machine-readable format.
            </div>
            <div>
              <strong>Right to Grievance Redressal:</strong> You can submit grievances about data processing.
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Processing Timeline
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Request Received:</strong> We acknowledge your request within 72 hours.
            </div>
            <div>
              <strong>Identity Verification:</strong> We may need to verify your identity to protect your data.
            </div>
            <div>
              <strong>Processing:</strong> We have 30 days to respond to your request as per DPDP Act 2023.
            </div>
            <div>
              <strong>Response:</strong> We will provide a detailed response about the actions taken.
            </div>
          </div>
        </Card>
      </div>

      {/* Grievance Officer Contact */}
      <Card className="p-6 bg-muted/50">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Need Help with Data Protection?</h3>
          <p className="text-muted-foreground">
            If you have questions about your data rights or our privacy practices under DPDP Act 2023, 
            contact our Grievance Officer:
          </p>
          <div className="space-y-1">
            <p className="font-medium">Data Protection Officer</p>
            <p className="text-sm">Email: privacy@pulss.com</p>
            <p className="text-sm text-muted-foreground">
              Response Time: Within 30 days as per DPDP Act 2023
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
