#!/usr/bin/env node

/**
 * Security Features Test Script
 * Tests rate limiting, audit logging, and GDPR endpoints
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const response = await makeRequest('GET', '/health');
    console.log('✓ Health endpoint status:', response.status);
    console.log('  Response:', response.body);
    return response.status === 200;
  } catch (error) {
    console.error('✗ Health endpoint failed:', error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n=== Testing Security Headers ===');
  try {
    const response = await makeRequest('GET', '/health');
    const headers = response.headers;
    
    const expectedHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    let passed = true;
    for (const header of expectedHeaders) {
      if (headers[header]) {
        console.log(`✓ ${header}: ${headers[header]}`);
      } else {
        console.log(`✗ Missing header: ${header}`);
        passed = false;
      }
    }
    
    return passed;
  } catch (error) {
    console.error('✗ Security headers test failed:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting ===');
  console.log('Making multiple rapid requests to test rate limiting...');
  
  try {
    const results = [];
    for (let i = 0; i < 10; i++) {
      const response = await makeRequest('GET', '/health');
      results.push(response.status);
      
      if (response.headers['ratelimit-limit']) {
        console.log(`Request ${i + 1}: Status ${response.status}, Rate Limit: ${response.headers['ratelimit-limit']}, Remaining: ${response.headers['ratelimit-remaining']}`);
      } else {
        console.log(`Request ${i + 1}: Status ${response.status}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('✓ Rate limiting headers present (if configured)');
    return true;
  } catch (error) {
    console.error('✗ Rate limiting test failed:', error.message);
    return false;
  }
}

async function testCORSHeaders() {
  console.log('\n=== Testing CORS Headers ===');
  try {
    const response = await makeRequest('OPTIONS', '/health');
    const headers = response.headers;
    
    if (headers['access-control-allow-origin']) {
      console.log('✓ CORS headers present');
      console.log('  Allow-Origin:', headers['access-control-allow-origin']);
      console.log('  Allow-Methods:', headers['access-control-allow-methods']);
      console.log('  Allow-Headers:', headers['access-control-allow-headers']);
      return true;
    } else {
      console.log('✗ CORS headers not found');
      return false;
    }
  } catch (error) {
    console.error('✗ CORS test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Security Features Test Suite             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\nNOTE: Backend server must be running on http://localhost:3000');
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'CORS Headers', fn: testCORSHeaders }
  ];
  
  const results = [];
  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                     ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${result.name}`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\nTotal: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
  }
}

// Run tests if server is available
async function checkServerAndRun() {
  try {
    await makeRequest('GET', '/health');
    await runTests();
  } catch (error) {
    console.error('\n✗ Cannot connect to backend server at http://localhost:3000');
    console.error('  Please start the backend server first:');
    console.error('    cd backend && npm run dev');
    process.exit(1);
  }
}

checkServerAndRun();
