const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Use SQLite for development to avoid PostgreSQL setup issues
const db = new sqlite3.Database('./dev-database.sqlite');

// Mock the pg pool interface for SQLite
const pool = {
  query: (text, params) => {
    return new Promise((resolve, reject) => {
      // Convert PostgreSQL queries to SQLite format
      let sqliteQuery = text
        .replace(/\$(\d+)/g, '?')
        .replace(/NOW\(\)/g, "datetime('now')")
        .replace(/RETURNING \*/g, '');
      
      db.all(sqliteQuery, params || [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows, rowCount: rows.length });
        }
      });
    });
  },
  connect: () => {
    return Promise.resolve({
      query: pool.query,
      release: () => {}
    });
  }
};

console.log('✓ Using SQLite database for development');

module.exports = { pool };
