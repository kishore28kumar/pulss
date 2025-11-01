/**
 * Input Validation and Sanitization Middleware
 * Provides validation schemas and sanitization for API requests
 */

const validator = require('validator');

/**
 * Validation rules for common fields
 */
const validationRules = {
  email: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isEmail(value);
  },

  phone: (value) => {
    if (!value || typeof value !== 'string') return false;
    // Allow international phone numbers
    return validator.isMobilePhone(value, 'any', { strictMode: false });
  },

  url: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isURL(value, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  },

  uuid: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isUUID(value);
  },

  alphanumeric: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isAlphanumeric(value);
  },

  numeric: (value) => {
    if (value === undefined || value === null) return false;
    return validator.isNumeric(String(value));
  },

  boolean: (value) => {
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  },

  date: (value) => {
    if (!value) return false;
    return validator.isISO8601(String(value));
  },

  password: (value) => {
    if (!value || typeof value !== 'string') return false;
    // At least 8 characters, one uppercase, one lowercase, one number
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value)
    );
  },

  strongPassword: (value) => {
    if (!value || typeof value !== 'string') return false;
    // At least 10 characters, one uppercase, one lowercase, one number, one special char
    return (
      value.length >= 10 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(value)
    );
  },

  mongoId: (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^[a-f\d]{24}$/i.test(value);
  },

  creditCard: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isCreditCard(value);
  },

  ipAddress: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isIP(value);
  },

  notEmpty: (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  },

  length: (min, max) => (value) => {
    if (!value || typeof value !== 'string') return false;
    const len = value.length;
    if (min !== undefined && len < min) return false;
    if (max !== undefined && len > max) return false;
    return true;
  },

  range: (min, max) => (value) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },

  enum: (allowedValues) => (value) => {
    return allowedValues.includes(value);
  },

  array: (itemValidator) => (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(itemValidator);
  },

  object: (schema) => (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return validateObject(value, schema);
  },
};

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;

  // Escape HTML entities first to prevent any tag interpretation
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();

  return sanitized;
}

/**
 * Validate object against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {boolean} True if valid
 */
function validateObject(obj, schema) {
  for (const [key, rule] of Object.entries(schema)) {
    const value = obj[key];

    // Check required fields
    if (rule.required && (value === undefined || value === null)) {
      return false;
    }

    // Skip validation if field is optional and not provided
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Apply validation rule
    if (rule.validator) {
      const isValid =
        typeof rule.validator === 'function'
          ? rule.validator(value)
          : validationRules[rule.validator]?.(value);

      if (!isValid) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validate request middleware factory
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schema.body) {
      for (const [key, rule] of Object.entries(schema.body)) {
        const value = req.body?.[key];

        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: key,
            message: rule.message || `${key} is required`,
          });
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Apply validation rule
        let isValid = true;
        if (rule.validator) {
          if (typeof rule.validator === 'function') {
            isValid = rule.validator(value);
          } else if (typeof rule.validator === 'string' && validationRules[rule.validator]) {
            isValid = validationRules[rule.validator](value);
          }

          if (!isValid) {
            errors.push({
              field: key,
              message: rule.message || `${key} is invalid`,
            });
          }
        }

        // Apply custom validators
        if (rule.custom && typeof rule.custom === 'function') {
          const customResult = rule.custom(value, req.body);
          if (customResult !== true) {
            errors.push({
              field: key,
              message: customResult || `${key} validation failed`,
            });
          }
        }
      }
    }

    // Validate query parameters
    if (schema.query) {
      for (const [key, rule] of Object.entries(schema.query)) {
        const value = req.query?.[key];

        if (rule.required && !value) {
          errors.push({
            field: key,
            message: rule.message || `Query parameter ${key} is required`,
          });
          continue;
        }

        if (!rule.required && !value) {
          continue;
        }

        let isValid = true;
        if (rule.validator) {
          if (typeof rule.validator === 'function') {
            isValid = rule.validator(value);
          } else if (validationRules[rule.validator]) {
            isValid = validationRules[rule.validator](value);
          }

          if (!isValid) {
            errors.push({
              field: key,
              message: rule.message || `Query parameter ${key} is invalid`,
            });
          }
        }
      }
    }

    // Validate params
    if (schema.params) {
      for (const [key, rule] of Object.entries(schema.params)) {
        const value = req.params?.[key];

        if (rule.required && !value) {
          errors.push({
            field: key,
            message: rule.message || `Parameter ${key} is required`,
          });
          continue;
        }

        if (!rule.required && !value) {
          continue;
        }

        let isValid = true;
        if (rule.validator) {
          if (typeof rule.validator === 'function') {
            isValid = rule.validator(value);
          } else if (validationRules[rule.validator]) {
            isValid = validationRules[rule.validator](value);
          }

          if (!isValid) {
            errors.push({
              field: key,
              message: rule.message || `Parameter ${key} is invalid`,
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
}

/**
 * Sanitize request data middleware
 */
function sanitizeRequest(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * Recursively sanitize object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' ? sanitizeObject(item) : sanitizeString(item)
    );
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Common validation schemas
 */
const commonSchemas = {
  // Pagination
  pagination: {
    query: {
      page: {
        validator: validationRules.numeric,
        message: 'Page must be a number',
      },
      limit: {
        validator: validationRules.numeric,
        message: 'Limit must be a number',
      },
    },
  },

  // ID parameter
  idParam: {
    params: {
      id: {
        required: true,
        validator: validationRules.uuid,
        message: 'Invalid ID format',
      },
    },
  },

  // Login
  login: {
    body: {
      email: {
        required: true,
        validator: validationRules.email,
        message: 'Invalid email address',
      },
      password: {
        required: true,
        validator: validationRules.notEmpty,
        message: 'Password is required',
      },
    },
  },

  // Register
  register: {
    body: {
      email: {
        required: true,
        validator: validationRules.email,
        message: 'Invalid email address',
      },
      password: {
        required: true,
        validator: validationRules.password,
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
      },
      name: {
        required: true,
        validator: validationRules.length(2, 100),
        message: 'Name must be between 2 and 100 characters',
      },
    },
  },
};

module.exports = {
  validateRequest,
  sanitizeRequest,
  sanitizeString,
  validationRules,
  commonSchemas,
};
