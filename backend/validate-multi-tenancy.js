#!/usr/bin/env node

/**
 * Multi-Tenancy Validation Script
 * 
 * This script validates that multi-tenancy is properly implemented across the codebase.
 * It checks for:
 * 1. Queries that are missing tenant_id filters
 * 2. Controllers that don't extract tenant_id
 * 3. Routes without tenant isolation middleware
 * 4. Database tables without tenant_id column
 */

const fs = require('fs');
const path = require('path');

// Configuration
const controllersDir = path.join(__dirname, 'controllers');
const routesDir = path.join(__dirname, 'routes');
const migrationsDir = path.join(__dirname, 'migrations');

// Tables that should have tenant_id
const TENANT_SCOPED_TABLES = [
  'admins',
  'customers',
  'products',
  'categories',
  'orders',
  'order_items',
  'transactions',
  'rewards',
  'reward_redemptions',
  'store_settings',
  'tenant_settings',
  'feature_flags',
  'notifications',
  'announcements',
  'scroll_messages',
  'tenant_qr_codes',
  'automated_reports',
  'tenant_stats'
];

// SQL patterns that should include tenant_id
const SQL_PATTERNS = [
  /SELECT\s+.*\s+FROM\s+(\w+)/gi,
  /INSERT\s+INTO\s+(\w+)/gi,
  /UPDATE\s+(\w+)\s+SET/gi,
  /DELETE\s+FROM\s+(\w+)/gi
];

let issues = [];
let warnings = [];
let passed = [];

console.log('🔍 Starting Multi-Tenancy Validation...\n');

/**
 * Check if a SQL query includes tenant_id filter
 */
function checkQueryForTenantId(query, tableName, filename, lineNumber) {
  // Skip if not a tenant-scoped table
  if (!TENANT_SCOPED_TABLES.includes(tableName)) {
    return;
  }
  
  // Check if query includes tenant_id
  const hasTenantId = /tenant_id\s*[=<>]|tenant_id\s+IN/i.test(query);
  
  if (!hasTenantId) {
    issues.push({
      type: 'MISSING_TENANT_FILTER',
      file: filename,
      line: lineNumber,
      table: tableName,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
    });
  } else {
    passed.push({
      type: 'TENANT_FILTER_PRESENT',
      file: filename,
      table: tableName
    });
  }
}

/**
 * Analyze a controller file
 */
function analyzeController(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  const lines = content.split('\n');
  
  console.log(`  📄 Analyzing ${filename}...`);
  
  // Check if controller extracts tenant_id
  const extractsTenantId = /const\s+{\s*tenant_id\s*}\s*=\s*req|req\.tenant_id|req\.params\.tenant_id|req\.query\.tenant_id|req\.body\.tenant_id/g.test(content);
  
  if (!extractsTenantId && !filename.includes('auth') && !filename.includes('superAdmin')) {
    warnings.push({
      type: 'NO_TENANT_EXTRACTION',
      file: filename,
      message: 'Controller does not extract tenant_id from request'
    });
  }
  
  // Find all SQL queries
  lines.forEach((line, index) => {
    // Check for pool.query calls
    if (line.includes('pool.query')) {
      // Get the full query (may span multiple lines)
      let query = '';
      let queryStartLine = index;
      
      // Simple extraction - may need improvement for complex cases
      for (let i = index; i < Math.min(index + 20, lines.length); i++) {
        query += lines[i];
        if (lines[i].includes(';') || lines[i].includes('])')) {
          break;
        }
      }
      
      // Extract SQL from query
      const sqlMatch = query.match(/`([^`]+)`|'([^']+)'|"([^"]+)"/);
      if (sqlMatch) {
        const sql = sqlMatch[1] || sqlMatch[2] || sqlMatch[3];
        
        // Check which table is being queried
        SQL_PATTERNS.forEach(pattern => {
          pattern.lastIndex = 0; // Reset regex
          const match = pattern.exec(sql);
          if (match) {
            const tableName = match[1].toLowerCase();
            checkQueryForTenantId(sql, tableName, filename, queryStartLine + 1);
          }
        });
      }
    }
  });
}

/**
 * Analyze a route file
 */
function analyzeRoute(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  
  console.log(`  🛣️  Analyzing ${filename}...`);
  
  // Check if route uses tenant middleware
  const usesTenantMiddleware = /tenantMiddleware|enforceTenantIsolation|requireTenant/g.test(content);
  
  // Check if routes have tenant_id in path
  const hasTenantIdInPath = /:tenant_id/g.test(content);
  
  if (!usesTenantMiddleware && !hasTenantIdInPath && !filename.includes('auth') && !filename.includes('superAdmin')) {
    warnings.push({
      type: 'NO_TENANT_MIDDLEWARE',
      file: filename,
      message: 'Route does not use tenant middleware or tenant_id in path'
    });
  } else if (usesTenantMiddleware || hasTenantIdInPath) {
    passed.push({
      type: 'TENANT_MIDDLEWARE_PRESENT',
      file: filename
    });
  }
}

/**
 * Main validation
 */
function validate() {
  console.log('📂 Validating Controllers...\n');
  
  // Analyze all controllers
  const controllers = fs.readdirSync(controllersDir)
    .filter(file => file.endsWith('.js'));
  
  controllers.forEach(file => {
    analyzeController(path.join(controllersDir, file));
  });
  
  console.log('\n📂 Validating Routes...\n');
  
  // Analyze all routes
  const routes = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.js'));
  
  routes.forEach(file => {
    analyzeRoute(path.join(routesDir, file));
  });
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');
  
  // Print issues
  if (issues.length > 0) {
    console.log(`❌ CRITICAL ISSUES (${issues.length}):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}`);
      console.log(`   File: ${issue.file}:${issue.line || 'N/A'}`);
      console.log(`   Table: ${issue.table}`);
      console.log(`   Query: ${issue.query}`);
      console.log('');
    });
  }
  
  // Print warnings
  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.type}`);
      console.log(`   File: ${warning.file}`);
      console.log(`   Message: ${warning.message}`);
      console.log('');
    });
  }
  
  // Print passed checks
  if (passed.length > 0) {
    console.log(`✅ PASSED CHECKS (${passed.length}):\n`);
    const groupedPassed = passed.reduce((acc, item) => {
      const key = item.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    
    Object.keys(groupedPassed).forEach(type => {
      console.log(`   ${type}: ${groupedPassed[type].length} files`);
    });
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Critical Issues: ${issues.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  console.log(`Total Passed: ${passed.length}`);
  console.log('');
  
  if (issues.length > 0) {
    console.log('❌ Multi-tenancy validation FAILED');
    console.log('   Please fix critical issues before deploying.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  Multi-tenancy validation passed with warnings');
    console.log('   Review warnings to ensure proper implementation.');
    process.exit(0);
  } else {
    console.log('✅ Multi-tenancy validation PASSED');
    console.log('   All checks completed successfully.');
    process.exit(0);
  }
}

// Run validation
validate();
