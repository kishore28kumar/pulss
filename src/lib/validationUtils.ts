/**
 * Validation utilities for onboarding forms
 */

// WhatsApp number validation (Indian format)
export const validateWhatsAppNumber = (number: string): { isValid: boolean; error?: string } => {
  // Remove all non-digit characters
  const cleaned = number.replace(/\D/g, '')
  
  // Check for Indian mobile number format
  // Should be 10 digits starting with 6-9, or with country code +91 (13 digits total)
  const indianMobileRegex = /^([6-9]\d{9}|91[6-9]\d{9})$/
  
  if (!cleaned) {
    return { isValid: false, error: 'WhatsApp number is required' }
  }
  
  if (!indianMobileRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Invalid WhatsApp number. Enter 10-digit Indian mobile number starting with 6-9' 
    }
  }
  
  return { isValid: true }
}

// UPI ID validation
export const validateUpiId = (upiId: string): { isValid: boolean; error?: string } => {
  // UPI ID format: username@provider
  // Examples: 9876543210@paytm, name@upi, merchant.name@bank
  const upiRegex = /^[\w.-]+@[\w.-]+$/
  
  if (!upiId) {
    return { isValid: false, error: 'UPI ID is required' }
  }
  
  if (!upiRegex.test(upiId)) {
    return { 
      isValid: false, 
      error: 'Invalid UPI ID format. Should be like: yourname@bank or 9876543210@paytm' 
    }
  }
  
  // Check for common UPI providers
  const commonProviders = ['paytm', 'phonepe', 'googlepay', 'okaxis', 'oksbi', 'okicici', 'okhdfcbank', 'ybl', 'upi']
  const provider = upiId.split('@')[1]?.toLowerCase()
  
  if (provider && !commonProviders.some(p => provider.includes(p))) {
    return {
      isValid: true, // Still valid, just a warning
      error: 'Note: Please ensure this UPI ID is correct and active'
    }
  }
  
  return { isValid: true }
}

// Razorpay Key ID validation
export const validateRazorpayKeyId = (keyId: string): { isValid: boolean; error?: string } => {
  // Razorpay Key ID format: rzp_test_XXXXX or rzp_live_XXXXX
  const razorpayKeyRegex = /^rzp_(test|live)_[A-Za-z0-9]{14}$/
  
  if (!keyId) {
    return { isValid: false, error: 'Razorpay Key ID is required' }
  }
  
  if (!razorpayKeyRegex.test(keyId)) {
    return { 
      isValid: false, 
      error: 'Invalid Razorpay Key ID. Should start with rzp_test_ or rzp_live_ followed by 14 characters' 
    }
  }
  
  return { isValid: true }
}

// Razorpay Key Secret validation
export const validateRazorpayKeySecret = (keySecret: string): { isValid: boolean; error?: string } => {
  // Razorpay Key Secret is typically 24 alphanumeric characters
  const razorpaySecretRegex = /^[A-Za-z0-9]{24,}$/
  
  if (!keySecret) {
    return { isValid: false, error: 'Razorpay Key Secret is required' }
  }
  
  if (!razorpaySecretRegex.test(keySecret)) {
    return { 
      isValid: false, 
      error: 'Invalid Razorpay Key Secret. Should be at least 24 alphanumeric characters' 
    }
  }
  
  return { isValid: true }
}

// Phone number validation
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const cleaned = phone.replace(/\D/g, '')
  const indianMobileRegex = /^([6-9]\d{9}|91[6-9]\d{9})$/
  
  if (!cleaned) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  if (!indianMobileRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Invalid phone number. Enter 10-digit Indian mobile number' 
    }
  }
  
  return { isValid: true }
}

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true }
}

// Format WhatsApp number for display and linking
export const formatWhatsAppNumber = (number: string): string => {
  const cleaned = number.replace(/\D/g, '')
  
  // If it's 10 digits, add country code
  if (cleaned.length === 10) {
    return `91${cleaned}`
  }
  
  // If it already has country code, return as is
  return cleaned
}

// Generate WhatsApp chat link
export const generateWhatsAppLink = (number: string, message?: string): string => {
  const formattedNumber = formatWhatsAppNumber(number)
  const encodedMessage = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${formattedNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

// Generate UPI payment link (for QR code generation)
export const generateUpiLink = (upiId: string, amount?: number, name?: string, note?: string): string => {
  const params = new URLSearchParams({
    pa: upiId, // Payee address
    ...(name && { pn: name }), // Payee name
    ...(amount && { am: amount.toString() }), // Amount
    ...(note && { tn: note }), // Transaction note
    cu: 'INR' // Currency
  })
  
  return `upi://pay?${params.toString()}`
}
