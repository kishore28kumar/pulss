import { Request, Response, NextFunction } from 'express';
import { prisma } from '@pulss/database';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
        name: string;
      };
      tenantId?: string;
    }
  }
}

export const tenantMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let tenantSlug: string | undefined;

    // Try to get tenant from:
    // 1. X-Tenant-Slug header (for API clients)
    // 2. Subdomain (e.g., pharmacy1.pulss.com)
    // 3. Query parameter (for testing)

    tenantSlug = req.headers['x-tenant-slug'] as string;

    if (!tenantSlug) {
      const host = req.headers.host || '';
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'localhost' && subdomain !== 'admin' && !subdomain.includes(':')) {
        tenantSlug = subdomain;
      }
    }

    if (!tenantSlug && req.query.tenant) {
      tenantSlug = req.query.tenant as string;
    }

    // Some routes don't require tenant (e.g., super admin routes)
    if (!tenantSlug) {
      return next();
    }

    // Fetch tenant
    const tenant = await prisma.tenants.findUnique({
      where: { slug: tenantSlug, status: 'ACTIVE' },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (tenant) {
      req.tenant = tenant;
      req.tenantId = tenant.id;
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
};

export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  // SUPER_ADMIN can proceed without tenant (for cross-tenant operations)
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  if (!req.tenant || !req.tenantId) {
    res.status(400).json({
      success: false,
      error: 'Tenant not found. Please specify a valid tenant.',
    });
    return;
  }
  next();
};

/**
 * Ensure user can only access their own tenant's data
 * SUPER_ADMIN can access any tenant
 */
export const ensureTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
  // If no user is authenticated, skip (will be caught by auth middleware)
  if (!req.user) {
    return next();
  }

  // SUPER_ADMIN can access any tenant
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Other roles must access their own tenant only
  if (req.tenantId && req.user.tenantId !== req.tenantId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to this resource',
    });
    return;
  }

  next();
};

