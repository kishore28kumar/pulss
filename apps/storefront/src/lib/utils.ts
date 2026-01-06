import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // If less than a minute ago
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // If less than an hour ago
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // If today
  if (dateObj.toDateString() === now.toDateString()) {
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Otherwise, show date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Get tenant-aware URL path
 * @param path - Path without tenant prefix (e.g., '/products', '/cart')
 * @param tenantSlug - Tenant slug (optional, will try to get from window if not provided)
 * @returns Full path with tenant prefix (e.g., '/pharmacy1/products')
 */
export function getTenantPath(path: string, tenantSlug?: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Get tenant slug from parameter or window location
  let slug = tenantSlug;
  if (!slug && typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    slug = pathSegments[0] || undefined;
  }
  
  if (!slug) {
    // If no tenant slug, return path as-is (for root pages)
    return `/${cleanPath}`;
}

  return `/${slug}/${cleanPath}`;
}
