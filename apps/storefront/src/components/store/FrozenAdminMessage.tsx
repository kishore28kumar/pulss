'use client';

import { Store, AlertTriangle } from 'lucide-react';

interface FrozenAdminMessageProps {
  storeName?: string;
}

export default function FrozenAdminMessage({ storeName: _storeName }: FrozenAdminMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Store className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to Pulss Commerce
        </h1>
        
        <div className="flex items-center justify-center space-x-2 text-amber-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">
            Store Temporarily Unavailable
          </p>
        </div>
        
        {/* <p className="text-gray-600 mb-6">
          {storeName 
            ? `${storeName} is temporarily unavailable. The store administrator's account has been frozen.`
            : 'This store is temporarily unavailable. The store administrator\'s account has been frozen.'}
        </p> */}
        
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          <p>Please check back later or contact the store administrator for assistance.</p>
        </div>
      </div>
    </div>
  );
}

