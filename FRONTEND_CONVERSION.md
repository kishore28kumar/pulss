# Frontend Conversion Guide - Supabase to Node.js Backend

This document shows how to convert Supabase client calls to Node.js backend API calls.

## 🔄 Conversion Patterns

### 1. Authentication

#### OLD (Supabase):
```typescript
import { supabase } from '@/lib/supabase'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

#### NEW (Node.js Backend):
```typescript
// Create API client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Sign up customer
const response = await fetch(`${API_URL}/auth/register-customer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: getTenantId(), // From subdomain or context
    email: 'user@example.com',
    password: 'password123',
    name: 'User Name',
    phone: '+919876543210'
  })
})
const { token, customer } = await response.json()
localStorage.setItem('auth_token', token)

// Sign in
const response = await fetch(`${API_URL}/auth/login-customer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    tenant_id: getTenantId()
  })
})
const { token, customer } = await response.json()
localStorage.setItem('auth_token', token)

// Get current user
const token = localStorage.getItem('auth_token')
const response = await fetch(`${API_URL}/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { user } = await response.json()

// Sign out
localStorage.removeItem('auth_token')
// Navigate to login page
```

### 2. Data Queries (SELECT)

#### OLD (Supabase):
```typescript
// Get all customers
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('tenant_id', tenantId)

// Get single customer
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('customer_id', customerId)
  .single()

// Get with filters
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('active', true)
  .order('name', { ascending: true })
  .limit(10)
```

#### NEW (Node.js Backend):
```typescript
const token = localStorage.getItem('auth_token')

// Get all customers
const response = await fetch(`${API_URL}/customers`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { customers } = await response.json()

// Get single customer
const response = await fetch(`${API_URL}/customers/${customerId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { customer } = await response.json()

// Get with filters (implement in backend)
const params = new URLSearchParams({
  active: 'true',
  order: 'name',
  limit: '10'
})
const response = await fetch(`${API_URL}/products?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { products } = await response.json()
```

### 3. Data Mutations (INSERT/UPDATE/DELETE)

#### OLD (Supabase):
```typescript
// Insert
const { data, error } = await supabase
  .from('customers')
  .insert([{
    tenant_id: tenantId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210'
  }])
  .select()

// Update
const { data, error } = await supabase
  .from('customers')
  .update({ phone: '+919999999999' })
  .eq('customer_id', customerId)
  .select()

// Delete
const { error } = await supabase
  .from('customers')
  .delete()
  .eq('customer_id', customerId)
```

#### NEW (Node.js Backend):
```typescript
const token = localStorage.getItem('auth_token')

// Insert
const response = await fetch(`${API_URL}/customers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210'
  })
})
const { customer } = await response.json()

// Update
const response = await fetch(`${API_URL}/customers/${customerId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '+919999999999'
  })
})
const { customer } = await response.json()

// Delete
await fetch(`${API_URL}/customers/${customerId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 4. Create API Helper/Client

Create a centralized API client for reusability:

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class APIClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  async get(endpoint: string, params?: Record<string, string>) {
    const url = params 
      ? `${API_URL}${endpoint}?${new URLSearchParams(params)}`
      : `${API_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    return response.json()
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    return response.json()
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    return response.json()
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    return response.json()
  }
}

export const api = new APIClient()

// Usage:
// const { customers } = await api.get('/customers')
// const { customer } = await api.post('/customers', { name: 'John' })
```

### 5. Update Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
  tenant_id: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const { user } = await api.get('/auth/me')
        setUser(user)
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { token, user } = await api.post('/auth/login-customer', {
      email,
      password,
      tenant_id: getTenantId() // Get from subdomain or context
    })
    localStorage.setItem('auth_token', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 6. Replace Supabase Storage

#### OLD (Supabase):
```typescript
const { data, error } = await supabase.storage
  .from('pulss-media')
  .upload(path, file)

const publicUrl = supabase.storage
  .from('pulss-media')
  .getPublicUrl(path).data.publicUrl
```

#### NEW (Node.js Backend with Local Storage or S3):

**Option A: Local File Storage**
```typescript
// Backend: Add multer for file uploads
// npm install multer

// In backend/app.js
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage })

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.filename}`
  })
})

