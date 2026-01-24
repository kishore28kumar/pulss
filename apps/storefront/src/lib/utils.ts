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

/**
 * Validate password strength
 * Requirements: Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}

/**
 * Get password validation requirements status
 * @param password - Password to check
 * @returns Object with individual requirement statuses
 */
export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}
