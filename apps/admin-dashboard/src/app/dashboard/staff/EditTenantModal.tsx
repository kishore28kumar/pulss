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

interface EditTenantModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const editSchema = z.object({
  scheduleDrugEligible: z.boolean(),
});

type EditFormData = z.infer<typeof editSchema>;

export default function EditTenantModal({ tenantId, tenantName, onClose, onSuccess }: EditTenantModalProps) {
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
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      scheduleDrugEligible: false,
    },
  });

  useEffect(() => {
    if (tenantData) {
      reset({
        scheduleDrugEligible: tenantData.scheduleDrugEligible ?? false,
      });
    }
  }, [tenantData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      return await api.put(`/tenants/${tenantId}`, {
        scheduleDrugEligible: data.scheduleDrugEligible,
      });
    },
    onSuccess: () => {
      toast.success('Tenant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update tenant');
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Tenant Settings</h2>
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
          {/* Schedule Drug Eligibility */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="scheduleDrugEligible" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Eligible to sell Schedule H, H1, and X drugs
                  </label>
                  <div className="relative inline-block w-12 h-6">
                    <input
                      id="scheduleDrugEligible"
                      type="checkbox"
                      {...register('scheduleDrugEligible')}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
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

