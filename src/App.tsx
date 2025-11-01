import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/useAuth'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { WhatsappLogo } from '@phosphor-icons/react'
import { initializeTenantPWA } from '@/lib/pwaManifest'

import { SkipNavigation } from '@/components/SkipNavigation'

// Import all comprehensive components
import { EnhancedCustomerHome } from './components/EnhancedCustomerHome'
import { SuperAdmin } from './pages/super/SuperAdmin'
import { AdminOnboarding } from './components/AdminOnboarding'
import { Health } from './pages/HealthSimple'
import { SystemStatus } from './pages/SystemStatus'
import { SystemHealthCheck } from './components/SystemHealthCheck'
import { Footer } from './components/Footer'
import { FeedbackWidget } from './components/FeedbackWidget'
import { AcceptInvite } from './pages/AcceptInvite'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

const SuperAdminPage = () => <SuperAdmin />

const AdminHome = () => (
  <AdminOnboarding onComplete={() => console.log('Onboarding completed')} />
)

const CustomerStore = () => <EnhancedCustomerHome />

const DeliveryHome = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Delivery Partner Portal
        </h1>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <div className="text-white text-2xl">🚚</div>
          </div>
          <h2 className="text-xl font-semibold mb-4">Delivery Management System</h2>
          <p className="text-muted-foreground mb-6">
            Complete delivery management with order tracking, route optimization, and real-time updates coming soon.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">📦 Order Management</h3>
              <p className="text-sm text-muted-foreground">View and manage assigned deliveries</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">🗺️ Route Optimization</h3>
              <p className="text-sm text-muted-foreground">AI-powered delivery route planning</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">📱 Real-time Tracking</h3>
              <p className="text-sm text-muted-foreground">Live GPS tracking and updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const Help = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Help & Support
        </h1>
        {/* ...rest of Help component unchanged... */}
        <Footer />
      </div>
    </div>
  </div>
)

function App() {
  useEffect(() => {
    initializeTenantPWA()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background">
            <SkipNavigation />
            <main id="main-content" role="main">
              <h1 className="sr-only">Pulss - Smart Commerce Platform</h1>
              <Router>
                <Routes>
                  <Route path="/health" element={<Health />} />
                  <Route path="/status" element={<SystemStatus />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/super/*" element={<SuperAdminPage />} />
                  <Route path="/admin/*" element={<AdminHome />} />
                  <Route path="/delivery/*" element={<DeliveryHome />} />
                  <Route path="/store/:tenantId" element={<CustomerStore />} />
                  <Route path="/store" element={<CustomerStore />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/*" element={<CustomerStore />} />
                </Routes>
                <FeedbackWidget />
                <Toaster 
                  position="top-right" 
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 4000,
                  }}
                />
              </Router>
            </main>
          </div>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
