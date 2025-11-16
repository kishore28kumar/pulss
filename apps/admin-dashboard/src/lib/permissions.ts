// Permission definitions matching backend
export enum Permission {
  // Products
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_UPDATE = 'products:update',
  PRODUCTS_DELETE = 'products:delete',
  
  // Categories
  CATEGORIES_VIEW = 'categories:view',
  CATEGORIES_CREATE = 'categories:create',
  CATEGORIES_UPDATE = 'categories:update',
  CATEGORIES_DELETE = 'categories:delete',
  
  // Orders
  ORDERS_VIEW = 'orders:view',
  ORDERS_UPDATE = 'orders:update',
  ORDERS_EXPORT = 'orders:export',
  ORDERS_CANCEL = 'orders:cancel',
  ORDERS_REFUND = 'orders:refund',
  
  // Customers
  CUSTOMERS_VIEW = 'customers:view',
  CUSTOMERS_EDIT = 'customers:edit',
  
  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  
  // Staff
  STAFF_VIEW = 'staff:view',
  STAFF_INVITE = 'staff:invite',
  STAFF_UPDATE = 'staff:update',
  STAFF_DELETE = 'staff:delete',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  
  // Tenant Management
  TENANTS_VIEW = 'tenants:view',
  TENANTS_CREATE = 'tenants:create',
  TENANTS_UPDATE = 'tenants:update',
  TENANTS_DELETE = 'tenants:delete',
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.CATEGORIES_VIEW,
    Permission.CATEGORIES_CREATE,
    Permission.CATEGORIES_UPDATE,
    Permission.CATEGORIES_DELETE,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE,
    Permission.ORDERS_EXPORT,
    Permission.ORDERS_CANCEL,
    Permission.ORDERS_REFUND,
    Permission.CUSTOMERS_VIEW,
    Permission.CUSTOMERS_EDIT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.STAFF_VIEW,
    Permission.STAFF_INVITE,
    Permission.STAFF_UPDATE,
    Permission.STAFF_DELETE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.TENANTS_VIEW,
    Permission.TENANTS_CREATE,
    Permission.TENANTS_UPDATE,
    Permission.TENANTS_DELETE,
  ],
  ADMIN: [
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.CATEGORIES_VIEW,
    Permission.CATEGORIES_CREATE,
    Permission.CATEGORIES_UPDATE,
    Permission.CATEGORIES_DELETE,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE,
    Permission.ORDERS_EXPORT,
    Permission.ORDERS_CANCEL,
    Permission.ORDERS_REFUND,
    Permission.CUSTOMERS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.STAFF_VIEW,
    Permission.STAFF_INVITE,
    Permission.STAFF_UPDATE,
    Permission.STAFF_DELETE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
  ],
  STAFF: [
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_UPDATE,
    Permission.CATEGORIES_VIEW,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE,
    Permission.CUSTOMERS_VIEW,
    Permission.SETTINGS_VIEW,
  ],
  CUSTOMER: [],
};

/**
 * Get user role from stored user data
 */
export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.role || null;
  } catch {
    return null;
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (permission: Permission): boolean => {
  const role = getUserRole();
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (...permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (...permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(permission));
};

/**
 * Check if user is admin or staff
 */
export const isAdminOrStaff = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'STAFF' || role === 'SUPER_ADMIN';
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'SUPER_ADMIN';
};

/**
 * Check if user is staff (not admin)
 */
export const isStaff = (): boolean => {
  const role = getUserRole();
  return role === 'STAFF';
};

