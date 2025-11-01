import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Question, Phone, EnvelopeSimple, ChatCircle, Info } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

export const Help = () => {
  const navigate = useNavigate()

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
              <Question className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Help & Support</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Quick Help */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">How do I place an order?</h3>
                  <p className="text-muted-foreground text-sm">
                    Browse products, add them to cart, and proceed to checkout. You can pay using UPI, 
                    cash on delivery, or other available payment methods.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Can I order without creating an account?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, guest checkout is available. However, creating an account helps you track 
                    orders and saves your preferences.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Do I need a prescription for medicines?</h3>
                  <p className="text-muted-foreground text-sm">
                    Some medicines require a valid prescription. These are clearly marked with an "Rx" badge. 
                    You'll need to upload your prescription during checkout.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">How can I track my order?</h3>
                  <p className="text-muted-foreground text-sm">
                    Once your order is confirmed, you'll receive updates via the app. You can also 
                    check your order history in your profile.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">What payment methods are accepted?</h3>
                  <p className="text-muted-foreground text-sm">
                    We accept UPI payments, cash on delivery, and other digital payment methods 
                    as configured by the store.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Can I return or exchange products?</h3>
                  <p className="text-muted-foreground text-sm">
                    Return and exchange policies vary by store and product type. Contact the store 
                    directly for specific return requests.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                    <ChatCircle className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Chat with Store</h3>
                      <p className="text-sm text-muted-foreground">
                        Use the WhatsApp button to contact the store directly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                    <Phone className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Call Store</h3>
                      <p className="text-sm text-muted-foreground">
                        Phone numbers are available in store information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                    <EnvelopeSimple className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Technical Support</h3>
                      <p className="text-sm text-muted-foreground">
                        For app-related issues, contact through your store admin
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                    <Info className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Platform Info</h3>
                      <p className="text-sm text-muted-foreground">
                        For platform-related queries, contact Pulss support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Better Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Keep Your Profile Updated</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure your delivery address and phone number are current for smooth delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Have Prescriptions Ready</h4>
                    <p className="text-sm text-muted-foreground">
                      For prescription medicines, keep clear photos of your prescriptions handy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Check Store Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      Verify store operating hours before placing orders, especially for urgent needs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Save Favorites</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the heart icon to save frequently ordered items for quick reordering.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Info */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Emergency Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-orange-700 space-y-2">
                <p className="font-semibold">For Medical Emergencies:</p>
                <p className="text-sm">
                  Please contact emergency services (108/102) or visit the nearest hospital immediately. 
                  This app is not suitable for emergency medical situations.
                </p>
                <p className="text-sm font-semibold mt-4">
                  Always consult healthcare professionals for medical advice.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}