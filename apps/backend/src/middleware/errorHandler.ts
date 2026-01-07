import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@pulss/types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error details
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    statusCode,
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    console.error('⚠️ Headers already sent, cannot send error response');
    return;
  }

  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (origin) {
    // Import getCorsOrigins dynamically to avoid circular dependency
    const { getCorsOrigins } = require('../config/urls');
    const allowedOrigins = getCorsOrigins();
    const FALLBACK_ORIGINS = [
      'https://pulss-admin-dev.onrender.com',
      'https://pulss-store-dev.onrender.com',
      'https://pulss-admin.onrender.com',
      'https://pulss-storefront.onrender.com',
    ];
    const allAllowedOrigins = [...new Set([...allowedOrigins, ...FALLBACK_ORIGINS])];
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allAllowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin || allowed === origin;
    }) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Requested-With');
    }
  }

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

