import { AuthUser, LoginCredentials } from '@pulss/types';
import api from './api';

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const { user, tokens } = response.data.data;

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Dispatch storage event for UserContext
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: JSON.stringify(user),
    }));

    return { user, tokens };
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get('/auth/me');
    const userData = response.data.data;
    // Transform to AuthUser format
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role,
      tenantId: userData.tenant?.id || '',
      tenant: userData.tenant || { id: '', name: '', slug: '' },
    };
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Dispatch storage event for UserContext
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: null,
    }));
    
    window.location.href = '/login';
  },

  getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  updateStoredUser(updatedUser: AuthUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Dispatch storage event for UserContext
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: JSON.stringify(updatedUser),
    }));
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
};

