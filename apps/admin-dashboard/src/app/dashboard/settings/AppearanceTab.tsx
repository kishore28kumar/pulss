'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Image as ImageIcon, Palette } from 'lucide-react';

const appearanceSchema = z.object({
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').optional().or(z.literal('')),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').optional().or(z.literal('')),
});

type AppearanceForm = z.infer<typeof appearanceSchema>;

interface AppearanceTabProps {
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  readOnly?: boolean;
}

export default function AppearanceTab({ settings, onSave, isSaving, readOnly = false }: AppearanceTabProps) {
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor || '#8B5CF6');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppearanceForm>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      logo: settings?.logoUrl || '',
      primaryColor: settings?.primaryColor || '#3B82F6',
      secondaryColor: settings?.secondaryColor || '#8B5CF6',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        logo: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#8B5CF6',
      });
      setPrimaryColor(settings.primaryColor || '#3B82F6');
      setSecondaryColor(settings.secondaryColor || '#8B5CF6');
    }
  }, [settings, reset]);

  const onSubmit = (data: AppearanceForm) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
      {/* Logo Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Brand Logo</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="logo"
                type="url"
                {...register('logo')}
                disabled={readOnly}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="https://example.com/logo.png"
              />
            </div>
            {errors.logo && (
              <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Recommended size: 200x60px. Supports PNG, JPG, SVG formats.
            </p>
          </div>

          {/* Logo Preview */}
          {settings?.logoUrl && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Logo</p>
              <div className="bg-white p-4 rounded border border-gray-200 inline-block">
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

      {/* Color Scheme Section */}
      <div className="border-t border-gray-200 pt-6 sm:pt-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Color Scheme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Primary Color */}
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="primaryColor"
                  type="text"
                  {...register('primaryColor')}
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setValue('primaryColor', e.target.value);
                  }}
                  disabled={readOnly}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="#3B82F6"
                />
              </div>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  setValue('primaryColor', e.target.value);
                }}
                disabled={readOnly}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {errors.primaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Used for buttons, links, and key UI elements
            </p>
          </div>

          {/* Secondary Color */}
          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="secondaryColor"
                  type="text"
                  {...register('secondaryColor')}
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    setValue('secondaryColor', e.target.value);
                  }}
                  disabled={readOnly}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="#8B5CF6"
                />
              </div>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => {
                  setSecondaryColor(e.target.value);
                  setValue('secondaryColor', e.target.value);
                }}
                disabled={readOnly}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {errors.secondaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Used for accents and secondary UI elements
            </p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Color Preview</p>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div 
                className="h-20 rounded-lg border border-gray-300 flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Primary
              </div>
            </div>
            <div className="flex-1">
              <div 
                className="h-20 rounded-lg border border-gray-300 flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
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

