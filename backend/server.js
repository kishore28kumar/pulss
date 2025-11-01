const app = require('./app');
const { pool } = require('./config/db');
const { connectMongoDB, disconnectMongoDB } = require('./config/mongodb');
const notificationWebSocket = require('./services/notificationWebSocket');
const path = require('path');
const fs = require('fs');
const express = require('express');

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    // Connect to MongoDB for branding features
    await connectMongoDB();
    
    // Test database connection with fallback
    try {
      await pool.query('SELECT NOW()');
      console.log('✓ Database connection established');
    } catch (dbError) {
      console.warn('⚠ PostgreSQL connection failed, using SQLite fallback');
      // Initialize basic tables for SQLite development
      await initializeSQLiteTables();
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });

    // Serve frontend production build (if present)
    try {
      const distPath = path.join(__dirname, '..', 'frontend', 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath, { index: false }));

        // Fallback to index.html for client-side routing, but avoid API and WS routes
        app.get('*', (req, res, next) => {
          const url = req.path || '';
          if (url.startsWith('/api') || url.startsWith('/health') || url.startsWith('/ws')) return next();
          res.sendFile(path.join(distPath, 'index.html'));
        });

        console.log('✓ Serving frontend from', distPath);
      }
    } catch (serveErr) {
      console.warn('⚠ Could not enable static frontend serving:', serveErr.message);
    }

    // Initialize WebSocket for real-time notifications (optional)
    try {
      notificationWebSocket.initialize(server);
      console.log(`✓ WebSocket available at ws://localhost:${PORT}/ws/notifications`);
    } catch (error) {
      console.log('⚠ WebSocket not initialized (optional feature)');
    }
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Initialize basic tables for SQLite development
async function initializeSQLiteTables() {
  try {
    // Create basic tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        tenant_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        business_type TEXT,
        theme_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_admin_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        tenant_id TEXT,
        setup_code TEXT,
        must_change_password BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        tenant_id TEXT PRIMARY KEY,
        wallet_enabled BOOLEAN DEFAULT 0,
        loyalty_enabled BOOLEAN DEFAULT 0,
        prescription_required BOOLEAN DEFAULT 0,
        multi_warehouse BOOLEAN DEFAULT 0,
        tracking_enabled BOOLEAN DEFAULT 0,
        whatsapp_notifications BOOLEAN DEFAULT 0,
        push_notifications BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        customer_id TEXT,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ SQLite tables initialized');
  } catch (error) {
    console.error('Failed to initialize SQLite tables:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectMongoDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectMongoDB();
  process.exit(0);
});

startServer();
