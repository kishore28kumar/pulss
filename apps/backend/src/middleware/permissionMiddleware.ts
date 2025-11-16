import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Permission definitions
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
  
  // Tenant Management (Super Admin only)
  TENANTS_VIEW = 'tenants:view',
  TENANTS_CREATE = 'tenants:create',
  TENANTS_UPDATE = 'tenants:update',
  TENANTS_DELETE = 'tenants:delete',
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    // All permissions
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
    Permission.PRODUCTS_UPDATE, // Limited fields only
    Permission.CATEGORIES_VIEW,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE,
    Permission.CUSTOMERS_VIEW,
    Permission.SETTINGS_VIEW,
  ],
  CUSTOMER: [], // No admin dashboard permissions
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasRequiredPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Middleware to check if user can update products (STAFF has limited fields)
 */
export const canUpdateProduct = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // ADMIN and SUPER_ADMIN can update all fields
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // STAFF can only update limited fields
  if (req.user.role === 'STAFF') {
    const allowedFields = ['stock', 'price', 'isActive'];
    const updateFields = Object.keys(req.body);
    const hasInvalidField = updateFields.some(field => !allowedFields.includes(field));

    if (hasInvalidField) {
      return next(new AppError('Staff can only update stock, price, and status', 403));
    }
  }

  next();
};

/**
 * Ensure user can only access their own tenant's data
 * SUPER_ADMIN can access any tenant
 */
export const ensureTenantAccess = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // SUPER_ADMIN can access any tenant
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Other roles must access their own tenant only
  if (req.tenantId && req.user.tenantId !== req.tenantId) {
    return next(new AppError('Access denied to this resource', 403));
  }

  next();
};

