const db = require('../config/db');
const Papa = require('papaparse');

/**
 * Bulk Operations Controller
 * Handles bulk import/export and batch operations
 */

// Start bulk product import
exports.bulkImportProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { products } = req.body; // Array of product objects

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    // Create bulk operation record
    const operation = await db.query(
      `INSERT INTO bulk_operations 
       (tenant_id, user_id, operation_type, total_records, status) 
       VALUES ($1, $2, 'product_import', $3, 'processing') 
       RETURNING id`,
      [tenantId, userId, products.length]
    );

    const operationId = operation.rows[0].id;

    // Process products in background
    processProductImport(operationId, tenantId, products).catch(error => {
      console.error('Error processing product import:', error);
    });

    res.json({
      success: true,
      message: 'Bulk import started',
      data: {
        operation_id: operationId,
        total_records: products.length
      }
    });
  } catch (error) {
    console.error('Error starting bulk import:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start bulk import' 
    });
  }
};

// Process product import (background task)
async function processProductImport(operationId, tenantId, products) {
  let processed = 0;
  let failed = 0;
  const errors = [];

  for (const product of products) {
    try {
      // Validate required fields
      if (!product.name || !product.selling_price) {
        throw new Error('Missing required fields: name, selling_price');
      }

      // Get or create category
      let categoryId = product.category_id;
      if (!categoryId && product.category) {
        const category = await db.query(
          `INSERT INTO categories (tenant_id, name) 
           VALUES ($1, $2) 
           ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tenantId, product.category]
        );
        categoryId = category.rows[0].id;
      }

      // Insert or update product
      await db.query(
        `INSERT INTO products 
         (tenant_id, name, description, category_id, brand, pack_size, mrp, selling_price, image_url, requires_prescription, active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (tenant_id, name, brand) 
         DO UPDATE SET 
           description = EXCLUDED.description,
           category_id = EXCLUDED.category_id,
           pack_size = EXCLUDED.pack_size,
           mrp = EXCLUDED.mrp,
           selling_price = EXCLUDED.selling_price,
           image_url = EXCLUDED.image_url,
           requires_prescription = EXCLUDED.requires_prescription,
           active = EXCLUDED.active,
           updated_at = NOW()`,
        [
          tenantId,
          product.name,
          product.description || null,
          categoryId,
          product.brand || null,
          product.pack_size || null,
          product.mrp || product.selling_price,
          product.selling_price,
          product.image_url || null,
          product.requires_prescription || false,
          product.active !== false
        ]
      );

      processed++;
    } catch (error) {
      failed++;
      errors.push({
        product: product.name,
        error: error.message
      });
    }

    // Update progress every 10 items
    if ((processed + failed) % 10 === 0) {
      await db.query(
        `UPDATE bulk_operations 
         SET processed_records = $1, failed_records = $2, updated_at = NOW() 
         WHERE id = $3`,
        [processed, failed, operationId]
      );
    }
  }

  // Mark as completed
  await db.query(
    `UPDATE bulk_operations 
     SET status = 'completed', 
         processed_records = $1, 
         failed_records = $2,
         error_log = $3,
         completed_at = NOW() 
     WHERE id = $4`,
    [processed, failed, JSON.stringify(errors), operationId]
  );
}

// Bulk update product prices
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { updates } = req.body; // Array of {product_id, selling_price, mrp}

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    // Create bulk operation record
    const operation = await db.query(
      `INSERT INTO bulk_operations 
       (tenant_id, user_id, operation_type, total_records, status) 
       VALUES ($1, $2, 'price_update', $3, 'processing') 
       RETURNING id`,
      [tenantId, userId, updates.length]
    );

    const operationId = operation.rows[0].id;
    let processed = 0;
    let failed = 0;

    // Process updates
    for (const update of updates) {
      try {
        await db.query(
          `UPDATE products 
           SET selling_price = $1, mrp = $2, updated_at = NOW() 
           WHERE id = $3 AND tenant_id = $4`,
          [update.selling_price, update.mrp || update.selling_price, update.product_id, tenantId]
        );
        processed++;
      } catch (error) {
        failed++;
      }
    }

    // Mark as completed
    await db.query(
      `UPDATE bulk_operations 
       SET status = 'completed', 
           processed_records = $1, 
           failed_records = $2,
           completed_at = NOW() 
       WHERE id = $3`,
      [processed, failed, operationId]
    );

    res.json({
      success: true,
      message: 'Bulk price update completed',
      data: {
        processed,
        failed
      }
    });
  } catch (error) {
    console.error('Error in bulk price update:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update prices' 
    });
  }
};

// Export orders
exports.exportOrders = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { start_date, end_date, status } = req.query;

    let query = `
      SELECT o.id, o.created_at, o.status, o.total_amount, o.final_amount, 
             o.payment_method, o.payment_status,
             c.full_name as customer_name, c.phone as customer_phone,
             o.delivery_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 1;

    if (start_date) {
      paramCount++;
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await db.query(query, params);

    // Convert to CSV
    const csv = Papa.unparse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export orders' 
    });
  }
};

// Export products
exports.exportProducts = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    const result = await db.query(
      `SELECT p.id, p.name, p.description, c.name as category, p.brand, 
              p.pack_size, p.mrp, p.selling_price, p.image_url, 
              p.requires_prescription, p.active, p.created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.tenant_id = $1
       ORDER BY p.name`,
      [tenantId]
    );

    // Convert to CSV
    const csv = Papa.unparse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export products' 
    });
  }
};

// Get bulk operation status
exports.getBulkOperationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * FROM bulk_operations 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bulk operation not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching bulk operation status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch operation status' 
    });
  }
};

// List bulk operations
exports.listBulkOperations = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT * FROM bulk_operations 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error listing bulk operations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list bulk operations' 
    });
  }
};
