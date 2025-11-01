const { pool } = require('./config/db');

async function initializeSQLiteTables() {
  try {
    console.log('Initializing SQLite tables...');
    
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
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        tenant_id TEXT,
        is_active BOOLEAN DEFAULT 1,
        reset_token TEXT,
        reset_token_expiry DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    
    console.log('✓ SQLite tables initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize SQLite tables:', error);
    process.exit(1);
  }
}

initializeSQLiteTables();