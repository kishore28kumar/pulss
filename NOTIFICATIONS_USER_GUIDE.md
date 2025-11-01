# Advanced Notifications System - User Guide

## Overview

The Advanced Notifications System enables powerful multi-channel communication with your customers through email, SMS, push notifications, WhatsApp, and in-app messages. This guide covers both Super Admin and Tenant Admin functionality.

## Table of Contents

1. [Super Admin Guide](#super-admin-guide)
2. [Tenant Admin Guide](#tenant-admin-guide)
3. [Best Practices](#best-practices)
4. [Troubleshooting](#troubleshooting)

---

## Super Admin Guide

Super Admins have full control over notification features across all tenants.

### Managing Feature Toggles

#### View Tenant Feature Status

1. Navigate to **Super Admin Dashboard** → **Notifications** → **Feature Toggles**
2. View table showing all tenants and their enabled features
3. Use filters to find specific tenants

#### Enable Features for a Tenant

1. Click on a tenant name or select **Manage Features**
2. Toggle features on/off:
   - **Basic Notifications**: Enable/disable all notifications
   - **Channels**: Push, SMS, Email, WhatsApp
   - **Campaigns**: Marketing campaign management
   - **Automation**: Triggered and scheduled campaigns
   - **Templates**: Custom template creation
   - **Analytics**: Performance metrics and reporting
   - **Export**: Data export functionality

3. Set limits:
   - **Max Campaigns per Month**: e.g., 10, 20, unlimited
   - **Max Notifications per Day**: e.g., 1000, 5000, unlimited
   - **Max Templates**: e.g., 10, 50, unlimited

4. Configure compliance:
   - **Compliance Mode**: Standard, Strict, Custom
   - **GDPR Enabled**: For EU customers
   - **DPDP Enabled**: For India customers
   - **Opt-in Required**: Require explicit consent

5. Click **Save Changes**

#### Bulk Enable Features

1. Navigate to **Feature Toggles** → **Bulk Actions**
2. Select multiple tenants using checkboxes
3. Choose features to enable/disable
4. Click **Apply to Selected Tenants**
5. Confirm the action

#### View Feature Toggle History

1. Select a tenant
2. Click **History** tab
3. View all changes with:
   - Who made the change
   - When it was changed
   - Old and new values
   - IP address and notes

#### Reset Features to Default

1. Select a tenant
2. Click **Reset to Defaults**
3. Confirm action
4. All features reset to standard configuration

### Monitoring Across Tenants

#### View System-Wide Metrics

1. Navigate to **Analytics** → **System Overview**
2. View aggregated metrics:
   - Total notifications sent today/week/month
   - Delivery rates by channel
   - Failed notifications by tenant
   - Top performing campaigns

#### Tenant Performance

1. Navigate to **Analytics** → **Tenant Performance**
2. View per-tenant metrics:
   - Notification volume
   - Delivery rates
   - Campaign effectiveness
   - Compliance status

### Managing System Templates

#### View System Templates

1. Navigate to **Templates** → **System Templates**
2. View all default templates used across tenants
3. Filter by:
   - Type (transactional, marketing)
   - Category (order, delivery, payment)
   - Region (India, US, EU, Global)

#### Create System Template

1. Click **New System Template**
2. Fill in details:
   - **Name**: Unique identifier (e.g., `order_confirmed_v2`)
   - **Description**: What this template is for
   - **Type**: Transactional, Marketing, Compliance, Event
   - **Category**: Order, Delivery, Payment, Account, Promotion
   - **Subject**: Email subject line (use #{variables})
   - **Body**: Message content (use #{variables})
   - **Channels**: Select applicable channels
   - **Region**: India, US, EU, Global
   - **Compliance Type**: DPDP, GDPR, CCPA, Standard

3. Define variables:
   ```
   #{customer_name} - Customer's full name
   #{order_number} - Order ID
   #{total_amount} - Order total
   #{tracking_url} - Link to track order
   ```

4. Preview template with sample data
5. Click **Create Template**

#### Regional Templates

**India-specific (DPDP Compliance):**
- Include consent statement
- Mention data processing
- Provide opt-out instructions

**EU-specific (GDPR Compliance):**
- Clear purpose statement
- Right to access information
- Unsubscribe link prominent

**US-specific (CAN-SPAM):**
- Physical address
- Unsubscribe option
- Honest subject lines

### Compliance Management

#### View Opt-out Requests

1. Navigate to **Compliance** → **Opt-out Requests**
2. View pending and processed requests
3. Export compliance report

#### Audit Logs

1. Navigate to **Compliance** → **Audit Logs**
2. Filter by:
   - Action type (opt-in, opt-out, consent)
   - Date range
   - Tenant
   - User
3. Export for compliance review

---

## Tenant Admin Guide

Tenant Admins manage notifications for their store.

### Getting Started

#### Check Available Features

1. Navigate to **Admin Dashboard** → **Notifications**
2. View enabled features badge
3. If a feature is disabled, contact super admin

### Managing Templates

#### View Templates

1. Navigate to **Notifications** → **Templates**
2. View available templates:
   - System templates (cannot be modified)
   - Custom templates (if feature enabled)

#### Create Custom Template

*Requires: custom_templates_enabled*

1. Click **New Template**
2. Fill in template details:
   - **Name**: Internal identifier
   - **Description**: Purpose of template
   - **Type**: Select type
   - **Category**: Select category
   - **Channels**: Which channels to use
   - **Subject**: Email subject (with variables)
   - **Body**: Message content

3. Add variables:
   ```
   Available variables depend on context:
   - Customer: #{customer_name}, #{customer_email}
   - Order: #{order_number}, #{order_total}
   - Store: #{store_name}, #{store_url}
   - Custom: Define your own
   ```

4. Apply branding (if enabled):
   - Upload logo
   - Set primary color
   - Set secondary color
   - Custom footer

5. Test template:
   - Send test notification
   - Verify across channels
   - Check appearance

6. Click **Save Template**

### Creating Campaigns

*Requires: campaigns_enabled*

#### Quick Campaign

1. Navigate to **Notifications** → **Campaigns** → **New Campaign**
2. Select **Quick Campaign** for immediate sending
3. Configure:
   - **Name**: Internal reference
   - **Template**: Choose template
   - **Target Audience**: All customers, VIP, Loyal, etc.
   - **Channels**: Email, SMS, Push (based on enabled features)
   - **Priority**: Low, Medium, High

4. Preview:
   - See how message appears
   - Test with sample data

5. Click **Send Now**

#### Scheduled Campaign

*Requires: campaign_scheduling_enabled*

1. Create campaign as above
2. Select **Schedule for Later**
3. Choose date and time
4. Set timezone
5. Click **Schedule Campaign**

#### Recurring Campaign

*Requires: campaign_automation_enabled*

1. Create campaign
2. Select **Recurring**
3. Configure recurrence:
   - **Pattern**: Daily, Weekly, Monthly, Custom
   - **Start Date**: When to begin
   - **End Date**: When to stop (optional)
   - **Time**: What time to send

4. Example use cases:
   - Weekly newsletter every Monday at 9 AM
   - Monthly promotional offer on 1st of month
   - Daily deal notification at 10 AM

### Target Audience

#### Predefined Segments

- **All Customers**: Everyone in your database
- **VIP**: High-value customers (configurable threshold)
- **Loyal**: Frequent purchasers
- **At Risk**: Haven't purchased recently
- **New**: Recently registered
- **Churned**: Inactive for extended period

#### Custom Filters

*Requires: advanced_analytics_enabled*

Create custom audience based on:
- **Purchase History**: Total spent, order count, average order value
- **Engagement**: Last order date, email open rate
- **Demographics**: Location, age (if collected)
- **Product Preferences**: Categories purchased

Example:
```
Customers who:
- Purchased in last 30 days
- Total spent > ₹5000
- Lives in Mumbai
- Subscribed to newsletters
```

### Campaign Management

#### Monitor Active Campaigns

1. Navigate to **Campaigns** → **Active**
2. View real-time metrics:
   - Recipients targeted
   - Sent count
   - Delivered count
   - Opened count
   - Clicked count

#### Pause/Resume Campaign

1. Find campaign in list
2. Click **Pause** to temporarily stop
3. Click **Resume** to continue
4. Useful for urgent changes or issues

#### Cancel Campaign

1. Find scheduled campaign
2. Click **Cancel**
3. Confirm cancellation
4. Cannot be undone

### Analytics

*Requires: analytics_enabled*

#### Campaign Performance

1. Navigate to **Analytics** → **Campaigns**
2. View metrics for each campaign:
   - **Delivery Rate**: % successfully delivered
   - **Open Rate**: % opened (email only)
   - **Click-Through Rate**: % clicked links
   - **Conversion Rate**: % completed desired action

3. Compare campaigns:
   - Which performed best
   - Which channel most effective
   - Best time to send

#### Notification Overview

1. Navigate to **Analytics** → **Overview**
2. View dashboard with:
   - Total sent today/week/month
   - Delivery rates by channel
   - Failed notifications
   - Top performing templates

#### Channel Performance

1. Navigate to **Analytics** → **Channels**
2. Compare performance across channels:
   - **Email**: Delivery rate, open rate, click rate
   - **SMS**: Delivery rate, response rate
   - **Push**: Delivery rate, interaction rate
   - **WhatsApp**: Delivery rate, read rate

### Export Data

*Requires: export_enabled*

#### Export Notifications

1. Navigate to **Analytics** → **Export**
2. Select date range
3. Choose format:
   - **CSV**: For Excel/Sheets
   - **JSON**: For processing

4. Click **Export**
5. Download file when ready

#### Export Campaign Data

1. Navigate to **Campaigns** → [Campaign]
2. Click **Export Campaign Data**
3. Includes:
   - All notifications sent
   - Delivery status
   - Engagement metrics
   - Recipient details

### Managing Customer Preferences

#### View Opt-out Requests

1. Navigate to **Notifications** → **Preferences** → **Opt-outs**
2. View customers who opted out
3. Respect preferences (automatically enforced)

#### Preference Summary

1. Navigate to **Analytics** → **Preferences**
2. View statistics:
   - % opted into each channel
   - % marketing enabled
   - Quiet hours distribution

---

## Best Practices

### Template Design

1. **Keep it Simple**: Clear, concise messaging
2. **Personalize**: Use customer name and relevant data
3. **Clear CTA**: Single, obvious call-to-action
4. **Mobile-First**: Most users on mobile
5. **Test Thoroughly**: Test on all channels before launch

### Campaign Timing

1. **Avoid Late Hours**: Respect customer time (check quiet hours)
2. **Weekday vs Weekend**: Different engagement rates
3. **Time Zones**: Consider customer location
4. **Seasonal**: Adjust for holidays, events
5. **Test and Learn**: A/B test send times

### Audience Segmentation

1. **Start Broad**: Test with larger segments first
2. **Refine Based on Data**: Use analytics to improve targeting
3. **Don't Over-segment**: Too small = limited insights
4. **Respect Preferences**: Never override opt-outs
5. **Regular Cleanup**: Remove inactive/invalid contacts

### Compliance

1. **Always Include Unsubscribe**: Make it easy to opt-out
2. **Honor Requests Immediately**: Process opt-outs right away
3. **Keep Records**: Maintain consent logs
4. **Update Regularly**: Keep templates compliant with laws
5. **Region-Specific**: Use appropriate templates per region

### Performance Optimization

1. **Monitor Delivery Rates**: Address issues quickly
2. **Clean Your List**: Remove bounces and invalid contacts
3. **Engagement-Based**: Focus on engaged users
4. **Frequency Caps**: Don't overwhelm customers
5. **Quality Over Quantity**: Better content = better results

---

## Troubleshooting

### Feature Not Available

**Problem**: Feature showing as "Not Enabled"

**Solution**:
1. Check feature toggles in admin panel
2. Contact super admin to enable feature
3. Verify subscription plan includes feature

### Notifications Not Sending

**Problem**: Campaign created but notifications not sending

**Checks**:
1. ✓ Campaign status is "Active"
2. ✓ Template is active
3. ✓ Recipients exist in target segment
4. ✓ Feature toggles enabled for channel
5. ✓ User preferences allow notifications
6. ✓ No quiet hours restriction
7. ✓ Daily/monthly limits not exceeded

**Solution**:
- Check campaign error logs
- Verify recipient preferences
- Contact support if persists

### Low Delivery Rates

**Problem**: Many notifications failing to deliver

**Channel-Specific Solutions**:

**Email:**
- Check SPF/DKIM records
- Verify sender domain reputation
- Review bounce reports
- Clean invalid addresses

**SMS:**
- Verify phone number format
- Check SMS credits/balance
- Verify sender ID approval
- Review carrier restrictions

**Push:**
- Verify FCM/APNS credentials
- Check device token validity
- Verify app is installed
- Review permission status

**WhatsApp:**
- Verify WhatsApp Business API setup
- Check message template approval
- Review rate limits
- Verify phone number validation

### Low Engagement

**Problem**: Notifications delivered but not opened/clicked

**Solutions**:
1. **Subject Lines**: Test different approaches
2. **Send Time**: Try different times
3. **Audience**: Better segmentation
4. **Content**: More relevant messaging
5. **Frequency**: Reduce sending frequency
6. **Channel**: Try different channel

### Template Errors

**Problem**: Template failing to render or sending with errors

**Solutions**:
1. Verify all variables defined
2. Check variable syntax: #{variable_name}
3. Test with sample data
4. Review template validation errors
5. Check for missing required fields

### Campaign Analytics Not Showing

**Problem**: Campaign sent but no analytics data

**Solutions**:
1. Verify analytics feature enabled
2. Wait 5-10 minutes for data to populate
3. Check that tracking pixels enabled
4. Verify links properly formatted
5. Contact support if data missing after 1 hour

---

## Getting Help

### Support Channels

- **Email**: support@pulss.app
- **Documentation**: https://docs.pulss.app/notifications
- **Status Page**: https://status.pulss.app
- **Community Forum**: https://community.pulss.app

### Before Contacting Support

Have ready:
1. Tenant ID
2. Campaign/Notification ID
3. Error messages or screenshots
4. Steps to reproduce issue
5. Expected vs actual behavior

---

## Keyboard Shortcuts

**Campaign Management:**
- `N` - New campaign
- `S` - Search campaigns
- `P` - Pause selected campaign
- `R` - Resume selected campaign

**Template Editor:**
- `Ctrl/Cmd + S` - Save template
- `Ctrl/Cmd + P` - Preview template
- `Ctrl/Cmd + T` - Test template

**Analytics:**
- `D` - Date range picker
- `E` - Export data
- `R` - Refresh data

---

## Changelog

### Version 1.0.0 (January 2025)
- Initial release
- Multi-channel support
- Campaign management
- Template system
- Analytics dashboard
- Feature toggles
- Compliance controls

---

## Glossary

- **Campaign**: Scheduled or automated notification to multiple recipients
- **Channel**: Delivery method (email, SMS, push, WhatsApp, in-app)
- **Compliance**: Following legal requirements (GDPR, DPDP, etc.)
- **Feature Toggle**: Super admin control for enabling/disabling features
- **Opt-in**: User explicitly consenting to receive notifications
- **Opt-out**: User choosing to stop receiving notifications
- **Quiet Hours**: Time period when notifications are not sent
- **Segment**: Group of users based on criteria
- **Template**: Reusable notification message with variables
- **Transactional**: Order/system notifications (cannot opt-out)
- **Marketing**: Promotional notifications (can opt-out)

---

For technical documentation, see [API Documentation](./NOTIFICATIONS_API_DOCUMENTATION.md) and [Architecture Guide](./NOTIFICATIONS_ARCHITECTURE.md).
