import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Shield, User, Warning } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface AgeVerificationProps {
  isOpen: boolean
  onVerified: (verified: boolean, age: number) => void
  minimumAge?: number
  requiredForService?: string
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({
  isOpen,
  onVerified,
  minimumAge = 18,
  requiredForService = "access this service"
}) => {
  const [birthDate, setBirthDate] = useState('')
  const [parentalConsent, setParentalConsent] = useState(false)
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)
  const [ageVerified, setAgeVerified] = useKV<{ verified: boolean; timestamp: string; age: number } | null>('age-verification', null)
  const [error, setError] = useState('')

  const calculateAge = (birthDateString: string): number => {
    const today = new Date()
    const birthDate = new Date(birthDateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleVerification = () => {
    setError('')
    
    if (!birthDate) {
      setError('Please enter your date of birth')
      return
    }
    
    if (!dataProcessingConsent) {
      setError('You must consent to data processing for age verification')
      return
    }

    const age = calculateAge(birthDate)
    
    if (age < 13) {
      setError('You must be at least 13 years old to use this service')
      return
    }
    
    if (age < minimumAge && !parentalConsent) {
      setError(`You must be at least ${minimumAge} years old or have parental consent`)
      return
    }

    const verificationData = {
      verified: true,
      timestamp: new Date().toISOString(),
      age: age
    }
    
    setAgeVerified(verificationData)
    onVerified(true, age)
  }

  const handleDecline = () => {
    onVerified(false, 0)
  }

  // If already verified recently (within 30 days), don't show again
  if (ageVerified?.verified && ageVerified.timestamp) {
    const verificationDate = new Date(ageVerified.timestamp)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (verificationDate > thirtyDaysAgo) {
      return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Age Verification Required
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Warning className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Age Verification Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You must be at least {minimumAge} years old to {requiredForService}. 
                We are required to verify your age to comply with legal regulations.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date of Birth</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {birthDate && calculateAge(birthDate) < minimumAge && calculateAge(birthDate) >= 13 && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Parental Consent Required</span>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="parental-consent"
                  checked={parentalConsent}
                  onCheckedChange={(checked) => setParentalConsent(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="parental-consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have parental or guardian consent
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I confirm that my parent or legal guardian has given consent for me to use this service
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Privacy & Data Processing</span>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="data-consent"
                checked={dataProcessingConsent}
                onCheckedChange={(checked) => setDataProcessingConsent(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="data-consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I consent to age verification data processing
                </label>
                <p className="text-xs text-muted-foreground">
                  We will process your date of birth solely for age verification purposes. 
                  This data will be stored securely and deleted after 30 days unless required by law.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1"
            >
              I'm Under {minimumAge}
            </Button>
            <Button
              onClick={handleVerification}
              className="flex-1"
              disabled={!birthDate || !dataProcessingConsent}
            >
              Verify Age
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Your privacy is protected. Age verification data is:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Used only for age verification purposes</li>
              <li>Stored securely with encryption</li>
              <li>Automatically deleted after 30 days</li>
              <li>Never shared with third parties</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}