'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface ScheduleDrugWarningProps {
  variant?: 'banner' | 'inline' | 'product';
}

export default function ScheduleDrugWarning({ variant = 'banner' }: ScheduleDrugWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && variant === 'banner') {
    return null;
  }

  const message = 'This store is not licensed to sell Schedule H, H1, and X drugs.';

  if (variant === 'banner') {
    return (
      <div className="bg-red-500 dark:bg-red-600 border-b-2 border-red-600 dark:border-red-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
              <p className="text-sm font-semibold text-white">
                {message}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:text-red-100 transition opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-r-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-800 dark:text-red-200">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

