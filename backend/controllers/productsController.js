const { pool } = require('../config/db');
const Papa = require('papaparse');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');

// Validate image URL accessibility
const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ valid: false, error: 'No URL provided' });
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      resolve({ valid: false, error: 'Invalid URL format' });
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { timeout: 5000 }, (res) => {
      const isImage = res.headers['content-type']?.startsWith('image/');
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      if (isSuccess && isImage) {
        resolve({ valid: true, contentType: res.headers['content-type'] });
      } else {
        resolve({ 
          valid: false, 
          error: `Invalid response: ${res.statusCode}, content-type: ${res.headers['content-type']}` 
        });
      }
      
      // Abort to prevent downloading the entire image
      request.abort();
    });
    
    request.on('error', (error) => {
      resolve({ valid: false, error: error.message });
    });
    
    request.on('timeout', () => {
      request.abort();
      resolve({ valid: false, error: 'Request timeout' });
    });
  });
};

// Import products from CSV
const importCSV = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req.params;
    const { validate_only = false, validate_images = true } = req.query;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    // Parse CSV
    const csvData = req.file.buffer.toString('utf8');
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
    });
    
    if (parseResult.errors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors 
      });
    }
    
    const rows = parseResult.data;
    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
      preview: []
    };
    
    // Validation phase
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const validationErrors = [];
      const validationWarnings = [];
      
      // Validate required fields
      if (!row.name || !row.price) {
        validationErrors.push('Missing required fields: name or price');
      }
      
      // Validate price format
      if (row.price && isNaN(parseFloat(row.price))) {
        validationErrors.push('Invalid price format');
      }
      
      if (row.mrp && isNaN(parseFloat(row.mrp))) {
        validationErrors.push('Invalid MRP format');
      }
      
      // Validate image URLs if requested
      let imageValidation = { valid: true };
      let imagesValidation = [];
      
      if (validate_images === 'true' || validate_images === true) {
        if (row.image_url) {
          imageValidation = await validateImageUrl(row.image_url);
          if (!imageValidation.valid) {
            validationWarnings.push(`Image URL validation failed: ${imageValidation.error}`);
          }
        }
        
        // Validate multiple images
        if (row.images) {
          const imageUrls = row.images.split(',').map(img => img.trim()).filter(img => img);
          for (const imageUrl of imageUrls) {
            const validation = await validateImageUrl(imageUrl);
            imagesValidation.push({
              url: imageUrl,
              valid: validation.valid,
              error: validation.error
            });
            if (!validation.valid) {
              validationWarnings.push(`Image validation failed for "${imageUrl}": ${validation.error}`);
            }
          }
        }
      }
      
      // Add to preview (first 10 rows)
      if (i < 10) {
        results.preview.push({
          row: rowNumber,
          data: row,
          imageValidation: validate_images ? imageValidation : null,
          imagesValidation: validate_images ? imagesValidation : null,
          errors: validationErrors,
          warnings: validationWarnings
        });
      }
      
      if (validationErrors.length > 0) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          data: row,
          errors: validationErrors
        });
      } else {
        if (validationWarnings.length > 0) {
          results.warnings.push({
            row: rowNumber,
            data: row,
            warnings: validationWarnings
          });
        }
      }
    }
    
    // If validate_only mode, return validation results without importing
    if (validate_only === 'true' || validate_only === true) {
      return res.json({
        message: 'Validation completed',
        validated: true,
        results
      });
    }
    
    // Import phase (if not validation only)
    await client.query('BEGIN');
    results.success = 0;
    results.failed = 0;
    results.errors = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Validate required fields
        if (!row.name || !row.price) {
          throw new Error('Missing required fields: name, price');
        }
        
        // Get or create category
        let category_id = null;
        if (row.category) {
          const categoryResult = await client.query(
            `INSERT INTO categories (tenant_id, name) 
             VALUES ($1, $2) 
             ON CONFLICT (tenant_id, name) 
             DO UPDATE SET name = EXCLUDED.name 
             RETURNING category_id`,
            [tenant_id, row.category.trim()]
          );
          category_id = categoryResult.rows[0].category_id;
        }
        
        // Parse images if provided (comma-separated URLs or filenames)
        let images = null;
        if (row.images) {
          images = row.images.split(',').map(img => img.trim()).filter(img => img);
        }
        
        // Insert or update product
        const productResult = await client.query(
          `INSERT INTO products (
            tenant_id, category_id, name, description, brand, pack_size,
            price, mrp, sku, image_url, images, requires_rx, active, 
            inventory_count, tags, manufacturer
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (tenant_id, name, brand, pack_size) 
          DO UPDATE SET 
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            mrp = EXCLUDED.mrp,
            image_url = COALESCE(EXCLUDED.image_url, products.image_url),
            updated_at = TIMEZONE('utc'::text, NOW())
          RETURNING product_id`,
          [
            tenant_id,
            category_id,
            row.name,
            row.description || null,
            row.brand || null,
            row.pack_size || null,
            parseFloat(row.price),
            row.mrp ? parseFloat(row.mrp) : parseFloat(row.price),
            row.sku || null,
            row.image_url || (images ? images[0] : null),
            images,
            row.requires_rx === 'true' || row.requires_rx === '1',
            row.active === 'false' || row.active === '0' ? false : true,
            row.inventory_count ? parseInt(row.inventory_count) : 0,
            row.tags ? row.tags.split(',').map(t => t.trim()) : null,
            row.manufacturer || null
          ]
        );
        
        const product_id = productResult.rows[0].product_id;
        
        // Handle variants if provided in CSV
        // Expected format: variant_strength, variant_pack_size, variant_color, etc.
        const variantTypes = ['strength', 'pack_size', 'color', 'size', 'flavor'];
        for (const variantType of variantTypes) {
          const variantKey = `variant_${variantType}`;
          if (row[variantKey]) {
            // Create or update variant
            await client.query(
              `INSERT INTO product_variants (
                product_id, tenant_id, variant_name, variant_type,
                price, mrp, inventory_count
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (product_id, variant_type, variant_name)
              DO UPDATE SET 
                price = EXCLUDED.price,
                mrp = EXCLUDED.mrp,
                inventory_count = EXCLUDED.inventory_count,
                updated_at = TIMEZONE('utc'::text, NOW())`,
              [
                product_id,
                tenant_id,
                row[variantKey].trim(),
                variantType,
                row[`${variantKey}_price`] ? parseFloat(row[`${variantKey}_price`]) : parseFloat(row.price),
                row[`${variantKey}_mrp`] ? parseFloat(row[`${variantKey}_mrp`]) : (row.mrp ? parseFloat(row.mrp) : parseFloat(row.price)),
                row[`${variantKey}_inventory`] ? parseInt(row[`${variantKey}_inventory`]) : (row.inventory_count ? parseInt(row.inventory_count) : 0)
              ]
            );
          }
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: row,
          error: error.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: 'CSV import completed',
      results
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV', details: error.message });
  } finally {
    client.release();
  }
};

