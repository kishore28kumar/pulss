#!/bin/bash

# ============================================================================
# Pulss API Test Suite - cURL Commands
# ============================================================================
# This script tests all major API endpoints for the Pulss platform
# Run with: bash tests/curl_tests.sh
# ============================================================================

BASE_URL="http://localhost:3000"
SUPER_ADMIN_TOKEN=""
ADMIN_TOKEN=""
CUSTOMER_TOKEN=""
TENANT_ID=""
PRODUCT_ID=""
ORDER_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
  echo -e "\n${BLUE}============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================${NC}\n"
}

# Helper function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================

print_section "1. AUTHENTICATION TESTS"

# Test 1.1: Super Admin Login
echo "Test 1.1: Super Admin Login"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pulss.local",
    "password": "SuperAdmin@123"
  }')

SUPER_ADMIN_TOKEN=$(echo $RESPONSE | jq -r '.token')

if [ "$SUPER_ADMIN_TOKEN" != "null" ]; then
  print_success "Super admin logged in successfully"
  echo "Token: $SUPER_ADMIN_TOKEN"
else
  print_error "Super admin login failed"
  echo $RESPONSE | jq '.'
  exit 1
fi

# Test 1.2: Create Tenant + Admin
echo -e "\nTest 1.2: Create Tenant + Admin"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register-tenant-admin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -d '{
    "email": "admin@citypharmacy.com",
    "password": "Admin@123",
    "full_name": "John Doe",
    "tenant_name": "City Pharmacy",
    "subdomain": "citypharmacy",
    "business_type": "pharmacy",
    "city": "Mumbai",
    "state": "Maharashtra"
  }')

TENANT_ID=$(echo $RESPONSE | jq -r '.tenant.id')
ADMIN_TOKEN=$(echo $RESPONSE | jq -r '.token')

if [ "$TENANT_ID" != "null" ]; then
  print_success "Tenant and admin created successfully"
  echo "Tenant ID: $TENANT_ID"
  echo "Admin Token: $ADMIN_TOKEN"
else
  print_error "Tenant creation failed"
  echo $RESPONSE | jq '.'
  exit 1
fi

# ============================================================================
# 2. TENANT PROFILE TESTS
# ============================================================================

print_section "2. TENANT PROFILE TESTS"

# Test 2.1: Update Tenant Profile
echo "Test 2.1: Update Tenant Profile"
RESPONSE=$(curl -s -X PUT "$BASE_URL/api/tenants/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "shop_name": "City Pharmacy",
    "street_address": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001",
    "drug_license_number": "DL-12345-MH",
    "gst_number": "27AABCU9603R1ZM",
    "upi_id": "citypharmacy@upi",
    "cash_on_delivery_enabled": true,
    "credit_on_delivery_enabled": true,
    "credit_limit": 5000
  }')

if echo $RESPONSE | jq -e '.tenant' > /dev/null; then
  print_success "Tenant profile updated"
else
  print_error "Tenant profile update failed"
  echo $RESPONSE | jq '.'
fi

# Test 2.2: Get Tenant Settings (Public)
echo -e "\nTest 2.2: Get Tenant Settings (Public)"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/tenants/$TENANT_ID/settings")

if echo $RESPONSE | jq -e '.settings' > /dev/null; then
  print_success "Tenant settings retrieved"
else
  print_error "Failed to get tenant settings"
  echo $RESPONSE | jq '.'
fi

# ============================================================================
# 3. PRODUCT TESTS
# ============================================================================

print_section "3. PRODUCT TESTS"

# Test 3.1: Create Product
echo "Test 3.1: Create Product"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/products/tenants/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Paracetamol 500mg",
    "description": "Pain relief and fever reducer",
    "brand": "Generic",
    "price": 25.00,
    "mrp": 30.00,
    "sku": "PARA-500",
    "inventory_count": 100,
    "requires_rx": false
  }')

PRODUCT_ID=$(echo $RESPONSE | jq -r '.product.product_id')

if [ "$PRODUCT_ID" != "null" ]; then
  print_success "Product created"
  echo "Product ID: $PRODUCT_ID"
else
  print_error "Product creation failed"
  echo $RESPONSE | jq '.'
fi

# Test 3.2: List Products
echo -e "\nTest 3.2: List Products"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/products/tenants/$TENANT_ID?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo $RESPONSE | jq -e '.products' > /dev/null; then
  print_success "Products listed successfully"
  echo "Total products: $(echo $RESPONSE | jq '.products | length')"
else
  print_error "Failed to list products"
  echo $RESPONSE | jq '.'
fi

# Test 3.3: CSV Import (requires CSV file)
echo -e "\nTest 3.3: CSV Import (skipped - requires file upload)"
echo "To test CSV import, use:"
echo "curl -X POST $BASE_URL/api/products/tenants/$TENANT_ID/import-csv \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -F \"csv=@sample-products.csv\""

# ============================================================================
# 4. CUSTOMER TESTS
# ============================================================================

print_section "4. CUSTOMER TESTS"

