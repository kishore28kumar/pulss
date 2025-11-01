const db = require('../config/db');

/**
 * Cart Controller
 * Handles persistent cart, cart sync across devices
 */

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;

    const cart = await db.query(
      `SELECT c.*, 
              ci.id as item_id, ci.product_id, ci.quantity, ci.added_at,
              p.name, p.description, p.selling_price, p.mrp, p.image_url, 
              p.requires_prescription, p.brand, p.pack_size, p.active
       FROM carts c
       LEFT JOIN cart_items ci ON c.id = ci.cart_id
       LEFT JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1 AND c.tenant_id = $2 AND c.status = 'active'
       ORDER BY ci.added_at DESC`,
      [userId, tenantId]
    );

    const cartData = cart.rows.length > 0 ? {
      id: cart.rows[0].id,
      user_id: cart.rows[0].user_id,
      tenant_id: cart.rows[0].tenant_id,
      created_at: cart.rows[0].created_at,
      updated_at: cart.rows[0].updated_at,
      items: cart.rows
        .filter(row => row.item_id)
        .map(row => ({
          id: row.item_id,
          product_id: row.product_id,
          quantity: row.quantity,
          added_at: row.added_at,
          product: {
            id: row.product_id,
            name: row.name,
            description: row.description,
            selling_price: row.selling_price,
            mrp: row.mrp,
            image_url: row.image_url,
            requires_prescription: row.requires_prescription,
            brand: row.brand,
            pack_size: row.pack_size,
            active: row.active
          }
        }))
    } : { items: [] };

    res.json({
      success: true,
      data: cartData
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cart' 
    });
  }
};

// Add item to cart
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { product_id, quantity = 1 } = req.body;

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

    // Check if item already in cart
    const existing = await db.query(
      `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cartId, product_id]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      const newQuantity = existing.rows[0].quantity + quantity;
      await db.query(
        `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
        [newQuantity, existing.rows[0].id]
      );
    } else {
      // Add new item
      await db.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [cartId, product_id, quantity]
      );
    }

    // Update cart timestamp
    await db.query(
      `UPDATE carts SET updated_at = NOW() WHERE id = $1`,
      [cartId]
    );

    res.json({
      success: true,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add item to cart' 
    });
  }
};

// Update cart item quantity
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Verify the item belongs to the user's cart
    const result = await db.query(
      `UPDATE cart_items ci
       SET quantity = $1, updated_at = NOW()
       FROM carts c
       WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $3
       RETURNING ci.*`,
      [quantity, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Cart item updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cart item' 
    });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.user_id = $2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove cart item' 
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;

    await db.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.cart_id = c.id AND c.user_id = $1 AND c.tenant_id = $2`,
      [userId, tenantId]
    );

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear cart' 
    });
  }
};

// Sync cart (merge guest cart with user cart on login)
exports.syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id;
    const { items } = req.body; // Array of {product_id, quantity}

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart items'
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

    // Merge items
    for (const item of items) {
      const existing = await db.query(
        `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, item.product_id]
      );

      if (existing.rows.length > 0) {
        // Update quantity (take max of both)
        const newQuantity = Math.max(existing.rows[0].quantity, item.quantity);
        await db.query(
          `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
          [newQuantity, existing.rows[0].id]
        );
      } else {
        // Add new item
        await db.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
          [cartId, item.product_id, item.quantity]
        );
      }
    }

    res.json({
      success: true,
      message: 'Cart synced successfully'
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync cart' 
    });
  }
};
