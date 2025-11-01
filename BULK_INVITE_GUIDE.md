# Bulk User Invite Feature Guide

## Overview

The Bulk User Invite feature allows tenant administrators to invite multiple users at once to join their store. This feature is controlled by super administrators and can be enabled or disabled per tenant.

## Key Features

- **Super Admin Control**: Only super admins can enable/disable bulk invites for tenant admins
- **Multiple Invite Methods**: 
  - Email list (manual entry)
  - CSV upload for bulk operations
- **Status Tracking**: Track invite status (pending, accepted, expired, cancelled)
- **Batch Management**: View history of bulk invite operations
- **Error Handling**: Clear feedback on validation errors and failed invites
- **Security**: Token-based invite system with 7-day expiration

## For Super Administrators

### Enabling Bulk Invites for a Tenant

1. **Access Super Admin Dashboard**
   - Navigate to `/super`
   - Click on the "Features" tab

2. **Select Tenant**
   - Choose the tenant you want to manage

3. **Enable Bulk Invite Feature**
   - Find "Bulk User Invites" in the feature list
   - Toggle it ON to enable for the selected tenant
   - Changes take effect immediately

4. **Monitor Usage**
   - Super admins can see invite statistics across all tenants
   - Track which tenants are actively using the feature

### Feature Flag Details

- **Flag Name**: `bulk_invite_enabled`
- **Category**: Administration
- **Default**: Disabled (false)
- **Scope**: Per-tenant

## For Tenant Administrators

### Prerequisites

- Bulk invite feature must be enabled by super admin
- Admin account with proper permissions
- Valid email addresses for invitees

### Accessing Bulk Invite

1. Sign in to your admin dashboard
2. Navigate to the Users or Team section
3. Look for "Bulk User Invites" option
4. If you don't see this option, contact your super administrator

### Method 1: Email List

**Best for**: Small batches (up to ~50 users)

1. **Select User Role**
   - Choose between "Customer" or "Admin"
   - This applies to all users in the batch

2. **Enter Email Addresses**
   - One email per line, or
   - Comma-separated, or
   - Semicolon-separated
   - Example:
     ```
     john@example.com
     jane@example.com
     bob@example.com
     ```

3. **Send Invites**
   - Click "Send Invites"
   - System validates all emails
   - Invalid emails are skipped with error messages

4. **Review Results**
   - View summary: successful, failed, skipped
   - Failed invites show specific error messages

### Method 2: CSV Upload

**Best for**: Large batches (50-1000 users)

1. **Download Template**
   - Click "Download Template"
   - Opens a CSV file with correct format

2. **CSV Format**
   ```csv
   email,role,name,phone
   user1@example.com,customer,John Doe,1234567890
   user2@example.com,admin,Jane Smith,0987654321
   ```

   **Columns**:
   - `email` (required): Valid email address
   - `role` (required): Either "customer" or "admin"
   - `name` (optional): User's full name
   - `phone` (optional): Phone number

3. **Upload CSV**
   - Click "Upload CSV"
   - Select your prepared CSV file
   - System validates and shows preview

4. **Review Preview**
   - Check the first 10 entries
   - See total count of valid invites
   - View any validation errors

5. **Send Invites**
   - Click "Send X Invites"
   - Monitor progress
   - View detailed results

### Managing Invites

#### Viewing Pending Invites

The dashboard shows all pending invites with:
- Email address
- User role
- Status (pending, accepted, expired, cancelled)
- Send date
- Expiration date

#### Resending Invites

For pending or expired invites:
1. Find the invite in the list
2. Click the resend button (↻)
3. New invite email is sent with fresh token
4. Expiration date is reset to 7 days

#### Cancelling Invites

To cancel a pending invite:
1. Find the invite in the list
2. Click the cancel button (⊘)
3. Invite is marked as cancelled
4. User cannot accept the invite anymore

#### Invite Statistics

View real-time statistics:
- **Pending**: Invites waiting to be accepted
- **Accepted**: Successfully registered users
- **Expired**: Invites past their expiration date
- **Total Sent**: All invites ever created

### Invite Batch History

View all previous bulk invite operations:
- Date and time of operation
- Method used (manual or CSV)
- Total invites sent
- Success/failure count
- Batch status

## For Invited Users

### Accepting an Invite

1. **Receive Invite Email**
   - Check your email inbox
   - Look for invite from the store
   - Click the invite link

2. **Complete Registration**
   - Enter your full name
   - Add phone number (optional)
   - Create a strong password (min 8 characters)
   - Confirm password

3. **Submit**
   - Click "Create Account"
   - Wait for confirmation
   - Redirected to sign in page

4. **Sign In**
   - Use your email and password
   - Access the store with your assigned role

### Invite Link Validity