# Test 4.1: Register Customer
echo "Test 4.1: Register Customer"
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register-customer" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "'"$TENANT_ID"'",
    "email": "customer@example.com",
    "password": "Customer@123",
    "name": "Jane Smith",
    "phone": "+919876543210"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.customer.id')
CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | jq -r '.token')

if [ "$CUSTOMER_ID" != "null" ]; then
  print_success "Customer registered"
  echo "Customer ID: $CUSTOMER_ID"
else
  print_error "Customer registration failed"
  echo $CUSTOMER_RESPONSE | jq '.'
fi

# ============================================================================
# 5. ORDER LIFECYCLE TESTS
# ============================================================================

print_section "5. ORDER LIFECYCLE TESTS"

# Test 5.1: Create Order
echo "Test 5.1: Create Order"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/tenants/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "customer_id": "'"$CUSTOMER_ID"'",
    "items": [
      {
        "product_id": "'"$PRODUCT_ID"'",
        "quantity": 2,
        "unit_price": 25.00
      }
    ],
    "payment_method": "cod",
    "delivery_type": "delivery",
    "delivery_address": "456 Customer Street, Mumbai 400002",
    "delivery_phone": "+919876543210"
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order.order_id')

if [ "$ORDER_ID" != "null" ]; then
  print_success "Order created"
  echo "Order ID: $ORDER_ID"
else
  print_error "Order creation failed"
  echo $ORDER_RESPONSE | jq '.'
fi

# Test 5.2: Accept Order
echo -e "\nTest 5.2: Accept Order"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "estimated_delivery_time": "2024-01-20T18:00:00Z",
    "notes": "Order accepted and being prepared"
  }')

if echo $RESPONSE | jq -e '.message' > /dev/null; then
  print_success "Order accepted"
else
  print_error "Order acceptance failed"
  echo $RESPONSE | jq '.'
fi

# Test 5.3: Pack Order
echo -e "\nTest 5.3: Pack Order"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/pack" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "notes": "Order packed and ready"
  }')

if echo $RESPONSE | jq -e '.message' > /dev/null; then
  print_success "Order packed"
else
  print_error "Order packing failed"
  echo $RESPONSE | jq '.'
fi

# Test 5.4: Dispatch Order
echo -e "\nTest 5.4: Dispatch Order"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/send-out" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "tracking_number": "TRACK123456",
    "notes": "Order dispatched via courier"
  }')

if echo $RESPONSE | jq -e '.message' > /dev/null; then
  print_success "Order dispatched"
else
  print_error "Order dispatch failed"
  echo $RESPONSE | jq '.'
fi

# Test 5.5: Deliver Order
echo -e "\nTest 5.5: Deliver Order"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/deliver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "payment_status": "completed",
    "notes": "Order delivered successfully"
  }')

if echo $RESPONSE | jq -e '.message' > /dev/null; then
  print_success "Order delivered"
  echo "Points earned: $(echo $RESPONSE | jq '.points_earned')"
else
  print_error "Order delivery failed"
  echo $RESPONSE | jq '.'
fi

# Test 5.6: Get Order History
echo -e "\nTest 5.6: Get Order History"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/orders/$ORDER_ID/history" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo $RESPONSE | jq -e '.history' > /dev/null; then
  print_success "Order history retrieved"
  echo "History entries: $(echo $RESPONSE | jq '.history | length')"
else
  print_error "Failed to get order history"
  echo $RESPONSE | jq '.'
fi

# ============================================================================
# 6. CREDIT/LEDGER TESTS
# ============================================================================

print_section "6. CREDIT/LEDGER TESTS"

# Create another order for credit testing
echo "Creating order for credit test..."
CREDIT_ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/tenants/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "customer_id": "'"$CUSTOMER_ID"'",
    "items": [
      {
        "product_id": "'"$PRODUCT_ID"'",
        "quantity": 3,
        "unit_price": 25.00
      }
    ],
    "payment_method": "credit",
    "delivery_type": "delivery",
    "delivery_address": "456 Customer Street, Mumbai 400002",
    "delivery_phone": "+919876543210"
  }')

CREDIT_ORDER_ID=$(echo $CREDIT_ORDER_RESPONSE | jq -r '.order.order_id')

# Test 6.1: Request Credit
echo -e "\nTest 6.1: Request Credit"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ledger/orders/$CREDIT_ORDER_ID/request-credit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "notes": "Please approve credit for this order"
  }')

if echo $RESPONSE | jq -e '.ledger' > /dev/null; then
  print_success "Credit requested"
else
  print_error "Credit request failed"
  echo $RESPONSE | jq '.'
fi

# Test 6.2: Get Pending Credit Requests
echo -e "\nTest 6.2: Get Pending Credit Requests"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/ledger/tenants/$TENANT_ID/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo $RESPONSE | jq -e '.requests' > /dev/null; then
  print_success "Pending requests retrieved"
  echo "Pending count: $(echo $RESPONSE | jq '.requests | length')"
else
  print_error "Failed to get pending requests"
  echo $RESPONSE | jq '.'
fi

