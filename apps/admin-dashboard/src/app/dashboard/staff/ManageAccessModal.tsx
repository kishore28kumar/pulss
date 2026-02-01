'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, ShieldCheck, Check, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  features?: {
    heroCarousel?: boolean;
    sponsoredBanner?: boolean;
    broadcast?: boolean;
  };
}

interface ManageAccessModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface AccessFormData {
  heroCarousel: boolean;
  sponsoredBanner: boolean;
  broadcast: boolean;
}

export default function ManageAccessModal({ tenantId, tenantName, onClose, onSuccess }: ManageAccessModalProps) {
  const queryClient = useQueryClient();

  // Fetch tenant details including features
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
    setValue,
    watch,
  } = useForm<AccessFormData>({
    defaultValues: {
      heroCarousel: true,
      sponsoredBanner: true,
      broadcast: true,
    },
  });

  // Load existing values
  useEffect(() => {
    if (tenantData) {
      if (tenantData.features) {
        setValue('heroCarousel', tenantData.features.heroCarousel ?? true);
        setValue('sponsoredBanner', tenantData.features.sponsoredBanner ?? true);
        setValue('broadcast', tenantData.features.broadcast ?? true);
      }
    }
  }, [tenantData, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: AccessFormData) => {
      await api.put(`/tenants/${tenantId}`, {
        features: {
          heroCarousel: data.heroCarousel,
          sponsoredBanner: data.sponsoredBanner,
          broadcast: data.broadcast,
        },
      });
    },
    onSuccess: () => {
      toast.success('Access permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['staff'] }); // Refresh list if needed
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update access permissions');
    },
  });

  const onSubmit = (data: AccessFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingTenant) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Loading access details...</p>
        </div>
      </div>
    );
  }

  const FeatureToggle = ({ id, label, description }: { id: keyof AccessFormData, label: string, description: string }) => {
    const isEnabled = watch(id);
    
    return (
      <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 mr-4">
          <label htmlFor={id} className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">
            {label}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setValue(id, !isEnabled, { shouldDirty: true })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={isEnabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Manage Access</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={mutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
                Disabling these features will hide them from the tenant's admin dashboard and prevent their usage, regardless of their subscription status.
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <FeatureToggle 
              id="heroCarousel" 
              label="Hero Carousel Requests" 
              description="Allow tenant to request hero carousel image updates."
            />
            <FeatureToggle 
              id="sponsoredBanner" 
              label="Sponsored Banner Requests" 
              description="Allow tenant to request sponsored banner placements."
            />
            <FeatureToggle 
              id="broadcast" 
              label="Customer Broadcasts" 
              description="Allow tenant to send broadcast messages to their customers."
            />
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
