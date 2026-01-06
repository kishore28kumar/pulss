'use client';

import { Snowflake, AlertTriangle } from 'lucide-react';

interface FrozenStoreMessageProps {
  storeName?: string;
}

export default function FrozenStoreMessage({ storeName }: FrozenStoreMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
          <Snowflake className="w-12 h-12 text-purple-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Store Unavailable
        </h1>
        
        <div className="flex items-center justify-center space-x-2 text-amber-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">
            This store is currently frozen
          </p>
        </div>
        
        <p className="text-gray-600 mb-6">
          {storeName 
            ? `${storeName} is temporarily unavailable. Please check back later or contact the store directly.`
            : 'This store is temporarily unavailable. Please check back later or contact the store directly.'}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          <p>If you have any questions, please contact the store administrator.</p>
        </div>
      </div>
    </div>
  );
}

