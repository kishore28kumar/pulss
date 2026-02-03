'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CSVRow {
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

type TemplateType = 'regular' | 'featured' | 'sponsored';

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [templateType, setTemplateType] = useState<TemplateType>('regular');

  // CSV Template headers (without isFeatured/isSponsored - will be set based on template type)
  const csvHeaders = [
    'name',
    'slug',
    'description',
    'shortDescription',
    'price',
    'compareAtPrice',
    'costPrice',
    'sku',
    'barcode',
    'trackInventory',
    'stockQuantity',
    'weight',
    'weightUnit',
    'categorySlug',
    'images',
    'isActive',
    'requiresPrescription',
    'isOTC',
    'manufacturer',
    'metaTitle',
    'metaDescription',
  ];

  // Download CSV template based on type
  const downloadTemplate = (type: TemplateType) => {
    const csvContent = [
      csvHeaders.join(','),
      // Example row - isFeatured/isSponsored will be set automatically based on template type
      'Sample Product, sample-product, "This is a sample product description", "Short description", 99.99, 129.99, 50.00, SKU-001, 1234567890123, true, 100, 10, 1.5, kg, electronics, "https://example.com/image1.jpg,https://example.com/image2.jpg", true, false, true, "Sample Manufacturer", "SEO Title", "SEO Description"',
    ].join('\n');

    const filename = type === 'regular' 
      ? 'regular-products-template.csv'
      : type === 'featured'
      ? 'featured-products-template.csv'
      : 'sponsored-products-template.csv';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type === 'regular' ? 'Regular' : type === 'featured' ? 'Featured' : 'Sponsored'} products template downloaded successfully`);
    setTemplateType(type);
  };

  // Parse CSV file
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      rows.push(row as CSVRow);
    }

    return rows;
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Validate CSV data
  const validateCSV = (rows: CSVRow[]): string[] => {
    const validationErrors: string[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and we skip header

      if (!row.name || row.name.trim().length < 2) {
        validationErrors.push(`Row ${rowNum}: Product name is required and must be at least 2 characters`);
      }

      if (!row.slug || row.slug.trim().length < 2) {
        validationErrors.push(`Row ${rowNum}: Slug is required and must be at least 2 characters`);
      } else if (!/^[a-z0-9-]+$/.test(row.slug)) {
        validationErrors.push(`Row ${rowNum}: Slug must contain only lowercase letters, numbers, and hyphens`);
      }

      if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0) {
        validationErrors.push(`Row ${rowNum}: Price is required and must be a valid number >= 0`);
      }

      if (row.compareAtPrice && (isNaN(parseFloat(row.compareAtPrice)) || parseFloat(row.compareAtPrice) < 0)) {
        validationErrors.push(`Row ${rowNum}: Compare at price must be a valid number >= 0`);
      }

      if (row.costPrice && (isNaN(parseFloat(row.costPrice)) || parseFloat(row.costPrice) < 0)) {
        validationErrors.push(`Row ${rowNum}: Cost price must be a valid number >= 0`);
      }

      if (row.stockQuantity && (isNaN(parseInt(row.stockQuantity)) || parseInt(row.stockQuantity) < 0)) {
        validationErrors.push(`Row ${rowNum}: Stock quantity must be a valid integer >= 0`);
      }

      if (row.weight && (isNaN(parseFloat(row.weight)) || parseFloat(row.weight) < 0)) {
        validationErrors.push(`Row ${rowNum}: Weight must be a valid number >= 0`);
      }

      if (row.images) {
        const imageUrls = row.images.split(',').map((url) => url.trim());
        for (const url of imageUrls) {
          if (url && !isValidUrl(url)) {
            validationErrors.push(`Row ${rowNum}: Invalid image URL: ${url}`);
          }
        }
      }
    });

    return validationErrors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        const validationErrors = validateCSV(parsed);

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          toast.error(`Found ${validationErrors.length} validation error(s)`);
        } else {
          setErrors([]);
          toast.success(`Successfully parsed ${parsed.length} product(s)`);
        }

        setCsvData(parsed);
      } catch (error: any) {
        toast.error(error.message || 'Failed to parse CSV file');
        setCsvData([]);
        setErrors([]);
      }
    };
    reader.readAsText(file);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
      handleFileSelect(file);
    }
  };

  // Navigate to preview page
  const handleContinue = () => {
    if (csvData.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }

    if (errors.length > 0) {
      toast.error('Please fix validation errors before continuing');
      return;
    }

    // Store CSV data and template type in sessionStorage for preview page
    sessionStorage.setItem('bulkImportData', JSON.stringify(csvData));
    sessionStorage.setItem('bulkImportTemplateType', templateType);
    router.push('/dashboard/products/bulk-import/preview');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Bulk Import Products</h1>
            <p className="text-sm text-gray-500 font-medium">Upload a CSV file to import multiple products at once</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">How to Import Products</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Download the CSV template using the button below</li>
              <li>Fill in all product details in the CSV file</li>
              <li>Upload your completed CSV file</li>
              <li>Review and validate the imported products</li>
              <li>Edit or remove products as needed</li>
              <li>Publish all products at once</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Download Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">CSV Templates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download a template file based on product type. The import will automatically set the product type based on the template used.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => downloadTemplate('regular')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm sm:text-base"
          >
            <Download className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Regular Products</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">regular-products-template.csv</span>
          </button>
          <button
            onClick={() => downloadTemplate('featured')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm sm:text-base"
          >
            <Download className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Featured Products</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">featured-products-template.csv</span>
          </button>
          <button
            onClick={() => downloadTemplate('sponsored')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm sm:text-base"
          >
            <Download className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Sponsored Products</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">sponsored-products-template.csv</span>
          </button>
        </div>
      </div>

      {/* Import Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Import Type</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select the type of products you are uploading. This will determine how they are categorized in the system, regardless of which template you used.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Regular Option */}
            <label className={`relative flex flex-1 items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                templateType === 'regular' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
                <input
                    type="radio"
                    name="importType"
                    value="regular"
                    checked={templateType === 'regular'}
                    onChange={() => setTemplateType('regular')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3 accent-blue-600"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Regular Products</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Standard listing</span>
                </div>
            </label>

            {/* Featured Option */}
            <label className={`relative flex flex-1 items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                templateType === 'featured' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm ring-1 ring-purple-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
                <input
                    type="radio"
                    name="importType"
                    value="featured"
                    checked={templateType === 'featured'}
                    onChange={() => setTemplateType('featured')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mr-3 accent-purple-600"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Featured Products</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Highlighted on homepage</span>
                </div>
            </label>

            {/* Sponsored Option */}
            <label className={`relative flex flex-1 items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                templateType === 'sponsored' 
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm ring-1 ring-amber-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
                <input
                    type="radio"
                    name="importType"
                    value="sponsored"
                    checked={templateType === 'sponsored'}
                    onChange={() => setTemplateType('sponsored')}
                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500 mr-3 accent-amber-600"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Sponsored Products</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Promoted placements</span>
                </div>
            </label>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload CSV File</h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer ${
            isDragging
              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : csvData.length > 0
              ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {csvData.length === 0 ? (
            <>
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop your CSV file here, or{' '}
                <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  click to browse
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">CSV files only</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                {csvData.length} product(s) loaded successfully
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                File: {fileInputRef.current?.files?.[0]?.name || 'uploaded.csv'}
              </p>
              <p className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm underline">
                Click to upload a different file
              </p>
            </>
          )}
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Validation Errors ({errors.length})
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300 max-h-60 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {csvData.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={() => {
                setCsvData([]);
                setErrors([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm sm:text-base text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={errors.length > 0}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Continue to Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