// List products
const listProducts = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { 
      category_id, 
      search, 
      active, 
      featured,
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.tenant_id = $1
    `;
    
    const params = [tenant_id];
    let paramCount = 2;
    
    if (category_id) {
      query += ` AND p.category_id = $${paramCount++}`;
      params.push(category_id);
    }
    
    if (active !== undefined) {
      query += ` AND p.active = $${paramCount++}`;
      params.push(active === 'true');
    }
    
    if (featured !== undefined) {
      query += ` AND p.featured = $${paramCount++}`;
      params.push(featured === 'true');
    }
    
    if (search) {
      query += ` AND (
        p.name ILIKE $${paramCount} OR 
        p.description ILIKE $${paramCount} OR 
        p.brand ILIKE $${paramCount} OR
        p.sku ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Add sorting and pagination
    query += ` ORDER BY p.${sort_by} ${sort_order} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      category_id, name, description, brand, pack_size,
      price, mrp, sku, image_url, images, requires_rx,
      active, featured, inventory_count, tags, manufacturer
    } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO products (
        tenant_id, category_id, name, description, brand, pack_size,
        price, mrp, sku, image_url, images, requires_rx, active, featured,
        inventory_count, tags, manufacturer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        tenant_id, category_id, name, description, brand, pack_size,
        price, mrp || price, sku, image_url, images, requires_rx || false,
        active !== false, featured || false, inventory_count || 0, tags, manufacturer
      ]
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product to check tenant
    const productCheck = await pool.query(
      'SELECT tenant_id FROM products WHERE product_id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product_tenant_id = productCheck.rows[0].tenant_id;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== product_tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'category_id', 'name', 'description', 'brand', 'pack_size',
      'price', 'mrp', 'sku', 'image_url', 'images', 'requires_rx',
      'active', 'featured', 'inventory_count', 'tags', 'manufacturer'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    values.push(id);
    
    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE product_id = $${paramCount} RETURNING *`,
      values
    );
    
    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product to check tenant
    const productCheck = await pool.query(
      'SELECT tenant_id FROM products WHERE product_id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product_tenant_id = productCheck.rows[0].tenant_id;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== product_tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await pool.query('DELETE FROM products WHERE product_id = $1', [id]);
    
    res.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Upload product images
const uploadImages = async (req, res) => {
  try {
    const { tenant_id, product_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
    
    // Update product images
    const result = await pool.query(
      `UPDATE products 
       SET images = array_cat(COALESCE(images, ARRAY[]::text[]), $1::text[]),
           image_url = COALESCE(image_url, $2),
           updated_at = TIMEZONE('utc'::text, NOW())
       WHERE product_id = $3 AND tenant_id = $4
       RETURNING *`,
      [imageUrls, imageUrls[0], product_id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      message: 'Images uploaded successfully',
      images: imageUrls,
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

// Get variants for a product
const getProductVariants = async (req, res) => {
  try {
    const { tenant_id, product_id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM product_variants 
       WHERE product_id = $1 AND tenant_id = $2 AND active = true
       ORDER BY display_order ASC, variant_type ASC, variant_name ASC`,
      [product_id, tenant_id]
    );
    
    // Group variants by type
    const variantsByType = result.rows.reduce((acc, variant) => {
      if (!acc[variant.variant_type]) {
        acc[variant.variant_type] = [];
      }
      acc[variant.variant_type].push(variant);
      return acc;
    }, {});
    
    res.json({
      variants: result.rows,
      variantsByType
    });
    
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: 'Failed to get variants' });
  }
};

// Create a product variant
const createProductVariant = async (req, res) => {
  try {
    const { tenant_id, product_id } = req.params;
    const {
      variant_name,
      variant_type,
      price,
      mrp,
      inventory_count = 0,
      sku,
      attributes = {},
      is_default = false,
      display_order = 0
    } = req.body;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate required fields
    if (!variant_name || !variant_type) {
      return res.status(400).json({ error: 'variant_name and variant_type are required' });
    }
    
    // If this is set as default, unset other defaults for this product/type
    if (is_default) {
      await pool.query(
        `UPDATE product_variants 
         SET is_default = false 
         WHERE product_id = $1 AND variant_type = $2`,
        [product_id, variant_type]
      );
    }
    
    const result = await pool.query(
      `INSERT INTO product_variants (
        product_id, tenant_id, variant_name, variant_type,
        price, mrp, inventory_count, sku, attributes,
        is_default, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        product_id, tenant_id, variant_name, variant_type,
        price, mrp, inventory_count, sku, JSON.stringify(attributes),
        is_default, display_order
      ]
    );
    
    res.status(201).json({
      message: 'Variant created successfully',
      variant: result.rows[0]
    });
    
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Variant with this name and type already exists for this product' });
    }
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Failed to create variant' });
  }
};

// Update a product variant
const updateProductVariant = async (req, res) => {
  try {
    const { tenant_id, variant_id } = req.params;
    const {
      variant_name,
      price,
      mrp,
      inventory_count,
      sku,
      attributes,
      is_default,
      active,
      display_order
    } = req.body;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (variant_name !== undefined) {
      updates.push(`variant_name = $${paramCount++}`);
      values.push(variant_name);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (mrp !== undefined) {
      updates.push(`mrp = $${paramCount++}`);
      values.push(mrp);
    }
    if (inventory_count !== undefined) {
      updates.push(`inventory_count = $${paramCount++}`);
      values.push(inventory_count);
    }
    if (sku !== undefined) {
      updates.push(`sku = $${paramCount++}`);
      values.push(sku);
    }
    if (attributes !== undefined) {
      updates.push(`attributes = $${paramCount++}`);
      values.push(JSON.stringify(attributes));
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(is_default);
      
      // If setting as default, unset others
      if (is_default) {
        const variantResult = await pool.query(
          'SELECT product_id, variant_type FROM product_variants WHERE variant_id = $1',
          [variant_id]
        );
        if (variantResult.rows.length > 0) {
          const { product_id, variant_type } = variantResult.rows[0];
          await pool.query(
            `UPDATE product_variants 
             SET is_default = false 
             WHERE product_id = $1 AND variant_type = $2 AND variant_id != $3`,
            [product_id, variant_type, variant_id]
          );
        }
      }
    }
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = TIMEZONE('utc'::text, NOW())`);
    values.push(variant_id, tenant_id);
    
    const query = `
      UPDATE product_variants 
      SET ${updates.join(', ')}
      WHERE variant_id = $${paramCount++} AND tenant_id = $${paramCount++}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({
      message: 'Variant updated successfully',
      variant: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
};

// Delete a product variant
const deleteProductVariant = async (req, res) => {
  try {
    const { tenant_id, variant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'DELETE FROM product_variants WHERE variant_id = $1 AND tenant_id = $2 RETURNING *',
      [variant_id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({
      message: 'Variant deleted successfully',
      variant: result.rows[0]
    });
    
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
};

// Bulk upload images for multiple products (via ZIP or multiple files with SKU mapping)
const bulkUploadImages = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { mappings } = req.body; // Array of { sku, imageIndex } or { sku, fileName }
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map((file, index) => ({
      index,
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/products/${file.filename}`
    }));
    
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      updated_products: []
    };
    
    // If mappings provided, use them
    if (mappings && Array.isArray(mappings)) {
      results.total = mappings.length;
      
      for (const mapping of mappings) {
        try {
          const { sku, imageIndex, fileName } = mapping;
          
          // Find the file
          let fileInfo;
          if (imageIndex !== undefined) {
            fileInfo = uploadedFiles[imageIndex];
          } else if (fileName) {
            fileInfo = uploadedFiles.find(f => f.originalname === fileName);
          }
          
          if (!fileInfo) {
            results.failed++;
            results.errors.push({
              sku,
              error: 'Image file not found'
            });
            continue;
          }
          
          // Update product
          const result = await pool.query(
            `UPDATE products 
             SET images = array_append(COALESCE(images, ARRAY[]::text[]), $1),
                 image_url = COALESCE(image_url, $1),
                 updated_at = TIMEZONE('utc'::text, NOW())
             WHERE sku = $2 AND tenant_id = $3
             RETURNING product_id, name, sku, images`,
            [fileInfo.path, sku, tenant_id]
          );
          
          if (result.rows.length === 0) {
            results.failed++;
            results.errors.push({
              sku,
              error: 'Product not found'
            });
          } else {
            results.success++;
            results.updated_products.push(result.rows[0]);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            sku: mapping.sku,
            error: error.message
          });
        }
      }
    } else {
      // Auto-match by filename (filename should contain SKU)
      results.total = uploadedFiles.length;
      
      for (const file of uploadedFiles) {
        try {
          // Extract SKU from filename (assumes format: SKU-*.ext or SKU.ext)
          const sku = file.originalname.split(/[-_.]/)[0];
          
          const result = await pool.query(
            `UPDATE products 
             SET images = array_append(COALESCE(images, ARRAY[]::text[]), $1),
                 image_url = COALESCE(image_url, $1),
                 updated_at = TIMEZONE('utc'::text, NOW())
             WHERE sku ILIKE $2 AND tenant_id = $3
             RETURNING product_id, name, sku, images`,
            [file.path, `%${sku}%`, tenant_id]
          );
          
          if (result.rows.length === 0) {
            results.failed++;
            results.errors.push({
              file: file.originalname,
              error: `No product found matching SKU: ${sku}`
            });
          } else {
            results.success++;
            results.updated_products.push(result.rows[0]);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            file: file.originalname,
            error: error.message
          });
        }
      }
    }
    
    res.json({
      message: 'Bulk image upload completed',
      results
    });
    
  } catch (error) {
    console.error('Bulk upload images error:', error);
    res.status(500).json({ error: 'Failed to bulk upload images' });
  }
};

// Delete a specific image from product
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }
    
    // Get product to check tenant
    const productCheck = await pool.query(
      'SELECT tenant_id, images FROM products WHERE product_id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product_tenant_id = productCheck.rows[0].tenant_id;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== product_tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Remove image from array
    const result = await pool.query(
      `UPDATE products 
       SET images = array_remove(images, $1),
           image_url = CASE WHEN image_url = $1 THEN 
             (SELECT images[1] FROM products WHERE product_id = $2 AND images IS NOT NULL AND array_length(images, 1) > 0)
           ELSE image_url END,
           updated_at = TIMEZONE('utc'::text, NOW())
       WHERE product_id = $2
       RETURNING *`,
      [image_url, id]
    );
    
    res.json({
      message: 'Image deleted successfully',
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Reorder product images
const reorderProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'images array is required' });
    }
    
    // Get product to check tenant
    const productCheck = await pool.query(
      'SELECT tenant_id FROM products WHERE product_id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product_tenant_id = productCheck.rows[0].tenant_id;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== product_tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update images order and set first as main image
    const result = await pool.query(
      `UPDATE products 
       SET images = $1,
           image_url = $2,
           updated_at = TIMEZONE('utc'::text, NOW())
       WHERE product_id = $3
       RETURNING *`,
      [images, images[0], id]
    );
    
    res.json({
      message: 'Images reordered successfully',
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
};

module.exports = {
  importCSV,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  bulkUploadImages,
  deleteProductImage,
  reorderProductImages
};
