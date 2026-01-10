'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Calendar, CheckSquare, Square, FileSpreadsheet, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatExportFilename } from '@/lib/exportUtils';
import { getUserRole } from '@/lib/permissions';

interface ExportSection {
  id: string;
  name: string;
  description: string;
}

const EXPORT_SECTIONS: ExportSection[] = [
  {
    id: 'topProducts',
    name: 'Top Selling Products',
    description: 'Products sorted by sales volume and revenue',
  },
  {
    id: 'globalTopSearches',
    name: 'Global Top Searches',
    description: 'Most searched products across all tenants',
  },
  {
    id: 'topSearchLocations',
    name: 'Top Search Locations',
    description: 'Cities with most order activity',
  },
  {
    id: 'tenantPerformance',
    name: 'Tenant Performance',
    description: 'Performance metrics for all tenants',
  },
  {
    id: 'storePerformance',
    name: 'Store Performance',
    description: 'Total Revenue, Orders, Customers, and Products',
  },
];

function AnalyticsExportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());

    // Check if user is Super Admin
    if (getUserRole() !== 'SUPER_ADMIN') {
      router.push('/dashboard/analytics');
      return;
    }

    // Get dates from URL params if available
    const urlStartDate = searchParams?.get('startDate');
    const urlEndDate = searchParams?.get('endDate');

    if (urlStartDate && urlEndDate) {
      setStartDate(urlStartDate);
      setEndDate(urlEndDate);
    } else {
      // Set default to today
      const today = new Date();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(endOfToday.toISOString().split('T')[0]);
    }

    // Select only Top Selling Products by default
    setSelectedSections(new Set(['topProducts']));
  }, [router, searchParams]);

  const toggleSection = (sectionId: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
    } else {
      newSelected.add(sectionId);
    }
    setSelectedSections(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSections.size === EXPORT_SECTIONS.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(EXPORT_SECTIONS.map(s => s.id)));
    }
  };

  const handleExport = async () => {
    if (selectedSections.size === 0) {
      toast.error('Please select at least one section to export');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Preparing export...');

    try {
      const sections = Array.from(selectedSections);
      const params = new URLSearchParams({
        sections: sections.join(','),
        startDate,
        endDate,
        format: exportFormat,
      });

      const response = await api.get(`/analytics/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: exportFormat === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or generate
      const contentDisposition = response.headers['content-disposition'];
      let filename = formatExportFilename('analytics-export', startDate, endDate, exportFormat);

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully', { id: toastId });
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to export analytics';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted || userRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Export Analytics</h1>
            <p className="text-sm text-gray-500 font-medium">Select sections and date range to export</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date Range *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exportStartDate" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <input
                id="exportStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                disabled={isExporting}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="exportEndDate" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                End Date
              </label>
              <input
                id="exportEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                max={new Date().toISOString().split('T')[0]}
                disabled={isExporting}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
          </div>
          {startDate && endDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Exporting data from {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
            </p>
          )}
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format *
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              disabled={isExporting}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition ${exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                } disabled:opacity-50`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('xlsx')}
              disabled={isExporting}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition ${exportFormat === 'xlsx'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                } disabled:opacity-50`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="font-medium">Excel</span>
            </button>
          </div>
        </div>

        {/* Sections Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Sections to Export *
            </label>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={isExporting}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {selectedSections.size === EXPORT_SECTIONS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            {EXPORT_SECTIONS.map((section) => (
              <label
                key={section.id}
                className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition ${selectedSections.has(section.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="mt-0.5">
                  {selectedSections.has(section.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{section.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedSections.has(section.id)}
                  onChange={() => toggleSection(section.id)}
                  disabled={isExporting}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
          {selectedSections.size === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Please select at least one section</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.push('/dashboard/analytics')}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedSections.size === 0 || !startDate || !endDate}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsExportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <AnalyticsExportPageContent />
    </Suspense>
  );
}