app.use('/uploads', express.static('uploads'))

// Frontend:
const formData = new FormData()
formData.append('file', file)

const response = await fetch(`${API_URL}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
const { url } = await response.json()
```

**Option B: AWS S3** (for production)
```typescript
// npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

// Backend controller:
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3Client = new S3Client({ region: process.env.AWS_REGION })

async function uploadToS3(file) {
  const key = `${Date.now()}-${file.originalname}`
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }))
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`
}
```

### 7. Realtime Updates (Supabase Realtime → WebSockets or Polling)

#### OLD (Supabase):
```typescript
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `tenant_id=eq.${tenantId}`
  }, (payload) => {
    console.log('New order:', payload.new)
  })
  .subscribe()
```

#### NEW (Polling - Simple):
```typescript
// Poll for new orders every 5 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const { orders } = await api.get('/orders', {
      since: lastOrderTimestamp
    })
    if (orders.length > 0) {
      setOrders(prev => [...orders, ...prev])
      setLastOrderTimestamp(orders[0].created_at)
    }
  }, 5000)
  
  return () => clearInterval(interval)
}, [lastOrderTimestamp])
```

#### NEW (WebSockets - Advanced):
```typescript
// Backend: Add Socket.IO
// npm install socket.io

// In backend/server.js
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN }
})

io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant-${tenantId}`)
  })
})

// Emit when order created:
io.to(`tenant-${tenantId}`).emit('new-order', order)

// Frontend:
import { io } from 'socket.io-client'

const socket = io(API_URL)

socket.emit('join-tenant', tenantId)

socket.on('new-order', (order) => {
  setOrders(prev => [order, ...prev])
  toast.success('New order received!')
})
```

## 🔧 Complete Example: Customer List Component

### Before (Supabase):
```typescript
import { supabase } from '@/lib/supabase'

export function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadCustomers()
  }, [])
  
  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(error)
      return
    }
    
    setCustomers(data)
    setLoading(false)
  }
  
  async function createCustomer(customer) {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customer, tenant_id: tenantId }])
      .select()
    
    if (error) throw error
    
    setCustomers([data[0], ...customers])
  }
  
  // ... render
}
```

### After (Node.js Backend):
```typescript
import { api } from '@/lib/api'

export function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadCustomers()
  }, [])
  
  async function loadCustomers() {
    try {
      const { customers: data } = await api.get('/customers')
      setCustomers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  async function createCustomer(customer) {
    const { customer: newCustomer } = await api.post('/customers', customer)
    setCustomers([newCustomer, ...customers])
  }
  
  // ... render
}
```

## 📝 Checklist for Frontend Conversion

- [ ] Remove `@supabase/supabase-js` from package.json
- [ ] Remove `src/lib/supabase.ts`
- [ ] Create `src/lib/api.ts` API client
- [ ] Update auth context to use JWT
- [ ] Replace all `supabase.from()` calls with API calls
- [ ] Replace `supabase.auth` calls with `/api/auth` endpoints
- [ ] Update file uploads to use backend endpoint
- [ ] Replace realtime subscriptions with polling or WebSockets
- [ ] Update environment variables (remove SUPABASE_*, add VITE_API_URL)
- [ ] Test all CRUD operations
- [ ] Test authentication flow
- [ ] Handle loading and error states properly

## 🌍 Environment Variables

Update `.env` or `.env.local`:

```env
# Remove:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Add:
VITE_API_URL=http://localhost:3000/api
VITE_TENANT_ID=your-tenant-id  # Or detect from subdomain
```

## 🔍 Finding All Supabase References

```bash
# Search for Supabase imports
grep -r "from '@supabase/supabase-js'" src/

# Search for supabase usage
grep -r "supabase\." src/

# Search for auth.users references
grep -r "auth\.users" src/
```

This guide should help you systematically convert all Supabase calls to backend API calls!
