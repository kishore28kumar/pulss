import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Trash, Shield, Eye, User, FileText, Clock, CheckCircle, Warning } from '@phosphor-icons/react'
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

export const GDPRCompliance: React.FC = () => {
  const [dataRequests, setDataRequests] = useKV<DataRequest[]>('gdpr-requests', [])
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestType, setRequestType] = useState<DataRequest['type']>('access')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newRequest: DataRequest = {
        id: Date.now().toString(),
        type: requestType,
        email,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      setDataRequests(prev => [...(prev || []), newRequest])
      
      toast.success('Request submitted successfully', {
        description: 'We will process your request within 30 days as required by GDPR regulations.'
      })
      
      setShowRequestDialog(false)
      setEmail('')
      setDescription('')
    } catch (error) {
      toast.error('Failed to submit request. Please try again.')
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
          color: 'bg-blue-100 text-blue-800'
        }
      case 'deletion':
        return {
          title: 'Right to be Forgotten',
          description: 'Request deletion of all your personal data',
          icon: Trash,
          color: 'bg-red-100 text-red-800'
        }
      case 'portability':
        return {
          title: 'Data Portability',
          description: 'Export your data in a machine-readable format',
          icon: Download,
          color: 'bg-green-100 text-green-800'
        }
      case 'rectification':
        return {
          title: 'Data Correction',
          description: 'Request correction of inaccurate personal data',
          icon: FileText,
          color: 'bg-orange-100 text-orange-800'
        }
    }
  }

  const getStatusIcon = (status: DataRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'processing':
        return <Warning className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <Warning className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">GDPR Data Rights</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Exercise your rights under the General Data Protection Regulation (GDPR). 
          We are committed to protecting your privacy and providing transparency about how we handle your data.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['access', 'deletion', 'portability', 'rectification'] as const).map((type) => {
          const info = getRequestTypeInfo(type)
          const Icon = info.icon
          
          return (
            <Dialog key={type}>
              <DialogTrigger asChild>
                <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                  <div className="text-center space-y-3">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${info.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold">{info.title}</h3>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {info.title}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  setRequestType(type)
                  setShowRequestDialog(true)
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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
                    <Label htmlFor="description">Additional Information</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide any additional details about your request..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                    We will respond to your request within 30 days as required by GDPR regulations.
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={(submitEvent) => {
                      setRequestType(type)
                      handleSubmitRequest(submitEvent as any)
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${info.title}`}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )
        })}
      </div>

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
                        Submitted on {new Date(request.createdAt).toLocaleDateString()}
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
            Your Rights Under GDPR
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Right to Access:</strong> You can request information about what personal data we have about you.
            </div>
            <div>
              <strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete data.
            </div>
            <div>
              <strong>Right to Erasure:</strong> You can request deletion of your personal data ("right to be forgotten").
            </div>
            <div>
              <strong>Right to Data Portability:</strong> You can request your data in a structured, machine-readable format.
            </div>
            <div>
              <strong>Right to Object:</strong> You can object to certain types of processing of your personal data.
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
              <strong>Processing:</strong> We have 30 days to respond to your request (extendable by 60 days for complex requests).
            </div>
            <div>
              <strong>Response:</strong> We will provide a detailed response about the actions taken.
            </div>
          </div>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="p-6 bg-muted/50">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Need Help with Data Protection?</h3>
          <p className="text-muted-foreground">
            If you have questions about your data rights or our privacy practices, contact our Data Protection Officer:
          </p>
          <div className="space-y-1">
            <p className="font-medium">privacy@pulss.com</p>
            <p className="text-sm text-muted-foreground">
              Available Monday - Friday, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}