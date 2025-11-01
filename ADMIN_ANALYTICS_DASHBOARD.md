# Admin Analytics Dashboard

## Overview
A comprehensive business summary dashboard for admin users with practical features focused on day-to-day business operations.

## Features Implemented

### 1. Store Information Display
- Store Name
- Contact Number
- Business Type
- Full Address (Street, City, State)

### 2. Summary Metrics
Three main cards showing:
- **Total Orders**: Number of orders in the selected period
- **Total Revenue**: Total revenue generated
- **Total Customers**: Total number of registered customers

### 3. Recent Activity Timeline
- Displays last 10 orders/actions
- Shows order ID, status, amount, customer name
- Timestamp for each activity
- Organized in a timeline format

### 4. Product Overview
Two sections:

#### Top 5 Selling Products
- Product name and category
- Number of times ordered
- Total quantity sold
- Total revenue generated
- Ranked by revenue

#### Low Stock Alerts
- Products below minimum stock level
- Current stock quantity
- Minimum stock level threshold
- Visual warning indicators

### 5. Order Status Breakdown
- **Pie Chart**: Visual representation of order distribution
- **List View**: Detailed breakdown with counts and percentages
- Status categories:
  - Pending
  - Packed
  - Delivered
  - Cancelled
  - Other statuses as configured

### 6. Customer Overview
Recent customers section showing:
- Customer name
- Contact information (phone/email)
- Total orders placed
- Loyalty points (if loyalty program is enabled)
- Credit balance (if credit system is enabled)
- Last order date

### 7. Charts and Visualizations

#### Monthly Sales Bar Chart
- X-axis: Months
- Y-axis (Left): Revenue in ₹
- Y-axis (Right): Order Count
- Shows last 12 months of data
- Dual-axis visualization

#### Order Status Pie Chart
- Visual distribution of orders by status
- Color-coded segments
- Percentage display
- Interactive tooltips

### 8. Export Functionality
Three export options, all generating Excel (.xlsx) files:

1. **Export Orders**
   - Order ID
   - Date & Time
   - Customer Name
   - Customer Phone
   - Status
   - Amount
   - Payment Method
   - Delivery Address

2. **Export Customers**
   - Customer ID
   - Name
   - Phone & Email
   - Loyalty Points
   - Registration Date
   - Total Orders
   - Total Amount Spent

3. **Export Products**
   - Product ID
   - Name
   - Category & Brand
   - Price
   - Stock Quantity
   - Active Status
   - Times Ordered
   - Total Quantity Sold
   - Total Revenue

### 9. Date Range Filters
- 7 Days
- 30 Days
- 90 Days

## Backend API Endpoints

### New Endpoints Added

1. **GET /api/analytics/admin-dashboard**
   - Returns comprehensive dashboard data
   - Query params: `startDate`, `endDate`
   - Response: All dashboard sections in one call

2. **GET /api/analytics/export/orders**
   - Exports orders data
   - Query params: `startDate`, `endDate`
   - Response: Array of order records

3. **GET /api/analytics/export/customers**
   - Exports customers data
   - Response: Array of customer records

4. **GET /api/analytics/export/products**
   - Exports products data
   - Response: Array of product records

## Database Queries

The implementation uses efficient SQL queries with:
- JOINs for relational data
- Aggregations (COUNT, SUM, AVG)
- GROUP BY for categorization
- ORDER BY for sorting
- LIMIT for pagination
- LEFT JOINs to handle optional data (loyalty, credit)

## Technology Stack

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Recharts**: Chart library for visualizations
- **XLSX**: Excel export functionality
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components

### Backend
- **Node.js**: Runtime
- **Express**: Web framework
- **PostgreSQL**: Database
- **pg**: PostgreSQL client

## Security
- All endpoints protected with authentication middleware
- Tenant isolation (tenantId from JWT token)
- No cross-tenant data access
- SQL injection prevention via parameterized queries

## Admin-Only Features
This dashboard is exclusively for admin users:
- No area-wise analytics
- No chemist-wise analytics
- No deep analytics (those are reserved for super admin)
- Focus on practical, actionable business metrics

## UI/UX Features
- Responsive design (works on mobile, tablet, desktop)
- Loading states with skeleton screens
- Error handling with toast notifications
- Clean, professional interface
- Tabbed navigation for better organization
- Color-coded status indicators
- Interactive charts with tooltips

## Performance Considerations
- Single API call for dashboard data (reduces latency)
- Efficient database queries with proper indexing
- Lazy loading for different tabs
- Optimized chart rendering

## Usage

### Accessing the Dashboard
1. Log in as an admin user
2. Navigate to Admin -> Analytics Dashboard
3. Select desired date range (7d, 30d, or 90d)
4. View different sections via tabs

### Exporting Data
1. Click on the desired export button (Orders, Customers, or Products)
2. Wait for the export to complete
3. Excel file will be automatically downloaded
4. File name includes the export date

## Future Enhancements (Not Included)
- Real-time updates
- Custom date range picker
- More granular filters
- Comparison with previous periods
- Email scheduled reports
- Print functionality
