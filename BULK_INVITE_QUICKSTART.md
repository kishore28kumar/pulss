# Bulk User Invite - Quick Start Guide

Quick reference for using the bulk user invite feature.

## 🚀 Quick Setup (Super Admin)

1. Navigate to `/super` → **Features** tab
2. Select a tenant
3. Find **"Bulk User Invites"** in the list
4. Toggle it **ON**
5. ✅ Feature is now enabled for that tenant!

## 👤 For Tenant Admins

### Method 1: Email List (Quick & Easy)

```
1. Go to User Management page
2. Click "Email List" tab
3. Select role (Customer or Admin)
4. Paste emails (one per line):
   john@example.com
   jane@example.com
   bob@example.com
5. Click "Send Invites"
6. Done! 🎉
```

### Method 2: CSV Upload (For Large Batches)

```
1. Download template (bulk-invite-template.csv)
2. Fill in your data:
   email,role,name,phone
   user1@example.com,customer,John Doe,1234567890
   user2@example.com,admin,Jane Smith,0987654321
3. Upload CSV file
4. Review preview
5. Click "Send X Invites"
6. Done! 🎉
```

## 📊 What You'll See

### Statistics Dashboard
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Pending   │  Accepted   │   Expired   │    Total    │
│      15     │      30     │      5      │      52     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Invite List
Each invite shows:
- 📧 Email address
- 👤 Role (admin/customer)
- 🟡 Status badge (pending/accepted/expired)
- 📅 Sent and expiration dates
- ↻ Resend button (for expired invites)
- ⊘ Cancel button (for pending invites)

## 🔗 For Users Receiving Invites

1. Check your email
2. Click the invite link
3. Fill in:
   - Full Name
   - Phone (optional)
   - Password (8+ characters)
   - Confirm Password
4. Click "Create Account"
5. Sign in with your new credentials

## ⚡ Common Actions

### Resend an Expired Invite
```
1. Find the invite in the list
2. Click the ↻ (resend) button
3. New invite sent with fresh 7-day expiration
```

### Cancel a Pending Invite
```
1. Find the invite in the list
2. Click the ⊘ (cancel) button
3. Invite is cancelled and cannot be accepted
```

### Check Invite Status
```
Look at the status badge:
🟡 Pending  - Waiting for user to accept
🟢 Accepted - User has registered
🔴 Expired  - Invitation has expired
⚫ Cancelled - Invitation was cancelled
```

## 📁 CSV Template Format

```csv
email,role,name,phone
john@example.com,customer,John Doe,+1234567890
jane@example.com,customer,Jane Smith,+0987654321
admin@example.com,admin,Admin User,+1122334455
```

### Required Columns
- `email` - Valid email address
- `role` - Either "customer" or "admin"

### Optional Columns
- `name` - User's full name
- `phone` - Phone number with country code

## 🔒 Security Features

- ✅ Tokens expire after 7 days
- ✅ One-time use only
- ✅ Secure password requirements (8+ characters)
- ✅ Email validation
- ✅ Duplicate detection
- ✅ Rate limiting

## ⚠️ Common Issues

### "Feature not enabled"
- **Solution:** Contact super admin to enable feature

### "Invalid email format"
- **Solution:** Check email addresses for typos

### "User already exists"
- **Solution:** User is already registered, they can sign in

### "Invite expired"
- **Solution:** Ask admin to resend the invite

### CSV Upload Failed
- **Solution:** 
  - Check CSV format matches template
  - Ensure required columns are present
  - Remove special characters

## 📊 Limits

- **Maximum per batch:** 1000 invites
- **Invite expiration:** 7 days
- **CSV file size:** Reasonable (recommend < 5MB)
- **Rate limiting:** Applied to prevent abuse

## 🎯 Best Practices

### For Super Admins
- Only enable for tenants that need it
- Monitor usage through analytics
- Review batch statistics periodically

### For Tenant Admins
- Verify email addresses before sending
- Use CSV for batches over 50 users
- Group customers and admins separately
- Clean up expired invites regularly
- Track acceptance rates

### For CSV Uploads
- Use the provided template
- Test with 5-10 invites first
- Keep a copy of your CSV file
- Remove duplicates before upload
- Validate data in spreadsheet first

## 🆘 Need Help?

- **User Guide:** See `BULK_INVITE_GUIDE.md`
- **API Docs:** See `API_DOCUMENTATION.md`
- **Implementation:** See `BULK_INVITE_IMPLEMENTATION_SUMMARY.md`

## 🔗 Related Features

- **Feature Flags:** Control feature availability
- **User Management:** Manage all users
- **Analytics:** Track invite statistics

---

**Ready to start?** Enable the feature and send your first bulk invite! 🚀
