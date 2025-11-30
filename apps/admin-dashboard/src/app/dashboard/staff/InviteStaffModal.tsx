'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, UserPlus, Eye, EyeOff, RefreshCw, Store, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getUserRole } from '@/lib/permissions';

interface InviteStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  // Store fields - only required when SUPER_ADMIN creates Admin
  storeName: z.string().min(2, 'Store name must be at least 2 characters').optional(),
  storeRoute: z.string()
    .min(2, 'Store route must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Store route must contain only lowercase letters, numbers, and hyphens')
    .optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// Generate a strong random password
const generateStrongPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly (minimum 12 characters total)
  const remainingLength = Math.max(8, 12 - password.length);
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate a single strong password
const generatePassword = (): string => {
  return generateStrongPassword();
};

export default function InviteStaffModal({ onClose, onSuccess }: InviteStaffModalProps) {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [storefrontUrl, setStorefrontUrl] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      storeName: '',
      storeRoute: '',
    },
  });

  // Watch storeRoute to update storefront URL preview
  const storeRoute = watch('storeRoute');
  const isCreatingAdmin = mounted && userRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (isCreatingAdmin && storeRoute) {
      // Construct storefront URL
      const storefrontBase = process.env.NEXT_PUBLIC_STOREFRONT_URL || 
        (typeof window !== 'undefined' 
          ? window.location.origin.replace(':3001', ':3000')
          : 'http://localhost:3000');
      setStorefrontUrl(`${storefrontBase}/${storeRoute}`);
    } else {
      setStorefrontUrl('');
    }
  }, [storeRoute, isCreatingAdmin]);

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setValue('password', password);
    toast.success('Password generated');
  };

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const payload: any = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        password: data.password,
      };

      // If creating Admin (SUPER_ADMIN), include store info
      if (isCreatingAdmin) {
        if (!data.storeName || !data.storeRoute) {
          throw new Error('Store name and store route are required when creating an Admin');
        }
        payload.storeName = data.storeName;
        payload.storeRoute = data.storeRoute;
      }

      return await api.post('/staff/invite', payload);
    },
    onSuccess: (_response, variables) => {
      const roleLabel = userRole === 'SUPER_ADMIN' ? 'Admin' : 'Staff';
      toast.success(`${roleLabel} user created successfully`);
      
      // If store route was provided, save it and show storefront link
      if (isCreatingAdmin && variables.storeRoute) {
        const storefrontBase = process.env.NEXT_PUBLIC_STOREFRONT_URL || 
          (typeof window !== 'undefined' 
            ? window.location.origin.replace(':3001', ':3000')
            : 'http://localhost:3000');
        const url = `${storefrontBase}/${variables.storeRoute}`;
        setStorefrontUrl(url);
        
        // Copy to clipboard
        if (typeof window !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast.success('Storefront URL copied to clipboard!');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to create user');
    },
  });

  const onSubmit = (data: InviteFormData) => {
    mutation.mutate(data);
  };

  const roleLabel = mounted && userRole === 'SUPER_ADMIN' ? 'Admin' : 'Staff';
  const title = mounted && userRole === 'SUPER_ADMIN' ? 'Create Admin User' : 'Add Staff Member';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-0 sm:m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">Add a new {roleLabel.toLowerCase()} member to your team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            disabled={mutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Store Name & Store Route - Only for SUPER_ADMIN creating Admin */}
          {isCreatingAdmin && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <Store className="w-4 h-4 mr-2" />
                  Store Information
                </h3>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  id="storeName"
                  type="text"
                  {...register('storeName', { required: isCreatingAdmin })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City Pharmacy"
                />
                {errors.storeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
                )}
              </div>

              {/* Store Route */}
              <div>
                <label htmlFor="storeRoute" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Route (URL Slug) *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {typeof window !== 'undefined' 
                      ? window.location.origin.replace(':3001', ':3000')
                      : 'http://localhost:3000'}
                    /
                  </span>
                  <input
                    id="storeRoute"
                    type="text"
                    {...register('storeRoute', { required: isCreatingAdmin })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent lowercase"
                    placeholder="city-pharmacy"
                    onChange={(e) => {
                      // Auto-lowercase and replace spaces with hyphens
                      const value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setValue('storeRoute', value);
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This will be used in the storefront URL. Only lowercase letters, numbers, and hyphens allowed.
                </p>
                {errors.storeRoute && (
                  <p className="mt-1 text-sm text-red-600">{errors.storeRoute.message}</p>
                )}
                
                {/* Storefront URL Preview */}
                {storeRoute && storefrontUrl && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-2">Storefront URL:</p>
                    <div className="flex items-center space-x-2">
                      <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-green-700 hover:text-green-800 underline truncate"
                      >
                        {storefrontUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(storefrontUrl);
                            toast.success('URL copied to clipboard!');
                          }
                        }}
                        className="p-1 text-green-600 hover:text-green-700 transition"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Password</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password (min 12 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> {mounted && userRole === 'SUPER_ADMIN' 
                ? 'You are creating an Admin user who will have full access to manage this tenant.'
                : 'You are creating a Staff user who will have limited access to manage products and orders.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create {roleLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

