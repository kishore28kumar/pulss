# Pulss - White-Label E-Commerce Platform

A comprehensive white-label e-commerce platform designed for pharmacies, grocery stores, and local businesses. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🎨 **NEW: Advanced Tenant Branding & White-Label System**

**Complete branding control with custom domains and white-labeling!**

✨ **Key Features:**
- 🎨 **Standard Branding**: Logo, colors, themes, favicon - enabled for all tenants
- 🚀 **Advanced Features**: Custom domains, white-label mode, email branding - super admin controlled
- 🌐 **Custom Domains**: Use your own domain (e.g., pharmacy.mycompany.com) with DNS verification & SSL
- 🔒 **Permission Controls**: Two-tier system with standard features by default, advanced features require approval
- 📊 **Complete Audit Trail**: Track all branding changes with history and webhooks
- 🔧 **Multi-Brand Support**: Manage multiple brands for partners and resellers

📖 **[View Complete Documentation](#advanced-branding-system)** | **[API Reference](./BRANDING_API_REFERENCE.md)** | **[Setup Guide](./CUSTOM_DOMAIN_SETUP_GUIDE.md)**

## 🚀 **NEW: Enterprise Multi-Tenancy**

**The platform now has complete multi-tenant architecture with strict data isolation!**

✨ **Production-Ready Features:**
- 🏢 **Tenant Model**: Complete tenant management with subscriptions and settings
- 🔒 **Strict Isolation**: Multi-layer data isolation (database, application, authentication)
- 🎫 **JWT with tenant_id**: Automatic tenant scoping for all authenticated requests
- 🛡️ **Security**: Role-based access control with zero vulnerabilities (CodeQL verified)
- ⚙️ **Management API**: Full CRUD for tenants with advanced settings
- 📚 **Documentation**: 60KB+ of comprehensive guides and best practices
- 🚀 **Ready for B2B SaaS**: White-label and enterprise deployments

📖 **[Read Full Documentation](./MULTI_TENANCY_README.md)** | **[Quick Start Guide](./MULTI_TENANCY_QUICK_START.md)** | **[Architecture](./MULTI_TENANCY_ARCHITECTURE.md)** | **[Deployment Checklist](./MULTI_TENANCY_DEPLOYMENT_CHECKLIST.md)**
feature/auth-system

## 🎨 **NEW: World-Class UI/UX Upgrade**

**The platform now features a complete visual overhaul matching leading e-commerce platforms!**

✨ **Key Visual Enhancements:**

- 🎭 **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- 💎 **Modern Design**: Rounded corners, gradients, shadows, and glassmorphism
- ⚡ **Performance**: Skeleton loaders and optimized rendering
- 🌓 **Dark Mode**: Beautiful light/dark theme switching
- 📱 **Mobile First**: Enhanced responsive design with smooth mobile menu
- 🎯 **Micro-interactions**: Delightful hover effects and button animations
- 🛍️ **Shopping Experience**: Enhanced product cards with ratings, quick view, and wishlist
- 🔔 **Toast Notifications**: Beautiful feedback for all user actions
- 🎨 **Enhanced Badges**: Animated badges for NEW, SALE, TRENDING products
- 📊 **Better Discovery**: Recommended, Best Sellers, Recently Viewed sections

📖 **[View UI/UX Documentation](#uiux-components-guide)** | **[Customization Guide](#customizing-uiux)**

## ⚡ Major Update: Supabase → Node.js/PostgreSQL

**The platform has been migrated from Supabase to a self-hosted Node.js/Express + PostgreSQL stack!**

📖 **[Read Migration Guide](./MIGRATION_STATUS.md)** | **[Detailed Docs](./SUPABASE_TO_NODEJS_MIGRATION.md)** | **[Theming Guide](./THEMING_GUIDE.md)** | **[Theme Showcase](./THEME_SHOWCASE.md)**

### Benefits

- ✅ **Full Control**: Own your infrastructure and data
- ✅ **No Vendor Lock-in**: Open source stack (Node.js + PostgreSQL)
- ✅ **Cost Savings**: No usage-based pricing
- ✅ **Self-Hosted**: Deploy anywhere (VPS, cloud, on-premise)
- ✅ **Customizable**: Extend backend as needed

## 🏥 Features

## 💳 **NEW: Advanced Billing & Subscription System**

**Enterprise-grade billing with Indian payment gateway integration and GST compliance!**

✨ **Key Billing Features:**

- 💰 **Payment Gateways**: Razorpay, Cashfree, Paytm integration
- 📊 **Subscription Plans**: Flexible monthly, quarterly, and annual billing
- 📝 **GST Compliance**: E-invoicing, GSTIN validation, tax receipts
- 🎟️ **Coupon System**: Percentage and fixed discounts with advanced rules
- 📈 **Usage-Based Billing**: Track and bill for orders, products, API calls, storage
- ⏱️ **Trial Management**: Configurable trial periods with auto-conversion
- 💸 **Refund Management**: Full and partial refunds with approval workflow
- 📧 **Email Notifications**: Automated billing event notifications
- 🔐 **Super Admin Controls**: Feature permissions per tenant
- 📊 **Billing Analytics**: Revenue tracking, subscription metrics, coupon analytics

📖 **[View Billing Documentation](./BILLING_SYSTEM.md)**

### Super Admin Features

- **Multi-tenant Management**: Create and manage unlimited pharmacy stores
- **QR Code Generation**: Generate unique QR codes for each store's customer app
- **Brand Management**: Upload and manage the main Pulss logo
- **Theme System**: Create and manage 10+ themes for different store types
- **Analytics Dashboard**: View revenue, orders, and performance across all stores
- **Easy Setup**: Simple form-based tenant creation with auto-generated admin credentials
- **Billing Management**: Manage subscription plans, coupons, and tenant billing
- **Feature Permissions**: Control advanced features per tenant

### Store Admin Features

- **Store Onboarding**: Complete setup flow with logo, address, payment details
- **PWA Icon Customization**: Upload custom app icons and favicons for branded PWA installations
- **Product Management**: CSV bulk upload with category auto-population
- **Visual Content**: Upload carousel images, hero banners, splash screens
- **Order Management**: Real-time notifications with sound alerts
- **Customer Management**: Track registered customers and loyalty programs
- **WhatsApp Integration**: Direct customer communication via WhatsApp

### Customer Features

- **Modern Storefront**: Beautiful product catalog with category browsing
- **Health Search**: Search medicines by disease/condition (AI-powered)
- **Prescription Upload**: Upload prescriptions for Rx-required medicines
- **Multiple Payment Options**: UPI, COD, Credit (with approval), Card payments
- **Guest Checkout**: Shop without registration, provide details at checkout
- **WhatsApp Support**: Direct contact with store admin

### Technical Features


- **Progressive Web App (PWA)**: Installable mobile app experience with per-tenant custom icons
- **Multi-tenant Architecture**: Secure tenant isolation
- **Real-time Updates**: Live order status and inventory updates
- **Responsive Design**: Works perfectly on all devices
- **Theme System**: Easy branding customization with per-tenant themes and colors
- **Dynamic Manifest**: Tenant-specific PWA manifests with custom icons, names, and branding

- **Progressive Web App (PWA)**: Installable mobile app experience
- **Multi-tenant Architecture**: Secure tenant isolation
- **Real-time Updates**: Live order status and inventory updates
- **Responsive Design**: Works perfectly on all devices
- **Theme System**: Easy branding customization
  copilot/implement-theming-and-branding-features
- **🎨 Dynamic Theming**: Light/dark mode with custom color schemes
- **🏷️ White-Label Ready**: Complete branding flexibility
- **👥 Community Features**: Changelog, feedback widget, Discord/Slack integration

## 🎨 Advanced Branding System

### Complete Branding Control with Permission Management

Pulss now includes an enterprise-grade branding system with two-tier permission controls:

#### Standard Branding Features (Enabled for All Tenants)
- ✅ **Logo Upload**: Light and dark mode logos
- ✅ **Color Customization**: Primary, secondary, accent, text, and background colors
- ✅ **Theme Selection**: Choose from 10+ predefined themes
- ✅ **Favicon**: Custom browser tab icon
- ✅ **Login Page**: Customize title, subtitle, and background
- ✅ **Company Info**: Name, address, contact details, social media

#### Advanced Features (Requires Super Admin Approval)
- 🚀 **Custom Domains**: Use your own domain (e.g., pharmacy.mycompany.com)
  - DNS verification with TXT records
  - Automatic SSL certificate provisioning (Let's Encrypt)
  - Domain status monitoring
- 🏷️ **White-Label Mode**: Completely hide platform branding
- 🎨 **Custom Footer**: Add custom HTML footer content
- 📄 **Custom Legal Pages**: Link to your own terms, privacy policy
- 📧 **Email Branding**: Customize email templates and colors
- 💻 **Custom CSS**: Advanced styling capabilities
- 🏢 **Multi-Brand Support**: Manage multiple brands (for partners/resellers)
- 🔌 **API Access**: Programmatic branding updates via REST API

#### Permission Control Workflow
1. All tenants get standard branding features by default
2. Super admin reviews and approves requests for advanced features
3. Approved tenants gain access to custom domains, white-labeling, etc.
4. Complete audit trail tracks all changes and approvals

#### Documentation & Guides
- 📖 [Architecture Documentation](./BRANDING_ARCHITECTURE.md) - System design and technical details
- 📚 [API Reference](./BRANDING_API_REFERENCE.md) - Complete API documentation with examples
- 🚀 [Custom Domain Setup Guide](./CUSTOM_DOMAIN_SETUP_GUIDE.md) - Step-by-step DNS configuration
- 📊 [Implementation Summary](./BRANDING_SYSTEM_SUMMARY.md) - Complete feature overview

---

## 🎨 Branding & Theming System

### Dynamic Theme Configuration

Pulss includes a world-class theming system with:

#### Light/Dark Mode Support

- **Automatic System Detection**: Respects user's OS preferences
- **Manual Toggle**: Users can override with light, dark, or system mode
- **Persistent Settings**: Theme preferences saved across sessions

#### Pre-configured Themes

Choose from 10+ professionally designed themes:

- **Healthcare Professional**: Medical blue with trustworthy feel
- **Fresh Market**: Vibrant green for groceries
- **Luxury Boutique**: Elegant black and gold for fashion
- **Tech Hub**: Modern blue and purple for electronics
- **Wellness Center**: Calming teal for health stores
- **Neighborhood Store**: Warm earth tones for local shops
- **Beauty & Cosmetics**: Elegant pink theme
- **Organic & Natural**: Sustainable green theme
- **Sports & Fitness**: Energetic orange and blue
- **Artisan & Craft**: Creative purple theme

#### White-Label Configurations

Each theme includes complete white-label setup:

```typescript
// Example: Healthcare theme configuration
{
  theme: {
    colors: {
      primary: 'oklch(0.47 0.13 264)',    // Medical blue
      secondary: 'oklch(0.97 0.01 264)',
      accent: 'oklch(0.55 0.15 142)',     // Health green
      // ... more colors
    }
  },
  branding: {
    primaryFont: "'Inter', sans-serif",
    secondaryFont: "'Inter', sans-serif"
  }
}
```

### Admin Branding Features

#### Logo & Favicon Management

- **Logo Upload**: Support for PNG, SVG, JPG (recommended: 300x100px)
- **Favicon Upload**: ICO or PNG format (32x32px)
- **Real-time Preview**: See changes instantly
- **Multiple Format Support**: Automatic optimization

#### Custom Color Palette

Override any theme color:

- Primary brand color
- Secondary supporting color
- Accent highlights
- Background colors
- Text colors (foreground)
- Border and muted colors

#### Typography Customization

- **Primary Font**: For headings and important text
- **Secondary Font**: For body text and descriptions
- **Google Fonts Support**: Easy integration
- **System Fonts**: Optimized performance

**Popular Font Combinations:**

- Playfair Display + Source Sans Pro
- Montserrat + Open Sans
- Lora + Merriweather
- Raleway + Lato

#### Custom CSS

Advanced users can add custom CSS for:

- Component-specific styling
- Custom animations
- Layout modifications
- Brand-specific adjustments

### Using the Branding Manager

#### For Super Admins

1. **Access Branding Manager**

   ```
   Navigate to: /super → Branding Tab
   ```

2. **Upload Logo**
   - Click "Logo Upload"
   - Select your logo file (PNG recommended)
   - Preview and confirm

3. **Configure Colors**
   - Use color picker or enter hex/oklch values
   - Real-time preview available
   - Reset to theme defaults anytime

4. **Set Custom Fonts**

   ```
   Primary Font: 'Your Font', sans-serif
   Secondary Font: 'Your Font', sans-serif
   ```

5. **Export Configuration**
   - Click "Export Config"
   - Save JSON file for backup
   - Import on other instances

#### For Store Admins

Store admins inherit the branding settings but can:

- Upload store-specific logo
- Choose from available themes
- Toggle light/dark mode

### Community & Ecosystem Features

#### Public Changelog

Keep users informed about updates:

- **Version Tracking**: Organized by release version
- **Change Categories**: Features, Improvements, Bug Fixes
- **Public Display**: Visible to all users
- **Admin Management**: Easy entry creation

#### Feedback Widget

Collect user feedback seamlessly:

- **Fixed Position Button**: Always accessible
- **Category Selection**: Bug Reports, Feature Requests, etc.
- **Email Integration**: Optional contact for responses
- **Webhook Support**: Real-time notifications

#### Discord Integration

Connect your community:

```javascript
// Configure in Community Features tab
{
  discord: {
    enabled: true,
    webhookUrl: 'https://discord.com/api/webhooks/...'
  }
}
```

**Automatic Notifications For:**

- New orders
- Customer feedback
- System alerts
- Version updates

#### Slack Integration

Team notifications:

```javascript
{
  slack: {
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/...'
  }
}
```

#### Documentation Site

Link to your help center:

- Getting Started guides
- Feature documentation
- API reference
- FAQ section
- Troubleshooting

### Theme Switcher Component

Add theme switcher to your layout:

```tsx
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

function Header() {
  return (
    <header>
      {/* ... other header content ... */}
      <ThemeSwitcher />
    </header>
  );
}
```

### Programmatic Theme Access

```tsx
import { useTheme } from '@/providers/ThemeProvider';

function MyComponent() {
  const { theme, mode, setTheme, setMode } = useTheme();

  // Change theme
  const changeToHealthcare = () => {
    const healthcareTheme = THEME_PRESETS.find((t) => t.id === 'medical');
    setTheme(healthcareTheme);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };
}
```

### CSS Variables

All theme colors are available as CSS variables:

```css
/* Use in your components */
.my-component {
  background: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--border);
}

/* Dark mode automatically handled */
.dark .my-component {
  /* Colors adjust automatically */
}
```

### Accessibility

The theming system ensures:

- ✅ WCAG 2.1 AA contrast ratios
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Screen reader compatibility
- ✅ Keyboard navigation

### Performance

Theme switching is optimized for:

- **Zero Layout Shift**: Instant color changes
- **Minimal Repaints**: Only colors update
- **LocalStorage Caching**: Fast page loads
- **No Flash**: Proper SSR support

- **Push Notifications**: FCM and Web Push API support for order updates
- **SMS/WhatsApp Integration**: Transactional messaging via Twilio and WhatsApp Business API
- **Real-time Tracking**: GPS-based delivery tracking with status timeline
- **Business Intelligence**: Advanced analytics, cohort analysis, and customer segmentation

### Accessibility & Internationalization

- **WCAG 2.1 Level AA Compliance**: Meets accessibility standards
- **Multi-language Support**: English and Hindi (easily extensible)
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Skip Navigation**: Quick access to main content
- **Automated Testing**: axe-core integration for continuous accessibility testing

📖 **[Read Accessibility Guide](./ACCESSIBILITY.md)** | **[i18n Guide](./INTERNATIONALIZATION.md)** | **[Keyboard Navigation](./KEYBOARD_NAVIGATION.md)** | **[Testing Guide](./TESTING_GUIDE.md)**
main
main

## 🚀 Quick Start

### Option 1: Docker (Recommended - Easiest)

```bash
# 1. Clone and navigate
cd pulss-platform

# 2. Start all services
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:5173
# - API: http://localhost:3000
# - PostgreSQL: localhost:5432
# - pgAdmin: http://localhost:5050
```

### Option 2: Local Development

```bash
# 1. Setup PostgreSQL
createdb pulssdb
psql -d pulssdb -f backend/migrations/01_init_schema.sql

# 2. Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev

# 3. Frontend Setup (in new terminal)
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

### Environment Configuration

## 🛠️ Developer Experience

This project includes comprehensive developer experience tools to ensure code quality and consistency.

### Quick Setup with Makefile

We provide a Makefile with common development tasks:

```bash
# Complete project setup
make setup

# Development
make dev              # Start frontend dev server
make backend-dev      # Start backend dev server
make build            # Build for production

# Code Quality
make lint             # Run all linters
make lint-fix         # Auto-fix linting issues
make format           # Format code with Prettier
make validate         # Run all checks (type-check, lint, format)

# See all available commands
make help
```

### Git Hooks (Husky)

Pre-commit hooks automatically run before each commit to ensure code quality:

**What runs on commit:**

- ESLint (auto-fixes issues when possible)
- Prettier (formats code)
- Stylelint (validates CSS)

**Setup hooks:**

```bash
npx husky install
# or
make hooks
```

**If hooks fail:**

```bash
# See what's failing
npm run validate

# Fix issues
make lint-fix
make format

# Try commit again
git commit -m "your message"
```

**Emergency bypass (use sparingly):**

```bash
git commit -m "your message" --no-verify
```

### Available Scripts

**Frontend:**

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run style            # Run Stylelint
npm run style:fix        # Auto-fix CSS issues
npm run type-check       # Check TypeScript types
npm run validate         # Run all checks
```

**Backend:**

```bash
cd backend
npm run dev              # Start backend server
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run validate         # Run all checks
npm run migrate:local    # Run database migrations
npm run seed:local       # Seed database
```

### Troubleshooting CI Failures

**Common Issues and Solutions:**

1. **ESLint errors:**

   ```bash
   npm run lint:fix        # Auto-fix issues
   npm run lint            # Check remaining issues
   ```

2. **Prettier formatting:**

   ```bash
   npm run format          # Format all files
   ```

3. **TypeScript errors:**

   ```bash
   npm run type-check      # Check for type errors
   ```

4. **Stylelint errors:**

   ```bash
   npm run style:fix       # Fix CSS issues
   ```

5. **Build failures:**
   ```bash
   make clean              # Clean build artifacts
   make install            # Reinstall dependencies
   npm run build           # Rebuild
   ```

**Running all validations locally:**

```bash
# Run everything that CI runs
make validate

# Or individually:
npm run type-check
npm run lint
npm run format:check
npm run style
cd backend && npm run validate
```

### Code Quality Tools

**ESLint** - JavaScript/TypeScript linting

- Config: `eslint.config.js` (frontend), `backend/.eslintrc.js` (backend)
- Enforces code style and catches common errors

**Prettier** - Code formatting

- Config: `.prettierrc`
- Ensures consistent formatting across the codebase

**Stylelint** - CSS linting

- Config: `.stylelintrc.json`
- Validates CSS and Tailwind usage

**Husky** - Git hooks

- Config: `.husky/`
- Runs quality checks before commits

**lint-staged** - Staged files linting

- Config: `.lintstagedrc.json`
- Only lints files you're committing

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Development setup
- Coding standards
- Git workflow
- Code review process
- Testing guidelines

### Environment Configuration

**Backend `.env`:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pulssdb
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d
PORT=3000
NODE_ENV=development
```

**Frontend `.env`:**

```env
VITE_API_URL=http://localhost:3000/api
VITE_DEFAULT_SUPERADMIN_EMAIL=admin@pulss.app
```

### Default Login Credentials

**Super Admin:**

- Email: `superadmin@pulss.app`
- Password: `admin123`

**Test Store Admin:**

- Email: `admin@teststore.com`
- Password: `admin123`

### 2. Database Setup

Run the SQL schema in your Supabase project:

```bash
# The schema is in supabase/schema.sql
# Execute it in your Supabase SQL editor
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access the Application

- **Health Check**: `http://localhost:5173/health`
- **Super Admin**: `http://localhost:5173/super`
- **Customer Store**: `http://localhost:5173/`
- **Admin Dashboard**: `http://localhost:5173/admin`
- **Sign In**: `http://localhost:5173/signin`

## 🏪 Getting Started Guide

### For Super Admin (You)

1. **Access Super Admin Panel**
   - Go to `/super`
   - Sign in with `lbalajeesreeshan@gmail.com`

2. **Upload Main Logo**
   - Go to Branding tab
   - Upload your Pulss main logo
   - This appears in all tenant stores

3. **Create Themes**
   - Go to Themes tab
   - Create 10+ themes for different areas/preferences
   - Set default theme

4. **Create New Store**
   - Click "Create New Store"
   - Fill in store details:
     - Store name and admin email
     - Upload store logo
     - Add address, WhatsApp, UPI details
   - Get auto-generated setup code

5. **Generate QR Codes**
   - Each store gets a QR code
   - Customers scan to access that specific store
   - QR codes are downloadable

### For Store Admin (Chemist)

1. **Initial Setup**
   - Receive setup code from Super Admin
   - Go to `/signin` → "First-time Setup"
   - Enter email and setup code
   - Set new password

2. **Complete Onboarding**
   - Upload store details
   - Add payment information (UPI ID, QR code)
   - Set up WhatsApp number for customer support

3. **Add Products**
   - Upload CSV with products (download sample CSV)
   - Products auto-populate into categories
   - Set featured products

4. **Customize Store**
   - Upload carousel images
   - Set daily splash screen
   - Create announcements and scroll messages

### For Customers

1. **Access Store**
   - Scan QR code or visit direct link
   - Browse products by category
   - Search by medicine name or health condition

2. **Shopping**
   - Add items to cart
   - Upload prescription if required
   - Choose payment method

3. **Support**
   - Click WhatsApp icon for direct support
   - Access store social media links

## 📱 Mobile App (PWA)

The platform works as a Progressive Web App:

1. **Installation**
   - Visit the store URL on mobile
   - Browser will show "Add to Home Screen"
   - Install for native app experience

2. **Features**
   - Works offline (basic browsing)
   - Push notifications
   - Full-screen experience

## 🔧 Key Features Explained

### Multi-tenant Architecture

- Each store is completely isolated
- Data security at tenant level
- Subdomain support (store.pulss.app)

### QR Code System

- Each store gets unique QR code
- Points to store-specific URL
- Easy distribution and marketing

### Theme Management

- 10+ pre-built themes
- Easy color customization
- Super admin controlled

### Payment Integration

- Ready for Razorpay, Stripe, PayTM
- UPI QR code integration
- Credit approval system

### WhatsApp Integration

- Direct customer-to-admin messaging
- Order notifications (when API added)
- Easy setup with phone number

## 🎨 Customization

### For Different Business Types

The platform supports:

- Pharmacies & Chemists
- Grocery Stores
- General Stores
- Medical Equipment Stores

### Theme Customization

- Easy color scheme changes
- Business-specific layouts
- Regional preferences

### CSV Product Upload

Sample CSV format:

```csv
name,brand,category,price,mrp,image_url,requires_rx,description
Paracetamol 500mg,Cipla,Medicines,50,60,image_url,false,Pain relief
Vitamin D3,HealthKart,Supplements,200,250,image_url,false,Daily vitamin
```

## 📊 Analytics & Reporting

### Super Admin Analytics

- Total revenue across all stores
- Active vs inactive stores
- Growth metrics

### Store Admin Analytics

- Daily/monthly sales
- Top-selling products
- Customer insights
- Inventory tracking

## 🔒 Security & Privacy Features

### Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication with configurable expiration
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA using industry-standard authenticator apps
  - QR code generation for easy setup
  - Backup codes for account recovery
  - Per-user 2FA settings
  - Compatible with Google Authenticator, Authy, Microsoft Authenticator, and other TOTP apps
- **Role-Based Access Control (RBAC)**: Separate permissions for super_admin, admin, and customer roles
- **Password Security**: bcrypt hashing with salt rounds
- **Multi-tenant Isolation**: Strict tenant data separation

### API Security

- **Rate Limiting**: Protection against brute-force attacks
  - General API: 100 requests per 15 minutes
  - Authentication: 5 attempts per 15 minutes
  - Account creation: 3 per hour
- **Security Headers**: Helmet middleware with CSP, HSTS, XSS protection
- **HTTPS Enforcement**: Automatic redirect in production
- **CORS Hardening**: Whitelist-based origin validation

### GDPR Compliance

- **User Consent Management**: Track marketing, analytics, and data processing consent
- **Right to Access**: Users can view all stored data
- **Right to Data Portability**: Request data export in JSON/CSV
- **Right to be Forgotten**: Request account and data deletion
- **Privacy Policy Tracking**: Version and acceptance logging

### Audit Logging

- **Comprehensive Audit Trail**: All admin actions logged
- **Authentication Events**: Login/logout tracking with IP and user agent
- **Change History**: Old and new values for data modifications
- **Queryable Logs**: Filter by action, resource, date, admin
- **Export Capability**: Download audit logs for compliance

### Automated Security Scanning

- **NPM Audit**: Dependency vulnerability scanning
- **Snyk Integration**: Advanced security analysis
- **GitHub Actions**: Automated weekly security scans
- **CodeQL Analysis**: Static code security analysis

### Security Best Practices

- Prepared statements (SQL injection protection)
- Input validation and sanitization
- File upload restrictions and validation
- Secure session management
- Regular dependency updates

For detailed security information, see [SECURITY.md](./SECURITY.md)

## 🔐 Two-Factor Authentication (2FA)

Pulss now supports Two-Factor Authentication (2FA) for enhanced account security using Time-based One-Time Passwords (TOTP).

### Features

- **TOTP-based 2FA**: Industry-standard time-based one-time passwords
- **QR Code Setup**: Easy setup by scanning QR codes with authenticator apps
- **Backup Codes**: 10 single-use backup codes for account recovery
- **Flexible**: Enable/disable 2FA per user account
- **Universal Support**: Compatible with all major authenticator apps:
  - Google Authenticator
  - Microsoft Authenticator
  - Authy
  - 1Password
  - LastPass Authenticator

### API Endpoints

**Enable 2FA (Authenticated)**
```bash
POST /api/auth/2fa/enable
Authorization: Bearer <token>

Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "message": "Scan the QR code with your authenticator app..."
}
```

**Verify and Activate 2FA**
```bash
POST /api/auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}

Response:
{
  "success": true,
  "message": "Two-factor authentication enabled successfully.",
  "backupCodes": ["AB12CD34", "EF56GH78", ...],
  "warning": "Save these backup codes in a secure location..."
}
```

**Login with 2FA**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorToken": "123456"
}
```

**Disable 2FA**
```bash
POST /api/auth/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "current_password"
}
```

**Check 2FA Status**
```bash
GET /api/auth/2fa/status
Authorization: Bearer <token>

Response:
{
  "enabled": true
}
```

### Setup Instructions

#### For Users

1. **Enable 2FA**
   - Log in to your account
   - Navigate to Security Settings
   - Click "Enable Two-Factor Authentication"
   - Scan the QR code with your authenticator app

2. **Verify Setup**
   - Enter the 6-digit code from your authenticator app
   - Save the backup codes in a secure location
   - 2FA is now active on your account

3. **Login with 2FA**
   - Enter your email and password as usual
   - When prompted, enter the 6-digit code from your authenticator app
   - Use a backup code if you don't have access to your authenticator

4. **Disable 2FA** (if needed)
   - Go to Security Settings
   - Click "Disable Two-Factor Authentication"
   - Enter your password to confirm

#### For Administrators

**Database Migration:**
```bash
# Run the 2FA migration
sqlite3 backend/dev-database.sqlite < backend/migrations/13_add_two_factor_auth.sql

# Or for PostgreSQL
psql -d pulssdb -f backend/migrations/13_add_two_factor_auth.sql
```

**Install Dependencies:**
```bash
cd backend
npm install speakeasy qrcode
```

### Security Considerations

- **Backup Codes**: Each backup code can only be used once. Generate new codes if running low.
- **Secret Storage**: 2FA secrets are encrypted and stored securely in the database.
- **Time Sync**: Ensure server time is synchronized (TOTP requires accurate time).
- **Account Recovery**: Users should save backup codes immediately after enabling 2FA.
- **Password Required**: Disabling 2FA requires password confirmation for security.

### Backup Code Usage

If you lose access to your authenticator app:
1. Use one of your backup codes instead of the TOTP token during login
2. Each backup code works only once
3. Contact support if you've used all backup codes

### Troubleshooting

**"Invalid verification token" error:**
- Ensure your device's time is synchronized
- Check that you're entering the code quickly (30-second validity window)
- Verify you're using the correct account in your authenticator app

**Lost authenticator device:**
- Use one of your backup codes to log in
- Disable and re-enable 2FA with your new device
- Generate new backup codes

### Privacy API Endpoints

**User Consent:**

```bash
GET  /api/privacy/consent              # Get consent settings
POST /api/privacy/consent              # Update consent
```

**Data Export (GDPR Article 20):**

```bash
POST /api/privacy/data-export          # Request export
GET  /api/privacy/data-export/:id      # Check status
```

**Data Deletion (GDPR Article 17):**

```bash
POST /api/privacy/data-deletion        # Request deletion
GET  /api/privacy/data-deletion/:id    # Check status
```

**Audit Logs (Admin only):**

```bash
GET /api/audit-logs                    # List logs
GET /api/audit-logs/stats              # Statistics
GET /api/audit-logs/export             # Export logs
```

## 🚀 Deployment Options

### Current Setup (Netlify + Supabase)

- Frontend: Deploy to Netlify
- Database: Supabase (current)
- Images: Supabase Storage / Netlify

### Alternative Deployments

- AWS: Frontend (S3+CloudFront), Backend (RDS+Lambda)
- Google Cloud: Cloud Run + Cloud SQL
- Vercel: Frontend + Supabase backend

### Migration Guide

If you need to change hosting:

1. **Export data** from current Supabase
2. **Set up new backend** (AWS RDS, etc.)
3. **Update environment variables**
4. **Redeploy frontend** to new host

All changes are handled through environment variables - no code rebuild needed!

## 🎯 Business Model

### Revenue Streams

1. **Monthly subscriptions** per store
2. **Transaction fees** on orders
3. **Premium features** (advanced analytics, etc.)
4. **Custom themes** and branding

### Scaling Strategy

- Unlimited stores per super admin
- Regional super admins
- White-label licensing

## 📈 Advanced Features (NEW!)

Pulss now includes world-class engagement and operational excellence features:

### 🔔 Push Notifications

- **FCM & Web Push Support**: Real-time notifications for order updates
- **Admin Broadcasts**: Send messages to all customers or specific segments
- **Customizable Priorities**: Control notification importance
- **Multi-platform**: Works on web and mobile devices

### 📱 SMS & WhatsApp Integration

- **Twilio Integration**: Send SMS and WhatsApp messages
- **WhatsApp Business API**: Official WhatsApp messaging
- **Automated Notifications**: Order confirmations and status updates
- **Broadcast Messaging**: Reach all customers instantly

### 🚚 Real-time Delivery Tracking

- **GPS Location Tracking**: Track delivery personnel in real-time
- **Status Timeline**: Complete order journey visualization
- **ETA Management**: Update and communicate delivery times
- **Public Tracking URLs**: Share tracking links with customers

### 📊 Business Intelligence Dashboard

- **Sales Trends**: Analyze performance over time (hourly to yearly)
- **Cohort Analysis**: Understand customer retention patterns
- **Customer Segmentation**: Identify VIP, Loyal, At Risk, and Churned customers
- **Product Analytics**: Track best-selling products and categories
- **Churn Prediction**: Identify customers likely to leave

### ✨ Product Variants (NEW!)

- **Multiple Variant Types**: Support for Strength, Pack Size, Color, Size, Flavor
- **Independent Pricing**: Each variant has its own price and inventory
- **CSV Import Support**: Bulk import products with variants
- **Smart Selectors**: Customer-friendly variant selection UI
- **Real-time Updates**: Price and stock updates based on variant selection

📖 **[Product Variants Guide](./PRODUCT_VARIANTS_GUIDE.md)**

### 🔔 Order Acceptance & Auto-Accept (NEW!)

- **Visual & Audio Alerts**: Immediate notification for new orders
- **Countdown Timer**: 5-minute acceptance window (configurable)
- **Auto-Acceptance**: Orders automatically accepted if not manually confirmed
- **No Rejection**: Improves customer satisfaction
- **Acceptance Analytics**: Track acceptance speed and patterns

📖 **[Order Acceptance Guide](./ORDER_ACCEPTANCE_GUIDE.md)**

### 🛡️ Enhanced Onboarding Validations (NEW!)

- **Real-time Validation**: WhatsApp, UPI, Razorpay credentials
- **Live Previews**: See how features appear to customers
- **WhatsApp Chat Preview**: Test chat button before going live
- **UPI QR Code**: Auto-generated and scannable
- **Payment Methods Preview**: Visual display of enabled payment options
- **Progressive Validation**: Cannot proceed with invalid data

📖 **[Onboarding Validation Guide](./ONBOARDING_VALIDATION_GUIDE.md)**

📖 **[View Complete Advanced Features Documentation](./ADVANCED_FEATURES.md)**

## 🆘 Support & Maintenance

### For Store Owners

- WhatsApp support integration
- Help documentation
- Video tutorials

### For You (Super Admin)

- Easy CSV uploads for bulk operations
- One-click backups
- Automated health monitoring

## 📈 Future Enhancements

### Planned Features


1. **AI-powered medicine search** (by symptoms)

1. **AI-powered medicine search** (by symptoms) ✅ Partially implemented
   main
1. **Inventory management** with low-stock alerts
1. **Loyalty programs** with points system
1. **Subscription management** for recurring orders
1. **Advanced analytics** with forecasting ✅ Implemented
1. **Multi-language support**
1. **Voice search** capabilities
1. **Telemedicine integration**

### Integration Roadmap

- Google Maps (when you get API key)
- Payment gateways (Razorpay, etc.)
- ~~SMS notifications~~ ✅ Implemented via Twilio
- ~~Push notifications~~ ✅ Implemented via FCM/Web Push
- ~~WhatsApp messaging~~ ✅ Implemented via Twilio & WhatsApp Business API
- Email marketing
- Social media automation

## 🎨 UI/UX Components Guide

### Animation System

The platform includes a comprehensive animation library (`src/lib/animations.ts`) with:

**Page Transitions:**

```typescript
import { pageTransition, fadeInUp, scaleIn } from '@/lib/animations'

<motion.div variants={pageTransition} initial="initial" animate="animate">
  {/* Your content */}
</motion.div>
```

**Available Animation Variants:**

- `pageTransition` - Smooth page load animations
- `fadeIn`, `fadeInUp`, `fadeInDown` - Fade animations
- `scaleIn` - Scale animations for cards and modals
- `cardHover`, `cardTap` - Card interaction animations
- `buttonHover`, `buttonTap` - Button micro-interactions
- `staggerContainer`, `staggerItem` - List animations
- `gridContainer`, `gridItem` - Grid animations
- `modalOverlay`, `modalContent` - Modal animations
- `shimmer` - Loading shimmer effect

### Enhanced Product Card

The `ProductCard` component now includes:

```typescript
<ProductCard
  product={product}
  featured={true}
  onQuickView={() => handleQuickView(product)}
  onAddToCart={() => toast.success('Added to cart')}
/>
```

**Features:**

- ✨ Smooth hover animations and scale effects
- 💝 Wishlist heart button with animation
- 👁️ Quick view button on hover
- ⭐ Product ratings display
- 🏷️ Animated badges (NEW, SALE, BESTSELLER)
- 🛒 Animated add-to-cart with quantity controls
- 📸 Image loading states
- 🎨 Gradient overlays on hover

### Skeleton Loaders

Use skeleton loaders for better perceived performance:

```typescript
import {
  ProductCardSkeleton,
  ProductGridSkeleton,
  DashboardWidgetSkeleton,
  ChartSkeleton
} from '@/components/ui/skeleton'

{loading ? <ProductGridSkeleton count={8} /> : <ProductGrid />}
```

**Available Skeletons:**

- `ProductCardSkeleton` - Single product card
- `ProductGridSkeleton` - Grid of product cards
- `ListItemSkeleton` - List items
- `TableSkeleton` - Data tables
- `CardSkeleton` - Generic cards
- `DashboardWidgetSkeleton` - Dashboard widgets
- `ChartSkeleton` - Charts and graphs
- `ReviewSkeleton` - Reviews
- `OrderItemSkeleton` - Order items

### Empty States

Beautiful empty states with illustrations:

```typescript
import { EmptyCart, EmptySearch, EmptyOrders } from '@/components/ui/empty-state'

<EmptyCart onStartShopping={() => navigate('/products')} />
<EmptySearch query={searchQuery} />
<EmptyOrders />
```

**Available Empty States:**

- `EmptyCart` - Empty shopping cart
- `EmptySearch` - No search results
- `EmptyOrders` - No orders
- `EmptyWishlist` - Empty wishlist
- `EmptyProducts` - No products
- `EmptyReviews` - No reviews
- `ErrorState` - Error messages
- `OfflineState` - Offline status

### Enhanced Badges

Animated badges for product labels:

```typescript
import {
  NewBadge,
  SaleBadge,
  BestSellerBadge,
  TrendingBadge,
  FlashSaleBadge,
  NotificationBadge
} from '@/components/ui/enhanced-badge'

<NewBadge />
<SaleBadge discount={25} />
<BestSellerBadge />
<NotificationBadge count={5} />
```

**Badge Types:**

- `NewBadge` - NEW products with pulse animation
- `SaleBadge` - Sale/discount badges
- `BestSellerBadge` - Bestseller indicator
- `TrendingBadge` - Trending products
- `FlashSaleBadge` - Flash sale with glow effect
- `HotBadge` - Hot products
- `VerifiedBadge` - Verified products
- `StatusBadge` - Order status
- `StockBadge` - Stock availability
- `RatingBadge` - Product ratings
- `NotificationBadge` - Notification counts

### Floating Action Buttons

Quick access to key features:

```typescript
import { FloatingActionButtons } from '@/components/ui/floating-action-buttons'

// In your main layout
<FloatingActionButtons />

// Or individual buttons
<FloatingCartButton onClick={() => setShowCart(true)} />
<FloatingChatButton unreadCount={3} />
<ScrollToTopButton />
```

**Features:**

- 🛒 Floating cart button with item count
- 💬 Chat/help button with contact options (WhatsApp, Phone, Email)
- ⬆️ Scroll to top button (appears on scroll)
- 🎨 Auto-hide on scroll down
- ✨ Smooth animations and transitions

### Sticky Navigation

Modern sticky navigation with mobile menu:

```typescript
import { StickyNav } from '@/components/ui/sticky-nav'

<StickyNav
  storeName="Your Store"
  logo="/logo.png"
  userName={user?.name}
  userAvatar={user?.avatar}
  onSearch={(query) => handleSearch(query)}
  onCartClick={() => setShowCart(true)}
  onProfileClick={() => navigate('/profile')}
/>
```

**Features:**

- 📌 Sticky header that slides in on scroll
- 🔍 Integrated search bar
- 🛒 Cart and wishlist counters
- 👤 User profile dropdown
- 🌓 Theme switcher
- 📱 Smooth mobile menu with slide animation
- 🎨 Glassmorphism effect on scroll

### Product Discovery Sections

Pre-built product discovery components:

```typescript
import {
  RecommendedProducts,
  BestSellers,
  RecentlyViewed,
  TrendingProducts,
  CategoryShowcase
} from '@/components/ui/product-sections'

<RecommendedProducts
  products={recommendedProducts}
  renderProduct={(product) => <ProductCard product={product} />}
  onSeeAll={() => navigate('/recommended')}
/>

<BestSellers products={bestSellers} />
<RecentlyViewed />
<TrendingProducts products={trending} />
<CategoryShowcase categories={categories} />
```

**Features:**

- 🎯 Personalized recommendations
- 🔥 Best sellers section
- 👁️ Recently viewed tracking
- 📈 Trending products
- 📂 Category showcase with horizontal scroll
- ⚡ Lazy loading and pagination
- ✨ Stagger animations

### Theme Switcher

Light/Dark mode with smooth transitions:

```typescript
import { ThemeSwitcher, ThemeToggle } from '@/components/ui/theme-switcher'

// Dropdown with Light/Dark/System options
<ThemeSwitcher />

// Simple toggle button
<ThemeToggle />
```

**Features:**

- 🌞 Light mode
- 🌙 Dark mode
- 💻 System preference
- 💾 Persisted preference
- ✨ Smooth icon transitions

### Recently Viewed Tracking

Automatically track and display recently viewed products:

```typescript
import { useTrackRecentlyViewed } from '@/components/ui/product-sections'

const trackProduct = useTrackRecentlyViewed()

// Track when user views a product
useEffect(() => {
  trackProduct(product)
}, [product.id])

// Display recently viewed
<RecentlyViewed renderProduct={(p) => <ProductCard product={p} />} />
```

## 🎨 Customizing UI/UX

### Colors and Theming

The platform uses Tailwind CSS v4 with custom color system. Edit `theme.json`:

```json
{
  "extend": {
    "colors": {
      "primary": "#your-color",
      "accent": "#your-accent"
    }
  }
}
```

### Animation Timing

Customize animation durations in `src/lib/animations.ts`:

```typescript
export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
};
```

### Component Styling

All components use Tailwind classes and support className prop:

```typescript
<ProductCard className="custom-class" />
<StickyNav className="bg-custom" />
```

### Gradient Customization

Common gradient patterns used:

- `from-blue-600 to-purple-600` - Primary gradient
- `from-green-600 to-teal-600` - Success/Chat
- `from-orange-600 to-red-600` - Warning/Help
- `from-pink-500 to-orange-500` - Sale/Discount

## 🔗 Important Links

- **Health Check**: Always check `/health` first
- **Super Admin**: `/super` (your main dashboard)
- **Demo Store**: `/` (customer view)
- **API Documentation**: In Supabase dashboard
  copilot/add-tenant-app-icon-support
- **PWA Icon Guide**: [PWA_ICON_DOCUMENTATION.md](./PWA_ICON_DOCUMENTATION.md) - Complete guide for custom app icons

- **Advanced Features Guide**: [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)
- **Quick Start Guide**: [QUICK_START_ADVANCED_FEATURES.md](./QUICK_START_ADVANCED_FEATURES.md)

## 🧪 Testing Advanced Features

Run the API test script to verify all endpoints:

```bash
# Basic test (no authentication)
./test-advanced-features.sh

