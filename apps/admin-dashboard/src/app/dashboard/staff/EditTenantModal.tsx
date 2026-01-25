'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Building2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  scheduleDrugEligible?: boolean;
  returnPolicy?: string;
  primaryContactWhatsApp?: string;
  isPrimaryContactWhatsApp?: boolean;
  shopFrontPhoto?: string;
  ownerPhoto?: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
}

interface EditTenantModalProps {
  tenantId: string;
  tenantName: string;
  staffMember: StaffMember;
  onClose: () => void;
  onSuccess: () => void;
}

const editSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  isActive: z.boolean(),
  scheduleDrugEligible: z.boolean(),
  returnPolicy: z.string().optional(),
  isPrimaryContactWhatsApp: z.boolean(),
  primaryContactWhatsApp: z.string().regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits').optional().or(z.literal('')),
  shopFrontPhoto: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownerPhoto: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type EditFormData = z.infer<typeof editSchema>;

export default function EditTenantModal({ tenantId, tenantName, staffMember, onClose, onSuccess }: EditTenantModalProps) {
  const queryClient = useQueryClient();
  const [shopFrontPhoto, setShopFrontPhoto] = useState<string>('');
  const [ownerPhoto, setOwnerPhoto] = useState<string>('');
  const [uploadingShopFrontPhoto, setUploadingShopFrontPhoto] = useState(false);
  const [uploadingOwnerPhoto, setUploadingOwnerPhoto] = useState(false);
  const shopFrontPhotoInputRef = useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);

  // Fetch tenant details
  const { data: tenantData, isLoading: isLoadingTenant } = useQuery<Tenant>({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data.data;
    },
    enabled: !!tenantId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      phone: staffMember.phone || '',
      isActive: staffMember.isActive ?? true,
      scheduleDrugEligible: false,
      returnPolicy: '',
      isPrimaryContactWhatsApp: false,
      primaryContactWhatsApp: '',
      shopFrontPhoto: '',
      ownerPhoto: '',
    },
  });

  const scheduleDrugEligibleValue = watch('scheduleDrugEligible');
  
  const handleToggleScheduleDrug = () => {
    setValue('scheduleDrugEligible', !scheduleDrugEligibleValue, { shouldValidate: true });
  };

  useEffect(() => {
    if (tenantData) {
      reset({
        firstName: staffMember.firstName || '',
        lastName: staffMember.lastName || '',
        phone: staffMember.phone || '',
        isActive: staffMember.isActive ?? true,
        scheduleDrugEligible: tenantData.scheduleDrugEligible ?? false,
        returnPolicy: tenantData.returnPolicy || '',
        isPrimaryContactWhatsApp: tenantData.isPrimaryContactWhatsApp ?? false,
        primaryContactWhatsApp: tenantData.primaryContactWhatsApp || '',
        shopFrontPhoto: tenantData.shopFrontPhoto || '',
        ownerPhoto: tenantData.ownerPhoto || '',
      });
      setShopFrontPhoto(tenantData.shopFrontPhoto || '');
      setOwnerPhoto(tenantData.ownerPhoto || '');
    }
  }, [tenantData, staffMember, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      // Update staff member
      await api.put(`/staff/${staffMember.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        isActive: data.isActive,
      });
      
      // Update tenant
      await api.put(`/tenants/${tenantId}`, {
        scheduleDrugEligible: data.scheduleDrugEligible,
        returnPolicy: data.returnPolicy,
        isPrimaryContactWhatsApp: data.isPrimaryContactWhatsApp,
        primaryContactWhatsApp: data.isPrimaryContactWhatsApp ? data.phone : (data.primaryContactWhatsApp || undefined),
        shopFrontPhoto: shopFrontPhoto || undefined,
        ownerPhoto: ownerPhoto || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Tenant and admin updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update tenant and admin');
    },
  });

  const onSubmit = (data: EditFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingTenant) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-0 sm:m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Tenant</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            disabled={mutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          {/* Staff Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Admin Information</h3>
            
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

            {/* Active Status */}
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>

          {/* Tenant Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Tenant Settings</h3>
            
            {/* Schedule Drug Eligibility */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="scheduleDrugEligible" className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                      Eligible to sell Schedule H, H1, and X drugs
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleScheduleDrug}
                      className="relative inline-block w-12 h-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                      aria-label="Toggle schedule drug eligibility"
                    >
                      <input
                        id="scheduleDrugEligible"
                        type="checkbox"
                        {...register('scheduleDrugEligible')}
                        className="sr-only"
                        checked={scheduleDrugEligibleValue}
                        readOnly
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        scheduleDrugEligibleValue 
                          ? 'bg-blue-600 dark:bg-blue-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-transform ${
                          scheduleDrugEligibleValue ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                    When enabled, this tenant can sell Schedule H, H1, and X drugs. When disabled, warning messages will be displayed on the storefront for these products.
                  </p>
                </div>
              </div>
              {errors.scheduleDrugEligible && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.scheduleDrugEligible.message}</p>
              )}
            </div>

            {/* Return Policy */}
            <div className="mt-4">
              <label htmlFor="returnPolicy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Return and Refund Policy
              </label>
              <textarea
                id="returnPolicy"
                {...register('returnPolicy')}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                    placeholder={`# Return Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 30-Day Return Window
You have 30 days from the date of delivery to initiate a return.

# Original Condition Required
Items must be unused, unwashed, and in original packaging with tags attached.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Non-Returnable Items
• Perishable goods (food, beverages, etc.)
• Personalized or custom-made items
• Items damaged by misuse

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Refund Information

## Refund Method:
Refunds will be issued to the original payment method used for the purchase.

## Refund Timeline:
Once we receive your return, we'll process your refund within 5-7 business days.`}
              />
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Formatting Tips:</p>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li><strong>Headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded"># Header Text</code> for main section headers</li>
                  <li><strong>Sub-headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">## Sub-header Text</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Label:</code> format</li>
                  <li><strong>Bullets:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">•</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">-</code>, or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">*</code> for lists</li>
                  <li><strong>Separators:</strong> Use separator lines (━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) to divide sections</li>
                  <li><strong>Paragraphs:</strong> Regular text will be displayed as paragraphs</li>
                </ul>
              </div>
              {errors.returnPolicy && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.returnPolicy.message}</p>
              )}
            </div>
          </div>

          {/* Contact & Media */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact & Media</h3>
            
            {/* Primary Contact WhatsApp */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Contact Number
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="1234567890"
                maxLength={10}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
              
              {/* WhatsApp Checkbox */}
              <div className="mt-3 flex items-center">
                <input
                  id="isPrimaryContactWhatsApp"
                  type="checkbox"
                  {...register('isPrimaryContactWhatsApp')}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <label htmlFor="isPrimaryContactWhatsApp" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Is this a WhatsApp number?
                </label>
              </div>
              
              {/* WhatsApp Number Input (shown if checkbox unchecked) */}
              {!watch('isPrimaryContactWhatsApp') && (
                <div className="mt-3">
                  <label htmlFor="primaryContactWhatsApp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    id="primaryContactWhatsApp"
                    type="tel"
                    {...register('primaryContactWhatsApp', {
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'WhatsApp number must be exactly 10 digits'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="1234567890"
                    maxLength={10}
                  />
                  {errors.primaryContactWhatsApp && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryContactWhatsApp.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Shop Front Photo & Owner Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shop Front Photo */}
              <div>
                <label htmlFor="shopFrontPhoto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shop Front Photo
                </label>
                <div className="space-y-2">
                  <input
                    id="shopFrontPhoto"
                    type="url"
                    {...register('shopFrontPhoto')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    placeholder="https://example.com/shop-front.jpg"
                    onChange={(e) => setShopFrontPhoto(e.target.value)}
                  />
                  <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                    <input
                      type="file"
                      ref={shopFrontPhotoInputRef}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image size must be less than 5MB');
                            return;
                          }
                          setUploadingShopFrontPhoto(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const response = await api.post('/upload', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            const uploadedUrl = response.data.data.url;
                            setShopFrontPhoto(uploadedUrl);
                            setValue('shopFrontPhoto', uploadedUrl);
                            toast.success('Shop front photo uploaded successfully');
                            if (shopFrontPhotoInputRef.current) shopFrontPhotoInputRef.current.value = '';
                          } catch (error: any) {
                            toast.error(error.response?.data?.error || 'Failed to upload image');
                          } finally {
                            setUploadingShopFrontPhoto(false);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => shopFrontPhotoInputRef.current?.click()}
                      disabled={uploadingShopFrontPhoto}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingShopFrontPhoto ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 mr-1" />
                      )}
                      {uploadingShopFrontPhoto ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {shopFrontPhoto && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={shopFrontPhoto} 
                        alt="Shop Front Preview" 
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          // Image loaded successfully
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                          target.onerror = null; // Prevent infinite loop
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShopFrontPhoto('');
                          setValue('shopFrontPhoto', '');
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition z-10 shadow-lg"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                        Preview
                      </div>
                    </div>
                  )}
                </div>
                {errors.shopFrontPhoto && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shopFrontPhoto.message}</p>
                )}
              </div>

              {/* Owner Photo */}
              <div>
                <label htmlFor="ownerPhoto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Photo
                </label>
                <div className="space-y-2">
                  <input
                    id="ownerPhoto"
                    type="url"
                    {...register('ownerPhoto')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    placeholder="https://example.com/owner.jpg"
                    onChange={(e) => setOwnerPhoto(e.target.value)}
                  />
                  <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                    <input
                      type="file"
                      ref={ownerPhotoInputRef}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image size must be less than 5MB');
                            return;
                          }
                          setUploadingOwnerPhoto(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const response = await api.post('/upload', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            const uploadedUrl = response.data.data.url;
                            setOwnerPhoto(uploadedUrl);
                            setValue('ownerPhoto', uploadedUrl);
                            toast.success('Owner photo uploaded successfully');
                            if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = '';
                          } catch (error: any) {
                            toast.error(error.response?.data?.error || 'Failed to upload image');
                          } finally {
                            setUploadingOwnerPhoto(false);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => ownerPhotoInputRef.current?.click()}
                      disabled={uploadingOwnerPhoto}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingOwnerPhoto ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 mr-1" />
                      )}
                      {uploadingOwnerPhoto ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {ownerPhoto && (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={ownerPhoto} 
                        alt="Owner Photo Preview" 
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          // Image loaded successfully
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                          target.onerror = null; // Prevent infinite loop
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerPhoto('');
                          setValue('ownerPhoto', '');
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition z-10 shadow-lg"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                        Preview
                      </div>
                    </div>
                  )}
                </div>
                {errors.ownerPhoto && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ownerPhoto.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm sm:text-base"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Tenant'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

