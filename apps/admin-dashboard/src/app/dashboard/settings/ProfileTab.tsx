'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Save, Loader2, Upload, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { AuthUser } from '@pulss/types';

interface ProfileTabProps {
  readOnly?: boolean;
}

export default function ProfileTab({ readOnly = false }: ProfileTabProps) {
  const { user, updateUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setAvatar((user as AuthUser & { avatar?: string })?.avatar || '');
    }
  }, [user]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;
      setAvatar(uploadedUrl);
      toast.success('Image uploaded successfully');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const response = await api.put('/auth/profile', { avatar: avatarUrl });
      return response.data.data;
    },
    onSuccess: (updatedData) => {
      // Transform to AuthUser format and update context
      const updatedUser: AuthUser & { phone?: string; avatar?: string } = {
        id: updatedData.id,
        email: updatedData.email,
        firstName: updatedData.firstName || '',
        lastName: updatedData.lastName || '',
        role: updatedData.role,
        tenantId: updatedData.tenant?.id || user?.tenantId || '',
        tenant: updatedData.tenant || user?.tenant || { id: '', name: '', slug: '' },
        phone: updatedData.phone || '',
        avatar: updatedData.avatar || '',
      };
      updateUser(updatedUser as AuthUser);
      toast.success('Profile picture updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile picture');
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(avatar);
  };

  if (!mounted || !user) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Picture</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your profile picture</p>
        </div>
      </div>

      {/* Avatar Upload Section */}
      <div className="space-y-4">
        {/* Current Avatar Preview */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            {avatar ? (
              <div className="relative">
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    aria-label="Remove avatar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Recommended size: 200x200px. Supports PNG, JPG formats. Max size: 5MB.
            </p>
            {!readOnly && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading || updateProfileMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || updateProfileMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {avatar ? 'Change Picture' : 'Upload Picture'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        {!readOnly && avatar && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateProfileMutation.isPending || !avatar}
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
      </div>
    </div>
  );
}

