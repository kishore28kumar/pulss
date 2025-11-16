'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  compareAtPrice: z.number().min(0, 'Compare at price must be 0 or greater').optional(),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater').optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater').optional(),
  lowStockThreshold: z.number().min(0, 'Low stock threshold must be 0 or greater').optional(),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  weightUnit: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, 'At least one category is required'),
  images: z.array(z.string().url('Must be a valid URL')).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  requiresPrescription: z.boolean().default(false),
  isOTC: z.boolean().default(false),
  manufacturer: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState('');

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data as Category[];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      price: 0,
      compareAtPrice: undefined,
      costPrice: undefined,
      sku: '',
      barcode: '',
      trackInventory: true,
      stockQuantity: 0,
      lowStockThreshold: 10,
      weight: undefined,
      weightUnit: 'kg',
      categoryIds: [],
      images: [],
      isActive: true,
      isFeatured: false,
      requiresPrescription: false,
      isOTC: false,
      manufacturer: '',
      metaTitle: '',
      metaDescription: '',
    },
  });

  const name = watch('name');
  const trackInventory = watch('trackInventory');
  const selectedCategories = watch('categoryIds');

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', slug);
    }
  }, [name, setValue]);

  // Create product mutation
  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        shortDescription: data.shortDescription || undefined,
        price: data.price,
        compareAtPrice: data.compareAtPrice || undefined,
        costPrice: data.costPrice || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity || undefined,
        lowStockThreshold: data.lowStockThreshold || undefined,
        weight: data.weight || undefined,
        weightUnit: data.weightUnit || undefined,
        categoryIds: data.categoryIds,
        images: data.images || undefined,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        requiresPrescription: data.requiresPrescription,
        isOTC: data.isOTC,
        manufacturer: data.manufacturer || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      };

      return await api.post('/products', payload);
    },
    onSuccess: () => {
      toast.success('Product created successfully');
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  const handleAddImage = () => {
    if (imageUrl) {
      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, imageUrl]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = watch('images') || [];
    setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = watch('categoryIds') || [];
    if (checked) {
      setValue('categoryIds', [...currentCategories, categoryId]);
    } else {
      setValue('categoryIds', currentCategories.filter((id) => id !== categoryId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
          <p className="text-gray-500 mt-1">Add a new product to your inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Product Name"
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
                placeholder="e.g., product-name"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              id="shortDescription"
              type="text"
              {...register('shortDescription')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief product description"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed product description"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price
              </label>
              <input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register('compareAtPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price
              </label>
              <input
                id="costPrice"
                type="number"
                step="0.01"
                {...register('costPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
          
          <div className="flex items-center mb-4">
            <input
              id="trackInventory"
              type="checkbox"
              {...register('trackInventory')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="trackInventory" className="ml-2 text-sm font-medium text-gray-700">
              Track inventory
            </label>
          </div>

          {trackInventory && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  id="stockQuantity"
                  type="number"
                  {...register('stockQuantity', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  {...register('lowStockThreshold', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                id="sku"
                type="text"
                {...register('sku')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., SKU-12345"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <input
                id="barcode"
                type="text"
                {...register('barcode')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1234567890123"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories *</h2>
          
          {categoriesLoading ? (
            <div className="text-gray-500">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {categories?.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories?.includes(category.id) || false}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          )}
          {errors.categoryIds && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryIds.message}</p>
          )}
        </div>

        {/* Images */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter image URL"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Add Image
            </button>
          </div>

          {watch('images') && watch('images')!.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {watch('images')!.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                id="manufacturer"
                type="text"
                {...register('manufacturer')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Manufacturer name"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <div className="flex space-x-2">
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  {...register('weight', { valueAsNumber: true })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                />
                <select
                  {...register('weightUnit')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isFeatured"
                type="checkbox"
                {...register('isFeatured')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="ml-2 text-sm font-medium text-gray-700">
                Featured
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="requiresPrescription"
                type="checkbox"
                {...register('requiresPrescription')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiresPrescription" className="ml-2 text-sm font-medium text-gray-700">
                Requires Prescription
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isOTC"
                type="checkbox"
                {...register('isOTC')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isOTC" className="ml-2 text-sm font-medium text-gray-700">
                Over-the-Counter (OTC)
              </label>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                id="metaTitle"
                type="text"
                {...register('metaTitle')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO title"
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                {...register('metaDescription')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO description"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/products"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}

