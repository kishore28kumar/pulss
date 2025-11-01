# Onboarding Validation & Setup Guide

## Overview

Enhanced onboarding process with real-time validation and live previews for WhatsApp, UPI, and Razorpay payment configurations. This ensures that all critical business information is correctly configured before going live.

## Key Features

### 1. **Real-Time Field Validation**
- WhatsApp number format validation
- UPI ID format verification
- Razorpay credentials validation
- Email and phone number validation

### 2. **Live Previews**
- WhatsApp chat button preview with working link
- UPI QR code generation and preview
- Payment methods availability preview
- Social media links verification

### 3. **Progressive Validation**
- Step-by-step validation
- Cannot proceed with invalid data
- Clear error messages and guidance
- Visual indicators for valid/invalid fields

## Supported Validations

### WhatsApp Number Validation

**Format:** 10-digit Indian mobile number starting with 6-9

**Valid Examples:**
- `9876543210`
- `91-9876543210`
- `+91 9876543210`

**Invalid Examples:**
- `1234567890` (doesn't start with 6-9)
- `98765` (too short)
- `abc9876543210` (contains letters)

**Validation Code:**
```typescript
import { validateWhatsAppNumber } from '@/lib/validationUtils'

const result = validateWhatsAppNumber('9876543210')
if (!result.isValid) {
  console.error(result.error)
}
```

### UPI ID Validation

**Format:** `username@provider`

**Valid Examples:**
- `9876543210@paytm`
- `john.doe@upi`
- `merchant.store@okaxis`

**Common Providers:**
- `@paytm`
- `@phonepe`
- `@googlepay`
- `@ybl` (Yes Bank)
- `@okaxis` (Axis Bank)
- `@oksbi` (State Bank)
- `@okicici` (ICICI Bank)
- `@okhdfcbank` (HDFC Bank)

**Validation Code:**
```typescript
import { validateUpiId } from '@/lib/validationUtils'

const result = validateUpiId('9876543210@paytm')
if (!result.isValid) {
  console.error(result.error)
}
```

### Razorpay Key ID Validation

**Format:** `rzp_test_XXXXXXXXXXXXXX` or `rzp_live_XXXXXXXXXXXXXX`

**Examples:**
- Test Key: `rzp_test_AbC123dEf456Gh`
- Live Key: `rzp_live_XyZ789pQr012St`

**Validation Code:**
```typescript
import { validateRazorpayKeyId } from '@/lib/validationUtils'

const result = validateRazorpayKeyId('rzp_test_AbC123dEf456Gh')
if (!result.isValid) {
  console.error(result.error)
}
```

### Razorpay Key Secret Validation

**Format:** 24+ alphanumeric characters

**Example:** `abcdef123456ghijklmnopqr`

**Security Note:** Never share your Razorpay Key Secret publicly. Store it securely on the server.

## Setting Up WhatsApp Integration

### Step 1: Get WhatsApp Business Number

1. **Use existing mobile number** or get new one for business
2. **Install WhatsApp Business** app on your phone
3. **Verify the number** via OTP
4. **Complete business profile** in WhatsApp Business

### Step 2: Configure in Pulss

1. Navigate to **Onboarding > Business Information**
2. Enter your WhatsApp number (10 digits)
3. See real-time validation and preview
4. Test the "Chat" button in preview

### Step 3: Customize Welcome Message

Default message template:
```
Hello [Business Name], I would like to inquire about...
```

To customize, update in `validationUtils.ts`:
```typescript
export const generateWhatsAppLink = (number: string, message?: string): string => {
  const formattedNumber = formatWhatsAppNumber(number)
  const defaultMessage = 'Hello, I would like to inquire about your products.'
  const encodedMessage = message || defaultMessage
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(encodedMessage)}`
}
```

### Step 4: Preview Component

The WhatsApp preview shows:
- ✅ Validation status
- 🔗 Working "Chat with [Business]" button
- 📱 How it appears to customers

**Preview Component:**
```tsx
<WhatsAppPreview
  whatsappNumber="9876543210"
  businessName="My Pharmacy"
  isValid={true}
