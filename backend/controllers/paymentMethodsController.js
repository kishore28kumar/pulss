const db = require('../config/db');

/**
 * Saved Payment Methods Controller
 * Handles storing and managing customer payment methods
 */

// Get saved payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const methods = await db.query(
      `SELECT id, user_id, payment_type, card_last4, card_brand, 
              upi_id, is_default, nickname, created_at, updated_at
       FROM saved_payment_methods 
       WHERE user_id = $1 AND is_active = true
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: methods.rows
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment methods' 
    });
  }
};

// Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      payment_type, 
      card_last4, 
      card_brand, 
      upi_id, 
      nickname, 
      is_default = false 
    } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        `UPDATE saved_payment_methods SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await db.query(
      `INSERT INTO saved_payment_methods 
       (user_id, payment_type, card_last4, card_brand, upi_id, nickname, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, user_id, payment_type, card_last4, card_brand, upi_id, nickname, is_default, created_at`,
      [userId, payment_type, card_last4, card_brand, upi_id, nickname, is_default]
    );

    res.json({
      success: true,
      message: 'Payment method added',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add payment method' 
    });
  }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { nickname, is_default } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        `UPDATE saved_payment_methods SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await db.query(
      `UPDATE saved_payment_methods 
       SET nickname = COALESCE($1, nickname), 
           is_default = COALESCE($2, is_default),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [nickname, is_default, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment method updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payment method' 
    });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `UPDATE saved_payment_methods 
       SET is_active = false, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Payment method deleted'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete payment method' 
    });
  }
};

// Get order history for reorder
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { limit = 10 } = req.query;

    const orders = await db.query(
      `SELECT o.id, o.created_at, o.total_amount, o.status,
              json_agg(
                json_build_object(
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'name', p.name,
                  'image_url', p.image_url
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE (o.customer_id = $1 OR o.guest_info->>'user_id' = $1)
       AND o.tenant_id = $2
       AND o.status = 'delivered'
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $3`,
      [userId, tenantId, limit]
    );

    res.json({
      success: true,
      data: orders.rows
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order history' 
    });
  }
};

// Reorder (one-click reorder)
exports.reorder = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { order_id } = req.body;

    // Get original order items
    const originalOrder = await db.query(
      `SELECT oi.product_id, oi.quantity, p.active
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.id = $1 
       AND (o.customer_id = $2 OR o.guest_info->>'user_id' = $2)
       AND o.tenant_id = $3`,
      [order_id, userId, tenantId]
    );

    if (originalOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get or create cart
    let cart = await db.query(
      `SELECT id FROM carts WHERE user_id = $1 AND tenant_id = $2 AND status = 'active'`,
      [userId, tenantId]
    );

    let cartId;
    if (cart.rows.length === 0) {
      const newCart = await db.query(
        `INSERT INTO carts (user_id, tenant_id) VALUES ($1, $2) RETURNING id`,
        [userId, tenantId]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cart.rows[0].id;
    }

    // Add items to cart (only active products)
    let addedCount = 0;
    let skippedCount = 0;

    for (const item of originalOrder.rows) {
      if (!item.active) {
        skippedCount++;
        continue;
      }

      // Check if already in cart
      const existing = await db.query(
        `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, item.product_id]
      );

      if (existing.rows.length > 0) {
        // Update quantity
        await db.query(
          `UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
          [item.quantity, existing.rows[0].id]
        );
      } else {
        // Add new item
        await db.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
          [cartId, item.product_id, item.quantity]
        );
      }
      addedCount++;
    }

    res.json({
      success: true,
      message: `${addedCount} items added to cart${skippedCount > 0 ? `, ${skippedCount} unavailable items skipped` : ''}`,
      data: {
        added: addedCount,
        skipped: skippedCount
      }
    });
  } catch (error) {
    console.error('Error reordering:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reorder' 
    });
  }
};
