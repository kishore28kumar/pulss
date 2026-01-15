'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UserPlus, Eye, EyeOff, RefreshCw, Store, Copy, ShieldCheck, RotateCcw, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { getUserRole } from '@/lib/permissions';

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
    .max(15, 'Store route must be at most 15 characters')
    .regex(/^[a-z0-9-]+$/, 'Store route must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  // Address fields - only required when SUPER_ADMIN creates Admin
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  state: z.string().min(2, 'State must be at least 2 characters').optional(),
  country: z.string().default('India'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').max(6, 'Pincode must be 6 characters').optional(),
  // Regulatory fields
  gstNumber: z.string().min(1, 'GST number is required').optional(),
  drugLicNumber: z.string().min(1, 'Drug License number is required').optional(),
  pharmacistName: z.string().min(1, 'Pharmacist Name is required').optional(),
  pharmacistRegNumber: z.string().min(1, 'Pharmacist Registration number is required').optional(),
  scheduleDrugEligible: z.boolean().default(false).optional(),
  returnPolicy: z.string().optional(),
  heroImages: z.array(z.string().url('Must be a valid URL')).max(10, 'Maximum 10 hero images allowed').optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// Default Return Policy Template (Plain Text)
const DEFAULT_RETURN_POLICY = `RETURN POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

30-DAY RETURN WINDOW
You have 30 days from the date of delivery to initiate a return.

ORIGINAL CONDITION REQUIRED
Items must be unused, unwashed, and in original packaging with tags attached.

FREE RETURN SHIPPING
We provide free return shipping labels for eligible returns.

QUICK REFUND PROCESSING
Refunds are processed within 5-7 business days after we receive your return.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NON-RETURNABLE ITEMS
• Perishable goods (food, beverages, etc.)
• Personalized or custom-made items
• Items damaged by misuse or normal wear
• Items without original packaging or tags
• Gift cards and digital products

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFUND INFORMATION

Refund Method
Refunds will be issued to the original payment method used for the purchase. Processing time may vary by payment method.

Refund Timeline
Once we receive your return, we'll inspect it and process your refund within 5-7 business days. You'll receive an email confirmation when the refund is processed.

Partial Refunds
If you're returning only part of your order, you'll receive a partial refund for the returned items. Shipping costs are non-refundable unless the return is due to our error.`;

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

export default function NewStaffPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [storefrontUrl, setStorefrontUrl] = useState<string>('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const heroImageFileInputRef = useRef<HTMLInputElement>(null);

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
    reset,
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
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      gstNumber: '',
      drugLicNumber: '',
      pharmacistName: '',
      pharmacistRegNumber: '',
      scheduleDrugEligible: false,
      returnPolicy: DEFAULT_RETURN_POLICY,
      heroImages: [],
    },
  });

  // Reset form on mount to ensure it starts empty
  useEffect(() => {
    reset({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      storeName: '',
      storeRoute: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      gstNumber: '',
      drugLicNumber: '',
      pharmacistName: '',
      pharmacistRegNumber: '',
      scheduleDrugEligible: false,
      returnPolicy: DEFAULT_RETURN_POLICY,
      heroImages: [],
    });
    setHeroImages([]);
  }, [reset]);

  // Watch storeRoute to update storefront URL preview
  const storeRoute = watch('storeRoute');
  const isCreatingAdmin = mounted && userRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (isCreatingAdmin && storeRoute) {
      // Construct storefront URL using config
      const { getStorefrontUrl } = require('@/lib/config/urls');
      const storefrontBase = typeof window !== 'undefined'
        ? getStorefrontUrl()
        : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
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

  // Hero Image Upload Handler
  const handleHeroImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (heroImages.length >= 10) {
      toast.error('Maximum 10 hero images allowed');
      return;
    }

    setUploadingHeroImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;
      const updatedImages = [...heroImages, uploadedUrl];
      setHeroImages(updatedImages);
      setValue('heroImages', updatedImages);
      toast.success('Hero image uploaded successfully');

      if (heroImageFileInputRef.current) {
        heroImageFileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleHeroImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleHeroImageUpload(file);
    }
  };

  const handleAddHeroImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      try {
        new URL(url); // Validate URL
        if (heroImages.length >= 10) {
          toast.error('Maximum 10 hero images allowed');
          return;
        }
        const updatedImages = [...heroImages, url];
        setHeroImages(updatedImages);
        setValue('heroImages', updatedImages);
        toast.success('Hero image URL added');
      } catch {
        toast.error('Invalid URL');
      }
    }
  };

  const handleRemoveHeroImage = (index: number) => {
    const updatedImages = heroImages.filter((_, i) => i !== index);
    setHeroImages(updatedImages);
    setValue('heroImages', updatedImages);
    toast.success('Hero image removed');
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
        if (!data.address || !data.city || !data.state || !data.pincode) {
          throw new Error('All address fields are required when creating an Admin');
        }
        payload.storeName = data.storeName;
        payload.storeRoute = data.storeRoute;
        // Include address fields
        payload.address = data.address;
        payload.city = data.city;
        payload.state = data.state;
        payload.country = data.country || 'India';
        payload.pincode = data.pincode;

        // Include regulatory fields
        if (!data.gstNumber || !data.drugLicNumber || !data.pharmacistName || !data.pharmacistRegNumber) {
          throw new Error('All regulatory details are required when creating an Admin');
        }
        payload.gstNumber = data.gstNumber;
        payload.drugLicNumber = data.drugLicNumber;
        payload.pharmacistName = data.pharmacistName;
        payload.pharmacistRegNumber = data.pharmacistRegNumber;
        payload.scheduleDrugEligible = data.scheduleDrugEligible ?? false;
        payload.returnPolicy = data.returnPolicy || DEFAULT_RETURN_POLICY;
        payload.heroImages = heroImages.length > 0 ? heroImages : [];
      }

      return await api.post('/staff/invite', payload);
    },
    onSuccess: (_response, variables) => {
      const roleLabel = userRole === 'SUPER_ADMIN' ? 'Admin' : 'Staff';
      toast.success(`${roleLabel} user created successfully`);

      // If store route was provided, copy URL to clipboard
      if (isCreatingAdmin && variables.storeRoute) {
        const { getStorefrontUrl } = require('@/lib/config/urls');
        const storefrontBase = typeof window !== 'undefined'
          ? getStorefrontUrl()
          : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
        const url = `${storefrontBase}/${variables.storeRoute}`;
        if (typeof window !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast.success('Storefront URL copied to clipboard!');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });

      // Navigate back to staff page
      router.push('/dashboard/staff');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to create user');
    },
  });

  const onSubmit = (data: InviteFormData) => {
    mutation.mutate(data);
  };

  const roleLabel = mounted && userRole === 'SUPER_ADMIN' ? 'Tenant' : 'Staff';
  const title = mounted && userRole === 'SUPER_ADMIN' ? 'Create Tenant Admin' : 'Add Staff Member';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500 font-medium">
              Add a new {roleLabel.toLowerCase()} member to your team
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
            )}
          </div>

          {/* Store Name & Store Route - Only for SUPER_ADMIN creating Admin */}
          {isCreatingAdmin && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Store Information
                </h3>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <input
                  id="storeName"
                  type="text"
                  {...register('storeName', { required: isCreatingAdmin })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="City Pharmacy"
                />
                {errors.storeName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storeName.message}</p>
                )}
              </div>

              {/* Store Route */}
              <div>
                <label htmlFor="storeRoute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Route (URL Slug) *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {typeof window !== 'undefined'
                      ? window.location.origin.replace(':3001', ':3000')
                      : 'http://localhost:3000'}
                    /
                  </span>
                  <input
                    id="storeRoute"
                    type="text"
                    {...register('storeRoute', { required: isCreatingAdmin })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent lowercase bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="city-pharmacy"
                    maxLength={15}
                    onChange={(e) => {
                      // Auto-lowercase and replace spaces with hyphens
                      // Limit to 15 characters
                      let value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      if (value.length > 15) {
                        value = value.substring(0, 15);
                      }
                      setValue('storeRoute', value);
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used in the storefront URL. Only lowercase letters, numbers, and hyphens allowed. Maximum 15 characters.
                </p>
                {errors.storeRoute && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storeRoute.message}</p>
                )}

                {/* Storefront URL Preview */}
                {storeRoute && storefrontUrl && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">Storefront URL:</p>
                    <div className="flex items-center space-x-2">
                      <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline truncate"
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
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Store Address</h3>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address', { required: isCreatingAdmin })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="123 Main Street, Suite 100"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>
                )}
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    {...register('state', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state.message}</p>
                  )}
                </div>
              </div>

              {/* Country and Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country *
                  </label>
                  <input
                    id="country"
                    type="text"
                    {...register('country')}
                    value="India"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    {...register('pincode', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="400001"
                    maxLength={6}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      setValue('pincode', value);
                    }}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              {/* Regulatory Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Regulatory/Pharmacy Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GST Number */}
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number *
                  </label>
                  <input
                    id="gstNumber"
                    type="text"
                    {...register('gstNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 uppercase"
                    placeholder="27AAAAA0000A1Z5"
                  />
                  {errors.gstNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gstNumber.message}</p>
                  )}
                </div>

                {/* Drug License Number */}
                <div>
                  <label htmlFor="drugLicNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drug License Number *
                  </label>
                  <input
                    id="drugLicNumber"
                    type="text"
                    {...register('drugLicNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="DL NO: 123456"
                  />
                  {errors.drugLicNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.drugLicNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pharmacist Name */}
                <div>
                  <label htmlFor="pharmacistName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registered Pharmacist Name *
                  </label>
                  <input
                    id="pharmacistName"
                    type="text"
                    {...register('pharmacistName', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="John Doe"
                  />
                  {errors.pharmacistName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacistName.message}</p>
                  )}
                </div>

                {/* Pharmacist Registration Number */}
                <div>
                  <label htmlFor="pharmacistRegNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pharmacist Registration Number *
                  </label>
                  <input
                    id="pharmacistRegNumber"
                    type="text"
                    {...register('pharmacistRegNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="REG-12345/2023"
                  />
                  {errors.pharmacistRegNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacistRegNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Schedule Drug Eligibility Toggle */}
              <div className="mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <label htmlFor="scheduleDrugEligible" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Eligible to sell Schedule H, H1, and X
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable this if the store is licensed to sell Schedule H, H1, and X drugs
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = watch('scheduleDrugEligible') ?? false;
                        setValue('scheduleDrugEligible', !currentValue);
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        watch('scheduleDrugEligible') ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={watch('scheduleDrugEligible') ?? false}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          watch('scheduleDrugEligible') ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <input
                      type="hidden"
                      {...register('scheduleDrugEligible')}
                    />
                  </div>
                </div>
              </div>

              {/* Return Policy */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Return and Refund Policy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Customize the return and refund policy that will be displayed on the storefront returns page. You can edit this later.
                </p>
                <div>
                  <label htmlFor="returnPolicy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Return and Refund Policy
                  </label>
                  <textarea
                    id="returnPolicy"
                    {...register('returnPolicy')}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm whitespace-pre-wrap"
                    placeholder="Enter your return and refund policy. Use clear section separators (like dashes or blank lines) to organize your content."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This content will be displayed on your storefront returns page. Line breaks and spacing will be preserved.
                  </p>
                  {errors.returnPolicy && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.returnPolicy.message}</p>
                  )}
                </div>
              </div>

              {/* Hero Images */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Homepage Hero Images
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload up to 10 hero images to display on the storefront homepage. If no images are uploaded, default images will be shown.
                </p>

                {/* Upload Options */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    ref={heroImageFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleHeroImageFileChange}
                    className="hidden"
                    disabled={uploadingHeroImage || heroImages.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={() => heroImageFileInputRef.current?.click()}
                    disabled={uploadingHeroImage || heroImages.length >= 10}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingHeroImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddHeroImageUrl}
                    disabled={heroImages.length >= 10}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image URL
                  </button>
                </div>

                {/* Hero Images Grid */}
                {heroImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Drag images to reorder. Images will be displayed in this order on the homepage.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {heroImages.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={imageUrl}
                              alt={`Hero ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHeroImage(index)}
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {heroImages.length} / 10 images uploaded
                    </p>
                  </div>
                )}

                {heroImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      No hero images uploaded
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Default images will be displayed on the homepage if no images are uploaded.
                    </p>
                  </div>
                )}

                {errors.heroImages && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.heroImages.message}</p>
                )}
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
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
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter password (min 12 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> {mounted && userRole === 'SUPER_ADMIN'
                ? 'You are creating a Tenant Admin who will have full access to manage this tenant.'
                : 'You are creating a Staff user who will have limited access to manage products and orders.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition bg-white dark:bg-gray-800"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

