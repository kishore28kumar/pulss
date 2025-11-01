# Order Acceptance & Auto-Accept Feature Guide

## Overview

The Pulss White-Label Platform now includes an order acceptance system with automatic acceptance timer. This ensures that all orders are acknowledged within a specific timeframe, improving customer experience and operational efficiency.

## Key Features

### 1. **Real-Time Order Alerts**
- Visual and audio notifications for new orders
- Prominent display with order details
- Automatic sound alert on new order

### 2. **Acceptance Timer**
- 5-minute countdown timer by default (configurable)
- Visual progress bar showing time remaining
- Warning when less than 1 minute remains

### 3. **Auto-Acceptance**
- Orders automatically accepted after timer expires
- No rejection option (improves customer satisfaction)
- Automatic notifications to customer and admin

### 4. **Order Tracking**
- Three acceptance statuses:
  - `pending_acceptance`: Waiting for manual acceptance
  - `accepted`: Manually accepted by admin
  - `auto_accepted`: Automatically accepted due to timeout

## How It Works

### 1. Customer Places Order

When a customer places an order:
- Order is created with status `pending`
- Acceptance status is set to `pending_acceptance`
- Acceptance deadline is set (current time + 5 minutes)
- Admin is notified via alert system

### 2. Admin Dashboard Alert

The admin sees:
- 🔔 **Order Alert Card** at top-right of dashboard
- Order number and total amount
- Countdown timer showing time remaining
- Green "Accept Order" button
- Progress bar visualization

### 3. Two Possible Outcomes

**Option A: Manual Acceptance**
- Admin clicks "Accept Order" button
- Order status changes to `accepted`
- Acceptance status changes to `accepted`
- Customer is notified
- Order proceeds to preparation

**Option B: Auto-Acceptance**
- Timer reaches zero
- System automatically accepts order
- Acceptance status changes to `auto_accepted`
- Both admin and customer are notified
- Order proceeds to preparation

## Setup & Configuration

### Backend Setup

The feature is automatically enabled when you run the migration:

```bash
psql -d pulssdb -f backend/migrations/10_product_variants_and_order_improvements.sql
```

This creates:
- New columns in `orders` table for acceptance tracking
- Auto-accept function in database
- Analytics events table for tracking acceptance metrics

### Frontend Integration

Add the `OrderAlertsContainer` to your admin dashboard:

```tsx
import { OrderAlertsContainer } from '@/components/OrderAlertsContainer'

// In your admin dashboard component
<OrderAlertsContainer
  tenantId={tenantId}
  apiUrl={process.env.VITE_API_URL}
  authToken={authToken}
/>
```

The component automatically:
- Polls for pending orders every 10 seconds
- Displays alerts for new orders
- Handles acceptance and dismissal
- Plays notification sounds

### Configuring the Timer

Default timer is 5 minutes (300 seconds). To change it:

**Option 1: Per Order (in order creation)**
```javascript
POST /api/orders/tenants/:tenant_id

{
  "customer_id": "...",
  "items": [...],
  "payment_method": "cod",
  "auto_accept_timer": 600  // 10 minutes in seconds
}
```

**Option 2: Globally (update order controller)**
```javascript
// In ordersController.js
const auto_accept_timer = 600; // Change from 300 to 600 for 10 minutes
```

## API Endpoints

### Get Pending Acceptance Orders

```javascript
GET /api/orders/tenants/:tenant_id/pending-acceptance

Response:
{
  "orders": [
    {
      "order_id": "...",
      "order_number": "ORD-...",
      "customer_id": "...",
      "total": 500,
      "acceptance_status": "pending_acceptance",
      "acceptance_deadline": "2024-10-16T10:35:00Z",
      "auto_accept_timer": 300,
      "created_at": "2024-10-16T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Accept Order Manually

```javascript
POST /api/orders/:order_id/accept

{
  "estimated_delivery_time": "2024-10-16T14:00:00Z",
  "notes": "Accepted via dashboard"
}

Response:
{
  "message": "Order accepted successfully"
}
```

### Process Auto-Accept (System Call)

```javascript
POST /api/orders/process-auto-accept

Response:
{
  "message": "Processed N orders for auto-acceptance",
  "processedOrders": ["order_id_1", "order_id_2"]
}
```

## Database Fields

### Orders Table - New Columns

```sql
acceptance_status TEXT DEFAULT 'pending_acceptance'
accepted_at TIMESTAMP WITH TIME ZONE
accepted_by UUID  -- References admin who accepted
auto_accept_timer INTEGER DEFAULT 300
auto_accepted BOOLEAN DEFAULT false
acceptance_deadline TIMESTAMP WITH TIME ZONE
```

## Analytics & Tracking

### Tracked Metrics

1. **Acceptance Speed**
   - Time from order creation to acceptance
   - Manual vs. auto-acceptance rates
   - Average acceptance time

2. **Order Status History**
   - All status changes logged
   - Who accepted (admin_id)
   - Acceptance method (manual/auto)

3. **Analytics Events**
   - `order_accepted`: Manual acceptance
   - `order_auto_accepted`: Auto acceptance
   - Includes timing data for reporting

### Viewing Analytics

```javascript
GET /api/analytics/acceptance-metrics?tenant_id=...

