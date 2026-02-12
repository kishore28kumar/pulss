'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
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
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  weightUnit: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const [imageUrl, setImageUrl] = useState('');

  // Fetch product data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}`);
      return response.data.data;
    },
    enabled: !!productId,
  });

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
    setError,
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

  const trackInventory = watch('trackInventory');
  const selectedCategories = watch('categoryIds');

  // Load product data into form
  useEffect(() => {
    if (product) {
      // Populate all form fields immediately when product data is available
      setValue('name', product.name || '');
      setValue('slug', product.slug || '');
      setValue('description', product.description || '');
      setValue('shortDescription', product.shortDescription || '');
      setValue('price', product.price || 0);
      setValue('compareAtPrice', product.comparePrice || undefined);
      setValue('costPrice', product.costPrice || undefined);
      setValue('sku', product.sku || '');
      setValue('barcode', product.barcode || '');
      setValue('trackInventory', product.trackInventory ?? true);
      setValue('stockQuantity', product.stock || 0);
      setValue('weight', product.weight || undefined);
      setValue('weightUnit', product.weightUnit || 'kg');

      // Handle images - check if they're strings or objects with url property
      let productImages: string[] = [];
      if (product.images && Array.isArray(product.images)) {
        productImages = product.images.map((img: any) => {
          if (typeof img === 'string') {
            return img;
          } else if (img?.url) {
            return img.url;
          }
          return '';
        }).filter(Boolean);
      }
      // If no images in array but thumbnail exists, use thumbnail as first image
      if (productImages.length === 0 && product.thumbnail) {
        productImages = [product.thumbnail];
      }
      setValue('images', productImages);

      setValue('isActive', product.isActive ?? true);
      setValue('isFeatured', product.isFeatured ?? false);
      setValue('requiresPrescription', product.requiresPrescription ?? false);
      setValue('isOTC', product.isOTC ?? false);
      setValue('manufacturer', product.manufacturer || '');
      setValue('metaTitle', product.metaTitle || '');
      setValue('metaDescription', product.metaDescription || '');
    }
  }, [product, setValue]);

  // Handle category selection separately (after categories are loaded)
  useEffect(() => {
    if (product && categories && categories.length > 0) {
      // Set category: use existing category if available
      const existingCategoryId = product.categories?.[0]?.id;
      if (existingCategoryId) {
        setValue('categoryIds', [existingCategoryId]);
      }
    }
  }, [product, categories, setValue]);

  // Update product mutation
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

      console.log('Sending payload to API:', payload);
      console.log('isFeatured in payload:', payload.isFeatured);

      return await api.put(`/products/${productId}`, payload);
    },
    onSuccess: (response) => {
      console.log('Update successful:', response.data);
      toast.success('Product updated successfully');
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to update product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    console.log('onSubmit called with data:', data);
    console.log('isFeatured value:', data.isFeatured);
    if (categories && categories.length > 0 && (!data.categoryIds || data.categoryIds.length === 0)) {
       setError('categoryIds', { type: 'manual', message: 'At least one category is required' });
       return;
    }
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

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Update product information</p>
          </div>
        </div>
      </div>

      {/* Product Preview */}
      {product && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Product Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div>
              {(product.thumbnail || (product.images && product.images.length > 0)) ? (
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={product.thumbnail || (Array.isArray(product.images) ? product.images[0] : product.images?.[0]?.url || '')}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const fallback = product.images && Array.isArray(product.images) && product.images.length > 0
                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || '')
                        : 'https://via.placeholder.com/400?text=No+Image';
                      (e.target as HTMLImageElement).src = fallback;
                    }}
                  />
                </div>
              ) : (
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500">No Image</span>
                </div>
              )}
            </div>
            {/* Product Info */}
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Price:</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">${product.price?.toFixed(2) || '0.00'}</p>
              </div>
              {product.sku && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU:</span>
                  <p className="text-gray-900 dark:text-gray-100">{product.sku}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(
          (data) => {
            console.log('Form submitted with data:', data);
            console.log('isFeatured value:', data.isFeatured);
            onSubmit(data);
          },
          (errors) => {
            console.error('Form validation errors:', errors);
            // Show toast error for each validation error
            const errorMessages = Object.entries(errors).map(([field, error]: [string, any]) => {
              return `${field}: ${error?.message || 'Invalid value'}`;
            });
            toast.error(`Please fix form errors: ${errorMessages.join(', ')}`);
          }
        )}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {/* Basic Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Product Name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                id="slug"
                type="text"
                {...register('slug')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., product-name"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Description
            </label>
            <input
              id="shortDescription"
              type="text"
              {...register('shortDescription')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Brief product description"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Detailed product description"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Pricing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0.00"
                min="0"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compare at Price
              </label>
              <input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register('compareAtPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0.00"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost Price
              </label>
              <input
                id="costPrice"
                type="number"
                step="0.01"
                {...register('costPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Inventory</h2>

          <div className="flex items-center mb-4">
            <input
              id="trackInventory"
              type="checkbox"
              {...register('trackInventory')}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
            <label htmlFor="trackInventory" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Track inventory
            </label>
          </div>

          {trackInventory && (
            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Quantity
              </label>
              <input
                id="stockQuantity"
                type="number"
                {...register('stockQuantity', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0"
                min="0"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SKU
              </label>
              <input
                id="sku"
                type="text"
                {...register('sku')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., SKU-12345"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barcode
              </label>
              <input
                id="barcode"
                type="text"
                {...register('barcode')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., 1234567890123"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories *</h2>

          {categoriesLoading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
              {categories?.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories?.includes(category.id) || false}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                </label>
              ))}
            </div>
          )}
          {errors.categoryIds && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoryIds.message}</p>
          )}
        </div>

        {/* Images */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Images</h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter image URL"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition whitespace-nowrap"
            >
              Add Image
            </button>
          </div>

          {watch('images') && watch('images')!.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watch('images')!.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Invalid+URL';
                    }}
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              No images added yet. Add image URLs above.
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer
              </label>
              <input
                id="manufacturer"
                type="text"
                {...register('manufacturer')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Manufacturer name"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight
              </label>
              <div className="flex space-x-2">
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  {...register('weight', { valueAsNumber: true })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="0.00"
                  min="0"
                />
                <select
                  {...register('weightUnit')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

            <div className="flex items-center">
              <input
                id="isFeatured"
                type="checkbox"
                {...register('isFeatured')}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                onChange={(e) => {
                  console.log('isFeatured checkbox changed:', e.target.checked);
                  setValue('isFeatured', e.target.checked, { shouldDirty: true });
                }}
              />
              <label htmlFor="isFeatured" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Featured
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="requiresPrescription"
                type="checkbox"
                {...register('requiresPrescription')}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <label htmlFor="requiresPrescription" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Requires Prescription
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isOTC"
                type="checkbox"
                {...register('isOTC')}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <label htmlFor="isOTC" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Over-the-Counter (OTC)
              </label>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">SEO</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Title
              </label>
              <input
                id="metaTitle"
                type="text"
                {...register('metaTitle')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="SEO title"
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                {...register('metaDescription')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="SEO description"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/products"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center text-sm sm:text-base text-gray-700 dark:text-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
}

