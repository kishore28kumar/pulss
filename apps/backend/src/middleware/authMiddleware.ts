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

export const authenticateUser = (req: Request, _res: Response, next: NextFunction) => {
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

    if (decoded.type !== 'customer') {
      throw new AppError('Invalid token type', 401);
    }

    req.customerId = decoded.customerId;
    req.user = {
      userId: decoded.customerId,
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

