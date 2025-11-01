# Two-Factor Authentication (2FA) User Guide

## Overview

Two-Factor Authentication (2FA) adds an extra layer of security to your Pulss account by requiring a unique code from your mobile device in addition to your password when signing in.

## What You'll Need

- Your Pulss account
- A smartphone or tablet
- An authenticator app (we recommend):
  - **Google Authenticator** (iOS/Android)
  - **Authy** (iOS/Android)
  - **Microsoft Authenticator** (iOS/Android)
  - **1Password** (iOS/Android/Desktop)

## Setting Up 2FA

### Step 1: Access Security Settings

1. Log in to your Pulss account
2. Navigate to your **Profile** or **Settings**
3. Click on **Security** or **Two-Factor Authentication**

### Step 2: Enable 2FA

1. Click the **Enable 2FA** button
2. A QR code will appear on your screen

### Step 3: Scan QR Code

1. Open your authenticator app
2. Tap the **+** or **Add** button
3. Choose **Scan QR Code** or **Scan Barcode**
4. Point your camera at the QR code on your screen

**Can't scan the code?** 
- Click "Enter key manually" below the QR code
- Copy the provided secret key
- In your authenticator app, choose "Enter key manually"
- Paste the key and give it a name (e.g., "Pulss")

### Step 4: Enter Verification Code

1. Your authenticator app will display a 6-digit code
2. Enter this code in the verification field
3. Click **Verify & Enable**

### Step 5: Save Backup Codes

**IMPORTANT:** You'll be shown 10 backup codes. These are crucial!

1. **Download** the codes as a text file
2. **Print** them and store them securely
3. **Copy** them to a password manager
4. **Each code can only be used once**

✅ 2FA is now enabled on your account!

## Signing In with 2FA

1. Enter your email and password as usual
2. You'll be prompted for a 2FA code
3. Open your authenticator app
4. Enter the 6-digit code shown for your Pulss account
5. Click **Verify**

**Note:** The code changes every 30 seconds, so you have plenty of time to enter it.

## Using Backup Codes

If you lose access to your authenticator app:

1. On the 2FA verification screen, click **Use backup code**
2. Enter one of your saved backup codes
3. Click **Verify**

**Remember:** Each backup code can only be used once. After using a code, it becomes invalid.

## Disabling 2FA

If you need to disable 2FA:

1. Go to **Security Settings**
2. Click **Disable 2FA**
3. Enter your account password to confirm
4. Click **Disable 2FA**

⚠️ **Warning:** Disabling 2FA makes your account less secure.

## Troubleshooting

### Code Not Working

**Issue:** "Invalid verification code" error

**Solutions:**
1. Make sure your device's time is correct (2FA codes are time-based)
2. Wait for a new code to generate (codes change every 30 seconds)
3. Check that you're using the correct account in your authenticator app
4. Try using a backup code instead

### Lost Authenticator Device

**Issue:** Can't access authenticator app

**Solutions:**
1. Use one of your backup codes to sign in
2. Once signed in, disable and re-enable 2FA with your new device
3. If you don't have backup codes, contact support

### Code Always Expires

**Issue:** Code expires before you can enter it

**Solutions:**
1. Check that your device's time is set to automatic
2. Synchronize time in your authenticator app (check app settings)
3. Try using a backup code which doesn't expire

### Can't Scan QR Code

**Issue:** QR code won't scan

**Solutions:**
1. Ensure your camera has permission to access
2. Try the "Enter key manually" option instead
3. Make sure there's good lighting
4. Clean your camera lens

## Best Practices

### ✅ Do's

- ✅ Save backup codes in multiple secure locations
- ✅ Keep your authenticator app updated
- ✅ Enable 2FA on multiple accounts
- ✅ Use a trusted authenticator app
- ✅ Test a backup code occasionally to ensure it works

### ❌ Don'ts

- ❌ Don't share your backup codes with anyone
- ❌ Don't store backup codes in plain text on your computer
- ❌ Don't screenshot your QR code and leave it in photos
- ❌ Don't use 2FA codes that arrive via SMS (use an app instead)
- ❌ Don't ignore 2FA prompts (they could indicate unauthorized access)

## Security Tips

1. **Use a Password Manager**: Combined with 2FA, this provides excellent security
2. **Regular Backups**: Backup your authenticator app data if the app supports it
3. **Multiple Devices**: Some authenticator apps allow syncing across devices
4. **Recovery Method**: Keep backup codes updated when you regenerate them
5. **Account Recovery**: Ensure your account recovery email is up to date

## FAQs

### Is 2FA required?

Currently, 2FA is optional but highly recommended for all accounts, especially those with admin privileges.

### Can I use SMS for 2FA?

We recommend using an authenticator app instead of SMS as it's more secure. SMS codes can be intercepted.

### What if I get a new phone?

1. Before switching phones:
   - Transfer your authenticator app data (if supported)
   - Or temporarily disable 2FA, then re-enable on your new device
   
2. After switching phones (if you forgot):
   - Use a backup code to log in
   - Set up 2FA again with your new device

### How many backup codes do I get?

You receive 10 backup codes when you first enable 2FA. Each can be used only once.

### Can I regenerate backup codes?

Currently, backup codes are generated once during 2FA setup. To get new codes, you'll need to disable and re-enable 2FA.

### Does 2FA work offline?

Yes! Authenticator apps generate codes offline based on time. You don't need an internet connection to generate codes.

## Need Help?

If you're experiencing issues with 2FA:

1. Check this troubleshooting guide first
2. Contact support at support@pulss.com
3. Include details about your issue:
   - What step you're on
   - Any error messages
   - What you've tried already

---

**Last Updated:** October 2025
**Version:** 1.0
