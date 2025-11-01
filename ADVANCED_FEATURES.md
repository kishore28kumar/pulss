# Advanced Features Documentation

This document covers the advanced engagement and operational excellence features added to Pulss.

## 🔔 Push Notifications

### Overview
Pulss now supports push notifications through FCM (Firebase Cloud Messaging) and Web Push API for real-time order updates and admin messages.

### Features
- Order status update notifications
- Admin broadcast messages to customers
- Real-time delivery updates
- Customizable notification priorities
- Support for both mobile (FCM) and web (Web Push) platforms

### Setup Instructions

#### Firebase Cloud Messaging (FCM)

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Navigate to Project Settings > Cloud Messaging
   - Copy the Server Key

2. **Configure Backend**
   ```env
   FCM_ENABLED=true
   FCM_SERVER_KEY=your_fcm_server_key_here
   ```

3. **Frontend Integration**
   - Add Firebase SDK to your app
   - Request notification permissions
   - Subscribe users to notifications using `/api/notifications/subscribe`

#### Web Push API

1. **Generate VAPID Keys**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. **Configure Backend**
   ```env
   WEB_PUSH_ENABLED=true
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   ```

3. **Frontend Implementation**
   - Register service worker
   - Subscribe to push notifications
   - Handle push events in service worker

### API Endpoints

#### Subscribe to Push Notifications
```http
POST /api/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm_token_or_web_push_subscription",
  "type": "fcm" | "web_push",
  "deviceInfo": {
    "browser": "Chrome",
    "os": "Android",
    "version": "10.0"
  }
}
```

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer <token>
```

#### Send Broadcast Notification
```http
POST /api/notifications/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Special offer: 20% off all products today!",
  "targetCustomerIds": ["customer-id-1", "customer-id-2"]
}
```

### Usage Example

```javascript
// Subscribe to notifications
const response = await fetch('/api/notifications/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: fcmToken,
    type: 'fcm',
    deviceInfo: {
      browser: 'Chrome',
      os: 'Android'
    }
  })
});

// Get notifications
const notifications = await fetch('/api/notifications', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📱 SMS & WhatsApp Integration

### Overview
Send transactional SMS and WhatsApp messages for order confirmations, status updates, and customer engagement.

### Supported Providers
- **Twilio** - SMS and WhatsApp
- **WhatsApp Business API** - Official WhatsApp Business integration

### Setup Instructions

#### Twilio Setup

1. **Create Twilio Account**
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID and Auth Token
   - Purchase a phone number
   - For WhatsApp, activate WhatsApp sandbox or get approved number

2. **Configure Backend**
   ```env
   TWILIO_ENABLED=true
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   TWILIO_WHATSAPP_NUMBER=+1234567890
   ```

#### WhatsApp Business API Setup

1. **Get WhatsApp Business API Access**
   - Apply through Meta (Facebook) Business
   - Get API credentials
   - Set up phone number and verify

2. **Configure Backend**
   ```env
   WHATSAPP_BUSINESS_ENABLED=true
   WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   WHATSAPP_API_KEY=your_api_key
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

### API Endpoints

#### Send SMS
```http
POST /api/messaging/sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "message": "Your order has been confirmed!"
}
```

#### Send WhatsApp Message
```http
POST /api/messaging/whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "message": "Your order is out for delivery!",
  "templateName": "order_update" // optional
}
```

#### Send Broadcast Message
```http
POST /api/messaging/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Flash sale starts now! Visit our store.",
  "phoneNumbers": ["+1234567890", "+0987654321"],
  "method": "whatsapp" // or "sms"
}
```

#### Get Message Logs
```http
GET /api/messaging/logs?page=1&limit=20&type=whatsapp&status=sent
Authorization: Bearer <token>
```

### Automatic Notifications

The system automatically sends notifications for:
- Order confirmation
- Order status updates
- Delivery tracking links
- Order ready for pickup
- Order delivered confirmation

---

## 🚚 Real-time Delivery & Order Tracking

### Overview
Track deliveries in real-time with GPS location updates, status timeline, and ETA management.

### Features
- GPS location tracking
- Order status timeline
- Estimated delivery time (ETA) updates
- Real-time notifications on status changes
- Public tracking URLs for customers
- Active deliveries dashboard

### API Endpoints

#### Update Order Location (GPS)
```http
POST /api/tracking/:orderId/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10.5
}
```

#### Get Order Location History
```http
GET /api/tracking/:orderId/location
```

Response:
```json
{
  "success": true,
  "locations": [
    {
      "tracking_location_id": "uuid",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10.5,
      "recorded_at": "2025-10-16T10:30:00Z"
    }
  ]
}
```

#### Update Order Status
```http
POST /api/tracking/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "out_for_delivery",
  "notes": "Package picked up by delivery agent"
}
```

Valid statuses:
- `pending`
- `confirmed`
- `preparing`
- `ready`
- `out_for_delivery`
- `delivered`
- `cancelled`

#### Get Order Timeline
```http
GET /api/tracking/:orderId/timeline
```

#### Get Comprehensive Tracking Data
```http
GET /api/tracking/:orderId
```

Response:
```json
{
  "success": true,
  "order": {
    "order_id": "uuid",
    "status": "out_for_delivery",
    "customer_name": "John Doe"
  },
  "timeline": [
    {
      "status": "pending",
      "notes": "Order received",
      "updated_at": "2025-10-16T10:00:00Z"
    }
  ],
  "locations": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "recorded_at": "2025-10-16T10:30:00Z"
    }
  ]
}
```

#### Update Estimated Delivery Time
```http
POST /api/tracking/:orderId/eta
Authorization: Bearer <token>
Content-Type: application/json

