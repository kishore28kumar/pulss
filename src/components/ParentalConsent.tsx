import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, AlertCircle, CheckCircle, Shield } from '@phosphor-icons/react'

interface ParentalConsentProps {
  customerId?: string
  userAge?: number
  onConsentGranted?: () => void
}

export const ParentalConsent: React.FC<ParentalConsentProps> = ({ 
  customerId, 
  userAge,
  onConsentGranted 
}) => {
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'parent'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [consentId, setConsentId] = useState<string | null>(null)

  const requiresParentalConsent = userAge !== undefined && userAge < 18

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.parentEmail || !formData.parentName) {
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, this would call the backend API
      // await fetch('/api/privacy/parental-consent/submit', { method: 'POST', body: JSON.stringify({ ...formData, customer_id: customerId }) })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const id = `PC-${Date.now()}`
      setConsentId(id)
      setShowSuccess(true)

      if (onConsentGranted) {
        onConsentGranted()
      }
    } catch (error) {
      console.error('Failed to submit parental consent:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!requiresParentalConsent) {
    return null
  }

  if (showSuccess) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green-900">Parental Consent Request Submitted</h3>
            <p className="text-muted-foreground">
              Consent ID: <strong>{consentId}</strong>
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A verification email has been sent to your parent/guardian. They will need to verify 
              and approve your account within 7 days.
            </p>
          </div>
          <Alert className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account access will be limited until parental consent is verified as required by 
              India's DPDP Act 2023 for users under 18 years of age.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="p-6 border-2 border-primary/20">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Parental Consent Required</h3>
            <p className="text-sm text-muted-foreground">
              As per India's Digital Personal Data Protection Act (DPDP Act), 2023, users under 18 years 
              of age require verifiable parental consent to use this service.
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Your current age: <strong>{userAge} years</strong>. Please provide your parent or guardian's 
            information below. They will receive a verification email to approve your account.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent/Guardian Full Name *</Label>
            <Input
              id="parentName"
              type="text"
              placeholder="Full name of parent or guardian"
              value={formData.parentName}
              onChange={(e) => handleChange('parentName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentEmail">Parent/Guardian Email Address *</Label>
            <Input
              id="parentEmail"
              type="email"
              placeholder="parent@email.com"
              value={formData.parentEmail}
              onChange={(e) => handleChange('parentEmail', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A verification link will be sent to this email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent/Guardian Phone Number</Label>
            <Input
              id="parentPhone"
              type="tel"
              placeholder="+91-XXXXXXXXXX"
              value={formData.parentPhone}
              onChange={(e) => handleChange('parentPhone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => handleChange('relationship', value)}
            >
              <SelectTrigger id="relationship">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="guardian">Legal Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium mb-2">What happens next?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your parent/guardian will receive a verification email</li>
                  <li>They must click the verification link within 7 days</li>
                  <li>They will review and approve your account registration</li>
                  <li>Once approved, you'll gain full access to the platform</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Verification Email...' : 'Submit for Parental Approval'}
          </Button>
        </form>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          This requirement is part of India's DPDP Act 2023 to protect minors' data privacy.
          For questions, contact us at <a href="mailto:privacy@pulss.com" className="text-primary underline">privacy@pulss.com</a>
        </p>
      </div>
    </div>
  )
}
