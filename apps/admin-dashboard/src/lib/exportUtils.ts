/**
 * Utility functions for exporting data to CSV and Excel formats
 */

export interface ExportData {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: ExportData): string {
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Prevent CSV injection by prepending single quote to formula characters
    const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
    if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  };

  const csvRows = [
    data.headers.map(escapeCSV).join(','),
    ...data.rows.map(row => row.map(escapeCSV).join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data: ExportData | ExportData[], filename: string): void {
  let csvContent = '';

  if (Array.isArray(data)) {
    // Multiple sheets - combine with separator
    csvContent = data.map(sheet => convertToCSV(sheet)).join('\n\n');
  } else {
    csvContent = convertToCSV(data);
  }

  // Add BOM for Excel UTF-8 support
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download Excel file (using backend endpoint)
 */
export async function downloadExcel(
  apiCall: () => Promise<Blob>,
  filename: string
): Promise<void> {
  try {
    const blob = await apiCall();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel download error:', error);
    throw error;
  }
}

/**
 * Format filename with date range
 */
export function formatExportFilename(
  baseName: string,
  startDate: string,
  endDate: string,
  extension: 'csv' | 'xlsx'
): string {
  const start = startDate.split('T')[0];
  const end = endDate.split('T')[0];
  
  return `${baseName}-${start}-to-${end}.${extension}`;
}

