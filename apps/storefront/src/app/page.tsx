'use client';

import { Store, QrCode, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-3xl mb-8 shadow-lg">
          <Store className="w-14 h-14 text-white" />
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Welcome to Pulss Commerce
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="flex flex-col items-center space-y-6">
            {/* QR Code Icon */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <QrCode className="w-20 h-20 text-blue-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-gray-800 font-medium leading-relaxed">
                Visit your nearest store and scan their QR code to access this commerce platform
              </p>
              
              <p className="text-gray-600 text-lg">
                This platform is exclusively for store customers. Please visit your local store to get started.
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="flex items-center justify-center space-x-2 pt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-gray-500 text-sm">
          Need help? Contact your local store for assistance.
        </p>
      </div>
    </div>
  );
}
