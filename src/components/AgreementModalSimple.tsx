import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  userRole: 'admin' | 'customer'
  isFirstTime?: boolean
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  userRole,
  isFirstTime = false
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const handleAccept = () => {
    if (termsAccepted && privacyAccepted) {
      onAccept()
    }
  }

  const canProceed = termsAccepted && privacyAccepted

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Welcome to Pulss</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Terms of Service</h3>
              <p className="text-muted-foreground">
                By using Pulss, you agree that this is a white-label e-commerce platform. 
                All product sales are conducted between business owners and their customers. 
                Pulss provides only the technology platform and is not responsible for 
                product quality, delivery, or customer service.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Privacy Policy</h3>
              <p className="text-muted-foreground">
                We collect minimal data necessary for platform operation. Your personal 
                information is protected and not shared with third parties except as 
                required for service delivery. You can request data deletion at any time.
              </p>
            </div>

            {userRole === 'admin' && (
              <div>
                <h3 className="font-semibold mb-2">Business Owner Agreement</h3>
                <p className="text-muted-foreground">
                  As a business owner, you are solely responsible for all products, 
                  customer service, legal compliance, and business operations conducted 
                  through your store on the Pulss platform.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the Terms of Service
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
            />
            <label htmlFor="privacy" className="text-sm">
              I agree to the Privacy Policy
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!canProceed}
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}