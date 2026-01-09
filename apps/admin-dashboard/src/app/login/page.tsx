'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import api from '@/lib/api';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenLogin, setIsTokenLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Handle token-based login
  useEffect(() => {
    const token = searchParams?.get('token');
    
    if (token) {
      handleTokenLogin(token);
    }
  }, [searchParams]);

  const handleTokenLogin = async (token: string) => {
    setIsTokenLogin(true);
    setIsLoading(true);
    
    try {
      // Verify token and get user info
      const response = await api.post('/auth/login-token', { token });
      const { user, tokens } = response.data.data;

      // Store tokens and user info
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Dispatch storage event for UserContext
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(user),
      }));

      toast.success('Login successful!', { duration: 3000 });
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error: any) {
      setIsTokenLogin(false);
      setIsLoading(false);
      
      const errorMessage = error.response?.data?.error || 'Invalid or expired login token';
      toast.error(errorMessage, { duration: 5000 });
      
      // Remove token from URL
      router.replace('/login', { scroll: false });
    }
  };

  const onSubmit = async (data: LoginForm, e?: React.BaseSyntheticEvent) => {
    // Prevent default form submission to avoid URL parameters
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsLoading(true);
    try {
      await authService.login(data);
      toast.success('Login successful!', { duration: 3000 });
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error: any) {
      // Handle different error scenarios
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with an error
        const status = error.response.status;
        const serverError = error.response?.data?.error || error.response?.data?.message;
        
        if (serverError) {
          errorMessage = serverError;
        } else if (status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (status === 400) {
          errorMessage = 'Invalid request. Please check your email and password.';
        } else if (status === 404) {
          errorMessage = 'Service not found. Please contact support.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      // Show error toast with longer duration (5 seconds)
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl mb-3 sm:mb-4">
            <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pulss Admin</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to manage your store</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form 
            method="post" 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4 sm:space-y-6"
            noValidate
          >
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500"
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (isTokenLogin ? 'Logging in...' : 'Signing in...') : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              Demo: admin@example.com / password123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-600 mt-6 sm:mt-8">
          Powered by <span className="font-semibold text-blue-600">Pulss</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

