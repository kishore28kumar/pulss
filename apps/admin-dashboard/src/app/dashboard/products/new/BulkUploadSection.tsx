'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Edit2, XCircle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface BulkUploadSectionProps {
  selectedTenantId: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  isSuperAdminUser: boolean;
  adminsData?: Array<{
    id: string;
    tenants?: { id: string; slug: string };
  }>;
  onSuccess: (result: any) => void;
}

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

const CSV_HEADERS = [
  'name',
  'slug',
  'description',
  'price',
  'compareAtPrice',
  'costPrice',
  'sku',
  'barcode',
  'trackInventory',
  'stockQuantity',
  'lowStockThreshold',
  'categorySlug',
  'images',
  'isActive',
  'isFeatured',
  'requiresPrescription',
  'manufacturer',
  'metaTitle',
  'metaDescription',
];

export default function BulkUploadSection({
  selectedTenantId,
  categories,
  isSuperAdminUser,
  adminsData,
  onSuccess,
}: BulkUploadSectionProps) {
  const router = useRouter();
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      'Sample Product, sample-product, "Product description", 99.99, 129.99, 50.00, SKU-001, 1234567890123, true, 100, 10, electronics, "https://example.com/image1.jpg,https://example.com/image2.jpg", true, false, false, "Manufacturer Name", "SEO Title", "SEO Description"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product-bulk-upload-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse CSV file
  const parseCSV = (text: string): BulkProduct[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const products: BulkProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (i > 1000) {
        toast.warning('Maximum 1000 products allowed. Only first 1000 rows will be processed.');
        break;
      }

      const values = parseCSVLine(lines[i]);
      const product: any = { id: `temp_${i}` };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        if (header === 'name') product.name = value;
        else if (header === 'slug') product.slug = value;
        else if (header === 'description') product.description = value || undefined;
        else if (header === 'price') product.price = parseFloat(value) || 0;
        else if (header === 'compareatprice') product.compareAtPrice = parseFloat(value) || undefined;
        else if (header === 'costprice') product.costPrice = parseFloat(value) || undefined;
        else if (header === 'sku') product.sku = value || undefined;
        else if (header === 'barcode') product.barcode = value || undefined;
        else if (header === 'trackinventory') product.trackInventory = value.toLowerCase() === 'true';
        else if (header === 'stockquantity') product.stockQuantity = parseInt(value) || 0;
        else if (header === 'lowstockthreshold') product.lowStockThreshold = parseInt(value) || 10;
        else if (header === 'categoryslug') product.categorySlug = value || undefined;
        else if (header === 'images') {
          product.images = value ? value.split(',').map((img: string) => img.trim()).filter(Boolean) : [];
        }
        else if (header === 'isactive') product.isActive = value.toLowerCase() !== 'false';
        else if (header === 'isfeatured') product.isFeatured = value.toLowerCase() === 'true';
        else if (header === 'requiresprescription') product.requiresPrescription = value.toLowerCase() === 'true';
        else if (header === 'manufacturer') product.manufacturer = value || undefined;
        else if (header === 'metatitle') product.metaTitle = value || undefined;
        else if (header === 'metadescription') product.metaDescription = value || undefined;
      });

      // Set defaults
      product.trackInventory = product.trackInventory ?? true;
      product.stockQuantity = product.stockQuantity ?? 0;
      product.lowStockThreshold = product.lowStockThreshold ?? 10;
      product.isActive = product.isActive ?? true;
      product.isFeatured = product.isFeatured ?? false;
      product.requiresPrescription = product.requiresPrescription ?? false;

      products.push(product as BulkProduct);
    }

    return products;
  };

  // Validate products
  const validateProducts = (productsToValidate: BulkProduct[]): BulkProduct[] => {
    return productsToValidate.map((product) => {
      const errors: string[] = [];

      if (!product.name || product.name.length < 2) {
        errors.push('Name must be at least 2 characters');
      }

      if (!product.slug || product.slug.length < 2) {
        errors.push('Slug must be at least 2 characters');
      } else if (!/^[a-z0-9-]+$/.test(product.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
      }

      if (!product.price || product.price < 0) {
        errors.push('Price must be 0 or greater');
      }

      if (product.categorySlug) {
        const category = categories.find(cat => cat.slug === product.categorySlug);
        if (category) {
          product.categoryId = category.id;
        } else {
          // Category not found - try to assign "Other" category
          const otherCategory = categories.find(cat => cat.slug.toLowerCase() === 'other');
          if (otherCategory) {
            product.categorySlug = 'other';
            product.categoryId = otherCategory.id;
          } else if (categories.length > 0) {
            // If "Other" doesn't exist, use the first category as fallback
            product.categorySlug = categories[0].slug;
            product.categoryId = categories[0].id;
          } else {
            // No categories available at all
            errors.push('No categories available');
          }
        }
      } else {
        // No category slug provided - try to assign "Other" or first category
        if (categories.length > 0) {
          const otherCategory = categories.find(cat => cat.slug.toLowerCase() === 'other');
          if (otherCategory) {
            product.categorySlug = 'other';
            product.categoryId = otherCategory.id;
          } else {
            product.categorySlug = categories[0].slug;
            product.categoryId = categories[0].id;
          }
        } else {
          errors.push('Category is required');
        }
      }

      if (product.images && product.images.length > 0) {
        product.images.forEach((img, imgIndex) => {
          try {
            new URL(img);
          } catch {
            errors.push(`Image ${imgIndex + 1} is not a valid URL`);
          }
        });
      }

      return {
        ...product,
        errors: errors.length > 0 ? errors : undefined,
        isValid: errors.length === 0,
      };
    });
  };

  // Handle CSV file upload
  const handleCSVUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        const validated = validateProducts(parsed);

        setProducts(validated);
        // Store products in sessionStorage for preview page
        sessionStorage.setItem('bulkUploadProducts', JSON.stringify(validated));

        const validCount = validated.filter(p => p.isValid).length;
        const invalidCount = validated.length - validCount;

        toast.success(`Parsed ${validated.length} products. ${validCount} valid, ${invalidCount} need attention.`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCSVUpload(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleCSVUpload(file);
    }
  };

  // Update product cell value
  const handleCellEdit = (rowIndex: number, col: string, value: any) => {
    const updated = [...products];
    updated[rowIndex] = { ...updated[rowIndex], [col]: value };

    // Re-validate the product
    const validated = validateProducts([updated[rowIndex]]);
    updated[rowIndex] = validated[0];

    setProducts(updated);
    // Update sessionStorage
    sessionStorage.setItem('bulkUploadProducts', JSON.stringify(updated));
    setEditingCell(null);
  };

  // Start editing cell
  const startEditing = (rowIndex: number, col: string) => {
    setEditingCell({ row: rowIndex, col });
    setEditValue(products[rowIndex][col as keyof BulkProduct]?.toString() || '');
  };

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (productsToUpload: BulkProduct[]) => {
      if (isSuperAdminUser && !selectedTenantId) {
        throw new Error('Tenant ID is required for Super Admin. Please select a tenant.');
      }

      const config: any = {};
      if (isSuperAdminUser) {
        const selectedAdmin = adminsData?.find(admin => admin.tenants?.id === selectedTenantId);
        if (selectedAdmin?.tenants?.slug) {
          config.headers = { 'X-Tenant-Slug': selectedAdmin.tenants.slug };
        } else {
          console.warn('Super Admin: Could not find tenant slug for selected tenant');
        }
      }

      const payload = {
        tenantId: selectedTenantId,
        products: productsToUpload.map(p => ({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          costPrice: p.costPrice,
          sku: p.sku,
          barcode: p.barcode,
          trackInventory: p.trackInventory,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          categoryIds: p.categoryId ? [p.categoryId] : [],
          images: p.images || [],
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          requiresPrescription: p.requiresPrescription,
          manufacturer: p.manufacturer,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
        })),
      };

      console.log('Bulk upload payload:', {
        tenantId: payload.tenantId,
        productCount: payload.products.length,
        config
      });

      return await api.post('/products/bulk', payload, config);
    },
    onSuccess: (response) => {
      const result = response.data.data;
      setSummaryData(result);
      setShowSummary(true);
      onSuccess(result);
    },
    onError: (error: any) => {
      console.error('Bulk upload error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to upload products';
      const errorDetails = error.response?.data?.details ? ` Details: ${JSON.stringify(error.response.data.details)}` : '';
      toast.error(`${errorMessage}${errorDetails}`, { duration: 5000 });
    },
  });

  // Calculate summary
  const calculateSummary = () => {
    const validProducts = products.filter(p => p.isValid);
    const invalidProducts = products.filter(p => !p.isValid);
    const categoriesUsed = new Set(products.map(p => p.categorySlug).filter(Boolean));

    return {
      total: products.length,
      valid: validProducts.length,
      invalid: invalidProducts.length,
      categories: categoriesUsed.size,
      estimatedTime: Math.ceil(validProducts.length / 10), // ~10 products per second
    };
  };

  // Handle bulk upload
  const handleBulkUpload = () => {
    const validProducts = products.filter(p => p.isValid);

    if (validProducts.length === 0) {
      toast.error('No valid products to upload');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmBulkUpload = () => {
    const validProducts = products.filter(p => p.isValid);
    setShowConfirmModal(false);
    bulkUploadMutation.mutate(validProducts);
  };

  const summary = calculateSummary();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bulk Upload Products</h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
        </div>
      </div>

      {/* CSV Upload Area */}
      {products.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => csvFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
            }`}
        >
          <input
            ref={csvFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload CSV File
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop your CSV file here, or{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                csvFileInputRef.current?.click();
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Maximum 1000 products per upload
          </p>
        </div>
      )}

      {/* Products Preview Table */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-semibold text-green-600 dark:text-green-400">{summary.valid} Valid</span>
                {' / '}
                <span className="font-semibold text-red-600 dark:text-red-400">{summary.invalid} Invalid</span>
                {' / '}
                <span className="text-gray-600 dark:text-gray-400">Total: {summary.total}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setProducts([]);
                  sessionStorage.removeItem('bulkUploadProducts');
                  if (csvFileInputRef.current) csvFileInputRef.current.value = '';
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={summary.valid === 0 || bulkUploadMutation.isPending}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bulkUploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {summary.valid} Products
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className={product.isValid ? 'bg-white dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20'}
                  >
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.col === 'name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(index, 'name', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellEdit(index, 'name', editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                          onClick={() => startEditing(index, 'name')}
                        >
                          <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.col === 'slug' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(index, 'slug', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellEdit(index, 'slug', editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                          onClick={() => startEditing(index, 'slug')}
                        >
                          <span className="text-gray-900 dark:text-gray-100">{product.slug}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.col === 'price' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(index, 'price', parseFloat(editValue) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellEdit(index, 'price', parseFloat(editValue) || 0);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                          onClick={() => startEditing(index, 'price')}
                        >
                          <span className="text-gray-900 dark:text-gray-100">₹{product.price}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.col === 'categorySlug' ? (
                        <select
                          value={editValue}
                          onChange={(e) => {
                            const selectedSlug = e.target.value || undefined;
                            const category = categories.find(c => c.slug === selectedSlug);

                            // Update both categorySlug and categoryId in a single state update
                            const updated = [...products];
                            updated[index] = {
                              ...updated[index],
                              categorySlug: selectedSlug,
                              categoryId: category?.id || undefined,
                            };

                            // Re-validate the product
                            const validated = validateProducts([updated[index]]);
                            updated[index] = validated[0];

                            setProducts(updated);
                            // Update sessionStorage
                            sessionStorage.setItem('bulkUploadProducts', JSON.stringify(updated));
                            setEditingCell(null);
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                          onClick={() => startEditing(index, 'categorySlug')}
                        >
                          <span className="text-gray-900 dark:text-gray-100">{product.categorySlug || 'None'}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.col === 'stockQuantity' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellEdit(index, 'stockQuantity', parseInt(editValue) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellEdit(index, 'stockQuantity', parseInt(editValue) || 0);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                          onClick={() => startEditing(index, 'stockQuantity')}
                        >
                          <span className="text-gray-900 dark:text-gray-100">{product.stockQuantity}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.isValid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Update sessionStorage before navigating
                            sessionStorage.setItem('bulkUploadProducts', JSON.stringify(products));
                            router.push(`/dashboard/products/new/preview?index=${index}`);
                          }}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Preview product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {product.errors && product.errors.length > 0 && (
                          <div className="group relative">
                            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded px-2 py-1 z-10 whitespace-nowrap border border-gray-700 dark:border-gray-600">
                              {product.errors.join(', ')}
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = products.filter((_, i) => i !== index);
                            setProducts(updated);
                            // Update sessionStorage
                            sessionStorage.setItem('bulkUploadProducts', JSON.stringify(updated));
                          }}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Remove product"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Upload</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to upload <span className="font-semibold text-blue-600 dark:text-blue-400">{summary.valid}</span> products?
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Products:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{summary.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Valid Products:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{summary.valid}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Invalid Products:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{summary.invalid} (will be skipped)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Categories Used:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{summary.categories}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Estimated Time:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">~{summary.estimatedTime} seconds</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Note: Invalid products will be skipped and shown in the summary after upload.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkUpload}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Summary Section */}
      {showSummary && summaryData && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              Upload Summary
            </h3>
            <button
              onClick={() => {
                setShowSummary(false);
                setProducts([]);
                if (csvFileInputRef.current) csvFileInputRef.current.value = '';
              }}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summaryData.successCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Products Created</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{summaryData.failedCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Products Failed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{summaryData.totalCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Processed</div>
            </div>
          </div>

          {summaryData.failedProducts && summaryData.failedProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                Failed Products ({summaryData.failedProducts.length}):
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {summaryData.failedProducts.map((failed: any, idx: number) => (
                  <div key={idx} className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{failed.name}</span>
                    {' '}({failed.slug}): <span className="text-red-600 dark:text-red-400">{failed.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summaryData.successfulProducts && summaryData.successfulProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                Successfully Created Products ({summaryData.successfulProducts.length}):
              </h4>
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {summaryData.successfulProducts.map((product: any, idx: number) => (
                    <div key={idx} className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">({product.slug})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-green-200 dark:border-green-800">
            <button
              onClick={() => {
                setShowSummary(false);
                setProducts([]);
                sessionStorage.removeItem('bulkUploadProducts');
                if (csvFileInputRef.current) csvFileInputRef.current.value = '';
              }}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

