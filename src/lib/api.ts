const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken() {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || data.message || 'An error occurred',
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async uploadFile(endpoint: string, file: File): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || data.message || 'Upload failed',
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Upload error',
      }
    }
  }
}

export const api = new ApiClient(API_BASE_URL)

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, role: string = 'customer') =>
    api.post('/auth/register', { email, password, role }),
  
  logout: () => {
    api.setToken(null)
    return Promise.resolve({ data: {} })
  },
  
  getProfile: () => api.get('/auth/me'),
  
  resetPassword: (email: string) =>
    api.post('/auth/reset-password', { email }),
}

export const customersApi = {
  getAll: () => api.get('/customers'),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (customer: any) => api.post('/customers', customer),
  update: (id: string, customer: any) => api.put(`/customers/${id}`, customer),
  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const productsApi = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return api.get(`/products${query}`)
  },
  getById: (id: string) => api.get(`/products/${id}`),
  create: (product: any) => api.post('/products', product),
  update: (id: string, product: any) => api.put(`/products/${id}`, product),
  delete: (id: string) => api.delete(`/products/${id}`),
  bulkUpload: (file: File) => api.uploadFile('/products/bulk-upload', file),
}

export const ordersApi = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return api.get(`/orders${query}`)
  },
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (order: any) => api.post('/orders', order),
  update: (id: string, order: any) => api.put(`/orders/${id}`, order),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
}

export const tenantsApi = {
  getAll: () => api.get('/tenants'),
  getById: (id: string) => api.get(`/tenants/${id}`),
  create: (tenant: any) => api.post('/tenants', tenant),
  update: (id: string, tenant: any) => api.put(`/tenants/${id}`, tenant),
  delete: (id: string) => api.delete(`/tenants/${id}`),
}

export const transactionsApi = {
  getAll: () => api.get('/transactions'),
  getByCustomer: (customerId: string) =>
    api.get(`/transactions/customer/${customerId}`),
  create: (transaction: any) => api.post('/transactions', transaction),
}

export const rewardsApi = {
  getAll: () => api.get('/rewards'),
  redeem: (rewardId: string, customerId: string) =>
    api.post('/rewards/redeem', { reward_id: rewardId, customer_id: customerId }),
}

export default api
