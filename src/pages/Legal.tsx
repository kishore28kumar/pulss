import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Scales, Shield, FileText, Users, Globe, ArrowUp } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { COPYRIGHT_NOTICE, PLATFORM_DISCLAIMER } from '@/lib/legal'

export const Legal = () => {
  const navigate = useNavigate()
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Scales className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Legal Information</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="#terms" className="flex items-center gap-2 justify-start">
                    <FileText className="w-4 h-4" />
                    Terms
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#privacy" className="flex items-center gap-2 justify-start">
                    <Shield className="w-4 h-4" />
                    Privacy
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#disclaimer" className="flex items-center gap-2 justify-start">
                    <Globe className="w-4 h-4" />
                    Disclaimer
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="#returns" className="flex items-center gap-2 justify-start">
                    <FileText className="w-4 h-4" />
                    Returns
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Legal Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Pulss, a white-label e-commerce platform designed to empower local businesses. 
                  This page outlines our legal framework, terms of service, and important disclaimers that 
                  govern the use of our platform.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms of Service */}
          <Card id="terms">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Platform Service</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Pulss provides a white-label e-commerce platform that enables businesses to create 
                    and manage their online presence. We act solely as a technology service provider.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Business Responsibility</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Each business using our platform is solely responsible for:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Product quality, safety, and compliance with local regulations</li>
                    <li>Accurate product descriptions and pricing</li>
                    <li>Order fulfillment and customer service</li>
                    <li>Handling returns, refunds, and customer disputes</li>
                    <li>Compliance with applicable laws and regulations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. User Responsibilities</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Users of this platform agree to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Provide accurate information when placing orders</li>
                    <li>Use the platform only for legitimate purposes</li>
                    <li>Respect intellectual property rights</li>
                    <li>Not attempt to circumvent security measures</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4. Prescription Medications</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    For businesses dealing with prescription medications:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Valid prescriptions are required for prescription-only medicines</li>
                    <li>Pharmacist verification is mandatory before dispensing</li>
                    <li>Age verification may be required for certain products</li>
                    <li>Users must not share prescription medications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card id="privacy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Collection</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect information necessary to provide our services, including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Account information (name, email, phone number)</li>
                    <li>Order and transaction history</li>
                    <li>Delivery addresses</li>
                    <li>Payment information (processed securely by third parties)</li>
                    <li>Usage data to improve our services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Protection</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Encryption in transit and at rest</li>
                    <li>Regular security audits and updates</li>
                    <li>Limited access on a need-to-know basis</li>
                    <li>Secure data centers with physical security</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Data Sharing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not sell your personal data. We may share data only:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>With the specific business you're purchasing from</li>
                    <li>With service providers (payment processors, delivery services)</li>
                    <li>When required by law or legal process</li>
                    <li>To protect rights, property, or safety</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card id="disclaimer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Platform Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">
                  {PLATFORM_DISCLAIMER}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Returns Policy */}
          <Card id="returns">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Returns & Refunds Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Return Eligibility</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Returns are subject to the individual business policies of each store on our platform. 
                    General guidelines include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Items must be returned within the timeframe specified by the business</li>
                    <li>Products must be in original condition and packaging</li>
                    <li>Prescription medications cannot be returned once dispensed</li>
                    <li>Perishable goods may have limited return windows</li>
                    <li>Custom or personalized items may not be returnable</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Return Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Contact the business directly through the app or provided contact information</li>
                    <li>Provide your order number and reason for return</li>
                    <li>Follow the business's specific return instructions</li>
                    <li>Package items securely for return shipping (if applicable)</li>
                    <li>Track your return status through the app</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Refund Processing</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Refunds are processed by individual businesses according to their policies:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Refunds typically processed within 3-7 business days after return approval</li>
                    <li>Refund method depends on original payment method</li>
                    <li>Some businesses may offer store credit or wallet refunds</li>
                    <li>Shipping costs may be deducted from refunds per business policy</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Damaged or Incorrect Items</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you receive damaged or incorrect items, contact the business immediately. 
                    Most businesses will provide expedited replacements or full refunds for such issues 
                    at no additional cost to you.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Pulss serves as a platform facilitator. All returns and refunds 
                    are handled directly by individual businesses. If you experience issues with a business's 
                    return process, please contact our support team for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Contact & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">For Technical Issues:</h3>
                  <p className="text-muted-foreground">
                    Contact the Pulss support team through your business administrator or 
                    the help section in your app.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">For Order & Business Issues:</h3>
                  <p className="text-muted-foreground">
                    Contact the specific business directly through their provided contact 
                    information or the in-app messaging system.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Legal Inquiries:</h3>
                  <p className="text-muted-foreground">
                    For legal matters related to the platform itself, contact us through 
                    our official support channels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copyright Notice */}
          <Card>
            <CardHeader>
              <CardTitle>Copyright Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {COPYRIGHT_NOTICE}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p className="mt-2">
              We reserve the right to update these terms and policies. 
              Users will be notified of significant changes.
            </p>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-50"
          size="icon"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}