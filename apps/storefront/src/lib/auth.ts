import api from './api';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  emailVerified?: boolean;
  dateOfBirth?: string;
  gender?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ customer: Customer; tokens: AuthTokens }> {
    const response = await api.post('/auth/customer/login', credentials);
    const { customer, tokens } = response.data.data;

    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('customerToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('customer', JSON.stringify(customer));
    }

    return { customer, tokens };
  },

  async register(data: RegisterData): Promise<{ customer: Customer; tokens: AuthTokens }> {
    const response = await api.post('/auth/customer/register', data);
    const { customer, tokens } = response.data.data;

    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('customerToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('customer', JSON.stringify(customer));
    }

    return { customer, tokens };
  },

  async getCurrentCustomer(): Promise<Customer> {
    const response = await api.get('/auth/customer/me');
    return response.data.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('customer');
      
      // Extract tenant slug from URL path
      // Path format: /[store-name]/... or /[store-name]
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const storeName = pathSegments[0];
      
      if (storeName) {
        // Redirect to tenant-specific login page
        window.location.href = `/${storeName}/login`;
      } else {
        // No tenant context, redirect to home (QR message)
      window.location.href = '/';
      }
    }
  },

  getStoredCustomer(): Customer | null {
    if (typeof window === 'undefined') return null;
    const customerStr = localStorage.getItem('customer');
    return customerStr ? JSON.parse(customerStr) : null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('customerToken');
  },
};

