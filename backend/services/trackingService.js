/**
 * Tracking Service
 * Handles real-time delivery/order tracking with GPS and status updates
 */

const db = require('../config/db');
const notificationService = require('./notificationService');
const messagingService = require('./messagingService');

class TrackingService {
  /**
   * Update order location (GPS tracking)
   */
  async updateOrderLocation(orderId, latitude, longitude, accuracy = null) {
    try {
      const { rows } = await db.query(
        `INSERT INTO order_tracking_locations (order_id, latitude, longitude, accuracy, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING tracking_location_id`,
        [orderId, latitude, longitude, accuracy]
      );

      // Get order details for notifications
      const { rows: orderRows } = await db.query(
        `SELECT customer_id, tenant_id FROM orders WHERE order_id = $1`,
        [orderId]
      );

      if (orderRows.length > 0) {
        const { customer_id, tenant_id } = orderRows[0];
        
        // Send real-time notification about location update
        await notificationService.sendNotification({
          tenantId: tenant_id,
          customerId: customer_id,
          notification: {
            type: 'location_update',
            title: 'Delivery Update',
            message: 'Your delivery location has been updated',
            data: { orderId, latitude, longitude },
            priority: 'low',
          },
        });
      }

      return { success: true, trackingLocationId: rows[0].tracking_location_id };
    } catch (error) {
      console.error('Update order location error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order location history
   */
  async getOrderLocationHistory(orderId) {
    try {
      const { rows } = await db.query(
        `SELECT 
           tracking_location_id,
           latitude,
           longitude,
           accuracy,
           recorded_at
         FROM order_tracking_locations
         WHERE order_id = $1
         ORDER BY recorded_at ASC`,
        [orderId]
      );

      return { success: true, locations: rows };
    } catch (error) {
      console.error('Get order location history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update order status with timeline
   */
  async updateOrderStatus(orderId, status, notes = null, updatedBy = null) {
    try {
      // Update order status
      await db.query(
        `UPDATE orders 
         SET status = $1, updated_at = NOW()
         WHERE order_id = $2`,
        [status, orderId]
      );

      // Add to status history
      const { rows } = await db.query(
        `INSERT INTO order_status_history (order_id, status, notes, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING status_history_id`,
        [orderId, status, notes, updatedBy]
      );

      // Get order details
      const { rows: orderRows } = await db.query(
        `SELECT o.customer_id, o.tenant_id, c.phone, c.name
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (orderRows.length > 0) {
        const { customer_id, tenant_id, phone, name } = orderRows[0];
        
        // Send push notification
        await notificationService.sendOrderUpdateNotification(
          orderId,
          status,
          customer_id,
          tenant_id
        );

        // Send SMS/WhatsApp notification
        if (phone) {
          await messagingService.sendOrderStatusUpdate(orderId, phone, status, 'whatsapp');
        }
      }

      return { success: true, statusHistoryId: rows[0].status_history_id };
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order status timeline
   */
  async getOrderTimeline(orderId) {
    try {
      const { rows } = await db.query(
        `SELECT 
           status_history_id,
           status,
           notes,
           updated_by,
           updated_at
         FROM order_status_history
         WHERE order_id = $1
         ORDER BY updated_at ASC`,
        [orderId]
      );

      return { success: true, timeline: rows };
    } catch (error) {
      console.error('Get order timeline error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive order tracking data
   */
  async getOrderTracking(orderId) {
    try {
      // Get order details
      const { rows: orderRows } = await db.query(
        `SELECT 
           o.order_id,
           o.status,
           o.total_amount,
           o.created_at,
           o.updated_at,
           c.name as customer_name,
           c.phone as customer_phone,
           c.email as customer_email
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (orderRows.length === 0) {
        return { success: false, error: 'Order not found' };
      }

      // Get timeline and location history
      const [timelineResult, locationResult] = await Promise.all([
        this.getOrderTimeline(orderId),
        this.getOrderLocationHistory(orderId),
      ]);

      return {
        success: true,
        order: orderRows[0],
        timeline: timelineResult.timeline || [],
        locations: locationResult.locations || [],
      };
    } catch (error) {
      console.error('Get order tracking error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get estimated delivery time
   */
  async getEstimatedDeliveryTime(orderId) {
    try {
      const { rows } = await db.query(
        `SELECT estimated_delivery_time, actual_delivery_time
         FROM orders
         WHERE order_id = $1`,
        [orderId]
      );

      if (rows.length === 0) {
        return { success: false, error: 'Order not found' };
      }

      return { success: true, ...rows[0] };
    } catch (error) {
      console.error('Get estimated delivery time error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update estimated delivery time
   */
  async updateEstimatedDeliveryTime(orderId, estimatedTime) {
    try {
      await db.query(
        `UPDATE orders 
         SET estimated_delivery_time = $1, updated_at = NOW()
         WHERE order_id = $2`,
        [estimatedTime, orderId]
      );

      // Notify customer
      const { rows: orderRows } = await db.query(
        `SELECT customer_id, tenant_id, phone FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (orderRows.length > 0) {
        const { customer_id, tenant_id, phone } = orderRows[0];
        
        await notificationService.sendNotification({
          tenantId: tenant_id,
          customerId: customer_id,
          notification: {
            type: 'eta_update',
            title: 'Delivery Time Updated',
            message: `Your order will arrive by ${new Date(estimatedTime).toLocaleString()}`,
            data: { orderId, estimatedTime },
            priority: 'medium',
          },
        });

        if (phone) {
          await messagingService.sendWhatsApp(
            phone,
            `Your order #${orderId} will arrive by ${new Date(estimatedTime).toLocaleString()}`
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Update estimated delivery time error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate tracking URL for order
   */
  generateTrackingUrl(orderId, baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
    return `${baseUrl}/track/${orderId}`;
  }

  /**
   * Get active deliveries (for delivery personnel)
   */
  async getActiveDeliveries(tenantId) {
    try {
      const { rows } = await db.query(
        `SELECT 
           o.order_id,
           o.status,
           o.created_at,
           o.estimated_delivery_time,
           c.name as customer_name,
           c.phone as customer_phone,
           c.email as customer_email,
           (SELECT COUNT(*) FROM order_tracking_locations WHERE order_id = o.order_id) as location_updates
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.tenant_id = $1
           AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery')
         ORDER BY o.created_at ASC`,
        [tenantId]
      );

      return { success: true, deliveries: rows };
    } catch (error) {
      console.error('Get active deliveries error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TrackingService();
