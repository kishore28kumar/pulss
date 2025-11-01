import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { WhatsappLogo, CheckCircle } from '@phosphor-icons/react'
import { generateWhatsAppLink } from '@/lib/validationUtils'

interface WhatsAppPreviewProps {
  whatsappNumber: string
  businessName: string
  isValid: boolean
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  whatsappNumber,
  businessName,
  isValid
}) => {
  const whatsappLink = isValid ? generateWhatsAppLink(
    whatsappNumber,
    `Hello ${businessName}, I would like to inquire about...`
  ) : '#'

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <WhatsappLogo className="h-5 w-5 text-green-600" weight="fill" />
            <span>WhatsApp Chat Preview</span>
          </CardTitle>
          {isValid && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Valid
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          This is how the WhatsApp button will appear to your customers:
        </p>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={!isValid}
          >
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2"
            >
              <WhatsappLogo className="h-5 w-5" weight="fill" />
              <span>Chat with {businessName}</span>
            </a>
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Customers can reach you directly on WhatsApp
          </p>
        </div>

        {isValid && (
          <div className="mt-3 p-3 bg-green-100 rounded-lg">
            <p className="text-xs text-green-800">
              ✓ WhatsApp number verified and preview ready
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
