import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface GrievanceFormData {
  name: string
  email: string
  phone: string
  category: string
  subject: string
  description: string
}

export const GrievanceRedressal: React.FC = () => {
  const [formData, setFormData] = useState<GrievanceFormData>({
    name: '',
    email: '',
    phone: '',
    category: 'general',
    subject: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [grievanceId, setGrievanceId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.email || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, this would call the backend API
      // await fetch('/api/privacy/grievance', { method: 'POST', body: JSON.stringify(formData) })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const id = `GRV-${Date.now()}`
      setGrievanceId(id)
      setShowSuccess(true)
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        subject: '',
        description: ''
      })

      // Hide success message after 8 seconds
      setTimeout(() => setShowSuccess(false), 8000)
    } catch (error) {
      toast.error('Failed to submit grievance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof GrievanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Grievance Redressal</h2>
        </div>
        <p className="text-muted-foreground">
          Submit your grievance under India's Digital Personal Data Protection Act, 2023
        </p>
      </div>

      {/* Success Message - Inline, Non-blocking */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Grievance Submitted Successfully</h4>
              <p className="text-sm text-green-700 mt-1">
                Your grievance has been recorded with ID: <strong>{grievanceId}</strong>
              </p>
              <p className="text-sm text-green-700 mt-1">
                We will respond to your grievance within 30 days as required by the DPDP Act, 2023.
                You will receive updates via email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grievance Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91-XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Privacy Concern</SelectItem>
                  <SelectItem value="data_access">Data Access Issue</SelectItem>
                  <SelectItem value="data_correction">Data Correction Request</SelectItem>
                  <SelectItem value="data_deletion">Data Deletion Issue</SelectItem>
                  <SelectItem value="consent">Consent Management</SelectItem>
                  <SelectItem value="breach">Data Breach Concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Brief description of your grievance"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed description of your grievance, including any relevant dates, incidents, or concerns..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters. Be as specific as possible to help us address your concern.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900">Important Information</p>
                <ul className="mt-2 space-y-1 text-blue-700 list-disc list-inside">
                  <li>Your grievance will be reviewed by our Data Protection Officer</li>
                  <li>We will acknowledge receipt within 72 hours</li>
                  <li>Resolution will be provided within 30 days as per DPDP Act 2023</li>
                  <li>You will receive updates via email at each stage</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Grievance...' : 'Submit Grievance'}
          </Button>
        </form>
      </Card>

      {/* Grievance Officer Contact */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-3">Contact Grievance Officer</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">Data Protection Officer</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">privacy@pulss.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-medium text-right">Pulss Technologies Pvt Ltd<br />Privacy Department, India</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Response Time:</span>
            <span className="font-medium">Within 30 days</span>
          </div>
        </div>
      </Card>

      {/* Additional Help */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          For urgent matters or if you don't receive a response within the stipulated time,
          you may escalate to the Data Protection Board of India.
        </p>
      </div>
    </div>
  )
}
