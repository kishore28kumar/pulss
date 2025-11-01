/**
 * Controller Helper Utilities
 * Provides reusable functions for common controller operations
 */

const { sendSuccessResponse, sendPaginatedResponse, handleNotFound } = require('./errorHandler');

/**
 * Extract user information from request
 * @param {Object} req - Express request object
 * @returns {Object} User information
 */
function getUserInfo(req) {
  return {
    userId: req.user?.id || req.user?.userId,
    tenantId: req.user?.tenantId || req.tenant?.id,
    role: req.user?.role || 'user',
    customerId: req.user?.customerId,
    adminId: req.user?.adminId,
    isCustomer: !!req.user?.customerId,
    isAdmin: !!req.user?.adminId || req.user?.role === 'admin',
    isSuperAdmin: req.user?.role === 'super_admin',
  };
}

/**
 * Extract pagination parameters from request
 * @param {Object} req - Express request object
 * @param {Object} defaults - Default pagination values
 * @returns {Object} Pagination parameters
 */
function getPaginationParams(req, defaults = {}) {
  const page = parseInt(req.query.page) || defaults.page || 1;
  const limit = Math.min(
    parseInt(req.query.limit) || defaults.limit || 10,
    defaults.maxLimit || 100
  );
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

/**
 * Extract sorting parameters from request
 * @param {Object} req - Express request object
 * @param {Object} defaults - Default sorting values
 * @returns {Object} Sorting parameters
 */
function getSortParams(req, defaults = {}) {
  const sortBy = req.query.sortBy || defaults.sortBy || 'created_at';
  const sortOrder = (req.query.sortOrder || defaults.sortOrder || 'DESC').toUpperCase();

  // Validate sort order
  const order = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

  return {
    sortBy,
    sortOrder: order,
    orderBy: `${sortBy} ${order}`,
  };
}

/**
 * Extract filter parameters from request query
 * @param {Object} req - Express request object
 * @param {Array<string>} allowedFilters - List of allowed filter keys
 * @returns {Object} Filter parameters
 */
function getFilterParams(req, allowedFilters = []) {
  const filters = {};

  allowedFilters.forEach((key) => {
    if (req.query[key] !== undefined && req.query[key] !== '') {
      filters[key] = req.query[key];
    }
  });

  return filters;
}

/**
 * Extract date range from request
 * @param {Object} req - Express request object
 * @returns {Object} Date range
 */
function getDateRange(req) {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

  return {
    startDate,
    endDate,
    hasDateFilter: !!(startDate || endDate),
  };
}

/**
 * Check if user has access to tenant
 * @param {Object} user - User object from request
 * @param {string} tenantId - Tenant ID to check
 * @returns {boolean} True if user has access
 */
function hasAccessToTenant(user, tenantId) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.tenantId === tenantId;
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array<string>} requiredFields - List of required fields
 * @returns {Object} Validation result
 */
function validateRequiredFields(body, requiredFields) {
  const missing = [];

  requiredFields.forEach((field) => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null,
  };
}

/**
 * Sanitize update fields (remove protected fields)
 * @param {Object} data - Update data
 * @param {Array<string>} protectedFields - Fields that cannot be updated
 * @returns {Object} Sanitized data
 */
function sanitizeUpdateData(data, protectedFields = ['id', 'created_at', 'tenant_id']) {
  const sanitized = { ...data };

  protectedFields.forEach((field) => {
    delete sanitized[field];
  });

  // Remove undefined and null values
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key];
    }
  });

  return sanitized;
}

/**
 * Build WHERE clause from filters
 * @param {Object} filters - Filter object
 * @param {number} startParamIndex - Starting parameter index
 * @returns {Object} WHERE clause and values
 */
function buildWhereClause(filters, startParamIndex = 1) {
  const conditions = [];
  const values = [];
  let paramIndex = startParamIndex;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        values.push(...value);
        paramIndex += value.length;
      } else if (typeof value === 'object' && value.operator) {
        // Handle custom operators (e.g., { operator: '>=', value: 100 })
        conditions.push(`${key} ${value.operator} $${paramIndex}`);
        values.push(value.value);
        paramIndex++;
      } else {
        // Handle equality
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
  });

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    whereClause,
    values,
    nextParamIndex: paramIndex,
  };
}

/**
 * Handle CRUD list operation with common patterns
 * @param {Object} options - Operation options
 * @returns {Function} Express handler function
 */
function handleList(options) {
  const {
    query,
    countQuery,
    allowedFilters = [],
    defaultSort = { sortBy: 'created_at', sortOrder: 'DESC' },
    transform = (rows) => rows,
  } = options;

  return async (req, res) => {
    try {
      const user = getUserInfo(req);
      const pagination = getPaginationParams(req);
      const sort = getSortParams(req, defaultSort);
      const filters = getFilterParams(req, allowedFilters);

      // Add tenant filter if not super admin
      if (!user.isSuperAdmin && user.tenantId) {
        filters.tenant_id = user.tenantId;
      }

      const { whereClause, values } = buildWhereClause(filters);

      // Get total count
      const countResult = await pool.query(
        `${countQuery} ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated data
      const dataQuery = `
        ${query}
        ${whereClause}
        ORDER BY ${sort.orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `;

      const result = await pool.query(dataQuery, [
        ...values,
        pagination.limit,
        pagination.offset,
      ]);

      const data = transform(result.rows);

      sendPaginatedResponse(res, data, {
        ...pagination,
        total,
      });
    } catch (error) {
      console.error('List operation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data',
      });
    }
  };
}

/**
 * Handle CRUD get by ID operation
 * @param {Object} options - Operation options
 * @returns {Function} Express handler function
 */
function handleGetById(options) {
  const {
    query,
    idParam = 'id',
    resourceName = 'Resource',
    checkTenantAccess = true,
    transform = (row) => row,
  } = options;

  return async (req, res) => {
    try {
      const user = getUserInfo(req);
      const id = req.params[idParam];

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return handleNotFound(resourceName, res);
      }

      const record = result.rows[0];

      // Check tenant access
      if (checkTenantAccess && !hasAccessToTenant(user, record.tenant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const data = transform(record);
      sendSuccessResponse(res, data);
    } catch (error) {
      console.error('Get by ID failed:', error);
      res.status(500).json({
        success: false,
        message: `Failed to fetch ${resourceName}`,
      });
    }
  };
}

/**
 * Format timestamp for consistent output
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toISOString();
}

/**
 * Calculate age from date
 * @param {Date|string} date - Date to calculate from
 * @returns {number} Age in days
 */
function calculateAge(date) {
  if (!date) return null;
  const now = new Date();
  const then = new Date(date);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

module.exports = {
  getUserInfo,
  getPaginationParams,
  getSortParams,
  getFilterParams,
  getDateRange,
  hasAccessToTenant,
  validateRequiredFields,
  sanitizeUpdateData,
  buildWhereClause,
  handleList,
  handleGetById,
  formatTimestamp,
  calculateAge,
};
