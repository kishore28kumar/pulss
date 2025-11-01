import React from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Cookie, FileText } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export const PrivacyNotice: React.FC = () => {
  return (
    <div className="bg-muted/50 border-t py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Your Privacy Matters</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              We are committed to protecting your personal data and respecting your privacy rights. 
              This website is fully compliant with India's Digital Personal Data Protection Act (DPDP Act), 2023 
              and gives you complete control over your data.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/privacy" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Manage Data Rights
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/privacy" className="flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  Cookie Preferences
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/legal" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </Button>
            </div>
          </div>

          {/* Data Processing Summary */}
          <div className="mt-8 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="font-medium">Data Minimization</h4>
                <p className="text-xs text-muted-foreground">
                  We only collect data necessary for our services
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Cookie className="w-4 h-4" />
                </div>
                <h4 className="font-medium">Consent Control</h4>
                <p className="text-xs text-muted-foreground">
                  You control what cookies and tracking we use
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-medium">Transparency</h4>
                <p className="text-xs text-muted-foreground">
                  Clear information about how we use your data
                </p>
              </div>
            </div>
          </div>

          {/* Legal Compliance Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This website complies with GDPR, CCPA, and other international privacy regulations. 
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}