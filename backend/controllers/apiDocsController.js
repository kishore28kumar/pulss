const db = require('../config/db');

/**
 * API Documentation Controller
 * Manages API documentation content for the developer portal
 */

// ============================================================================
// API DOCUMENTATION
// ============================================================================

// Get all documentation pages
exports.getDocumentation = async (req, res) => {
  try {
    const { category, parent_id } = req.query;

    let whereClause = 'WHERE is_published = true';
    const values = [];
    let paramCount = 1;

    if (category) {
      whereClause += ` AND category = $${paramCount++}`;
      values.push(category);
    }

    if (parent_id) {
      whereClause += ` AND parent_id = $${paramCount++}`;
      values.push(parent_id);
    } else {
      whereClause += ' AND parent_id IS NULL';
    }

    const result = await db.query(
      `SELECT id, slug, title, description, category, content, code_samples, 
              parent_id, order_index, version, meta_title, meta_description, created_at, updated_at
       FROM api_documentation
       ${whereClause}
       ORDER BY category, order_index, title`,
      values
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documentation'
    });
  }
};

// Get documentation by slug
exports.getDocumentationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      `SELECT * FROM api_documentation WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documentation'
    });
  }
};

// Get documentation categories
exports.getDocumentationCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM api_documentation
       WHERE is_published = true
       GROUP BY category
       ORDER BY category`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching documentation categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documentation categories'
    });
  }
};

// Create documentation (Super Admin only)
exports.createDocumentation = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const {
      slug,
      title,
      description,
      category,
      content,
      code_samples,
      parent_id,
      order_index = 0,
      is_published = true,
      version = '1.0',
      meta_title,
      meta_description
    } = req.body;

    // Validate required fields
    if (!slug || !title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: 'Slug, title, category, and content are required'
      });
    }

    // Check if slug already exists
    const existingDoc = await db.query(
      'SELECT id FROM api_documentation WHERE slug = $1',
      [slug]
    );

    if (existingDoc.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A document with this slug already exists'
      });
    }

    // Insert documentation
    const result = await db.query(
      `INSERT INTO api_documentation 
       (slug, title, description, category, content, code_samples, parent_id, 
        order_index, is_published, version, meta_title, meta_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        slug, title, description, category, content, 
        code_samples ? JSON.stringify(code_samples) : null,
        parent_id, order_index, is_published, version, meta_title, meta_description
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Documentation created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create documentation'
    });
  }
};

// Update documentation (Super Admin only)
exports.updateDocumentation = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { id } = req.params;
    const {
      slug, title, description, category, content, code_samples,
      parent_id, order_index, is_published, version, meta_title, meta_description
    } = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (code_samples !== undefined) {
      updates.push(`code_samples = $${paramCount++}`);
      values.push(JSON.stringify(code_samples));
    }
    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(parent_id);
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramCount++}`);
      values.push(order_index);
    }
    if (is_published !== undefined) {
      updates.push(`is_published = $${paramCount++}`);
      values.push(is_published);
    }
    if (version !== undefined) {
      updates.push(`version = $${paramCount++}`);
      values.push(version);
    }
    if (meta_title !== undefined) {
      updates.push(`meta_title = $${paramCount++}`);
      values.push(meta_title);
    }
    if (meta_description !== undefined) {
      updates.push(`meta_description = $${paramCount++}`);
      values.push(meta_description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE api_documentation 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      message: 'Documentation updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update documentation'
    });
  }
};

// Delete documentation (Super Admin only)
exports.deleteDocumentation = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { id } = req.params;

    await db.query('DELETE FROM api_documentation WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Documentation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete documentation'
    });
  }
};

// ============================================================================
// API CHANGELOG
// ============================================================================

// Get changelog entries
exports.getChangelog = async (req, res) => {
  try {
    const { version, type, is_breaking, limit = 20, page = 1 } = req.query;

    let whereClause = 'WHERE is_published = true';
    const values = [];
    let paramCount = 1;

    if (version) {
      whereClause += ` AND version = $${paramCount++}`;
      values.push(version);
    }
    if (type) {
      whereClause += ` AND type = $${paramCount++}`;
      values.push(type);
    }
    if (is_breaking !== undefined) {
      whereClause += ` AND is_breaking = $${paramCount++}`;
      values.push(is_breaking === 'true');
    }

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await db.query(
      `SELECT * FROM api_changelog
       ${whereClause}
       ORDER BY release_date DESC, version DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM api_changelog ${whereClause}`,
      values.slice(0, -2)
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching changelog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch changelog'
    });
  }
};

// Get changelog entry by version
exports.getChangelogByVersion = async (req, res) => {
  try {
    const { version } = req.params;

    const result = await db.query(
      'SELECT * FROM api_changelog WHERE version = $1 AND is_published = true',
      [version]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Changelog entry not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching changelog entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch changelog entry'
    });
  }
};

// Create changelog entry (Super Admin only)
exports.createChangelogEntry = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const {
      version,
      release_date,
      type,
      title,
      description,
      changes,
      is_published = true,
      is_breaking = false
    } = req.body;

    // Validate required fields
    if (!version || !release_date || !type || !title || !description || !changes) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Insert changelog entry
    const result = await db.query(
      `INSERT INTO api_changelog 
       (version, release_date, type, title, description, changes, is_published, is_breaking)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [version, release_date, type, title, description, JSON.stringify(changes), is_published, is_breaking]
    );

    res.status(201).json({
      success: true,
      message: 'Changelog entry created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating changelog entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create changelog entry'
    });
  }
};

// Update changelog entry (Super Admin only)
exports.updateChangelogEntry = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { id } = req.params;
    const { version, release_date, type, title, description, changes, is_published, is_breaking } = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (version !== undefined) {
      updates.push(`version = $${paramCount++}`);
      values.push(version);
    }
    if (release_date !== undefined) {
      updates.push(`release_date = $${paramCount++}`);
      values.push(release_date);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (changes !== undefined) {
      updates.push(`changes = $${paramCount++}`);
      values.push(JSON.stringify(changes));
    }
    if (is_published !== undefined) {
      updates.push(`is_published = $${paramCount++}`);
      values.push(is_published);
    }
    if (is_breaking !== undefined) {
      updates.push(`is_breaking = $${paramCount++}`);
      values.push(is_breaking);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE api_changelog 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Changelog entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Changelog entry updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating changelog entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update changelog entry'
    });
  }
};

// Delete changelog entry (Super Admin only)
exports.deleteChangelogEntry = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { id } = req.params;

    await db.query('DELETE FROM api_changelog WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Changelog entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting changelog entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete changelog entry'
    });
  }
};

module.exports = exports;
