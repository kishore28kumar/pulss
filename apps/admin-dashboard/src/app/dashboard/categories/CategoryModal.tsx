'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  displayOrder: number;
}

interface CategoryModalProps {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  icon: z.string().optional(),
  parentId: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  displayOrder: z.number().min(0, 'Display order must be 0 or greater'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryModal({ category, categories, onClose, onSuccess }: CategoryModalProps) {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      image: category?.image || '',
      icon: category?.icon || '',
      parentId: category?.parentId || '',
      isActive: category?.isActive ?? true,
      displayOrder: category?.displayOrder || 0,
    },
  });

  const name = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', slug);
    }
  }, [name, isEditing, setValue]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        image: data.image || undefined,
        icon: data.icon || undefined,
        parentId: data.parentId || undefined,
        isActive: data.isActive,
        sortOrder: data.displayOrder,
      };

      if (isEditing) {
        return await api.put(`/categories/${category.id}`, payload);
      } else {
        return await api.post('/categories', payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Category updated successfully' : 'Category created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save category');
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  // Filter out the current category from parent options (can't be its own parent)
  const parentOptions = categories.filter(c => !isEditing || c.id !== category?.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Category' : 'Create Category'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Name & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electronics"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  id="slug"
                  type="text"
                  {...register('slug')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., electronics"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the category..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="image"
                  type="url"
                  {...register('image')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
              )}
            </div>

            {/* Parent Category & Display Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  id="parentId"
                  {...register('parentId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  id="displayOrder"
                  type="number"
                  {...register('displayOrder', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
                {errors.displayOrder && (
                  <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>
                )}
              </div>
            </div>

            {/* Icon */}
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                Icon (optional)
              </label>
              <input
                id="icon"
                type="text"
                {...register('icon')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 🏥 or icon name"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active (visible on storefront)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={mutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Category' : 'Create Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

