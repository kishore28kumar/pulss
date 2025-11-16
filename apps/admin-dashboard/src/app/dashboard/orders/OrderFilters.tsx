'use client';

import { useState, useEffect } from 'react';

interface OrderFiltersProps {
  filters: {
    status: string;
    paymentStatus: string;
    startDate: string;
    endDate: string;
  };
  onApply: (filters: any) => void;
  onReset: () => void;
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export default function OrderFilters({ filters, onApply, onReset }: OrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({ status: '', paymentStatus: '', startDate: '', endDate: '' });
    onReset();
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Order Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Status
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Status
          </label>
          <select
            value={localFilters.paymentStatus}
            onChange={(e) => setLocalFilters({ ...localFilters, paymentStatus: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