# With authentication token
export API_TOKEN="your_jwt_token"
./test-advanced-features.sh

# With custom API URL
export API_URL="http://your-server:3000"
./test-advanced-features.sh
```

main

## ⚡ Quick Tips

1. **Always test on mobile** - most customers use phones
2. **Use high-quality images** - especially for products
3. **Keep product descriptions clear** - health products need clarity
4. **Monitor QR code usage** - track which codes are most effective
5. **Regular backups** - export data monthly
6. **Update themes seasonally** - keep stores fresh
7. **Use animations sparingly** - too many can overwhelm users
8. **Test dark mode** - ensure all content is readable
9. **Optimize images** - use WebP format when possible
10. **Monitor performance** - keep bundle size in check

---

**Need help?** The platform is designed to be intuitive, but if you need assistance:

1. Check the `/health` page for system status
2. Use the built-in help sections
3. All features have hover tooltips
4. Contact support through the super admin panel

**Ready to scale?** The platform can handle unlimited stores and customers. Start with a few stores and expand as needed!

---

## 📚 Additional Documentation

- **[Theming Guide](./THEMING_GUIDE.md)** - Complete guide to branding and theme customization
- **[Theme Showcase](./THEME_SHOWCASE.md)** - Visual preview of all available themes
- **[Migration Guide](./MIGRATION_STATUS.md)** - Supabase to Node.js migration details
- **[API Documentation](./API_DOCUMENTATION.md)** - Backend API reference

## 🎨 Quick Theming Reference

### Available Themes

1. Healthcare Professional (Medical Blue)
2. Fresh Market (Vibrant Green)
3. Luxury Boutique (Black & Gold)
4. Tech Hub (Modern Blue/Purple)
5. Wellness Center (Calming Teal)
6. Neighborhood Store (Warm Earth)
7. Beauty & Cosmetics (Elegant Pink)
8. Organic & Natural (Sustainable Green)
9. Sports & Fitness (Energetic Orange)
10. Artisan & Craft (Creative Purple)

### Branding Features

- ✅ Logo and favicon upload
- ✅ Custom color palette
- ✅ Font customization
- ✅ Light/dark mode
- ✅ Custom CSS support
- ✅ Export/import configuration

### Community Features

- ✅ Public changelog
- ✅ Feedback widget
- ✅ Discord integration
- ✅ Slack integration
- ✅ Documentation linking

For detailed setup instructions, see [THEMING_GUIDE.md](./THEMING_GUIDE.md)

main
