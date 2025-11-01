import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Cookie, Shield, Eye, Target, Palette, CheckCircle } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

export const PrivacySettings: React.FC = () => {
  const [cookieConsent] = useKV<string | null>('cookie-consent', null)
  const [cookiePreferences, setCookiePreferences] = useKV<CookiePreferences>('cookie-preferences', {
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false
  })
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setCookiePreferences(prev => ({
      essential: prev?.essential ?? true,
      analytics: prev?.analytics ?? false,
      marketing: prev?.marketing ?? false,
      personalization: prev?.personalization ?? false,
      [key]: value
    }))
    
    // Show inline success message instead of toast
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const resetCookieConsent = () => {
    setCookiePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false
    })
    
    // Show inline success message instead of toast
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Privacy Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage how we collect and use your data under India's DPDP Act, 2023. Changes take effect immediately.
        </p>
      </div>

      {/* Success Message - Inline, Non-blocking */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Privacy preferences updated successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium">Cookie Consent Status</span>
          </div>
          <Badge variant={cookieConsent ? "default" : "secondary"}>
            {cookieConsent ? `Consent ${cookieConsent}` : 'No consent given'}
          </Badge>
        </div>
      </Card>

      {/* Cookie Categories */}
      <div className="space-y-4">
        {/* Essential Cookies */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium">Essential Cookies</h4>
                  <p className="text-sm text-muted-foreground">Required for basic website functionality</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Always Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, network management, and accessibility. They cannot be disabled.
            </p>
          </div>
        </Card>

        {/* Analytics Cookies */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">Help us understand how visitors use our website</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="analytics" className="text-sm">
                  {cookiePreferences?.analytics ? 'Enabled' : 'Disabled'}
                </Label>
                <Switch
                  id="analytics"
                  checked={cookiePreferences?.analytics ?? false}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              These cookies collect anonymous information about how visitors use our website, 
              helping us improve performance and user experience.
            </p>
            <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
              Data collected: Page views, session duration, bounce rate, popular content
            </div>
          </div>
        </Card>

        {/* Marketing Cookies */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className="text-sm text-muted-foreground">Used to deliver personalized advertisements</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="marketing" className="text-sm">
                  {cookiePreferences?.marketing ? 'Enabled' : 'Disabled'}
                </Label>
                <Switch
                  id="marketing"
                  checked={cookiePreferences?.marketing ?? false}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              These cookies track your online activity to help advertisers deliver more relevant advertisements 
              and measure the effectiveness of advertising campaigns.
            </p>
            <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
              Data collected: Browsing behavior, interests, ad interactions, conversion tracking
            </div>
          </div>
        </Card>

        {/* Personalization Cookies */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-purple-500" />
                <div>
                  <h4 className="font-medium">Personalization Cookies</h4>
                  <p className="text-sm text-muted-foreground">Remember your preferences and settings</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="personalization" className="text-sm">
                  {cookiePreferences?.personalization ? 'Enabled' : 'Disabled'}
                </Label>
                <Switch
                  id="personalization"
                  checked={cookiePreferences?.personalization ?? false}
                  onCheckedChange={(checked) => handlePreferenceChange('personalization', checked)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              These cookies remember your choices and preferences to provide a more personalized experience 
              when you return to our website.
            </p>
            <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
              Data collected: Language preferences, display settings, recently viewed items, customized content
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={resetCookieConsent}
          className="flex-1"
        >
          Reset Cookie Preferences
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="flex-1"
        >
          Apply Changes
        </Button>
      </div>

      {/* Information */}
      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
        <p className="font-medium mb-2">Important Information:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Essential cookies cannot be disabled as they are required for basic website functionality</li>
          <li>Disabling certain cookies may affect your user experience</li>
          <li>You can change these settings at any time</li>
          <li>Some changes may require a page refresh to take effect</li>
        </ul>
      </div>
    </div>
  )
}