/>
```

## Setting Up UPI Payments

### Step 1: Get UPI ID

**Option A: From Payment App**
1. Open Paytm/PhonePe/Google Pay
2. Go to Profile/Settings
3. Find "UPI ID" or "Payment Address"
4. Copy your UPI ID

**Option B: Create New UPI ID**
1. Download any UPI app (Paytm, PhonePe, Google Pay)
2. Link your bank account
3. Create a custom UPI ID
4. Verify with small test transaction

### Step 2: Configure in Pulss

1. Navigate to **Onboarding > Payment Information**
2. Enter your UPI ID
3. See real-time validation
4. QR code automatically generated on valid UPI ID

### Step 3: Test UPI QR Code

1. View the generated QR code in preview
2. Scan with any UPI app
3. Verify business name appears correctly
4. Make a small test payment

### Step 4: UPI QR Code Features

The preview shows:
- ✅ UPI ID validation
- 📱 Scannable QR code
- 💳 Your business name on payment screen
- 🔍 QR code ready for download

**Preview Component:**
```tsx
<PaymentOptionsPreview
  upiId="9876543210@paytm"
  upiIdValid={true}
  businessName="My Pharmacy"
/>
```

## Setting Up Razorpay Integration

### Step 1: Create Razorpay Account

1. Visit [razorpay.com](https://razorpay.com)
2. Sign up for merchant account
3. Complete KYC verification
4. Activate your account

### Step 2: Get API Credentials

1. Login to Razorpay Dashboard
2. Go to **Settings > API Keys**
3. Generate new key pair
4. Copy Key ID and Key Secret

**Important:** 
- Use **Test Keys** for testing
- Use **Live Keys** for production
- Never share Key Secret publicly

### Step 3: Configure in Pulss

1. Navigate to **Onboarding > Payment Information**
2. Enter Razorpay Key ID
3. Enter Razorpay Key Secret (stored securely)
4. See validation status
5. View enabled payment methods in preview

### Step 4: Test Payment Integration

**Test Mode:**
1. Use test Key ID: `rzp_test_...`
2. Make test payment with test cards
3. Verify payment success workflow

**Test Cards:**
```
Success: 4111 1111 1111 1111
Failed:  4111 1111 1111 1112
CVV: Any 3 digits
Expiry: Any future date
```

**Live Mode:**
1. Switch to live Key ID: `rzp_live_...`
2. Test with real small amount
3. Verify payment flows correctly
4. Check Razorpay dashboard for transaction

### Step 5: Enabled Payment Methods

With Razorpay, customers can pay via:
- 💳 Credit/Debit Cards (Visa, Mastercard, Rupay)
- 📱 UPI (any UPI app)
- 💰 Wallets (Paytm, PhonePe, etc.)
- 🏦 Net Banking
- 💵 EMI options (for eligible amounts)

## Validation Flow Integration

### In AdminOnboarding Component

```tsx
import { 
  validateWhatsAppNumber, 
  validateUpiId, 
  validateRazorpayKeyId 
} from '@/lib/validationUtils'
import { WhatsAppPreview } from '@/components/WhatsAppPreview'
import { PaymentOptionsPreview } from '@/components/PaymentOptionsPreview'

// State for validation
const [whatsappError, setWhatsappError] = useState<string>('')
const [upiError, setUpiError] = useState<string>('')

// Real-time validation
const handleWhatsAppChange = (value: string) => {
  setWhatsappNumber(value)
  const validation = validateWhatsAppNumber(value)
  setWhatsappError(validation.error || '')
}

const handleUpiIdChange = (value: string) => {
  setUpiId(value)
  const validation = validateUpiId(value)
  setUpiError(validation.error || '')
}

// Render with previews
<div className="space-y-4">
  <Input
    value={whatsappNumber}
    onChange={(e) => handleWhatsAppChange(e.target.value)}
    placeholder="9876543210"
  />
  {whatsappError && (
    <p className="text-sm text-red-600">{whatsappError}</p>
  )}
  
  {!whatsappError && whatsappNumber && (
    <WhatsAppPreview
      whatsappNumber={whatsappNumber}
      businessName={businessName}
      isValid={!whatsappError}
    />
  )}
</div>
```

### Block Navigation on Invalid Fields

```tsx
const canProceed = () => {
  const whatsappValid = validateWhatsAppNumber(whatsappNumber).isValid
  const upiValid = validateUpiId(upiId).isValid
  
  return whatsappValid && upiValid
}

<Button
  onClick={goToNextStep}
  disabled={!canProceed()}
>
  Continue
</Button>
```

## Validation Utilities API

### Available Functions

```typescript
// WhatsApp
validateWhatsAppNumber(number: string): { isValid: boolean; error?: string }
formatWhatsAppNumber(number: string): string
generateWhatsAppLink(number: string, message?: string): string

