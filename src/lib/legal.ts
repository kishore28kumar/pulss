// Legal components and agreement management

export interface LegalDocument {
  id: string
  title: string
  content: string
  version: string
  lastUpdated: Date
  mandatory: boolean
  targetRole: 'admin' | 'customer' | 'all'
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'service_agreement',
    title: 'Software Service Agreement',
    content: `
# PULSS SOFTWARE SERVICE AGREEMENT

**IMPORTANT: PLEASE READ THIS AGREEMENT CAREFULLY BEFORE USING THE PULSS PLATFORM**

## 1. SERVICE PROVIDER
Pulss is a white-label e-commerce platform service provided by Pulss Technologies. We provide the software platform and technical infrastructure only.

## 2. PLATFORM ROLE & RESPONSIBILITIES
- **Pulss Role**: We are solely a technology service provider
- **We Provide**: Software platform, hosting, technical support, and payment processing facilitation
- **We Do NOT**:
  - Sell, manufacture, or distribute any products
  - Handle product quality, safety, or compliance
  - Manage customer service for end products
  - Take responsibility for business operations

## 3. BUSINESS OWNER (ADMIN) RESPONSIBILITIES
By using this platform, you agree that:
- You are solely responsible for all products sold through your store
- You handle all customer service, returns, and refunds
- You comply with all applicable laws and regulations for your business type
- You maintain proper licenses and permits for your business
- You are responsible for product descriptions, pricing, and availability
- You handle all tax obligations and business compliance

## 4. LIABILITY DISCLAIMER
- All transactions are between the business owner and their customers
- Pulss is not liable for product quality, delivery issues, or customer disputes
- Business owners indemnify Pulss against any claims arising from their operations
- Maximum liability limited to monthly service fees paid

## 5. INTELLECTUAL PROPERTY
- Pulss retains all rights to the platform software
- Business owners retain rights to their content and branding
- Mutual respect for intellectual property rights

## 6. DATA & PRIVACY
- Business data remains owned by the business owner
- Pulss maintains data security and privacy standards
- Compliance with applicable data protection laws

## 7. TERMINATION
Either party may terminate with 30 days notice. Upon termination:
- Business owner retains access to their data
- Platform access is revoked after grace period
- No refunds for partial months

## 8. ACCEPTANCE
By clicking "I Agree" and using this platform, you acknowledge:
- You have read and understood this agreement
- You accept full responsibility for your business operations
- You agree to indemnify Pulss against any related claims

**Version 1.0 | Last Updated: ${new Date().toLocaleDateString()}**
    `,
    version: '1.0',
    lastUpdated: new Date(),
    mandatory: true,
    targetRole: 'admin'
  },
  {
    id: 'customer_terms',
    title: 'Customer Terms of Service',
    content: `
# CUSTOMER TERMS OF SERVICE

## Welcome to Pulss Platform

This platform is provided by Pulss Technologies as a service to local businesses. Please read these terms carefully.

## 1. ABOUT THIS PLATFORM
- Pulss provides the technology platform only
- Each store is operated independently by local business owners
- Your purchases are directly from the individual store owner, not Pulss

## 2. YOUR RESPONSIBILITIES
- Provide accurate information during checkout
- Comply with store policies and terms
- Make payments as agreed
- Report any issues directly to the store

## 3. STORE OWNER RESPONSIBILITIES
- Store owners are solely responsible for:
  - Product quality and descriptions
  - Order fulfillment and delivery
  - Customer service and support
  - Returns and refunds
  - Legal compliance

## 4. PULSS ROLE
- We provide technology infrastructure only
- We do not handle customer service for individual stores
- We are not responsible for product quality or delivery
- Contact the store directly for order-related issues

## 5. PRIVACY & DATA
- Your data is handled according to our Privacy Policy
- Store owners may collect additional information per their policies
- You can request data deletion at any time

## 6. LIMITATION OF LIABILITY
- Pulss is not liable for store operations or product issues
- Maximum liability limited to platform-related technical issues
- Direct disputes with stores should be resolved with store owners

## 7. ACCEPTANCE
By using this platform, you agree to these terms and understand that:
- Your primary relationship is with the individual store
- Pulss is a technology service provider only
- Store owners are responsible for their business operations

**Version 1.0 | Last Updated: ${new Date().toLocaleDateString()}**
    `,
    version: '1.0',
    lastUpdated: new Date(),
    mandatory: true,
    targetRole: 'customer'
  },
  {
    id: 'privacy_policy',
    title: 'Privacy Policy',
    content: `
# PULSS PRIVACY POLICY

## 1. INFORMATION WE COLLECT
- Account information (email, name)
- Usage data and analytics
- Payment information (processed securely)
- Location data (with permission)

## 2. HOW WE USE INFORMATION
- Provide platform services
- Process payments
- Send important updates
- Improve platform functionality
- Prevent fraud and abuse

## 3. INFORMATION SHARING
- We do not sell personal information
- Store owners can access their customer data
- Third-party services (payment processors) as needed
- Legal requirements when necessary

## 4. DATA SECURITY
- Industry-standard encryption
- Secure data storage
- Regular security audits
- Access controls and monitoring

## 5. YOUR RIGHTS
- Access your data
- Correct inaccuracies
- Request deletion
- Data portability
- Opt out of communications

## 6. COOKIES & TRACKING
- Essential cookies for functionality
- Analytics cookies (can be disabled)
- No third-party advertising cookies

## 7. CONTACT US
For privacy questions: privacy@pulss.com

**Version 1.0 | Last Updated: ${new Date().toLocaleDateString()}**
    `,
    version: '1.0',
    lastUpdated: new Date(),
    mandatory: false,
    targetRole: 'all'
  }
]

export const COPYRIGHT_NOTICE = `
© ${new Date().getFullYear()} Pulss Technologies. All rights reserved.

Pulss is a registered trademark. This platform is provided as a service to independent businesses. Each store operates independently and is solely responsible for their products and services.
`

export const PLATFORM_DISCLAIMER = `
Platform Service Notice: Pulss provides technology infrastructure only. All products, services, and business operations are the sole responsibility of individual store owners. For order-related inquiries, please contact the store directly.
`