{
  "estimatedTime": "2025-10-16T14:00:00Z"
}
```

#### Get Active Deliveries
```http
GET /api/tracking/deliveries/active
Authorization: Bearer <token>
```

### Usage Example

```javascript
// Update delivery location
navigator.geolocation.getCurrentPosition(async (position) => {
  await fetch(`/api/tracking/${orderId}/location`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    })
  });
});

// Update order status
await fetch(`/api/tracking/${orderId}/status`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'out_for_delivery',
    notes: 'Package is on the way'
  })
});
```

---

## 📊 Business Intelligence Dashboard

### Overview
Advanced analytics for data-driven decision making with trends, cohort analysis, customer segmentation, and performance metrics.

### Features
- Sales trends over time (hourly, daily, weekly, monthly)
- Cohort analysis for customer retention
- Customer segmentation (VIP, Loyal, At Risk, Churned)
- Product and category performance analytics
- Churn prediction
- Comprehensive dashboard with key metrics

### API Endpoints

#### Get Sales Trends
```http
GET /api/analytics/sales-trends?startDate=2025-01-01&endDate=2025-10-16&groupBy=day
Authorization: Bearer <token>
```

Parameters:
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `groupBy`: `hour`, `day`, `week`, `month`, `year` (default: `day`)

Response:
```json
{
  "success": true,
  "trends": [
    {
      "period": "2025-10-15",
      "order_count": 45,
      "total_revenue": 12500.00,
      "avg_order_value": 277.78,
      "unique_customers": 32
    }
  ]
}
```

#### Get Cohort Analysis
```http
GET /api/analytics/cohort-analysis?startDate=2025-01-01&endDate=2025-10-16
Authorization: Bearer <token>
```

Response shows customer retention by signup cohort.

#### Get Customer Segmentation
```http
GET /api/analytics/customer-segmentation
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "segments": {
    "VIP": [/* high-value active customers */],
    "Loyal": [/* regular customers */],
    "At Risk": [/* customers who haven't ordered recently */],
    "Churned": [/* inactive customers */],
    "New": [/* new customers with no orders */],
    "Regular": [/* other active customers */]
  },
  "customers": [/* all customers with segment info */]
}
```

Segmentation criteria:
- **VIP**: Total spent > $5000, last order within 30 days
- **Loyal**: Total spent > $2000, last order within 60 days
- **At Risk**: Last order > 90 days ago
- **Churned**: Last order > 180 days ago
- **New**: No orders yet
- **Regular**: Other active customers

#### Get Product Performance
```http
GET /api/analytics/product-performance?startDate=2025-01-01&endDate=2025-10-16
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "products": [
    {
      "product_id": "uuid",
      "name": "Product Name",
      "category": "Category",
      "times_ordered": 150,
      "total_quantity_sold": 450,
      "total_revenue": 22500.00,
      "unique_customers": 87
    }
  ]
}
```

#### Get Category Performance
```http
GET /api/analytics/category-performance?startDate=2025-01-01&endDate=2025-10-16
Authorization: Bearer <token>
```

#### Get Comprehensive Dashboard
```http
GET /api/analytics/dashboard?startDate=2025-01-01&endDate=2025-10-16
Authorization: Bearer <token>
```

Returns all metrics in a single request:
- Summary metrics
- Sales trends
- Cohort analysis
- Customer segmentation
- Product performance
- Category performance

#### Get Churn Prediction
```http
GET /api/analytics/churn-prediction
Authorization: Bearer <token>
```

Predicts customers at risk of churning based on their order frequency patterns.

### Usage Example

```javascript
// Get dashboard metrics for the last 30 days
const endDate = new Date().toISOString().split('T')[0];
const startDate = new Date(Date.now() - 30*24*60*60*1000)
  .toISOString().split('T')[0];