Response:
{
  "total_orders": 150,
  "manually_accepted": 120,
  "auto_accepted": 30,
  "avg_acceptance_time_seconds": 145,
  "acceptance_rate": 0.80  // 80% manually accepted
}
```

## Notification Sound

### Default Sound

Location: `/public/sounds/new-order.mp3`

The sound plays automatically when:
- A new order appears in the alerts container
- Browser supports audio playback
- User has granted audio permissions

### Custom Sound

To use your own notification sound:

1. Add your sound file to `/public/sounds/`
2. Update the sound reference in `OrderAlert.tsx`:

```typescript
audioRef.current = new Audio('/sounds/your-custom-sound.mp3')
```

### Browser Notifications

If audio fails to play, the system falls back to browser notifications:

```javascript
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('New Order Received!', {
    body: `Order ${order.order_number} - ₹${order.total}`,
    icon: '/favicon.ico'
  })
}
```

## Best Practices

### 1. **Monitor Acceptance Rates**
- Aim for >80% manual acceptance rate
- High auto-acceptance rate may indicate staffing issues
- Review acceptance analytics weekly

### 2. **Set Appropriate Timer**
- 5 minutes for fast-moving stores
- 10-15 minutes for pharmacies requiring prescription verification
- 30 minutes for specialty/custom orders

### 3. **Staff Training**
- Train staff to respond to alerts promptly
- Ensure alerts are visible on admin dashboard
- Set up audio on admin devices

### 4. **Customer Communication**
- Set expectations in order confirmation
- Explain acceptance process in FAQ
- Send acceptance notification promptly

### 5. **Periodic Cleanup**
- Run auto-accept processing every 5 minutes via cron job
- Archive old acceptance data after 90 days
- Monitor system performance

## Automated Processing

### Setup Cron Job for Auto-Accept

To ensure auto-accept runs even when no admin is logged in:

**Option 1: System Cron Job**
```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * curl -X POST http://localhost:3000/api/orders/process-auto-accept \
  -H "Authorization: Bearer YOUR_SYSTEM_TOKEN"
```

**Option 2: Node Scheduler**
```javascript
// In server.js
const cron = require('node-cron');

cron.schedule('*/5 * * * *', async () => {
  // Run auto-accept processing
  await processAutoAcceptOrders();
});
```

**Option 3: Database Function**
```sql
-- PostgreSQL scheduled function
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('auto-accept-orders', '*/5 * * * *', 
  'SELECT auto_accept_expired_orders();'
);
```

## Troubleshooting

### Issue: Alerts not appearing

**Solutions:**
1. Check polling is working (browser console for API calls)
2. Verify authToken is valid
3. Ensure tenant_id is correct
4. Check browser console for errors

### Issue: Sound not playing

**Solutions:**
1. Check browser allows audio playback
2. Verify sound file exists at `/public/sounds/new-order.mp3`
3. Check browser console for audio errors
4. Try enabling browser notifications as fallback

### Issue: Orders auto-accepting too quickly

**Solution:** Increase the `auto_accept_timer` value in order creation or globally in the controller.

### Issue: Orders not auto-accepting

**Solutions:**
1. Check acceptance_deadline is set correctly
2. Run manual auto-accept processing: `POST /api/orders/process-auto-accept`
3. Verify cron job is running
4. Check database function exists

## Customer Experience

From the customer's perspective:

1. **Place Order**
   - Order confirmation shown immediately
   - Status: "Order Received - Awaiting Confirmation"

2. **Order Accepted** (within 5 minutes)
   - Notification: "Your order has been accepted"
   - Status: "Order Confirmed - Being Prepared"
   - Estimated delivery time shown

3. **If Auto-Accepted**
   - Same notification experience
   - No difference from manual acceptance
   - Ensures timely response

## Reporting

### Acceptance Report Query

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN auto_accepted = false THEN 1 ELSE 0 END) as manual_accepts,
  SUM(CASE WHEN auto_accepted = true THEN 1 ELSE 0 END) as auto_accepts,
  AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) as avg_acceptance_seconds
FROM orders
WHERE acceptance_status IN ('accepted', 'auto_accepted')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Future Enhancements

Planned improvements:
- [ ] Configurable timer per tenant
- [ ] Admin notification preferences
- [ ] SMS alerts for critical orders
- [ ] Acceptance rate dashboard widget
- [ ] Predictive auto-accept based on order type
- [ ] Multiple acceptance tiers (urgent/normal/low priority)

## Support

For issues with order acceptance:
1. Check the troubleshooting section
2. Review server logs for errors
3. Verify database migration completed
4. Test with a single test order
5. Contact support with error details
