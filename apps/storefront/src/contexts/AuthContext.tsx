'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, Customer } from '@/lib/auth';

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedCustomer = authService.getStoredCustomer();
    if (storedCustomer) {
      setCustomer(storedCustomer);
      // Optionally refresh customer data from server
      refreshCustomer().catch(() => {
        // If refresh fails, clear stored data
        authService.logout();
        setCustomer(null);
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { customer: loggedInCustomer } = await authService.login({ email, password });
      setCustomer(loggedInCustomer);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    try {
      const { customer: registeredCustomer } = await authService.register(data);
      setCustomer(registeredCustomer);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCustomer(null);
  };

  const refreshCustomer = async () => {
    try {
      const updatedCustomer = await authService.getCurrentCustomer();
      setCustomer(updatedCustomer);
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer', JSON.stringify(updatedCustomer));
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        login,
        register,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

