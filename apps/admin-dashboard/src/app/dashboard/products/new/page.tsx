'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Store, Upload, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isSuperAdmin } from '@/lib/permissions';
import BulkUploadSection from './BulkUploadSection';

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

interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenants?: {
    id: string;
    name: string;
    slug: string;
  };
}

function NewProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    searchParams?.get('tenantId') || null
  );
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSingleUpload, setShowSingleUpload] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close tenant dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setShowTenantDropdown(false);
      }
    };

    if (showTenantDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTenantDropdown]);

  const isSuperAdminUser = mounted && isSuperAdmin();

  // Fetch admins list for SUPER_ADMIN
  const { data: adminsData } = useQuery<{ data: Admin[] }>({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await api.get('/staff');
      return response.data.data;
    },
    enabled: isSuperAdminUser,
  });

  // Fetch categories - filter by tenant if SUPER_ADMIN has selected one
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', selectedTenantId],
    queryFn: async () => {
      // For SUPER_ADMIN, we need to get the tenant slug from the selected admin
      const selectedAdmin = adminsData?.data?.find(admin => admin.tenants?.id === selectedTenantId);
      const tenantSlug = selectedAdmin?.tenants?.slug;
      
      const config: any = {};
      if (isSuperAdminUser && tenantSlug) {
        config.headers = { 'X-Tenant-Slug': tenantSlug };
      }
      
      const response = await api.get('/categories', config);
      return response.data.data as Category[];
    },
    enabled: !isSuperAdminUser || !!selectedTenantId, // SUPER_ADMIN must select tenant first
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
      if (isSuperAdminUser && !selectedTenantId) {
        throw new Error('Please select an admin/store before creating a product');
      }

      const payload: any = {
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

      // For SUPER_ADMIN, include tenantId in the request body and tenant slug in header
      const config: any = {};
      if (isSuperAdminUser && selectedTenantId) {
        payload.tenantId = selectedTenantId;
        // Get tenant slug from selected admin
        const selectedAdmin = adminsData?.data?.find(admin => admin.tenants?.id === selectedTenantId);
        if (selectedAdmin?.tenants?.slug) {
          config.headers = { 'X-Tenant-Slug': selectedAdmin.tenants.slug };
        }
      }

      return await api.post('/products', payload, config);
    },
    onSuccess: () => {
      toast.success('Product created successfully');
      if (isSuperAdminUser && selectedTenantId) {
        router.push(`/dashboard/products?tenantId=${selectedTenantId}`);
      } else {
      router.push('/dashboard/products');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (isSuperAdminUser && !selectedTenantId) {
      toast.error('Please select an admin/store before creating a product');
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

  // Handle file upload
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
      
      // Add tenant slug header if SUPER_ADMIN has selected a tenant
      const config: any = {};
      if (isSuperAdminUser && selectedTenantId) {
        const selectedAdmin = adminsData?.data?.find(admin => admin.tenants?.id === selectedTenantId);
        if (selectedAdmin?.tenants?.slug) {
          config.headers = { 'X-Tenant-Slug': selectedAdmin.tenants.slug };
        }
      }

      const response = await api.post('/upload', formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;
      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, uploadedUrl]);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
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
            href={isSuperAdminUser && selectedTenantId 
              ? `/dashboard/products?tenantId=${selectedTenantId}`
              : '/dashboard/products'}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isSuperAdminUser ? 'Add Product on Behalf of Admin' : 'Create New Product'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {isSuperAdminUser 
              ? 'Add a new product on behalf of the selected admin'
              : 'Add a new product to your inventory'}
          </p>
        </div>
      </div>

      {/* Tenant Selector for SUPER_ADMIN */}
      {isSuperAdminUser && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Store className="w-4 h-4 inline mr-2" />
            Select Admin/Store *
          </label>
          <div className="relative" ref={tenantDropdownRef}>
            <button
              type="button"
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span className={selectedTenantId ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                {selectedTenantId
                  ? (() => {
                      const selectedAdmin = adminsData?.data?.find(
                        (admin) => admin.tenants?.id === selectedTenantId
                      );
                      return selectedAdmin
                        ? `${selectedAdmin.firstName} ${selectedAdmin.lastName} (${selectedAdmin.tenants?.name || 'No Store'})`
                        : '-- Select an Admin/Store --';
                    })()
                  : '-- Select an Admin/Store --'}
              </span>
              {showTenantDropdown ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {showTenantDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTenantId(null);
                    setShowTenantDropdown(false);
                    if (showBulkUpload) {
                      setShowBulkUpload(false);
                    }
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                    !selectedTenantId ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  -- Select an Admin/Store --
                </button>
                {adminsData?.data?.map((admin) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => {
                      setSelectedTenantId(admin.tenants?.id || null);
                      setShowTenantDropdown(false);
                      if (showBulkUpload && !admin.tenants?.id) {
                        setShowBulkUpload(false);
                      }
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      selectedTenantId === admin.tenants?.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {admin.firstName} {admin.lastName} ({admin.tenants?.name || 'No Store'})
                  </button>
                ))}
              </div>
            )}
          </div>
          {!selectedTenantId && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Please select an admin/store to create a product on their behalf.
            </p>
          )}
        </div>
      )}

      {/* Divider with Toggle */}
      {selectedTenantId && (
        <>
          {/* Bulk Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const newBulkState = !showBulkUpload;
                setShowBulkUpload(newBulkState);
                if (newBulkState) {
                  setShowSingleUpload(false); // Collapse single upload when bulk expands
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Bulk Upload Products</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload multiple products via CSV file (up to 1000 products)</p>
                </div>
              </div>
              {showBulkUpload ? (
                <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform" />
              )}
            </button>
            
            {showBulkUpload && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <BulkUploadSection
                  selectedTenantId={selectedTenantId}
                  categories={categories || []}
                  isSuperAdminUser={isSuperAdminUser}
                  adminsData={adminsData?.data}
                  onSuccess={(result) => {
                    toast.success(`Successfully uploaded ${result.successCount || 0} products`);
                  }}
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">OR</span>
            </div>
          </div>

          {/* Single Product Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const newSingleState = !showSingleUpload;
                setShowSingleUpload(newSingleState);
                if (newSingleState) {
                  setShowBulkUpload(false); // Collapse bulk upload when single expands
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Single Product Upload</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add one product at a time with detailed information</p>
                </div>
              </div>
              {showSingleUpload ? (
                <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform" />
              )}
            </button>

      {/* Form */}
            {showSingleUpload && (
              <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6 border-t border-gray-200 dark:border-gray-700">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
          
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Categories *</h2>
          
          {categoriesLoading ? (
            <div className="text-gray-500">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
          
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading || (isSuperAdminUser && !selectedTenantId)}
            />
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Or enter image URL"
            />
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!imageUrl}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add URL
            </button>
          </div>

          {watch('images') && watch('images')!.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
        <div className="pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">SEO</h2>
          
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
          <Link
            href={isSuperAdminUser && selectedTenantId 
              ? `/dashboard/products?tenantId=${selectedTenantId}`
              : '/dashboard/products'}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center text-sm sm:text-base"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Product
          </button>
        </div>
      </form>
            )}
          </div>
        </>
      )}

      {/* Show form for non-SUPER_ADMIN users */}
      {!isSuperAdminUser && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Single Product Upload</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add one product at a time with detailed information</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-4 sm:pb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="border-b border-gray-200 pb-4 sm:pb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <div className="border-b border-gray-200 pb-4 sm:pb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
            
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
          <div className="border-b border-gray-200 pb-4 sm:pb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Categories *</h2>
            
            {categoriesLoading ? (
              <div className="text-gray-500">Loading categories...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
          <div className="border-b border-gray-200 pb-4 sm:pb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
            
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>

            {/* URL Input */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Or enter image URL"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!imageUrl}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add URL
            </button>
          </div>

          {watch('images') && watch('images')!.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        <div className="border-b border-gray-200 pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
        <div className="pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">SEO</h2>
          
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/products"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center text-sm sm:text-base"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Product
          </button>
        </div>
      </form>
        </div>
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <NewProductPageContent />
    </Suspense>
  );
}

