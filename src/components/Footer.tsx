import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Shield, 
  Phone, 
  EnvelopeSimple, 
  MapPin, 
  Heart,
  Info,
  Question,
  FileText
} from '@phosphor-icons/react'
import { COPYRIGHT_NOTICE, PLATFORM_DISCLAIMER } from '@/lib/legal'

interface FooterProps {
  variant?: 'customer' | 'admin' | 'minimal'
  businessName?: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  showSocialMedia?: boolean
  socialMedia?: {
    whatsapp?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

const PrivacyModal = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button 
        variant="ghost" 
        size="sm"
        className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <Shield className="w-4 h-4" />
        Privacy Policy
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Policy
        </DialogTitle>
        <DialogDescription>
          How we collect, use, and protect your information
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 text-sm">
        <section>
          <h3 className="font-semibold mb-2">Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Account information (name, email, phone)</li>
            <li>Order and transaction history</li>
            <li>Usage data for platform improvement</li>
            <li>Location data (with your permission)</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">How We Use Your Information</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Process orders and transactions</li>
            <li>Provide customer support</li>
            <li>Send important updates about your orders</li>
            <li>Improve platform functionality</li>
            <li>Prevent fraud and enhance security</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Information Sharing</h3>
          <p className="text-muted-foreground mb-2">We never sell your personal information. We only share data:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>With store owners for order fulfillment</li>
            <li>With payment processors (securely)</li>
            <li>When required by law</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Data Security</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Industry-standard encryption</li>
            <li>Secure data storage and transmission</li>
            <li>Regular security audits</li>
            <li>Limited access controls</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Your Rights</h3>
          <p className="text-muted-foreground mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request data deletion</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>
        
        <div className="bg-muted p-3 rounded">
          <p className="text-xs text-muted-foreground">
            <strong>Contact:</strong> For privacy concerns, email privacy@pulss.app or contact customer support.
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

const TermsModal = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button 
        variant="ghost" 
        size="sm"
        className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <FileText className="w-4 h-4" />
        Terms of Service
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Terms of Service
        </DialogTitle>
        <DialogDescription>
          Platform usage terms and conditions
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 text-sm">
        <section>
          <h3 className="font-semibold mb-2">Platform Service</h3>
          <p className="text-muted-foreground">
            Pulss provides technology infrastructure for local businesses to operate online stores. 
            We are a platform service provider only.
          </p>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Business Responsibilities</h3>
          <p className="text-muted-foreground mb-2">Store owners are solely responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Product quality, safety, and descriptions</li>
            <li>Order fulfillment and delivery</li>
            <li>Customer service and support</li>
            <li>Returns, refunds, and exchanges</li>
            <li>Legal compliance for their business type</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Customer Responsibilities</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Provide accurate information</li>
            <li>Make payments as agreed</li>
            <li>Follow store policies</li>
            <li>Report issues to the appropriate store</li>
          </ul>
        </section>
        
        <section>
          <h3 className="font-semibold mb-2">Limitation of Liability</h3>
          <p className="text-muted-foreground">
            Pulss is not responsible for store operations, product quality, or customer disputes. 
            All transactions are between customers and individual store owners.
          </p>
        </section>
        
        <div className="bg-muted p-3 rounded">
          <p className="text-xs text-muted-foreground">
            <strong>Important:</strong> Your primary relationship is with individual stores. 
            Contact stores directly for order-related inquiries.
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

interface FooterProps {
  variant?: 'customer' | 'admin' | 'minimal'
  businessName?: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  showSocialMedia?: boolean
  socialMedia?: {
    whatsapp?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

export const Footer: React.FC<FooterProps> = ({
  variant = 'customer',
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  showSocialMedia = false,
  socialMedia
}) => {
  const currentYear = new Date().getFullYear()

  if (variant === 'minimal') {
    return (
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-sm">
              <TermsModal />
              <PrivacyModal />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{PLATFORM_DISCLAIMER}</p>
              <p>{COPYRIGHT_NOTICE}</p>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Business Info */}
          {variant === 'customer' && businessName && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{businessName}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {businessPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${businessPhone}`} className="hover:text-primary transition-colors">
                      {businessPhone}
                    </a>
                  </div>
                )}
                {businessEmail && (
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple className="w-4 h-4" />
                    <a href={`mailto:${businessEmail}`} className="hover:text-primary transition-colors">
                      {businessEmail}
                    </a>
                  </div>
                )}
                {businessAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{businessAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link 
                to="/" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              {variant === 'customer' && (
                <>
                  <Link 
                    to="/orders" 
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    My Orders
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    Profile
                  </Link>
                </>
              )}
              <Link 
                to="/help" 
                className="block text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Question className="w-4 h-4" />
                Help & Support
              </Link>
              <Link 
                to="/status" 
                className="block text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                System Status
              </Link>
            </div>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Legal & Policies
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-800 font-medium mb-1">✅ No Popups Policy</p>
                <p className="text-xs text-green-600">All legal content accessible below - no annoying interruptions!</p>
              </div>
              <div className="block">
                <TermsModal />
              </div>
              <div className="block">
                <PrivacyModal />
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                onClick={() => window.open('mailto:support@pulss.app', '_blank')}
              >
                <Info className="w-4 h-4" />
                Contact Support
              </Button>
            </div>
          </div>

          {/* Social Media & Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connect With Us</h3>
            
            {/* WhatsApp Link */}
            {businessPhone && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <a
                    href={`https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.786"/>
                    </svg>
                    WhatsApp
                  </a>
                </Button>
              </div>
            )}

            {/* Other Social Media */}
            {showSocialMedia && socialMedia && (
              <div className="flex gap-2">
                {socialMedia.facebook && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                {socialMedia.instagram && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.33-1.297C4.198 14.81 3.708 13.659 3.708 12.362s.49-2.448 1.411-3.33c.882-.882 2.033-1.297 3.33-1.297s2.448.415 3.33 1.297c.921.882 1.411 2.033 1.411 3.33s-.49 2.448-1.411 3.33c-.882.807-2.033 1.296-3.33 1.296zm7.718-1.487c-.393.295-.883.49-1.373.49s-.98-.195-1.373-.49c-.393-.295-.588-.686-.588-1.079 0-.393.195-.784.588-1.079.393-.295.883-.49 1.373-.49s.98.195 1.373.49c.393.295.588.686.588 1.079 0 .393-.195.784-.588 1.079z"/>
                      </svg>
                    </a>
                  </Button>
                )}
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Powered by <span className="font-semibold text-primary">Pulss</span>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="border-t mt-8 pt-8 space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Platform Service Notice:</strong> {PLATFORM_DISCLAIMER.trim()}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {businessName || 'Pulss'}. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="w-3 h-3 text-red-500" />
              <span>Made with care for local businesses</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}