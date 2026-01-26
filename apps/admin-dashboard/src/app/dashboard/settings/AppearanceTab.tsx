'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Image as ImageIcon } from 'lucide-react';

const appearanceSchema = z.object({
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type AppearanceForm = z.infer<typeof appearanceSchema>;

interface AppearanceTabProps {
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  readOnly?: boolean;
}

export default function AppearanceTab({ settings, onSave, isSaving, readOnly = false }: AppearanceTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppearanceForm>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      logo: settings?.logoUrl || '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        logo: settings.logoUrl || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: AppearanceForm) => {
    onSave({
      logoUrl: data.logo || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
      {/* Logo Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand Logo</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="logo"
                type="url"
                {...register('logo')}
                disabled={readOnly}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="https://example.com/logo.png"
              />
            </div>
            {errors.logo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logo.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recommended size: 200x60px. Supports PNG, JPG, SVG formats.
            </p>
          </div>

          {/* Logo Preview */}
          {settings?.logoUrl && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Logo</p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 inline-block">
                <img
                  src={settings.logoUrl}
                  alt="Store Logo"
                  className="h-12 object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

