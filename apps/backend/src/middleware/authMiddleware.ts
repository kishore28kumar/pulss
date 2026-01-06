import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@pulss/types';
import { AppError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        tenantId: string;
      };
      customerId?: string;
    }
  }
}

/**
 * Optional authentication - sets req.user if token is present, but doesn't fail if missing
 * Useful for routes that need to support both authenticated and public access
 */
export const optionalAuthenticateUser = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // No token provided - continue without authentication (for public routes)
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    if (decoded.type !== 'access') {
      // Invalid token type - continue without authentication
      return next();
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };

    next();
  } catch (error) {
    // If token is invalid/expired, continue without authentication (for public routes)
    // This allows public storefront access even with invalid tokens
    next();
  }
};

export const authenticateUser = (req: Request, _res: Response, next: NextFunction) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    // Check both lowercase and capitalized versions (Express normalizes headers)
    // Express normalizes headers to lowercase, but check both to be safe
    const authHeaderRaw = req.headers.authorization || req.headers.Authorization;
    
    // Normalize to string (Express headers can be string | string[])
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;
    
    // Log ALL headers for debugging (only for chat conversations endpoint)
    if (req.url?.includes('/chat/conversations')) {
      console.log('[Auth] Request received:', {
        url: req.url,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? (typeof authHeader === 'string' ? authHeader.substring(0, 50) + '...' : String(authHeader).substring(0, 50) + '...') : null,
        allHeaderKeys: Object.keys(req.headers),
        authorizationHeader: req.headers.authorization,
        AuthorizationHeader: req.headers.Authorization,
      });
    }
    
    const token = authHeader && typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;

    if (!token) {
      console.log('[Auth] No token provided:', {
        url: req.url,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader && typeof authHeader === 'string' ? authHeader.substring(0, 30) : null,
        allHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('auth')),
      });
      throw new AppError('No authentication token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    if (decoded.type !== 'access') {
      console.log('[Auth] Invalid token type:', {
        url: req.url,
        tokenType: decoded.type,
      });
      throw new AppError('Invalid token type', 401);
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };

    console.log('[Auth] User authenticated:', {
      url: req.url,
      userId: decoded.userId,
      role: decoded.role,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('[Auth] JWT Error:', {
        url: req.url,
        error: error.message,
      });
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Auth] Token expired:', {
        url: req.url,
      });
      return next(new AppError('Token expired', 401));
    }
    console.log('[Auth] Other error:', {
      url: req.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

export const authenticateCustomer = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if the token is for a customer (by role, not type)
    if (decoded.role !== 'CUSTOMER') {
      throw new AppError('Invalid token - not a customer token', 401);
    }

    // The token contains userId (which is the customer ID for customer tokens)
    req.customerId = decoded.userId;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: 'CUSTOMER',
      tenantId: decoded.tenantId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Only Super Admin can perform this action', 403));
  }

  next();
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Ensure user is authenticated and has admin/staff role (not customer)
 */
export const requireAdminOrStaff = (req: Request, _res: Response, next: NextFunction) => {
  // Skip for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Admin or Staff access required', 403));
  }

  next();
};

