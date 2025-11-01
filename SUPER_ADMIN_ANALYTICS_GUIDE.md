# Super Admin Analytics Dashboard - Feature Documentation

## Overview

The Super Admin Analytics Dashboard provides comprehensive, real-time insights into the entire platform's performance across all stores/chemists, geographic areas, products, and time periods. This feature-rich dashboard enables data-driven decision-making with interactive visualizations, smart insights, and powerful filtering capabilities.

## Key Features

### 1. Chemist-wise (Store) Analytics

**Description:** Detailed performance metrics for each store/chemist on the platform.

**Metrics Tracked:**
- Total Revenue
- Total Orders
- Customer Count
- Average Order Value
- Product Count
- Order Status Breakdown (Pending, Processing, Delivered, Cancelled)

**Visualizations:**
- Data table with sortable columns
- Top 10 stores by revenue (bar chart)
- Order status pie chart (drill-down view)

**Drill-down Capability:**
Click on any store to view:
- Detailed revenue metrics
- Order statistics
- Customer engagement
- Visual order status distribution

### 2. Area-wise Analysis

**Description:** Geographic performance analysis showing sales distribution across cities, pin codes, and states.

**Metrics Tracked:**
- Revenue by area
- Order count by area
- Store count per area
- Revenue percentage of total
- Delivered orders count

**Visualizations:**
- Revenue distribution bar chart
- Interactive heatmap with color-coded revenue intensity
- Comparative table with percentage metrics

**Heatmap Features:**
- Color-coded tiles (orange → yellow → green) based on revenue
- Grouped by state
- Hover tooltips with detailed metrics
- Visual legend for interpretation

### 3. Product Performance by Area

**Description:** Analyze which products are performing best across different geographic areas.

**Metrics Tracked:**
- Product name and category
- Sales by area
- Order count
- Quantity sold
- Total revenue
- Average price
- Number of stores selling the product

**Visualizations:**
- Horizontal bar chart for top 10 products
- Detailed data table with filtering

### 4. Time-based Trends

**Description:** Historical performance analysis over customizable time periods.

**Time Periods Supported:**
- Daily (default for last 7-30 days)
- Weekly
- Monthly
- Yearly

**Metrics Tracked:**
- Total orders over time
- Total revenue over time
- Unique customers over time
- Active tenants over time
- Products sold over time

**Visualizations:**
- Multi-line chart with dual Y-axes
- Area chart for revenue trends
- Interactive tooltips with exact values

### 5. Smart Insights & Recommendations

**Description:** Automated analysis that highlights key opportunities and areas of concern.

**Insight Types:**

1. **Top Performer** (Green)
   - Identifies the highest revenue-generating store
   - Shows total revenue and store name

2. **Needs Attention** (Red)
   - Highlights the lowest performing store
   - Flags stores requiring intervention

3. **Trending Product** (Green)
   - Shows the best-selling product
   - Includes quantity sold and revenue

4. **Peak Sales Area** (Green)
   - Identifies the highest performing geographic area
   - Shows order count and revenue

5. **Growth Opportunity** (Blue)
   - Identifies areas with multiple stores but low activity
   - Suggests potential for growth

### 6. Advanced Filtering

**Filter Options:**
- Store/Chemist selection
- Area/City selection
- Product Category selection
- Minimum Revenue threshold
- Maximum Revenue threshold
- Minimum Orders threshold

**Features:**
- Collapsible filter panel
- Real-time filter application
- Clear all filters button
- Filter persistence across tabs

### 7. Data Export

**Export Formats:**
- Excel (XLSX) - Multi-sheet workbook
- CSV - Simple comma-separated values

**Export Options:**
- Complete dashboard data
- Chemist-wise data only
- Area-wise data only
- Product data only
- Time trends data only

**File Naming:**
- Auto-generated with date: `analytics-[format]-[YYYY-MM-DD].[extension]`

## API Endpoints

### Dashboard Data
```
GET /api/super-admin/analytics/dashboard
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
```

### Chemist-wise Analytics
```
GET /api/super-admin/analytics/chemist-wise
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - tenantId: (optional) specific tenant ID
```

### Area-wise Analytics
```
GET /api/super-admin/analytics/area-wise
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - groupBy: city|pincode|state|district (default: city)
```

### Product Sales by Area
```
GET /api/super-admin/analytics/product-by-area
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - area: (optional) specific area
  - areaType: city|pincode|state|district (default: city)
```

### Time Trends
```
GET /api/super-admin/analytics/time-trends
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - groupBy: hour|day|week|month|year (default: day)
```

### Smart Insights
```
GET /api/super-admin/analytics/insights
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
```

### Export to Excel
```
GET /api/super-admin/analytics/export/excel
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - dataType: dashboard|chemist|area|product|trends
```

### Export to CSV
```
GET /api/super-admin/analytics/export/csv
Query Parameters:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - dataType: dashboard|chemist|area|product|trends
```

## User Guide

### Accessing the Dashboard

1. Log in as a Super Admin user
2. Navigate to the Super Admin Dashboard
3. Click on the "Analytics" tab

### Changing Time Period

1. Click the date range selector in the top-right
2. Choose from: 7 days, 30 days, 90 days, or 1 year
3. Dashboard automatically refreshes with new data

### Using Filters

1. Click "Expand" on the Advanced Filters card
2. Select desired filters (store, area, category, revenue range)
3. Filters apply immediately to all tabs
4. Click "Clear All" to reset filters

### Drilling Down into Store Data

1. Go to the "Chemists/Stores" tab
2. Click the eye icon next to any store
3. View detailed metrics and order status breakdown
4. Click "Back to All Stores" to return

### Viewing the Heatmap

1. Navigate to the "Area Analysis" tab
2. Scroll down to the "Revenue Heatmap by Area" card
3. Hover over any tile to see exact metrics
4. Colors indicate revenue levels (orange=low, green=high)

### Exporting Data

1. Select desired date range and filters
2. Click "CSV" or "Excel" button in the header
3. OR click "Export" within any specific tab
4. File downloads automatically

## Technical Details

### Frontend Technologies
- React 19.x with TypeScript
- Recharts for data visualization
- Tailwind CSS for styling
- shadcn/ui component library
- date-fns for date manipulation

### Backend Technologies
- Node.js with Express
- PostgreSQL database
- JWT authentication
- XLSX library for Excel export

### Performance Optimizations
- Data caching with 30-second refresh interval
- Lazy loading of charts
- Pagination for large datasets
- Optimized SQL queries with indexes

### Security
- Super Admin authentication required for all endpoints
- JWT token validation
- Role-based access control
- SQL injection prevention

## Troubleshooting

### Dashboard not loading data
- Check that you're logged in as a Super Admin
- Verify date range is valid
- Check browser console for errors
- Ensure backend server is running

### Export not working
- Verify you have data in the selected date range
- Check that filters aren't excluding all data
- Try exporting without filters first
- Check browser's download settings

### Filters not applying
- Clear all filters and try again
- Refresh the page
- Check that you have data matching the filter criteria

### Charts not displaying
- Ensure there's data in the selected time period
- Check browser compatibility (modern browsers required)
- Clear browser cache and reload

## Future Enhancements

- Real-time data streaming with WebSockets
- Custom report builder
- Scheduled email reports
- Predictive analytics with ML
- Custom dashboard layouts
- Mobile app version
- Integration with BI tools (Tableau, Power BI)
- Advanced segmentation and cohort analysis
- A/B testing framework integration

## Support

For technical support or feature requests, please contact the development team or create an issue in the repository.
