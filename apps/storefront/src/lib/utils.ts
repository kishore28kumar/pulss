import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    slug = pathSegments[0] || null;
  }
  
  if (!slug) {
    // If no tenant slug, return path as-is (for root pages)
    return `/${cleanPath}`;
  }
  
  return `/${slug}/${cleanPath}`;
}
