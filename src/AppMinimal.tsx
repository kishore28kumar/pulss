import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { MinimalApp } from './components/MinimalApp'
import { Health } from './pages/HealthSimple'

// Create simple page components
const SuperAdmin = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Super Admin Portal</h1>
    <p>Coming soon - manage all tenants and global settings</p>
  </div>
)

const AdminHome = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Business Admin Portal</h1>
    <p>Coming soon - manage your store and products</p>
  </div>
)

const CustomerStore = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Customer Store</h1>
    <p>Coming soon - browse and order products</p>
  </div>
)

const DeliveryHome = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Delivery Portal</h1>
    <p>Coming soon - manage delivery orders</p>
  </div>
)

const Legal = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Legal Terms</h1>
    <p>Terms and conditions coming soon</p>
  </div>
)

const Privacy = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p>Privacy policy coming soon</p>
  </div>
)

const Help = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
    <p>Help documentation coming soon</p>
  </div>
)

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Router>
        <Routes>
          <Route path="/health" element={<Health />} />
          <Route path="/super/*" element={<SuperAdmin />} />
          <Route path="/admin/*" element={<AdminHome />} />
          <Route path="/delivery/*" element={<DeliveryHome />} />
          <Route path="/store" element={<CustomerStore />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/*" element={<MinimalApp />} />
        </Routes>
        
        <Toaster 
          position="top-right" 
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </Router>
    </div>
  )
}

export default App