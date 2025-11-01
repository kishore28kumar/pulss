import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChatCircle, 
  WhatsappLogo, 
  TelegramLogo,
  Phone,
  EnvelopeSimple,
  X,
  MessengerLogo
} from '@phosphor-icons/react'

interface ChatSupportProps {
  businessName?: string
  businessPhone?: string
  businessEmail?: string
  whatsappNumber?: string
  telegramUsername?: string
  arattaiId?: string
  supportHours?: string
  position?: 'bottom-right' | 'bottom-left'
}

export function ChatSupport({ 
  businessName = "Store Support",
  businessPhone,
  businessEmail,
  whatsappNumber,
  telegramUsername,
  arattaiId,
  supportHours = "9 AM - 6 PM IST",
  position = 'bottom-right'
}: ChatSupportProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleWhatsAppClick = () => {
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
      const message = encodeURIComponent(`Hi! I need help with my order from ${businessName}`)
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank')
    }
  }

  const handleTelegramClick = () => {
    if (telegramUsername) {
      const cleanUsername = telegramUsername.replace('@', '')
      window.open(`https://t.me/${cleanUsername}`, '_blank')
    }
  }

  const handleArattaiClick = () => {
    if (arattaiId) {
      // Arattai is a popular Indian customer service chat platform
      window.open(`https://chat.arattai.com/${arattaiId}`, '_blank')
    }
  }

  const handlePhoneClick = () => {
    if (businessPhone) {
      window.open(`tel:${businessPhone}`, '_self')
    }
  }

  const handleEmailClick = () => {
    if (businessEmail) {
      const subject = encodeURIComponent(`Support Request - ${businessName}`)
      const body = encodeURIComponent(`Hi,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you!`)
      window.open(`mailto:${businessEmail}?subject=${subject}&body=${body}`, '_self')
    }
  }

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4'

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 animate-pulse-glow"
          >
            <ChatCircle className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChatCircle className="w-5 h-5 text-blue-600" />
              Contact {businessName}
            </DialogTitle>
            <DialogDescription>
              Get instant support through your preferred channel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Support Hours */}
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <span className="font-medium">Support Hours:</span> {supportHours}
            </div>
            
            {/* Chat Options */}
            <div className="grid grid-cols-1 gap-3">
              {whatsappNumber && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={handleWhatsAppClick}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <WhatsappLogo className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-green-600 transition-colors">
                        WhatsApp Chat
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Instant messaging support
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {telegramUsername && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={handleTelegramClick}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <TelegramLogo className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                        Telegram Chat
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        @{telegramUsername.replace('@', '')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {arattaiId && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={handleArattaiClick}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <MessengerLogo className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">
                        Arattai Chat
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Live customer support
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {businessPhone && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={handlePhoneClick}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-orange-600 transition-colors">
                        Call Us
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {businessPhone}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {businessEmail && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={handleEmailClick}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <EnvelopeSimple className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-purple-600 transition-colors">
                        Email Support
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {businessEmail}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Emergency Note */}
            <div className="text-xs text-center text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="font-medium text-amber-800">For urgent medical emergencies,</span>
              <br />
              <span className="text-amber-700">please call emergency services or visit the nearest hospital</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="mt-2"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}