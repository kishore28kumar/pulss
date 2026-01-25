'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Store, Mail, Lock, User, Phone, Eye, EyeOff, MapPin, Check, X } from 'lucide-react';
import { validatePassword, getPasswordRequirements } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { login, register, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
  });

  // Form validation errors state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Show loading while tenant is loading
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push(`/${storeName}`);
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      router.push(`/${storeName}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10);
    setRegisterData({ ...registerData, phone: limitedDigits });
    // Clear phone error when user types
    if (formErrors.phone) {
      setFormErrors({ ...formErrors, phone: '' });
    }
  };

  // Comprehensive validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate first name
    if (!registerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Validate last name
    if (!registerData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Validate email
    if (!registerData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate phone
    if (!registerData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const digitsOnly = registerData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    // Validate password
    const passwordValidation = validatePassword(registerData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error || 'Invalid password';
    }

    // Validate city
    if (!registerData.city.trim()) {
      errors.city = 'City is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields before submission
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
      });
      
      // Store city in localStorage for use in checkout
      if (typeof window !== 'undefined') {
        localStorage.setItem('customerAddress', JSON.stringify({
          name: `${registerData.firstName} ${registerData.lastName}`,
          phone: registerData.phone,
          city: registerData.city,
        }));
      }
      
      toast.success('Account created successfully!');
      router.push(`/${storeName}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-lg object-cover" />
            ) : (
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl mb-3 sm:mb-4">
                <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome to {tenant?.name || 'Pulss Store'}</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Sign in to continue shopping</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 sm:mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setFormErrors({});
              }}
              className={`flex-1 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium transition-colors ${
                isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setFormErrors({});
              }}
              className={`flex-1 py-2.5 sm:py-3 text-center text-sm sm:text-base font-medium transition-colors ${
                !isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Links */}
              <div className="flex items-center justify-between pt-2 text-sm">
                <Link
                  href={`/${storeName}/forgot-password`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot Password?
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                    setFormErrors({});
                  }}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  New User? <span className="text-blue-600 hover:text-blue-700">Sign Up</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={registerData.firstName}
                      onChange={(e) => {
                        setRegisterData({ ...registerData, firstName: e.target.value });
                        if (formErrors.firstName) {
                          setFormErrors({ ...formErrors, firstName: '' });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.lastName}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, lastName: e.target.value });
                      if (formErrors.lastName) {
                        setFormErrors({ ...formErrors, lastName: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, email: e.target.value });
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: '' });
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={registerData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                  />
                </div>
                {formErrors.phone ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                ) : registerData.phone ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {registerData.phone.replace(/\D/g, '').length}/10 digits
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={registerData.password}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, password: e.target.value });
                      if (formErrors.password) {
                        setFormErrors({ ...formErrors, password: '' });
                      }
                    }}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                )}
                {registerData.password && (
                  <div className="mt-2 space-y-1">
                    {(() => {
                      const requirements = getPasswordRequirements(registerData.password);
                      return (
                        <>
                          <div className={`flex items-center text-xs ${requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.minLength ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            At least 8 characters
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasUppercase ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one uppercase letter
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasLowercase ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one lowercase letter
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasNumber ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one number
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasSpecial ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one special character
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                {!registerData.password && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character
                  </p>
                )}
              </div>

              {/* City Field */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Location</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.city}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, city: e.target.value });
                      if (formErrors.city) {
                        setFormErrors({ ...formErrors, city: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              {/* Already have account link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                    setFormErrors({});
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Already have an account? <span className="text-blue-600 hover:text-blue-700">Sign In</span>
                </button>
              </div>
            </form>
          )}

        </div>
        </div>
      </div>

      {/* Right Column - Image (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md">
            <h3 className="text-4xl font-bold mb-4">Shop with Confidence</h3>
            <p className="text-xl mb-8 text-blue-100">
              Discover amazing products and enjoy seamless shopping experience
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Fast delivery</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
      </div>
    </div>
  );
}

