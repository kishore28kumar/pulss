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

  async requestPasswordReset(email: string, phone: string): Promise<{ token: string }> {
    const response = await api.post('/auth/customer/forgot-password', { email, phone });
    const { token } = response.data.data;

    // Store token and user info in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('_ptoken', token);
      sessionStorage.setItem('_pemail', email);
      sessionStorage.setItem('_pphone', phone);
    }

    return { token };
  },

  async resetPassword(newPassword: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot reset password on server side');
    }

    const token = sessionStorage.getItem('_ptoken');
    const email = sessionStorage.getItem('_pemail');
    const phone = sessionStorage.getItem('_pphone');

    if (!token || !email || !phone) {
      throw new Error('Reset token not found. Please request a new password reset.');
    }

    const response = await api.post('/auth/customer/reset-password', {
      email,
      phone,
      token,
      newPassword,
    });

    // Clear sessionStorage after successful reset
    sessionStorage.removeItem('_ptoken');
    sessionStorage.removeItem('_pemail');
    sessionStorage.removeItem('_pphone');

    return response.data;
  },

  getPasswordResetToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('_ptoken');
  },

  getPasswordResetEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('_pemail');
  },

  getPasswordResetPhone(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('_pphone');
  },

  clearPasswordResetData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('_ptoken');
      sessionStorage.removeItem('_pemail');
      sessionStorage.removeItem('_pphone');
    }
  },
};

