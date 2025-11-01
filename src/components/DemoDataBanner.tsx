import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Database, ArrowClockwise, Info, Shield } from '@phosphor-icons/react'
import { isDemoDataReady, DEMO_STORES, DEMO_ORDERS } from '@/lib/demoData'

interface DemoDataBannerProps {
  onRefreshData?: () => void
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ onRefreshData }) => {
  const isReady = isDemoDataReady()
  
  if (!isReady) return null
  
  return (
    <div className="space-y-2 mb-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <strong className="text-blue-800">🎮 Demo Mode Active</strong>
            <span className="text-blue-700 ml-2 block sm:inline">
              Loaded {DEMO_STORES.length} demo stores with {DEMO_ORDERS.length} sample orders. 
              Experience full e-commerce functionality with simulated data.
            </span>
          </div>
          {onRefreshData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshData}
              className="ml-0 sm:ml-4 border-blue-300 hover:bg-blue-100 shrink-0"
            >
              <ArrowClockwise className="w-4 h-4 mr-1" />
              Refresh Data
            </Button>
          )}
        </AlertDescription>
      </Alert>
      
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="text-green-800">
            <strong>✅ Legal Compliance Ready</strong>
            <span className="text-green-700 ml-2">
              Privacy Policy, Terms of Service, and GDPR compliance available in footer. 
              No popups - all legal content integrated seamlessly.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}