- **Duration**: 7 days from send date
- **One-time use**: Cannot be reused after acceptance
- **Can be resent**: Contact admin if expired

### Troubleshooting

**"Invalid or expired invite"**
- Link may have expired (>7 days old)
- Link may have been cancelled by admin
- Link may have already been used
- Contact admin for new invite

**"User already exists"**
- Email is already registered
- Try signing in instead
- Contact admin if you forgot password

## API Reference

### Endpoints

**For Admins:**
- `POST /api/invites` - Create single invite
- `POST /api/invites/bulk` - Create bulk invites
- `GET /api/invites` - List invites with filters
- `GET /api/invites/stats` - Get invite statistics
- `GET /api/invites/batches` - List invite batches
- `POST /api/invites/:id/resend` - Resend invite
- `DELETE /api/invites/:id` - Cancel invite

**Public:**
- `POST /api/invites/accept` - Accept invite (no auth required)

**Super Admin:**
- `POST /api/invites/expire-old` - Expire old invites (maintenance)

### Request Examples

**Create Bulk Invites (Email List)**
```json
POST /api/invites/bulk
{
  "invites": [
    { "email": "user1@example.com", "role": "customer" },
    { "email": "user2@example.com", "role": "admin" }
  ],
  "method": "manual"
}
```

**Create Bulk Invites (CSV)**
```json
POST /api/invites/bulk
{
  "invites": [
    { 
      "email": "user1@example.com", 
      "role": "customer",
      "name": "John Doe",
      "phone": "1234567890"
    }
  ],
  "method": "csv"
}
```

**Accept Invite**
```json
POST /api/invites/accept
{
  "token": "abc123...",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "1234567890"
}
```

## Security Considerations

### Token Security
- Tokens are cryptographically secure (32-byte random)
- One-time use only
- Auto-expire after 7 days
- Cannot be reused after acceptance or cancellation

### Email Validation
- Format validation before sending
- Duplicate detection (same email, same tenant)
- Skip users that already exist

### Rate Limiting
- API endpoints are rate-limited
- Maximum 1000 invites per batch
- Prevents abuse and spam

### Access Control
- Only admins can create invites for their tenant
- Super admins can manage all invites
- Users cannot invite others to different tenants

## Best Practices

### For Super Admins
1. **Enable selectively**: Only enable for tenants that need it
2. **Monitor usage**: Check invite statistics regularly
3. **Review batches**: Ensure feature isn't being abused
4. **Communicate**: Inform tenant admins when enabling

### For Tenant Admins
1. **Verify emails**: Double-check email addresses before sending
2. **Use CSV for large batches**: More efficient than manual entry
3. **Clean up expired invites**: Resend or cancel old invites
4. **Track acceptance rate**: Monitor who's accepting invites
5. **Batch similar roles**: Group customers and admins separately

### For CSV Uploads
1. **Use the template**: Ensures correct format
2. **Validate data**: Check for typos before upload
3. **Test with small batch**: Try 5-10 invites first
4. **Keep records**: Save CSV files for reference
5. **Remove duplicates**: Clean data before upload

## Troubleshooting

### Common Issues

**"Bulk invite feature is not enabled"**
- Solution: Contact super administrator to enable the feature

**"Failed to send invites"**
- Check email format
- Verify internet connection
- Check for duplicate emails
- Review validation errors

**"CSV upload failed"**
- Verify CSV format matches template
- Check for special characters in emails
- Ensure required columns are present
- Try with smaller file

**"Invite not received"**
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for delivery
- Ask admin to resend

**"Cannot accept invite"**
- Check if link is expired
- Verify you're using the latest link
- Clear browser cache
- Try different browser

## Maintenance

### Automated Cleanup

The system automatically:
- Expires invites older than 7 days
- Updates invite status in real-time
- Cleans up duplicate pending invites

### Manual Maintenance

Super admins can:
- Run manual expire operation
- View system-wide invite statistics
- Monitor feature usage across tenants

## Future Enhancements

Planned improvements:
- Email templates customization
- SMS invite option
- Bulk role assignment
- Import from external systems
- Advanced filtering and search
- Invite expiration customization
- Welcome email customization

## Support

For assistance with bulk invites:

**Tenant Admins:**
- Contact your super administrator
- Check this guide for common issues
- Review API documentation for integration

**Super Admins:**
- Refer to super admin documentation
- Check system logs for errors
- Contact platform support if needed

## Summary

The Bulk User Invite feature streamlines user onboarding by allowing administrators to invite multiple users efficiently. With super admin controls, comprehensive tracking, and clear error handling, it provides a secure and user-friendly way to grow your user base.

Key benefits:
- ✅ Save time with bulk operations
- ✅ Track invite status in real-time
- ✅ Reduce manual errors with CSV upload
- ✅ Maintain security with token-based system
- ✅ Super admin control for governance