// UPI
validateUpiId(upiId: string): { isValid: boolean; error?: string }
generateUpiLink(upiId: string, amount?: number, name?: string, note?: string): string

// Razorpay
validateRazorpayKeyId(keyId: string): { isValid: boolean; error?: string }
validateRazorpayKeySecret(keySecret: string): { isValid: boolean; error?: string }

// General
validatePhoneNumber(phone: string): { isValid: boolean; error?: string }
validateEmail(email: string): { isValid: boolean; error?: string }
```

## Error Messages

### WhatsApp Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "WhatsApp number is required" | Empty field | Enter 10-digit number |
| "Invalid WhatsApp number..." | Wrong format | Use 10 digits starting with 6-9 |

### UPI Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "UPI ID is required" | Empty field | Enter UPI ID |
| "Invalid UPI ID format..." | Wrong format | Use format: name@provider |
| "Note: Please ensure..." | Uncommon provider | Double-check UPI ID is correct |

### Razorpay Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Razorpay Key ID is required" | Empty field | Enter Key ID from dashboard |
| "Invalid Razorpay Key ID..." | Wrong format | Check format: rzp_test/live_... |
| "Razorpay Key Secret is required" | Empty field | Enter Key Secret |
| "Invalid Razorpay Key Secret..." | Wrong format | Should be 24+ characters |

## Testing Checklist

### WhatsApp Integration
- [ ] Enter valid 10-digit number
- [ ] See green checkmark on validation
- [ ] Preview shows WhatsApp button
- [ ] Click button opens WhatsApp web/app
- [ ] Message template is correct

### UPI Integration
- [ ] Enter valid UPI ID
- [ ] QR code generates automatically
- [ ] Scan QR with UPI app
- [ ] Business name appears correctly
- [ ] Test payment works

### Razorpay Integration
- [ ] Enter test Key ID and Secret
- [ ] Validation passes
- [ ] Payment methods shown in preview
- [ ] Test payment with test card
- [ ] Check Razorpay dashboard for transaction
- [ ] Switch to live keys for production

## Best Practices

### 1. **Use Test Mode First**
- Always test with test credentials
- Verify all flows work correctly
- Only switch to live after thorough testing

### 2. **Keep Credentials Secure**
- Never commit credentials to git
- Store in environment variables
- Use server-side validation for Razorpay secret

### 3. **Provide Clear Instructions**
- Show examples of valid formats
- Display validation errors immediately
- Offer help text for each field

### 4. **Test Real Workflows**
- Send test WhatsApp message
- Scan and pay via UPI QR code
- Complete test Razorpay payment

### 5. **Monitor Setup Completion**
- Track which validations fail most
- Provide in-app guidance
- Offer setup support if needed

## Troubleshooting

### WhatsApp button not working

**Check:**
1. Number is validated and correct
2. WhatsApp Business is installed on the number
3. Number is active and not blocked
4. Browser allows opening WhatsApp links

### UPI QR code not scanning

**Check:**
1. UPI ID is correct and active
2. QR code is clear and not blurry
3. Scanner app is up to date
4. Try different UPI apps

### Razorpay payments failing

**Check:**
1. Using correct mode (test vs live) keys
2. Account is activated (for live)
3. KYC is complete (for live)
4. Test with known-good test card
5. Check Razorpay dashboard for errors

## Support Resources

- **WhatsApp Business:** [business.whatsapp.com](https://business.whatsapp.com)
- **Razorpay Docs:** [razorpay.com/docs](https://razorpay.com/docs)
- **UPI Help:** Your bank's customer support
- **Pulss Support:** Check /help page in platform

## Database Fields

The onboarding validation status is stored in `store_settings`:

```sql
whatsapp_verified BOOLEAN DEFAULT false
upi_verified BOOLEAN DEFAULT false
razorpay_key_id TEXT
razorpay_key_secret TEXT  -- Encrypted
razorpay_verified BOOLEAN DEFAULT false
onboarding_completed BOOLEAN DEFAULT false
onboarding_step INTEGER DEFAULT 0
```

## Future Enhancements

Planned improvements:
- [ ] SMS verification for WhatsApp number
- [ ] Automated UPI verification via test payment
- [ ] Razorpay webhook validation
- [ ] Multi-language support for chat templates
- [ ] Custom QR code branding
- [ ] Payment analytics integration
