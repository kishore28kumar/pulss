#!/bin/bash

# n8n Integration Test Script
# Tests the n8n integration without requiring a running n8n server

echo "================================================"
echo "Testing Pulss n8n Integration"
echo "================================================"
echo ""

cd backend

echo "1. Testing module loading..."
node -e "
const n8nService = require('./services/n8nService');
const webhookTrigger = require('./utils/webhookTrigger');
console.log('✓ n8n service loaded');
console.log('✓ Webhook trigger utilities loaded');
console.log('✓ Available events:', Object.keys(webhookTrigger.WEBHOOK_EVENTS).length);
"

if [ $? -eq 0 ]; then
  echo "✓ Module loading test passed"
else
  echo "✗ Module loading test failed"
  exit 1
fi

echo ""
echo "2. Testing n8n service methods..."
node -e "
const n8nService = require('./services/n8nService');

// Test disabled state (default)
const isEnabled = n8nService.isEnabled();
console.log('✓ isEnabled() returns:', isEnabled);

// Test health check with disabled state
n8nService.checkHealth().then(health => {
  console.log('✓ checkHealth() returns:', health.status);
  if (health.status !== 'disabled') {
    console.error('✗ Expected disabled status');
    process.exit(1);
  }
}).catch(err => {
  console.error('✗ Health check failed:', err.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
  echo "✓ n8n service methods test passed"
else
  echo "✗ n8n service methods test failed"
  exit 1
fi

sleep 1

echo ""
echo "3. Testing webhook trigger functions..."
node -e "
const { WEBHOOK_EVENTS, triggerWebhook } = require('./utils/webhookTrigger');

// Test that webhook events are defined
const eventCount = Object.keys(WEBHOOK_EVENTS).length;
if (eventCount < 10) {
  console.error('✗ Expected at least 10 webhook events, got', eventCount);
  process.exit(1);
}
console.log('✓ Found', eventCount, 'webhook events');

// Test event types
const requiredEvents = ['ORDER_PLACED', 'ORDER_ACCEPTED', 'CUSTOMER_REGISTERED'];
for (const event of requiredEvents) {
  if (!WEBHOOK_EVENTS[event]) {
    console.error('✗ Missing required event:', event);
    process.exit(1);
  }
}
console.log('✓ All required events are defined');
"

if [ $? -eq 0 ]; then
  echo "✓ Webhook trigger functions test passed"
else
  echo "✗ Webhook trigger functions test failed"
  exit 1
fi

echo ""
echo "4. Testing controller imports..."
node -c controllers/n8nController.js
if [ $? -eq 0 ]; then
  echo "✓ n8nController.js syntax is valid"
else
  echo "✗ n8nController.js has syntax errors"
  exit 1
fi

echo ""
echo "5. Testing routes..."
node -c routes/n8n.js
if [ $? -eq 0 ]; then
  echo "✓ n8n.js routes syntax is valid"
else
  echo "✗ n8n.js routes has syntax errors"
  exit 1
fi

echo ""
echo "6. Checking migration file..."
if [ -f migrations/10_create_n8n_tables.sql ]; then
  echo "✓ Migration file exists"
  
  # Check if migration contains required tables
  if grep -q "n8n_workflow_triggers" migrations/10_create_n8n_tables.sql && \
     grep -q "n8n_webhook_logs" migrations/10_create_n8n_tables.sql; then
    echo "✓ Migration contains required tables"
  else
    echo "✗ Migration is missing required tables"
    exit 1
  fi
else
  echo "✗ Migration file not found"
  exit 1
fi

echo ""
echo "7. Testing updated controllers..."
# Check if webhook triggers were added to orders controller
if grep -q "triggerOrderPlaced\|triggerOrderStatusChange" controllers/ordersController.js; then
  echo "✓ Orders controller has webhook triggers"
else
  echo "✗ Orders controller missing webhook triggers"
  exit 1
fi

# Check if webhook triggers were added to customers controller
if grep -q "triggerCustomerRegistered" controllers/customersController.js; then
  echo "✓ Customers controller has webhook triggers"
else
  echo "✗ Customers controller missing webhook triggers"
  exit 1
fi

echo ""
echo "8. Verifying .env.example..."
if grep -q "N8N_ENABLED" .env.example && \
   grep -q "N8N_WEBHOOK_URL" .env.example; then
  echo "✓ .env.example has n8n configuration"
else
  echo "✗ .env.example missing n8n configuration"
  exit 1
fi

echo ""
echo "================================================"
echo "All tests passed! ✓"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Run database migration: npm run migrate:local"
echo "2. Set N8N_ENABLED=true in .env"
echo "3. Start n8n server: docker run -p 5678:5678 n8nio/n8n"
echo "4. Test webhooks from admin UI"
echo ""
