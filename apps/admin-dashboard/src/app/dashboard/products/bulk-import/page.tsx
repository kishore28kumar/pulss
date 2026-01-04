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

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // CSV Template headers
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
    'lowStockThreshold',
    'weight',
    'weightUnit',
    'categorySlug',
    'images',
    'isActive',
    'isFeatured',
    'requiresPrescription',
    'isOTC',
    'manufacturer',
    'metaTitle',
    'metaDescription',
  ];

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      csvHeaders.join(','),
      // Example row
      'Sample Product, sample-product, "This is a sample product description", "Short description", 99.99, 129.99, 50.00, SKU-001, 1234567890123, true, 100, 10, 1.5, kg, electronics, "https://example.com/image1.jpg,https://example.com/image2.jpg", true, false, false, true, "Sample Manufacturer", "SEO Title", "SEO Description"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
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

      if (row.lowStockThreshold && (isNaN(parseInt(row.lowStockThreshold)) || parseInt(row.lowStockThreshold) < 0)) {
        validationErrors.push(`Row ${rowNum}: Low stock threshold must be a valid integer >= 0`);
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

    // Store CSV data in sessionStorage for preview page
    sessionStorage.setItem('bulkImportData', JSON.stringify(csvData));
    router.push('/dashboard/products/bulk-import/preview');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Bulk Import Products</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Upload a CSV file to import multiple products at once</p>
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

      {/* Download Template */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">CSV Template</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Download a template file with all required fields</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm sm:text-base"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Template
          </button>
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

