/**
 * Notification WebSocket Service
 * Provides real-time notification delivery via WebSocket connections
 */

class NotificationWebSocketService {
  constructor() {
    this.connections = new Map(); // userId -> Set of WebSocket connections
    this.wss = null;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    // Only import ws when we need it (optional dependency)
    try {
      const WebSocket = require('ws');
      this.wss = new WebSocket.Server({ 
        server,
        path: '/ws/notifications'
      });

      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      console.log('✓ WebSocket server initialized for notifications');
    } catch (error) {
      console.log('⚠ WebSocket not available (install ws package for real-time notifications)');
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    // Extract user ID from query string or token
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify token and get user ID
    const userId = this.verifyToken(token);
    if (!userId) {
      ws.close(1008, 'Invalid token');
      return;
    }

    // Add connection to map
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(ws);

    console.log(`WebSocket connected for user ${userId}`);

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(userId, data, ws);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.connections.delete(userId);
        }
      }
      console.log(`WebSocket disconnected for user ${userId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send welcome message
    this.sendToConnection(ws, {
      type: 'connected',
      message: 'Real-time notifications active'
    });
  }

  /**
   * Verify JWT token and extract user ID
   */
  verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.adminId || decoded.customerId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle message from client
   */
  handleMessage(userId, data, ws) {
    switch (data.type) {
      case 'ping':
        this.sendToConnection(ws, { type: 'pong' });
        break;
      
      case 'mark_read':
        // Client wants to mark notification as read
        // This could trigger a database update
        break;
      
      case 'subscribe':
        // Client wants to subscribe to specific notification types
        break;
      
      default:
        console.log(`Unknown message type: ${data.type}`);
    }
  }

  /**
   * Send message to a specific WebSocket connection
   */
  sendToConnection(ws, data) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send notification to user in real-time
   */
  notifyUser(userId, notification) {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      // User not connected, notification will be polled
      return false;
    }

    const message = {
      type: 'notification',
      data: notification
    };

    let sent = false;
    userConnections.forEach(ws => {
      this.sendToConnection(ws, message);
      sent = true;
    });

    return sent;
  }

  /**
   * Broadcast to all connected users of a tenant
   */
  broadcastToTenant(tenantId, notification) {
    // This would require tracking tenant-user relationships
    // For now, we'll implement a simple version
    let count = 0;
    
    this.connections.forEach((userConnections, userId) => {
      // In a real implementation, you'd check if user belongs to tenant
      userConnections.forEach(ws => {
        this.sendToConnection(ws, {
          type: 'notification',
          data: notification
        });
        count++;
      });
    });

    return count;
  }

  /**
   * Send unread count update
   */
  notifyUnreadCount(userId, count) {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections) {
      return false;
    }

    const message = {
      type: 'unread_count',
      count: count
    };

    userConnections.forEach(ws => {
      this.sendToConnection(ws, message);
    });

    return true;
  }

  /**
   * Get connected users count
   */
  getConnectionCount() {
    return this.connections.size;
  }

  /**
   * Get total WebSocket connections
   */
  getTotalConnections() {
    let total = 0;
    this.connections.forEach(userConnections => {
      total += userConnections.size;
    });
    return total;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    const userConnections = this.connections.get(userId);
    return userConnections && userConnections.size > 0;
  }

  /**
   * Disconnect user (admin action)
   */
  disconnectUser(userId, reason = 'Disconnected by admin') {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections) {
      return false;
    }

    userConnections.forEach(ws => {
      ws.close(1000, reason);
    });

    this.connections.delete(userId);
    return true;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalUsers: this.connections.size,
      totalConnections: this.getTotalConnections(),
      userConnections: []
    };

    this.connections.forEach((userConnections, userId) => {
      stats.userConnections.push({
        userId,
        connectionCount: userConnections.size
      });
    });

    return stats;
  }
}

// Export singleton instance
module.exports = new NotificationWebSocketService();
