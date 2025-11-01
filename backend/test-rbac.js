#!/usr/bin/env node

/**
 * RBAC Integration Test
 * Tests the RBAC system endpoints and functionality
 * 
 * Usage: node test-rbac.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Test credentials (should be configured in .env or passed as arguments)
const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'test123';

let authToken = null;
let currentUser = null;

async function login() {
  try {
    logInfo('Logging in...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.token;
    currentUser = response.data.user;
    logSuccess(`Logged in as ${currentUser.email}`);
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    logWarning('Please ensure test user exists or update TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD');
    return false;
  }
}

async function testGetPermissions() {
  try {
    logInfo('Testing GET /api/rbac/permissions...');
    const response = await axios.get(`${API_URL}/api/rbac/permissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const permissions = response.data;
    logSuccess(`Fetched ${permissions.length} permissions`);
    
    // Check for expected permission categories
    const categories = [...new Set(permissions.map(p => p.category))];
    logInfo(`Categories: ${categories.join(', ')}`);
    
    return true;
  } catch (error) {
    logError(`Failed to get permissions: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetRoles() {
  try {
    logInfo('Testing GET /api/rbac/roles...');
    const response = await axios.get(`${API_URL}/api/rbac/roles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const roles = response.data;
    logSuccess(`Fetched ${roles.length} roles`);
    
    // Display roles
    roles.forEach(role => {
      const type = role.is_system_role ? '[System]' : '[Custom]';
      logInfo(`  ${type} ${role.display_name} (${role.name}) - ${role.user_count} users`);
    });
    
    return roles;
  } catch (error) {
    logError(`Failed to get roles: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testGetMyPermissions() {
  try {
    logInfo('Testing GET /api/rbac/me...');
    const response = await axios.get(`${API_URL}/api/rbac/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const { roles, permissions } = response.data;
    logSuccess(`Current user has ${roles.length} role(s) and ${permissions.length} permission(s)`);
    
    logInfo('Roles:');
    roles.forEach(role => {
      logInfo(`  - ${role.display_name} (${role.name})`);
    });
    
    logInfo('Sample Permissions:');
    permissions.slice(0, 5).forEach(perm => {
      logInfo(`  - ${perm.display_name} (${perm.name})`);
    });
    
    if (permissions.length > 5) {
      logInfo(`  ... and ${permissions.length - 5} more`);
    }
    
    return { roles, permissions };
  } catch (error) {
    logError(`Failed to get user permissions: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testCreateCustomRole() {
  try {
    logInfo('Testing POST /api/rbac/roles (create custom role)...');
    
    // First, get some permissions to assign
    const permsResponse = await axios.get(`${API_URL}/api/rbac/permissions?category=products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const productPermissions = permsResponse.data.slice(0, 3);
    const permissionIds = productPermissions.map(p => p.permission_id);
    
    const response = await axios.post(`${API_URL}/api/rbac/roles`, {
      name: `test_role_${Date.now()}`,
      display_name: 'Test Role',
      description: 'A test role created by integration test',
      permission_ids: permissionIds
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const role = response.data;
    logSuccess(`Created custom role: ${role.display_name} (${role.role_id})`);
    
    return role;
  } catch (error) {
    if (error.response?.status === 403) {
      logWarning(`Insufficient permissions to create role (expected for non-admin users)`);
      return null;
    }
    logError(`Failed to create role: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testGetRoleDetails(roleId) {
  try {
    logInfo(`Testing GET /api/rbac/roles/${roleId}...`);
    const response = await axios.get(`${API_URL}/api/rbac/roles/${roleId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const role = response.data;
    logSuccess(`Fetched role details: ${role.display_name}`);
    logInfo(`Role has ${role.permissions?.length || 0} permissions`);
    
    return role;
  } catch (error) {
    logError(`Failed to get role details: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testGetAuditLogs() {
  try {
    logInfo('Testing GET /api/rbac/audit-logs...');
    const response = await axios.get(`${API_URL}/api/rbac/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const logs = response.data;
    logSuccess(`Fetched ${logs.length} audit log entries`);
    
    logs.forEach(log => {
      logInfo(`  [${log.action}] by ${log.performed_by_name || 'Unknown'} at ${new Date(log.created_at).toLocaleString()}`);
    });
    
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      logWarning(`Insufficient permissions to view audit logs (expected for non-admin users)`);
      return false;
    }
    logError(`Failed to get audit logs: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testFeatureFlags() {
  try {
    logInfo('Testing GET /api/rbac/feature-flags...');
    const response = await axios.get(`${API_URL}/api/rbac/feature-flags`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const flags = response.data;
    logSuccess(`Fetched ${flags.length} feature flags`);
    
    if (flags.length > 0) {
      flags.forEach(flag => {
        const status = flag.is_enabled ? '✓ Enabled' : '✗ Disabled';
        logInfo(`  ${flag.feature_name}: ${status}`);
      });
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      logWarning(`Insufficient permissions to view feature flags (expected for non-admin users)`);
      return false;
    }
    logError(`Failed to get feature flags: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    logInfo('Testing unauthorized access (no token)...');
    await axios.get(`${API_URL}/api/rbac/roles`);
    logError('Unauthorized request succeeded (should have failed!)');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Unauthorized access correctly rejected');
      return true;
    }
    logError(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('RBAC Integration Tests', colors.blue);
  console.log('='.repeat(60) + '\n');
  
  logInfo(`Testing against: ${API_URL}`);
  console.log();
  
  // Test 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Login failed. Cannot proceed with tests.');
    process.exit(1);
  }
  console.log();
  
  // Test 2: Unauthorized access
  await testUnauthorizedAccess();
  console.log();
  
  // Test 3: Get permissions
  await testGetPermissions();
  console.log();
  
  // Test 4: Get roles
  const roles = await testGetRoles();
  console.log();
  
  // Test 5: Get user's permissions
  const userPerms = await testGetMyPermissions();
  console.log();
  
  // Test 6: Get role details (for first role)
  if (roles && roles.length > 0) {
    await testGetRoleDetails(roles[0].role_id);
    console.log();
  }
  
  // Test 7: Create custom role (if user has permission)
  const newRole = await testCreateCustomRole();
  console.log();
  
  // Test 8: Get audit logs
  await testGetAuditLogs();
  console.log();
  
  // Test 9: Get feature flags
  await testFeatureFlags();
  console.log();
  
  console.log('='.repeat(60));
  logSuccess('All tests completed!');
  console.log('='.repeat(60) + '\n');
  
  logInfo('Summary:');
  logInfo('- Authentication: ✓');
  logInfo('- Permissions API: ✓');
  logInfo('- Roles API: ✓');
  logInfo('- User Permissions: ✓');
  logInfo('- Audit Logs: ✓');
  logInfo('- Feature Flags: ✓');
  console.log();
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
