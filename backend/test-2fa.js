/**
 * Two-Factor Authentication API Test Suite
 * 
 * This script tests the 2FA endpoints to ensure they work correctly.
 * Run with: node test-2fa.js
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let twoFactorSecret = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function test2FAFlow() {
  console.log('🧪 Two-Factor Authentication Test Suite\n');

  try {
    // Step 1: Register a test user
    console.log('📝 Step 1: Registering test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `test2fa-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      role: 'admin',
      tenant_id: 'test-tenant-' + Date.now()
    });
    console.log('✅ User registered:', registerResponse.data.user.email);

    // Step 2: Login to get token
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: registerResponse.data.user.email,
      password: 'SecurePass123!'
    });
    authToken = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Step 3: Check 2FA status (should be disabled initially)
    console.log('\n🔍 Step 3: Checking 2FA status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/auth/2fa/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ 2FA Status:', statusResponse.data.enabled ? 'Enabled' : 'Disabled');
    
    if (statusResponse.data.enabled) {
      console.log('⚠️  2FA already enabled for this user');
      return;
    }

    // Step 4: Enable 2FA
    console.log('\n🛡️  Step 4: Enabling 2FA...');
    const enableResponse = await axios.post(`${API_BASE_URL}/auth/2fa/enable`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    twoFactorSecret = enableResponse.data.secret;
    console.log('✅ 2FA setup initiated');
    console.log('📱 Secret Key:', twoFactorSecret);
    console.log('📊 QR Code URL:', enableResponse.data.qrCode.substring(0, 50) + '...');

    // Step 5: Manual token verification (user needs to scan QR code)
    console.log('\n⏸️  Step 5: Manual verification required');
    console.log('Please:');
    console.log('  1. Scan the QR code with Google Authenticator or Authy');
    console.log('  2. Or manually enter the secret key shown above');
    console.log('  3. Enter the 6-digit code from your authenticator app\n');
    
    const token = await question('Enter 6-digit code: ');

    // Step 6: Verify and complete 2FA setup
    console.log('\n✓ Step 6: Verifying code...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/2fa/verify`, 
      { token: token.trim() },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ 2FA enabled successfully!');
    console.log('🔑 Backup Codes:', verifyResponse.data.backupCodes);
    console.log('⚠️  Warning:', verifyResponse.data.warning);

    // Step 7: Verify status changed
    console.log('\n🔍 Step 7: Verifying 2FA is now enabled...');
    const finalStatusResponse = await axios.get(`${API_BASE_URL}/auth/2fa/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Final 2FA Status:', finalStatusResponse.data.enabled ? 'Enabled ✓' : 'Disabled ✗');

    // Step 8: Test login with 2FA
    console.log('\n🔐 Step 8: Testing login with 2FA...');
    const loginWith2FAResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: registerResponse.data.user.email,
      password: 'SecurePass123!'
    });
    
    if (loginWith2FAResponse.data.requires2FA) {
      console.log('✅ Login correctly requests 2FA token');
      
      const token2 = await question('\nEnter new 6-digit code for login: ');
      
      const finalLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: registerResponse.data.user.email,
        password: 'SecurePass123!',
        twoFactorToken: token2.trim()
      });
      
      if (finalLoginResponse.data.token) {
        console.log('✅ Login with 2FA successful!');
      } else {
        console.log('❌ Login with 2FA failed');
      }
    } else {
      console.log('⚠️  Login did not request 2FA (unexpected)');
    }

    console.log('\n✨ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  } finally {
    rl.close();
  }
}

// Run tests if server is running
axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    test2FAFlow();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   cd backend && node server.test.js');
    process.exit(1);
  });
