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
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {message}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition"
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
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 rounded-r-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

