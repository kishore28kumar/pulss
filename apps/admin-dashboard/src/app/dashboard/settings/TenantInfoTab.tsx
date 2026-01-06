'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Building2, Mail, Phone, MapPin, Tag, CreditCard, Calendar, FileText } from 'lucide-react';
import { getUserRole } from '@/lib/permissions';

const tenantInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

type TenantInfoForm = z.infer<typeof tenantInfoSchema>;

interface TenantInfoTabProps {
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  readOnly?: boolean;
}

export default function TenantInfoTab({ settings, onSave, isSaving, readOnly = false }: TenantInfoTabProps) {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TenantInfoForm>({
    resolver: zodResolver(tenantInfoSchema),
    defaultValues: {
      name: settings?.name || '',
      email: settings?.email || '',
      phone: settings?.phone || '',
      address: settings?.address || '',
      city: settings?.city || '',
      state: settings?.state || '',
      country: settings?.country || '',
      pincode: settings?.pincode || '',
      gstNumber: settings?.gstNumber || '',
      panNumber: settings?.panNumber || '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        country: settings.country || '',
        pincode: settings.pincode || '',
        gstNumber: settings.gstNumber || '',
        panNumber: settings.panNumber || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: TenantInfoForm) => {
    onSave({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      zipCode: data.pincode || undefined,
      gstNumber: data.gstNumber || undefined,
      panNumber: data.panNumber || undefined,
    });
  };

  const isReadOnly = readOnly || (mounted && userRole === 'STAFF');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {/* Read-only Info Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Tag className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">View Only</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You have view-only access to tenant information. Contact an Admin to make changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Basic Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tenant Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tenant Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="name"
                type="text"
                {...register('name')}
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
                placeholder="Tenant Name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Slug (Read-only) */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="slug"
                type="text"
                value={settings?.slug || ''}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed text-gray-900 dark:text-gray-100"
                placeholder="tenant-slug"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Slug cannot be changed</p>
          </div>
        </div>

        {/* Status and Subscription (Read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={settings?.status || 'N/A'}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed capitalize text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subscription Plan
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={settings?.subscriptionPlan || 'N/A'}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed capitalize text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Created Date (Read-only) */}
        {settings?.createdAt && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Created Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={new Date(settings.createdAt).toLocaleDateString()}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                {...register('email')}
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
                placeholder="tenant@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Address Information</h3>
        
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Street Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <textarea
              id="address"
              {...register('address')}
              disabled={isReadOnly}
              rows={2}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
              }`}
              placeholder="123 Main Street, Suite 100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <input
              id="city"
              type="text"
              {...register('city')}
              disabled={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
              placeholder="New York"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State / Province
            </label>
            <input
              id="state"
              type="text"
              {...register('state')}
              disabled={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
              placeholder="NY"
            />
          </div>

          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ZIP / Postal Code
            </label>
            <input
              id="pincode"
              type="text"
              {...register('pincode')}
              disabled={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
              placeholder="10001"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country
            </label>
            <input
              id="country"
              type="text"
              {...register('country')}
              disabled={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
              placeholder="United States"
            />
          </div>
        </div>
      </div>

      {/* Tax Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GST Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="gstNumber"
                type="text"
                {...register('gstNumber')}
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
                placeholder="GST123456789"
              />
            </div>
          </div>

          <div>
            <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PAN Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="panNumber"
                type="text"
                {...register('panNumber')}
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                  isReadOnly ? 'bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed' : ''
                }`}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics (Read-only) */}
      {settings?._count && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 pb-4 sm:pb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Users</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{settings._count.users || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Products</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{settings._count.products || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Orders</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{settings._count.orders || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Customers</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{settings._count.customers || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {!isReadOnly && (
        <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}

