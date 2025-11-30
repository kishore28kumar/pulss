'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BulkProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  categorySlug?: string;
  categoryId?: string;
  images?: string[];
  isActive: boolean;
  isFeatured: boolean;
  requiresPrescription: boolean;
  manufacturer?: string;
  metaTitle?: string;
  metaDescription?: string;
  errors?: string[];
  isValid?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BulkUploadPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<BulkProduct | null>(null);
  const [productIndex, setProductIndex] = useState<number>(0);
  const [allProducts, setAllProducts] = useState<BulkProduct[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<BulkProduct | null>(null);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data as Category[];
    },
  });

  useEffect(() => {
    // Get product index from URL query params
    const index = searchParams.get('index');
    const idx = index ? parseInt(index, 10) : 0;
    setProductIndex(idx);

    // Load products from sessionStorage
    const storedProducts = sessionStorage.getItem('bulkUploadProducts');
    if (!storedProducts) {
      router.push('/dashboard/products/new');
      return;
    }

    try {
      const products: BulkProduct[] = JSON.parse(storedProducts);
      setAllProducts(products);
      
      if (idx >= 0 && idx < products.length) {
        setProduct(products[idx]);
        setEditedProduct(products[idx]);
        setIsEditing(false); // Reset editing state when switching products
      } else {
        router.push('/dashboard/products/new');
      }
    } catch (error) {
      router.push('/dashboard/products/new');
    }
  }, [searchParams, router]);

  // Validate product
  const validateProduct = (productToValidate: BulkProduct): BulkProduct => {
    const errors: string[] = [];
    
    if (!productToValidate.name || productToValidate.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!productToValidate.slug || productToValidate.slug.length < 2) {
      errors.push('Slug must be at least 2 characters');
    } else if (!/^[a-z0-9-]+$/.test(productToValidate.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
    
    if (!productToValidate.price || productToValidate.price < 0) {
      errors.push('Price must be 0 or greater');
    }
    
    if (productToValidate.categorySlug) {
      const category = categories?.find(cat => cat.slug === productToValidate.categorySlug);
      if (category) {
        productToValidate.categoryId = category.id;
      } else {
        errors.push(`Category "${productToValidate.categorySlug}" not found`);
      }
    } else {
      errors.push('Category is required');
    }
    
    if (productToValidate.images && productToValidate.images.length > 0) {
      productToValidate.images.forEach((img, imgIndex) => {
        try {
          new URL(img);
        } catch {
          errors.push(`Image ${imgIndex + 1} is not a valid URL`);
        }
      });
    }
    
    return {
      ...productToValidate,
      errors: errors.length > 0 ? errors : undefined,
      isValid: errors.length === 0,
    };
  };

  const handleSave = () => {
    if (!editedProduct) return;
    
    const validated = validateProduct({ ...editedProduct });
    const updated = [...allProducts];
    updated[productIndex] = validated;
    
    setAllProducts(updated);
    setProduct(validated);
    setIsEditing(false);
    
    // Update sessionStorage
    sessionStorage.setItem('bulkUploadProducts', JSON.stringify(updated));
    toast.success('Product updated successfully');
  };

  const handleCancel = () => {
    setEditedProduct(product);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof BulkProduct, value: any) => {
    if (!editedProduct) return;
    setEditedProduct({ ...editedProduct, [field]: value });
  };

  const handlePrevious = () => {
    if (productIndex > 0) {
      router.push(`/dashboard/products/new/preview?index=${productIndex - 1}`);
    }
  };

  const handleNext = () => {
    if (productIndex < allProducts.length - 1) {
      router.push(`/dashboard/products/new/preview?index=${productIndex + 1}`);
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading product preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Preview</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Product {productIndex + 1} of {allProducts.length}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={productIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={productIndex === allProducts.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Product Preview Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div>
            {product.isValid ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Valid Product
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-4 h-4 mr-1" />
                Invalid Product
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {product.errors && product.errors.length > 0 && (
              <div className="text-sm text-red-600">
                {product.errors.length} error(s)
              </div>
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {product.errors && product.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {product.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            {isEditing && editedProduct ? (
              <input
                type="text"
                value={editedProduct.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 font-semibold">{product.name || 'N/A'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            {isEditing && editedProduct ? (
              <input
                type="text"
                value={editedProduct.slug || ''}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900">{product.slug || 'N/A'}</div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {isEditing && editedProduct ? (
              <textarea
                value={editedProduct.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 whitespace-pre-wrap">
                {product.description || 'No description provided'}
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              {isEditing && editedProduct ? (
                <input
                  type="number"
                  step="0.01"
                  value={editedProduct.price || 0}
                  onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="text-lg font-bold text-gray-900">₹{product.price || '0.00'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price</label>
              {isEditing && editedProduct ? (
                <input
                  type="number"
                  step="0.01"
                  value={editedProduct.compareAtPrice || ''}
                  onChange={(e) => handleFieldChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : product.compareAtPrice ? (
                <div className="text-lg font-semibold text-gray-600 line-through">₹{product.compareAtPrice}</div>
              ) : (
                <div className="text-gray-400">Not set</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
              {isEditing && editedProduct ? (
                <input
                  type="number"
                  step="0.01"
                  value={editedProduct.costPrice || ''}
                  onChange={(e) => handleFieldChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : product.costPrice ? (
                <div className="text-lg font-semibold text-gray-900">₹{product.costPrice}</div>
              ) : (
                <div className="text-gray-400">Not set</div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              {isEditing && editedProduct ? (
                <input
                  type="text"
                  value={editedProduct.sku || ''}
                  onChange={(e) => handleFieldChange('sku', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : (
                <div className="text-gray-900">{product.sku || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              {isEditing && editedProduct ? (
                <input
                  type="text"
                  value={editedProduct.barcode || ''}
                  onChange={(e) => handleFieldChange('barcode', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : (
                <div className="text-gray-900">{product.barcode || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Track Inventory</label>
              {isEditing && editedProduct ? (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedProduct.trackInventory}
                    onChange={(e) => handleFieldChange('trackInventory', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Track inventory</span>
                </label>
              ) : (
                <div className="text-gray-900">
                  {product.trackInventory ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              {isEditing && editedProduct ? (
                <input
                  type="number"
                  value={editedProduct.stockQuantity || 0}
                  onChange={(e) => handleFieldChange('stockQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="text-gray-900 font-semibold">{product.stockQuantity || 0}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              {isEditing && editedProduct ? (
                <input
                  type="number"
                  value={editedProduct.lowStockThreshold || 10}
                  onChange={(e) => handleFieldChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="text-gray-900">{product.lowStockThreshold || 10}</div>
              )}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Category</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            {isEditing && editedProduct ? (
              <select
                value={editedProduct.categorySlug || ''}
                onChange={(e) => {
                  const category = categories?.find(c => c.slug === e.target.value);
                  handleFieldChange('categorySlug', e.target.value || undefined);
                  if (category) {
                    handleFieldChange('categoryId', category.id);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-gray-900">{product.categorySlug || 'N/A'}</div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Images {product.images ? `(${product.images.length})` : '(0)'}
          </h4>
          {isEditing && editedProduct ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  id="newImageUrl"
                  placeholder="Enter image URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        const currentImages = editedProduct.images || [];
                        handleFieldChange('images', [...currentImages, input.value.trim()]);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newImageUrl') as HTMLInputElement;
                    if (input?.value.trim()) {
                      const currentImages = editedProduct.images || [];
                      handleFieldChange('images', [...currentImages, input.value.trim()]);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Add Image
                </button>
              </div>
              {editedProduct.images && editedProduct.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editedProduct.images.map((image, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img
                        src={image}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Invalid+URL';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages = editedProduct.images?.filter((_, i) => i !== idx) || [];
                          handleFieldChange('images', updatedImages);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image}
                    alt={`Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Invalid+URL';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No images</div>
          )}
        </div>

        {/* Flags */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Flags</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Active:</label>
              {isEditing && editedProduct ? (
                <input
                  type="checkbox"
                  checked={editedProduct.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              ) : product.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Featured:</label>
              {isEditing && editedProduct ? (
                <input
                  type="checkbox"
                  checked={editedProduct.isFeatured}
                  onChange={(e) => handleFieldChange('isFeatured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              ) : product.isFeatured ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Requires Prescription:</label>
              {isEditing && editedProduct ? (
                <input
                  type="checkbox"
                  checked={editedProduct.requiresPrescription}
                  onChange={(e) => handleFieldChange('requiresPrescription', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              ) : product.requiresPrescription ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Manufacturer */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Manufacturer</h4>
          {isEditing && editedProduct ? (
            <input
              type="text"
              value={editedProduct.manufacturer || ''}
              onChange={(e) => handleFieldChange('manufacturer', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          ) : product.manufacturer ? (
            <div className="text-gray-900">{product.manufacturer}</div>
          ) : (
            <div className="text-gray-400">Not set</div>
          )}
        </div>

        {/* SEO */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              {isEditing && editedProduct ? (
                <input
                  type="text"
                  value={editedProduct.metaTitle || ''}
                  onChange={(e) => handleFieldChange('metaTitle', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : product.metaTitle ? (
                <div className="text-gray-900">{product.metaTitle}</div>
              ) : (
                <div className="text-gray-400">Not set</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              {isEditing && editedProduct ? (
                <textarea
                  value={editedProduct.metaDescription || ''}
                  onChange={(e) => handleFieldChange('metaDescription', e.target.value || undefined)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              ) : product.metaDescription ? (
                <div className="text-gray-900">{product.metaDescription}</div>
              ) : (
                <div className="text-gray-400">Not set</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <Link
          href="/dashboard/products/new"
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Back to Upload
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            disabled={productIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={productIndex === allProducts.length - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