# Test 6.3: Approve Credit
echo -e "\nTest 6.3: Approve Credit"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ledger/orders/$CREDIT_ORDER_ID/approve-credit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "approved": true,
    "notes": "Credit approved for trusted customer"
  }')

if echo $RESPONSE | jq -e '.message' > /dev/null; then
  print_success "Credit approved"
else
  print_error "Credit approval failed"
  echo $RESPONSE | jq '.'
fi

# Test 6.4: Get Customer Ledger
echo -e "\nTest 6.4: Get Customer Ledger"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/ledger/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo $RESPONSE | jq -e '.ledger' > /dev/null; then
  print_success "Customer ledger retrieved"
  echo "Credit balance: ₹$(echo $RESPONSE | jq '.summary.credit_balance')"
  echo "Ledger entries: $(echo $RESPONSE | jq '.ledger | length')"
else
  print_error "Failed to get ledger"
  echo $RESPONSE | jq '.'
fi

# ============================================================================
# 7. GO LIVE TEST
# ============================================================================

print_section "7. GO LIVE TEST"

# Test 7.1: Make Store Live and Generate QR
echo "Test 7.1: Make Store Live"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/tenants/$TENANT_ID/go-live" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo $RESPONSE | jq -e '.pwa_url' > /dev/null; then
  print_success "Store is now live!"
  echo "PWA URL: $(echo $RESPONSE | jq -r '.pwa_url')"
  echo "QR Code: $(echo $RESPONSE | jq -r '.qr_image_url')"
else
  print_error "Go live failed"
  echo $RESPONSE | jq '.'
fi

# ============================================================================
# 8. TENANT ISOLATION TEST
# ============================================================================

print_section "8. TENANT ISOLATION TEST (Security)"

# Create second tenant
echo "Creating second tenant for isolation test..."
TENANT2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register-tenant-admin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -d '{
    "email": "admin@pharmacy2.com",
    "password": "Admin@123",
    "full_name": "Admin Two",
    "tenant_name": "Pharmacy Two",
    "subdomain": "pharmacy2",
    "business_type": "pharmacy"
  }')

TENANT2_ID=$(echo $TENANT2_RESPONSE | jq -r '.tenant.id')

# Test 8.1: Try to access Tenant 1 data with Tenant 2 credentials
echo -e "\nTest 8.1: Try to access Tenant 1 products with Tenant 2 admin"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/products/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $(echo $TENANT2_RESPONSE | jq -r '.token')")

if echo $RESPONSE | jq -e '.error' > /dev/null; then
  print_success "Tenant isolation working - Access denied as expected"
else
  print_error "SECURITY ISSUE: Tenant isolation failed!"
  echo $RESPONSE | jq '.'
fi

# ============================================================================
# SUMMARY
# ============================================================================

print_section "TEST SUMMARY"

echo -e "${GREEN}All critical tests completed!${NC}\n"
echo "Created Resources:"
echo "  - Tenant ID: $TENANT_ID"
echo "  - Product ID: $PRODUCT_ID"
echo "  - Order ID: $ORDER_ID"
echo "  - Customer ID: $CUSTOMER_ID"
echo ""
echo "Tokens (save for manual testing):"
echo "  - Super Admin: $SUPER_ADMIN_TOKEN"
echo "  - Admin: $ADMIN_TOKEN"
echo "  - Customer: $CUSTOMER_TOKEN"
echo ""

# ============================================================================
# ADMIN ANALYTICS DASHBOARD TESTS
# ============================================================================

print_section "ADMIN ANALYTICS DASHBOARD TESTS"

# Test: Get Admin Dashboard
echo "Test: Get Admin Dashboard Data"
START_DATE=$(date -d '30 days ago' +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)

RESPONSE=$(curl -s -X GET "$BASE_URL/api/analytics/admin-dashboard?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  print_success "Admin dashboard data retrieved successfully"
  echo "Dashboard includes:"
  echo "  - Store information"
  echo "  - Summary metrics"
  echo "  - Recent activity"
  echo "  - Top selling products"
  echo "  - Low stock alerts"
  echo "  - Order status breakdown"
  echo "  - Recent customers"
  echo "  - Monthly sales data"
else
  print_error "Failed to get admin dashboard data"
  echo "Response: $RESPONSE"
fi

# Test: Export Orders
echo ""
echo "Test: Export Orders"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/analytics/export/orders?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  print_success "Orders export data retrieved successfully"
else
  print_error "Failed to export orders"
  echo "Response: $RESPONSE"
fi

# Test: Export Customers
echo ""
echo "Test: Export Customers"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/analytics/export/customers" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  print_success "Customers export data retrieved successfully"
else
  print_error "Failed to export customers"
  echo "Response: $RESPONSE"
fi

# Test: Export Products
echo ""
echo "Test: Export Products"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/analytics/export/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  print_success "Products export data retrieved successfully"
else
  print_error "Failed to export products"
  echo "Response: $RESPONSE"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test file uploads (logo, product images, CSV)"
echo "  2. Test frontend integration"
echo "  3. Setup notifications"
echo "  4. Configure payment gateway"
echo ""
