/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling and logging across the application
 */

/**
 * Custom error classes for different error types
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, false);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send consistent error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code
 */
function sendErrorResponse(res, error, statusCode = 500) {
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    success: false,
    message: error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
  };

  // Add error details in development mode
  if (!isProduction) {
    response.error = {
      name: error.name,
      stack: error.stack,
    };
  }

  // Add validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Log error
  logError(error, { statusCode, url: res.req?.originalUrl });

  res.status(statusCode).json(response);
}

/**
 * Handle database errors with appropriate logging and response
 * @param {Error} error - Database error
 * @param {Object} res - Express response object
 * @param {string} context - Context description for logging
 */
function handleDatabaseError(error, res, context = 'Database operation') {
  console.error(`${context} failed:`, {
    error: error.message,
    code: error.code,
    detail: error.detail,
    timestamp: new Date().toISOString(),
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? 'An error occurred while processing your request'
    : `${context} failed: ${error.message}`;

  sendErrorResponse(res, new DatabaseError(message, error), 500);
}

/**
 * Handle validation errors
 * @param {Array} errors - Array of validation errors
 * @param {Object} res - Express response object
 */
function handleValidationError(errors, res) {
  const errorMessages = Array.isArray(errors)
    ? errors.map((e) => e.message || e)
    : [errors];

  sendErrorResponse(
    res,
    new ValidationError('Validation failed', errorMessages),
    400
  );
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context information
 */
function logError(error, context = {}) {
  const errorLog = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('Error:', errorLog);
  }
}

/**
 * Try-catch wrapper for controller functions
 * @param {Function} controller - Controller function
 * @param {string} errorContext - Context for error messages
 * @returns {Function} Wrapped controller with error handling
 */
function withErrorHandling(controller, errorContext = 'Operation') {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      if (error.isOperational) {
        sendErrorResponse(res, error, error.statusCode);
      } else {
        handleDatabaseError(error, res, errorContext);
      }
    }
  };
}

/**
 * Create a success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
function sendSuccessResponse(res, data, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
function sendPaginatedResponse(res, data, pagination, message = 'Success') {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle not found errors
 * @param {string} resource - Resource name
 * @param {Object} res - Express response object
 */
function handleNotFound(resource, res) {
  sendErrorResponse(res, new NotFoundError(resource), 404);
}

/**
 * Handle unauthorized access
 * @param {Object} res - Express response object
 * @param {string} message - Custom error message
 */
function handleUnauthorized(res, message = 'Authentication required') {
  sendErrorResponse(res, new AuthenticationError(message), 401);
}

/**
 * Handle forbidden access
 * @param {Object} res - Express response object
 * @param {string} message - Custom error message
 */
function handleForbidden(res, message = 'Insufficient permissions') {
  sendErrorResponse(res, new AuthorizationError(message), 403);
}

/**
 * Handle duplicate resource errors
 * @param {string} resource - Resource name
 * @param {Object} res - Express response object
 */
function handleDuplicateError(resource, res) {
  sendErrorResponse(res, new ConflictError(`${resource} already exists`), 409);
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,

  // Handlers
  asyncHandler,
  withErrorHandling,
  handleDatabaseError,
  handleValidationError,
  handleNotFound,
  handleUnauthorized,
  handleForbidden,
  handleDuplicateError,

  // Response helpers
  sendErrorResponse,
  sendSuccessResponse,
  sendPaginatedResponse,
  logError,
};
