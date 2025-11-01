import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Cookie, Shield, Gear, CheckCircle } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { useState } from 'react'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

export const CookieConsent: React.FC = () => {
  const [cookieConsent, setCookieConsent] = useKV<string | null>('cookie-consent', null)
  const [cookiePreferences, setCookiePreferences] = useKV<CookiePreferences>('cookie-preferences', {
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false
  })
  const [showDetails, setShowDetails] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Don't show if already consented
  if (cookieConsent !== null) return null

  const handleAcceptAll = () => {
    setCookiePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true
    })
    setCookieConsent('accepted')
    
    // Show inline success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleRejectAll = () => {
    setCookiePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false
    })
    setCookieConsent('rejected')
    
    // Show inline success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleSavePreferences = () => {
    setCookieConsent('customized')
    
    // Show inline success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setCookiePreferences(prev => ({
      essential: prev?.essential ?? true,
      analytics: prev?.analytics ?? false,
      marketing: prev?.marketing ?? false,
      personalization: prev?.personalization ?? false,
      [key]: value
    }))
  }

  return (
    <>
      {/* Success Message - Non-blocking, appears at top */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in">
          <Card className="p-4 bg-green-50 border-green-200 shadow-lg max-w-md">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-900 font-medium">
                Your cookie preferences have been saved successfully.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Cookie Banner - Fixed at bottom, non-blocking */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-4 pointer-events-none">
        <div className="pointer-events-auto">
          <Card className="mx-auto max-w-4xl border-2 shadow-2xl bg-card/95 backdrop-blur-sm">
            <div className="p-6">
              {!showDetails ? (
                // Simple consent banner
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Cookie className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2">We value your privacy</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We use cookies to provide you with a personalized experience and improve our services. 
                        By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                        <a href="/privacy" className="text-primary underline hover:no-underline">
                          Privacy Policy
                        </a> (compliant with India's DPDP Act 2023).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Gear className="w-4 h-4 mr-2" />
                      Customize Settings
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleRejectAll}
                        className="min-w-[100px]"
                      >
                        Reject All
                      </Button>
                      <Button
                        onClick={handleAcceptAll}
                        className="min-w-[100px] bg-primary hover:bg-primary/90"
                      >
                        Accept All
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Detailed preferences
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      <h3 className="font-semibold text-lg">Cookie Preferences</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                    {/* Essential Cookies */}
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Essential Cookies</h4>
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Always Active
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        These cookies are necessary for the website to function and cannot be disabled. 
                        They include authentication, security, and basic functionality cookies.
                      </p>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Analytics Cookies</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cookiePreferences?.analytics ?? false}
                            onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how visitors interact with our website by collecting anonymous 
                        information about page views, popular features, and user behavior patterns.
                      </p>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Marketing Cookies</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cookiePreferences?.marketing ?? false}
                            onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Used to track visitors across websites and display relevant advertisements. 
                        These cookies help us show you personalized content and offers.
                      </p>
                    </div>

                    {/* Personalization Cookies */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Personalization Cookies</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cookiePreferences?.personalization ?? false}
                            onChange={(e) => handlePreferenceChange('personalization', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Remember your preferences and settings to provide a more personalized experience, 
                        including language preferences and customized content.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="flex-1"
                    >
                      Reject All
                    </Button>
                    <Button
                      onClick={handleSavePreferences}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Save Preferences
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      className="flex-1"
                    >
                      Accept All
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    You can change these settings at any time in your{' '}
                    <a href="/privacy" className="text-primary underline hover:no-underline">
                      Privacy Settings
                    </a>.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}