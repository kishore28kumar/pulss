import api from './api';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  emailVerified?: boolean;
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
      window.location.href = '/';
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

