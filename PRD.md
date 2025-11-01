# Pulss - Enterprise White-Label Chemist Platform

A comprehensive multi-tenant pharmacy management system that enables chemists to run their digital operations with full customization, real-time features, and integrated payment/delivery solutions.

**Experience Qualities**:
1. **Professional** - Clean, medical-grade interface that builds trust with healthcare consumers
2. **Efficient** - Streamlined workflows that minimize clicks and maximize productivity for busy pharmacists
3. **Reliable** - Enterprise-grade stability with real-time updates and offline-capable PWA functionality

**Complexity Level**: Complex Application (advanced functionality, accounts)
Multi-tenant SaaS with role-based access, real-time features, payment processing, prescription management, and extensive integration capabilities requiring sophisticated state management and security.

## Essential Features

### Multi-Tenant Management
- **Functionality**: Super admin creates tenants with setup codes, manages global settings
- **Purpose**: Enables white-label deployment across multiple pharmacies
- **Trigger**: Super admin dashboard access
- **Progression**: Create tenant → Generate setup code → Admin registers → Tenant operational
- **Success criteria**: Tenant isolation, secure onboarding, proper role assignment

### Prescription Management
- **Functionality**: Upload, review, and approve prescriptions for controlled medicines
- **Purpose**: Ensures regulatory compliance for prescription-only medicines
- **Trigger**: Customer adds Rx-required product to cart
- **Progression**: Upload prescription → Pharmacist review → Approval/rejection → Order processing
- **Success criteria**: Regulatory compliance, clear approval workflow, audit trail

### Real-time Order Management
- **Functionality**: Live order updates, delivery tracking, status changes
- **Purpose**: Keeps all stakeholders informed of order progress
- **Trigger**: Order placement, status updates, delivery events
- **Progression**: Order placed → Real-time notifications → Status updates → Delivery tracking
- **Success criteria**: Sub-second updates, reliable WebSocket connections, offline resilience

### Integrated Payment Processing
- **Functionality**: Multiple payment providers (Razorpay, Stripe, UPI), wallet management
- **Purpose**: Flexible payment options to maximize conversion
- **Trigger**: Checkout initiation
- **Progression**: Select payment → Provider integration → Webhook validation → Order confirmation
- **Success criteria**: Secure transactions, multiple provider support, automated reconciliation

### Feature Flag System
- **Functionality**: Runtime enable/disable of features per tenant without rebuilds
- **Purpose**: Flexible feature rollout and tenant-specific configurations
- **Trigger**: Admin settings modification
- **Progression**: Toggle feature → Update database → Immediate UI reflection
- **Success criteria**: No rebuild required, instant activation, proper state isolation

## Edge Case Handling
- **Network Failures**: Offline-first PWA with sync when online
- **Payment Failures**: Retry mechanisms and manual reconciliation tools
- **Prescription Rejections**: Clear communication and resubmission workflows
- **Inventory Shortages**: Real-time stock updates and backorder management
- **Multi-warehouse**: Location-aware inventory and delivery optimization
- **Provider Outages**: Graceful degradation with fallback options

## Design Direction
The design should feel professional and medical-grade, building trust with healthcare consumers while maintaining efficiency for busy pharmacy staff - clean, modern interface with subtle healthcare-appropriate styling that emphasizes clarity and reliability over flashy elements.

## Color Selection
Complementary (medical trust blue with warm accent)
Primary blue conveys medical trust and professionalism, with warm orange accents for calls-to-action to create approachable contrast against the clinical foundation.

- **Primary Color**: Medical Blue (#2563EB) - Conveys trust, professionalism, healthcare authority
- **Secondary Colors**: Soft Gray (#F8FAFC) for backgrounds, Clean White (#FFFFFF) for cards
- **Accent Color**: Warm Orange (#EA580C) for CTAs, notifications, and interactive elements
- **Foreground/Background Pairings**:
  - Primary (#2563EB): White text (#FFFFFF) - Ratio 5.2:1 ✓
  - Secondary (#F8FAFC): Dark text (#1E293B) - Ratio 13.1:1 ✓
  - Accent (#EA580C): White text (#FFFFFF) - Ratio 4.9:1 ✓
  - Background (#FFFFFF): Dark text (#1E293B) - Ratio 16.1:1 ✓

## Font Selection
Clean, highly legible sans-serif that conveys medical professionalism while maintaining excellent readability across devices and contexts.

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter SemiBold/24px/normal spacing  
  - H3 (Subsections): Inter Medium/18px/normal spacing
  - Body Text: Inter Regular/16px/relaxed line height
  - Small Text: Inter Regular/14px/relaxed line height

## Animations
Subtle, purposeful animations that enhance usability without feeling unprofessional - focusing on state transitions, loading feedback, and gentle micro-interactions that guide attention.

- **Purposeful Meaning**: Smooth transitions communicate system responsiveness and guide user attention to important state changes
- **Hierarchy of Movement**: Critical alerts and real-time updates get priority animation treatment, while secondary interactions use minimal motion

## Component Selection
- **Components**: Heavy use of Card for information grouping, Dialog for modals, Form components for data entry, Table for order management, Badge for status indicators, Button variants for different action priorities
- **Customizations**: Medical-themed Badge colors for prescription status, enhanced Table with real-time updates, custom Map component for delivery tracking
- **States**: Clear loading, success, error, and disabled states for all interactive elements with appropriate color coding
- **Icon Selection**: Phosphor icons emphasizing medical/pharmacy context (pill, stethoscope, location, etc.)
- **Spacing**: Generous padding (p-6, p-8) for clinical feel, consistent gap-4/gap-6 for related elements
- **Mobile**: Stack-first layouts with progressive enhancement, touch-friendly button sizing (min-44px), collapsible navigation for delivery staff mobile use