const response = await fetch(
  `/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const data = await response.json();
console.log('Total Revenue:', data.summary.total_revenue);
console.log('Sales Trends:', data.salesTrends);
console.log('Customer Segments:', data.customerSegmentation);
```

---

## 🗄️ Database Schema

### New Tables

#### `push_subscriptions`
Stores push notification subscriptions.

```sql
CREATE TABLE push_subscriptions (
  subscription_id UUID PRIMARY KEY,
  admin_id UUID REFERENCES admins(admin_id),
  customer_id UUID REFERENCES customers(customer_id),
  token TEXT NOT NULL,
  type TEXT NOT NULL, -- 'fcm' or 'web_push'
  active BOOLEAN DEFAULT true,
  device_info JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `message_logs`
Logs all SMS and WhatsApp messages.

```sql
CREATE TABLE message_logs (
  message_log_id UUID PRIMARY KEY,
  type TEXT NOT NULL, -- 'sms' or 'whatsapp'
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'delivered'
  provider TEXT NOT NULL, -- 'twilio', 'whatsapp_business'
  provider_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP
);
```

#### `order_tracking_locations`
GPS tracking data for deliveries.

```sql
CREATE TABLE order_tracking_locations (
  tracking_location_id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  recorded_at TIMESTAMP
);
```

#### `push_notifications`
Queue for Web Push notifications.

```sql
CREATE TABLE push_notifications (
  notification_id UUID PRIMARY KEY,
  subscription_endpoint TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
);
```

### Modified Tables

#### `orders`
Added delivery tracking fields:
- `estimated_delivery_time`: Timestamp
- `actual_delivery_time`: Timestamp

---

## 🚀 Getting Started

### 1. Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run the migration
psql -d pulssdb -f migrations/09_advanced_features.sql
```

### 2. Configure Environment Variables

Copy and update your `.env` file with the new configuration options:

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Restart Backend Server

```bash
npm run dev
```

### 4. Test Features

Use the provided API endpoints to test each feature:

```bash
# Test notifications
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"test_token","type":"fcm"}'

# Test messaging
curl -X GET http://localhost:3000/api/messaging/config \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test analytics
curl -X GET "http://localhost:3000/api/analytics/dashboard?startDate=2025-01-01&endDate=2025-10-16" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Best Practices

### Push Notifications
- Request permission at appropriate times (after first order, not on page load)
- Keep messages concise and actionable
- Use appropriate priority levels
- Handle permission denials gracefully

### SMS/WhatsApp
- Always get customer consent before sending messages
- Keep messages under 160 characters for SMS
- Use templates for WhatsApp Business API
- Monitor delivery rates and costs

### Order Tracking
- Update location frequently for active deliveries (every 30-60 seconds)
- Batch location updates to reduce API calls
- Provide fallback for customers without GPS
- Keep customers informed with status updates

### Analytics
- Query larger date ranges less frequently
- Cache dashboard results
- Use appropriate grouping levels (day for weeks, month for years)
- Export data for deeper analysis

---

## 🔧 Troubleshooting

### Push Notifications Not Working
1. Check FCM/Web Push configuration in `.env`
2. Verify service worker is registered
3. Check browser notification permissions
4. Review browser console for errors

### SMS/WhatsApp Messages Not Sending
1. Verify Twilio/WhatsApp credentials
2. Check phone number format (+country code)
3. Review message logs: `GET /api/messaging/logs`
4. Check provider balance/quotas

### Tracking Issues
1. Ensure GPS permissions are granted
2. Check order status is appropriate for tracking
3. Verify location accuracy threshold
4. Review order timeline for status progression

### Analytics Showing No Data
1. Verify date range parameters
2. Check if orders exist in the database
3. Ensure tenant_id is correct
4. Review query execution time for large datasets

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses
3. Check application logs
4. Contact development team

---

## 🎯 Future Enhancements

Planned features:
- AI-powered delivery time prediction
- Customer sentiment analysis
- Predictive inventory management
- Advanced A/B testing framework
- Multi-language notification support
- Voice notifications
- Integration with more messaging providers
