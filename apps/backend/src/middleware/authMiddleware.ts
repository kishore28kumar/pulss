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
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401);
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
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

