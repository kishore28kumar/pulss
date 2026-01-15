'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
});

type EditFormData = z.infer<typeof editSchema>;

export default function EditTenantModal({ tenantId, tenantName, staffMember, onClose, onSuccess }: EditTenantModalProps) {
  const queryClient = useQueryClient();

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
      });
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

