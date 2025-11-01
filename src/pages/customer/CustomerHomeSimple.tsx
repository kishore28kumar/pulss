import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AgreementModal } from '@/components/AgreementModal'
import { toast } from 'sonner'

export const CustomerHome = () => {
  const [showAgreement, setShowAgreement] = useState(true)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)

  const handleAcceptAgreement = () => {
    setHasAcceptedTerms(true)
    setShowAgreement(false)
    toast.success('Welcome to Pulss! Terms accepted successfully.')
  }

  if (!hasAcceptedTerms) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">P</span>
              </div>
              <CardTitle className="text-2xl">Welcome to Pulss</CardTitle>
              <p className="text-muted-foreground">
                Your trusted white-label e-commerce platform
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAgreement(true)} 
                className="w-full"
                size="lg"
              >
                Get Started - Accept Terms
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                By continuing, you agree to our terms and privacy policy
              </p>
            </CardContent>
          </Card>
        </div>

        <AgreementModal
          isOpen={showAgreement}
          onClose={() => setShowAgreement(false)}
          onAccept={handleAcceptAgreement}
          userRole="customer"
          isFirstTime={true}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold">Pulss Store</h1>
            </div>
            <Button variant="outline" size="sm">
              Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Your Health, Our Priority</h2>
          <p className="text-muted-foreground mb-6">
            Quality medicines and healthcare products delivered to your doorstep
          </p>
          <div className="max-w-md mx-auto">
            <Input 
              placeholder="Search medicines, symptoms, or conditions..." 
              className="mb-4"
            />
            <Button className="w-full">
              Start Shopping
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-6">Shop by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Medicines', 'Personal Care', 'Baby Care', 'Health Devices'].map((category, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg mx-auto mb-3"></div>
                  <h4 className="font-medium">{category}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-6">Featured Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="h-32 w-full bg-muted rounded-lg mb-3"></div>
                  <h4 className="font-medium mb-2">Sample Product {idx + 1}</h4>
                  <p className="text-sm text-muted-foreground mb-2">Description here</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">₹99</span>
                    <Button size="sm">Add</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Pulss. All rights reserved.
          </p>
          <div className="mt-4 space-x-4">
            <Button variant="link" size="sm">Privacy Policy</Button>
            <Button variant="link" size="sm">Terms of Service</Button>
            <Button variant="link" size="sm">Help</Button>
          </div>
        </div>
      </footer>
    </div>
  )
}