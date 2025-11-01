#!/bin/bash

# Advanced Features API Test Script
# This script tests all the new API endpoints

set -e

# Configuration
API_URL=${API_URL:-"http://localhost:3000"}
TOKEN=${API_TOKEN:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Pulss Advanced Features API Test Script"
echo "================================================"
echo ""

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}Warning: API_TOKEN not set. Some tests may fail.${NC}"
    echo "Set it with: export API_TOKEN='your_token_here'"
    echo ""
fi

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        return 1
    fi
}

echo "1. Health Check"
echo "==============="
test_endpoint "Health endpoint" "GET" "/health" || true
echo ""

echo "2. Notification Endpoints"
echo "========================="
test_endpoint "Get VAPID public key" "GET" "/api/notifications/vapid-key" || true
test_endpoint "Get notifications" "GET" "/api/notifications?page=1&limit=5" || true
echo ""

echo "3. Messaging Endpoints"
echo "======================"
test_endpoint "Get messaging config" "GET" "/api/messaging/config" || true
test_endpoint "Get message logs" "GET" "/api/messaging/logs?page=1&limit=5" || true
echo ""

echo "4. Tracking Endpoints"
echo "====================="
echo "Note: These tests require a valid order ID"
# You can set ORDER_ID environment variable to test specific order
ORDER_ID=${ORDER_ID:-"00000000-0000-0000-0000-000000000000"}
test_endpoint "Get order tracking" "GET" "/api/tracking/$ORDER_ID" || true
test_endpoint "Get order timeline" "GET" "/api/tracking/$ORDER_ID/timeline" || true
echo ""

echo "5. Analytics Endpoints"
echo "======================"
START_DATE=$(date -d '30 days ago' +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
test_endpoint "Get dashboard metrics" "GET" "/api/analytics/dashboard?startDate=$START_DATE&endDate=$END_DATE" || true
test_endpoint "Get customer segmentation" "GET" "/api/analytics/customer-segmentation" || true
test_endpoint "Get sales trends" "GET" "/api/analytics/sales-trends?startDate=$START_DATE&endDate=$END_DATE&groupBy=day" || true
echo ""

echo "================================================"
echo "  Test Summary"
echo "================================================"
echo ""
echo "All endpoint checks completed!"
echo ""
echo "Next steps:"
echo "1. Set API_TOKEN environment variable for authenticated requests"
echo "2. Create test orders to populate analytics data"
echo "3. Configure FCM/Twilio/WhatsApp credentials in .env"
echo "4. Test push notifications and messaging features"
echo ""
echo "For detailed documentation, see:"
echo "  - ADVANCED_FEATURES.md"
echo "  - QUICK_START_ADVANCED_FEATURES.md"
echo ""
