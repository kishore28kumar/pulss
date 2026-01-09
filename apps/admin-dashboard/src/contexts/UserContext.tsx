'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@pulss/types';
import { authService } from '@/lib/auth';
import api from '@/lib/api';

interface UserContextType {
  user: AuthUser | null;
  isLoading: boolean;
  updateUser: (updatedUser: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  // Listen for storage events (for cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update user in both state and localStorage
  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: JSON.stringify(updatedUser),
    }));
  }, []);

  // Refresh user from API
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const updatedUser = response.data.data;
      // Transform to AuthUser format (preserve phone if it exists)
      const authUser: AuthUser & { phone?: string } = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        role: updatedUser.role,
        tenantId: updatedUser.tenant?.id || '',
        tenant: updatedUser.tenant || { id: '', name: '', slug: '' },
        ...(updatedUser.phone && { phone: updatedUser.phone }),
      };
      updateUser(authUser as AuthUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [updateUser]);

  return (
    <UserContext.Provider value={{ user, isLoading, updateUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

