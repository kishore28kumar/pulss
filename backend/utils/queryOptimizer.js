/**
 * Database Query Optimization Utilities
 * Provides helpers for optimizing database queries and preventing N+1 problems
 */

const { pool } = require('../config/db');

/**
 * Build optimized SELECT query with specific columns
 * @param {string} table - Table name
 * @param {Array<string>} columns - Columns to select
 * @param {Object} options - Query options
 * @returns {Object} Query object with text and values
 */
function buildSelectQuery(table, columns = ['*'], options = {}) {
  const {
    where = {},
    orderBy = null,
    limit = null,
    offset = null,
    joins = [],
  } = options;

  let query = `SELECT ${columns.join(', ')} FROM ${table}`;
  const values = [];
  let paramCount = 1;

  // Add joins
  if (joins.length > 0) {
    joins.forEach((join) => {
      query += ` ${join.type || 'LEFT'} JOIN ${join.table} ON ${join.condition}`;
    });
  }

  // Add WHERE clause
  const whereConditions = [];
  Object.entries(where).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      whereConditions.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // Add ORDER BY
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  // Add LIMIT
  if (limit) {
    query += ` LIMIT $${paramCount}`;
    values.push(limit);
    paramCount++;
  }

  // Add OFFSET
  if (offset) {
    query += ` OFFSET $${paramCount}`;
    values.push(offset);
  }

  return { text: query, values };
}

/**
 * Execute a query with pagination
 * @param {string} query - SQL query
 * @param {Array} values - Query parameters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Result with data and pagination info
 */
async function paginatedQuery(query, values = [], pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Get paginated data
  const paginatedQuery = `${query} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const result = await pool.query(paginatedQuery, [...values, limit, offset]);

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Batch load related records to prevent N+1 queries
 * @param {Array} parentRecords - Parent records
 * @param {string} parentKey - Key in parent records
 * @param {string} table - Related table name
 * @param {string} foreignKey - Foreign key in related table
 * @param {Array<string>} columns - Columns to select
 * @returns {Promise<Map>} Map of parent ID to related records
 */
async function batchLoad(parentRecords, parentKey, table, foreignKey, columns = ['*']) {
  if (!parentRecords || parentRecords.length === 0) {
    return new Map();
  }

  const ids = parentRecords.map((record) => record[parentKey]).filter(Boolean);
  if (ids.length === 0) {
    return new Map();
  }

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const query = `
    SELECT ${columns.join(', ')}
    FROM ${table}
    WHERE ${foreignKey} IN (${placeholders})
  `;

  const result = await pool.query(query, ids);

  // Group by foreign key
  const grouped = new Map();
  result.rows.forEach((row) => {
    const key = row[foreignKey];
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(row);
  });

  return grouped;
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Callback function with client parameter
 * @returns {Promise<*>} Transaction result
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Build batch insert query
 * @param {string} table - Table name
 * @param {Array<Object>} records - Records to insert
 * @param {Array<string>} columns - Column names
 * @returns {Object} Query object
 */
function buildBatchInsert(table, records, columns) {
  if (!records || records.length === 0) {
    return null;
  }

  const values = [];
  const valuePlaceholders = [];
  let paramCount = 1;

  records.forEach((record) => {
    const rowPlaceholders = [];
    columns.forEach((col) => {
      rowPlaceholders.push(`$${paramCount}`);
      values.push(record[col]);
      paramCount++;
    });
    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
  });

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${valuePlaceholders.join(', ')}
    RETURNING *
  `;

  return { text: query, values };
}

/**
 * Build batch update query
 * @param {string} table - Table name
 * @param {Array<Object>} updates - Updates with id and values
 * @param {string} idColumn - ID column name
 * @returns {Promise<Array>} Updated records
 */
async function batchUpdate(table, updates, idColumn = 'id') {
  if (!updates || updates.length === 0) {
    return [];
  }

  const results = [];
  for (const update of updates) {
    const { [idColumn]: id, ...values } = update;
    const setClause = Object.keys(values)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${idColumn} = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...Object.values(values)]);
    if (result.rows[0]) {
      results.push(result.rows[0]);
    }
  }

  return results;
}

/**
 * Create indexes for better query performance
 * @param {string} table - Table name
 * @param {Array<string>} columns - Columns to index
 * @param {Object} options - Index options
 */
async function createIndex(table, columns, options = {}) {
  const { unique = false, name = null } = options;
  const indexName = name || `idx_${table}_${columns.join('_')}`;
  const uniqueClause = unique ? 'UNIQUE' : '';

  const query = `
    CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexName}
    ON ${table} (${columns.join(', ')})
  `;

  try {
    await pool.query(query);
    console.log(`Index ${indexName} created successfully`);
  } catch (error) {
    console.error(`Failed to create index ${indexName}:`, error.message);
  }
}

/**
 * Analyze query performance
 * @param {string} query - SQL query
 * @param {Array} values - Query parameters
 * @returns {Promise<Object>} Query plan and execution time
 */
async function analyzeQuery(query, values = []) {
  const explainQuery = `EXPLAIN ANALYZE ${query}`;
  const start = Date.now();
  const result = await pool.query(explainQuery, values);
  const duration = Date.now() - start;

  return {
    plan: result.rows,
    duration,
  };
}

/**
 * Common indexes to create for better performance
 */
const commonIndexes = {
  tenants: [
    { columns: ['tenant_id'], unique: false },
    { columns: ['status'], unique: false },
    { columns: ['created_at'], unique: false },
  ],
  customers: [
    { columns: ['tenant_id'], unique: false },
    { columns: ['email'], unique: true },
    { columns: ['phone'], unique: false },
    { columns: ['tenant_id', 'email'], unique: true },
  ],
  orders: [
    { columns: ['tenant_id'], unique: false },
    { columns: ['customer_id'], unique: false },
    { columns: ['status'], unique: false },
    { columns: ['created_at'], unique: false },
    { columns: ['tenant_id', 'status'], unique: false },
  ],
  products: [
    { columns: ['tenant_id'], unique: false },
    { columns: ['sku'], unique: true },
    { columns: ['category'], unique: false },
    { columns: ['tenant_id', 'category'], unique: false },
  ],
  transactions: [
    { columns: ['tenant_id'], unique: false },
    { columns: ['customer_id'], unique: false },
    { columns: ['order_id'], unique: false },
    { columns: ['created_at'], unique: false },
    { columns: ['tenant_id', 'created_at'], unique: false },
  ],
};

/**
 * Initialize common indexes
 */
async function initializeIndexes() {
  console.log('Initializing database indexes...');
  
  for (const [table, indexes] of Object.entries(commonIndexes)) {
    for (const index of indexes) {
      await createIndex(table, index.columns, { unique: index.unique });
    }
  }
  
  console.log('Database indexes initialized');
}

module.exports = {
  buildSelectQuery,
  paginatedQuery,
  batchLoad,
  transaction,
  buildBatchInsert,
  batchUpdate,
  createIndex,
  analyzeQuery,
  initializeIndexes,
  commonIndexes,
};
