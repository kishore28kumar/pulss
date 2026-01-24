'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Loader2, Save, AlertCircle, Grid, List } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface ProductData {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: string;
  compareAtPrice?: string;
  costPrice?: string;
  sku?: string;
  barcode?: string;
  trackInventory?: string;
  stockQuantity?: string;
  lowStockThreshold?: string;
  weight?: string;
  weightUnit?: string;
  categorySlug?: string;
  images?: string;
  isActive?: string;
  isFeatured?: string;
  requiresPrescription?: string;
  isOTC?: string;
  manufacturer?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface EditableProduct extends ProductData {
  id: string;
  isValid: boolean;
  errors: string[];
  isEditing?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BulkImportPreviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data as Category[];
    },
  });

  // Helper function for URL validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate product function
  const validateProduct = useCallback((product: ProductData, index: number): string[] => {
    const errors: string[] = [];
    const rowNum = index + 1;

    if (!product.name || product.name.trim().length < 2) {
      errors.push(`Row ${rowNum}: Name must be at least 2 characters`);
    }

    if (!product.slug || product.slug.trim().length < 2) {
      errors.push(`Row ${rowNum}: Slug must be at least 2 characters`);
    } else if (!/^[a-z0-9-]+$/.test(product.slug)) {
      errors.push(`Row ${rowNum}: Slug must contain only lowercase letters, numbers, and hyphens`);
    }

    if (!product.price || isNaN(parseFloat(product.price)) || parseFloat(product.price) < 0) {
      errors.push(`Row ${rowNum}: Price must be a valid number >= 0`);
    }

    if (product.compareAtPrice && (isNaN(parseFloat(product.compareAtPrice)) || parseFloat(product.compareAtPrice) < 0)) {
      errors.push(`Row ${rowNum}: Compare at price must be a valid number >= 0`);
    }

    if (product.costPrice && (isNaN(parseFloat(product.costPrice)) || parseFloat(product.costPrice) < 0)) {
      errors.push(`Row ${rowNum}: Cost price must be a valid number >= 0`);
    }

    if (product.stockQuantity && (isNaN(parseInt(product.stockQuantity)) || parseInt(product.stockQuantity) < 0)) {
      errors.push(`Row ${rowNum}: Stock quantity must be a valid integer >= 0`);
    }

    if (product.lowStockThreshold && (isNaN(parseInt(product.lowStockThreshold)) || parseInt(product.lowStockThreshold) < 0)) {
      errors.push(`Row ${rowNum}: Low stock threshold must be a valid integer >= 0`);
    }

    if (product.weight && (isNaN(parseFloat(product.weight)) || parseFloat(product.weight) < 0)) {
      errors.push(`Row ${rowNum}: Weight must be a valid number >= 0`);
    }

    if (product.images) {
      const imageUrls = product.images.split(',').map((url) => url.trim());
      for (const url of imageUrls) {
        if (url && !isValidUrl(url)) {
          errors.push(`Row ${rowNum}: Invalid image URL: ${url}`);
        }
      }
    }

    return errors;
  }, []);

  // Load products from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const storedData = sessionStorage.getItem('bulkImportData');
    
    if (storedData) {
      try {
        const csvData: ProductData[] = JSON.parse(storedData);
        
        if (!Array.isArray(csvData) || csvData.length === 0) {
          console.error('Invalid data format or empty array:', csvData);
          toast.error('No products found in uploaded data. Please upload again.');
          setIsLoading(false);
          setTimeout(() => {
            router.push('/dashboard/products/bulk-import');
          }, 2000);
          return;
        }
        
        // Convert CSV data to EditableProduct format with validation
        const editableProducts: EditableProduct[] = csvData.map((product, index) => {
          const errors = validateProduct(product, index);
          return {
            ...product,
            id: `product_${index}_${Date.now()}_${Math.random()}`,
            isValid: errors.length === 0,
            errors,
          };
        });

        console.log('Loaded products:', editableProducts.length);
        setProducts(editableProducts);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load products from sessionStorage:', error);
        toast.error('Failed to load products. Please upload again.');
        setIsLoading(false);
        setTimeout(() => {
          router.push('/dashboard/products/bulk-import');
        }, 2000);
      }
    } else {
      // No data in sessionStorage, redirect to upload page
      toast.error('No products to preview. Please upload a CSV file first.');
      setIsLoading(false);
      setTimeout(() => {
        router.push('/dashboard/products/bulk-import');
      }, 2000);
    }
  }, [router, validateProduct]);

  const handleEdit = (product: EditableProduct) => {
    setEditingId(product.id);
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editingId) return;

    // Find the index of the product being edited
    const productIndex = products.findIndex((p) => p.id === editingId);
    if (productIndex === -1) return;

    const errors = validateProduct(editingProduct, productIndex);
    const updatedProduct: EditableProduct = {
      ...editingProduct,
      isValid: errors.length === 0,
      errors,
    };

    setProducts(products.map((p) => (p.id === editingId ? updatedProduct : p)));
    setEditingId(null);
    setEditingProduct(null);
    
    if (errors.length === 0) {
      toast.success('Product updated and validated successfully');
    } else {
      toast.warning(`Product updated but has ${errors.length} error(s). Please fix them.`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingProduct(null);
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this product from the import?')) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Product removed');
    }
  };

  const handleFieldChange = (field: keyof ProductData, value: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      [field]: value,
    });
  };

  // Bulk publish mutation using bulk endpoint
  const publishMutation = useMutation({
    mutationFn: async (productsToPublish: EditableProduct[]) => {
      const validProducts = productsToPublish.filter((p) => p.isValid);
      
      if (validProducts.length === 0) {
        throw new Error('No valid products to publish');
      }

      // Find category IDs from slugs
      const categoryMap = new Map(categories?.map((cat) => [cat.slug, cat.id]) || []);

      // Prepare products for bulk upload
      const productsPayload = validProducts.map((product) => {
        const categoryId = product.categorySlug
          ? categoryMap.get(product.categorySlug) || null
          : null;

        return {
          name: product.name,
          slug: product.slug,
          description: product.description || undefined,
          price: parseFloat(product.price),
          compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : undefined,
          costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
          sku: product.sku || undefined,
          barcode: product.barcode || undefined,
          trackInventory: product.trackInventory === 'true' || product.trackInventory === '1' || product.trackInventory === '',
          stockQuantity: product.stockQuantity ? parseInt(product.stockQuantity) : undefined,
          lowStockThreshold: product.lowStockThreshold ? parseInt(product.lowStockThreshold) : undefined,
          images: product.images ? product.images.split(',').map((url) => url.trim()).filter(Boolean) : undefined,
          isActive: product.isActive === 'true' || product.isActive === '1' || product.isActive === '',
          isFeatured: product.isFeatured === 'true' || product.isFeatured === '1',
          requiresPrescription: product.requiresPrescription === 'true' || product.requiresPrescription === '1',
          manufacturer: product.manufacturer || undefined,
          metaTitle: product.metaTitle || undefined,
          metaDescription: product.metaDescription || undefined,
          categoryIds: categoryId ? [categoryId] : [],
        };
      });

      // Use bulk upload endpoint
      const response = await api.post('/products/bulk', {
        products: productsPayload,
      });

      return response.data.data;
    },
    onSuccess: (data) => {
      const successCount = data.successCount || 0;
      const failedCount = data.failedCount || 0;
      const failedProducts = data.failedProducts || [];

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} product(s)`);
      }

      if (failedCount > 0 && failedProducts.length > 0) {
        // Update products list with errors from failed products
        setProducts((prevProducts) => {
          return prevProducts.map((product) => {
            const failedProduct = failedProducts.find(
              (fp: any) => fp.slug === product.slug
            );
            
            if (failedProduct) {
              // Mark as invalid and add error
              return {
                ...product,
                isValid: false,
                errors: [failedProduct.error],
              };
            }
            
            // If product was successful, remove it from the list
            const successfulProduct = data.successfulProducts?.find(
              (sp: any) => sp.slug === product.slug
            );
            
            if (successfulProduct) {
              return null; // Will be filtered out
            }
            
            return product;
          }).filter((p): p is EditableProduct => p !== null);
        });

        toast.error(`Failed to upload ${failedCount} product(s). Please correct errors and try again.`, {
          duration: 6000,
        });
      } else {
        // All products succeeded
        // Clear session storage
        sessionStorage.removeItem('bulkImportData');
        
        // Invalidate products query
        queryClient.invalidateQueries({ queryKey: ['products'] });
        
        // Redirect to products page
        router.push('/dashboard/products');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to upload products');
    },
  });

  const handlePublish = () => {
    const validProducts = products.filter((p) => p.isValid);
    const invalidProducts = products.filter((p) => !p.isValid);

    if (validProducts.length === 0) {
      toast.error('No valid products to publish. Please fix errors first.');
      return;
    }

    if (invalidProducts.length > 0) {
      if (!confirm(`You have ${invalidProducts.length} invalid product(s) that will be skipped. Continue?`)) {
        return;
      }
    }

    publishMutation.mutate(validProducts);
  };

  // Handle reupload - upload only failed products after correction
  const handleReupload = () => {
    const validProducts = products.filter((p) => p.isValid);
    
    if (validProducts.length === 0) {
      toast.error('No valid products to reupload. Please fix errors first.');
      return;
    }

    publishMutation.mutate(validProducts);
  };

  const validCount = products.filter((p) => p.isValid).length;
  const invalidCount = products.filter((p) => !p.isValid).length;

  // Filter products based on selected filter
  const filteredProducts = products.filter((product) => {
    if (filter === 'valid') return product.isValid;
    if (filter === 'invalid') return !product.isValid;
    return true;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/products/bulk-import"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Import
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Review & Validate Products</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Review your products before publishing</p>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{products.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{validCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Valid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">{invalidCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Invalid</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and View Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilter('valid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'valid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Valid ({validCount})
            </button>
            <button
              onClick={() => setFilter('invalid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'invalid'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Invalid ({invalidCount})
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Preview */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {filter === 'valid' && 'No valid products found'}
                      {filter === 'invalid' && 'No invalid products found'}
                      {filter === 'all' && 'No products found'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const firstImage = product.images?.split(',')[0]?.trim() || '';
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-12 w-12 flex-shrink-0">
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingId === product.id && editingProduct ? (
                            <input
                              type="text"
                              value={editingProduct.name}
                              onChange={(e) => handleFieldChange('name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          )}
                          {product.errors.length > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {product.errors[0]}
                              {product.errors.length > 1 && ` (+${product.errors.length - 1} more)`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === product.id && editingProduct ? (
                            <input
                              type="text"
                              value={editingProduct.slug}
                              onChange={(e) => handleFieldChange('slug', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{product.slug}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === product.id && editingProduct ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingProduct.price}
                              onChange={(e) => handleFieldChange('price', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(product.price || '0'))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.stockQuantity || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.categorySlug || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === product.id ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="p-2 text-green-600 hover:text-green-700 transition"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemove(product.id)}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'valid' && 'No valid products found'}
                {filter === 'invalid' && 'No invalid products found'}
                {filter === 'all' && 'No products found'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const firstImage = product.images?.split(',')[0]?.trim() || '';
              return (
                <div
                  key={product.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden transition ${
                    product.isValid
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-red-200 dark:border-red-800'
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📦</div>
                          <div className="text-sm">No Image</div>
                        </div>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {product.isValid ? (
                        <CheckCircle className="w-6 h-6 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500 bg-white dark:bg-gray-800 rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.slug}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(product.price || '0'))}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Stock: {product.stockQuantity || '0'}
                      </span>
                    </div>

                    {product.categorySlug && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Category: {product.categorySlug}
                      </div>
                    )}

                    {product.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                        {product.errors[0]}
                        {product.errors.length > 1 && ` (+${product.errors.length - 1} more)`}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-end space-x-2">
                      {editingId === product.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:text-green-700 transition"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(product.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Error Summary Banner - Show after upload if there are errors */}
      {invalidCount > 0 && products.some(p => p.errors.length > 0 && !p.isValid) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                Upload Errors Detected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {invalidCount} product(s) failed to upload. Please review the errors below, correct them, and click &quot;Reupload Failed Products&quot; to try again.
              </p>
              <div className="space-y-2">
                {products
                  .filter(p => !p.isValid && p.errors.length > 0)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded p-2">
                      <span className="font-medium">{product.name}</span>: {product.errors[0]}
                    </div>
                  ))}
                {products.filter(p => !p.isValid && p.errors.length > 0).length > 5 && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    +{products.filter(p => !p.isValid && p.errors.length > 0).length - 5} more error(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
          {validCount > 0 && (
            <span className="text-green-600 dark:text-green-500 font-medium block sm:inline">{validCount} product(s) ready to publish</span>
          )}
          {invalidCount > 0 && (
            <span className="text-red-600 dark:text-red-500 font-medium block sm:inline sm:ml-4 mt-1 sm:mt-0">
              {invalidCount} product(s) need attention
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard/products/bulk-import"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center text-sm sm:text-base text-gray-700 dark:text-gray-300"
          >
            Cancel
          </Link>
          {invalidCount > 0 && products.some(p => p.errors.length > 0 && !p.isValid) && (
            <button
              onClick={handleReupload}
              disabled={publishMutation.isPending || validCount === 0}
              className="inline-flex items-center justify-center px-6 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reuploading...
                </>
              ) : (
                `Reupload ${validCount} Failed Product(s)`
              )}
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending || validCount === 0}
            className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              `Publish ${validCount} Product(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

