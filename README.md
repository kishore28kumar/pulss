# 🚀 Pulss White-Label E-Commerce Platform

<div align="center">

![Pulss Logo](https://via.placeholder.com/150x150?text=PULSS)

**Enterprise-grade Multi-Tenant E-Commerce Platform**

Built for Pharmacies • Grocery Stores • Local Businesses • Retail Chains

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## ⚡ Quick Start

**Want to get started immediately?** Just run:

```bash
npm start
```

This single command will set up everything automatically! 

**📖 See [QUICKSTART.md](QUICKSTART.md) for the simplified guide.**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Pulss is a **comprehensive, enterprise-grade multi-tenant white-label e-commerce platform** designed specifically for:

- 🏥 **Pharmacies and Chemists** - Prescription management & OTC products
- 🛒 **Grocery Stores** - Inventory tracking & delivery management
- 🏪 **Local Businesses** - Customizable branding & local SEO
- 🎯 **Regional Retail Chains** - Multi-location management

### Why Pulss?

✅ **Multi-Tenant Architecture** - One platform, infinite stores  
✅ **White-Label Ready** - Complete branding customization  
✅ **Production-Ready** - Built with enterprise standards  
✅ **Scalable** - Handles growth from startup to enterprise  
✅ **Modern Stack** - Latest technologies & best practices  

---

## ✨ Features

### 🎨 **Multi-Tenant & Branding**
- Subdomain-based tenant routing (`pharmacy1.pulss.com`)
- Custom domain support
- Per-tenant branding (logo, colors, theme)
- Isolated tenant data with row-level security

### 🛍️ **Customer Storefront**
- Modern, responsive design
- Product browsing with advanced filters
- Shopping cart & wishlist
- Guest & registered checkout
- Order tracking & history
- Product reviews & ratings
- Prescription upload (for pharmacies)

### 👨‍💼 **Admin Dashboard**
- Beautiful, intuitive interface
- Product management (CRUD operations)
- Category & subcategory management
- Order management & fulfillment tracking
- Customer management
- Real-time inventory tracking
- Analytics & sales reports
- Low stock alerts
- Bulk product import/export (CSV)

### 💳 **Payment & Checkout**
- Stripe payment integration
- Multiple payment methods
- Secure payment processing
- Webhook handling for order updates
- Invoice generation

### 🔐 **Authentication & Security**
- JWT-based authentication
- Role-based access control (RBAC)
  - Super Admin (platform management)
  - Admin (store owner)
  - Manager (store operations)
  - Staff (basic operations)
  - Customer (storefront)
- Password hashing with bcrypt
- Token refresh mechanism

### 📊 **Advanced Features**
- Multi-currency support
- Tax calculation
- Shipping fee management
- Discount codes & promotions
- Email notifications
- Real-time inventory updates
- Product variants (size, color, etc.)
- SEO optimization (meta tags, sitemaps)

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand, TanStack Query
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Charts:** Recharts
- **Payments:** Stripe.js

### **Backend**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Caching:** Redis
- **Authentication:** JWT + Passport.js
- **Validation:** Zod
- **File Upload:** Multer + Cloudinary

### **Infrastructure**
- **Monorepo:** Turborepo
- **Containerization:** Docker & Docker Compose
- **Package Manager:** npm workspaces
- **CI/CD Ready:** GitHub Actions compatible

---

## 📁 Project Structure

```
pulss-white-label-ch-main/
├── apps/
│   ├── backend/                 # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/     # Route controllers
│   │   │   ├── middleware/      # Auth, tenant, error handling
│   │   │   ├── routes/          # API routes
│   │   │   ├── utils/           # Helper functions
│   │   │   └── server.ts        # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── admin-dashboard/         # Next.js Admin UI
│   │   ├── src/
│   │   │   ├── app/             # App router pages
│   │   │   ├── components/      # React components
│   │   │   └── lib/             # API client, utils
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── storefront/              # Next.js Customer UI
│       ├── src/
│       │   ├── app/             # App router pages
│       │   ├── components/      # React components
│       │   └── lib/             # API client, utils
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── database/                # Prisma schema & client
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── index.ts
│   │
│   └── types/                   # Shared TypeScript types
│       └── index.ts
│
├── docker-compose.yml           # Docker orchestration
├── turbo.json                   # Turborepo configuration
├── package.json                 # Root package.json
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 16
- **Redis** (optional, for caching)
- **Docker** (optional, for containerized setup)

### Option 1: Quick Start with Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd pulss-white-label-ch-main

# 2. Copy environment variables
cp .env.example .env

# 3. Update .env with your configuration

# 4. Start all services with Docker Compose
docker-compose up -d

# 5. Run database migrations
docker-compose exec backend npx prisma migrate dev

# 6. Seed the database (optional)
docker-compose exec backend npm run seed
```

**Access the applications:**
- 🌐 Storefront: http://localhost:3000
- 👨‍💼 Admin Dashboard: http://localhost:3001
- 🔌 Backend API: http://localhost:5000

### Option 2: Manual Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd pulss-white-label-ch-main
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup PostgreSQL database
createdb pulss_db

# 4. Run database migrations
cd packages/database
npx prisma migrate dev
npx prisma generate

# 5. Start Redis (if using)
redis-server

# 6. Start development servers
cd ../..
npm run dev
```

This will start:
- Backend API on port 5000
- Admin Dashboard on port 3001
- Storefront on port 3000

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/pulss_db"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Application URLs
BACKEND_PORT=5000
BACKEND_URL="http://localhost:5000"
ADMIN_URL="http://localhost:3001"
STOREFRONT_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Email (optional)
SENDGRID_API_KEY="your_sendgrid_key"
EMAIL_FROM="noreply@pulss.com"
```

---

## 🗄️ Database Setup

### Prisma Migrations

```bash
# Generate Prisma Client
cd packages/database
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Database Schema Overview

The platform includes comprehensive models for:

- **Tenants** - Multi-tenant isolation
- **Users & Customers** - Authentication & accounts
- **Products & Categories** - Product catalog
- **Orders & Order Items** - Order management
- **Cart & Wishlist** - Shopping features
- **Addresses** - Shipping & billing
- **Reviews & Ratings** - Customer feedback
- **Pages & Banners** - CMS content
- **Tenant Settings** - Store configuration

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

For tenant-specific requests, include the tenant slug:
```
X-Tenant-Slug: <tenant-slug>
```

### Key Endpoints

#### Authentication
```
POST   /api/auth/login              # Admin/Staff login
POST   /api/auth/customer/login     # Customer login
POST   /api/auth/customer/register  # Customer registration
GET    /api/auth/me                 # Get current user
POST   /api/auth/refresh            # Refresh token
```

#### Products
```
GET    /api/products                # List products
GET    /api/products/:id            # Get product
POST   /api/products                # Create product (Admin)
PUT    /api/products/:id            # Update product (Admin)
DELETE /api/products/:id            # Delete product (Admin)
```

#### Orders
```
GET    /api/orders                  # List orders (Admin)
GET    /api/orders/:id              # Get order details
POST   /api/orders                  # Create order (Customer)
PATCH  /api/orders/:id/status       # Update order status (Admin)
GET    /api/orders/my-orders        # Customer's orders
```

#### Cart
```
GET    /api/cart                    # Get cart
POST   /api/cart                    # Add to cart
PUT    /api/cart/:id                # Update cart item
DELETE /api/cart/:id                # Remove from cart
```

#### Stripe Payments
```
POST   /api/stripe/create-payment-intent  # Create payment
POST   /api/stripe/webhook                # Stripe webhook
GET    /api/stripe/config                 # Get publishable key
```

---

## 🚢 Deployment

### Production Build

```bash
# Build all applications
npm run build

# Start production servers
npm run start
```

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Checklist

Before deploying to production:

- [ ] Update all `JWT_SECRET` values
- [ ] Configure production database
- [ ] Set up Stripe production keys
- [ ] Configure email service (SendGrid)
- [ ] Set up Cloudinary for image uploads
- [ ] Update CORS allowed origins
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up domain & DNS records
- [ ] Configure backup strategy
- [ ] Set up monitoring & logging

---

## 🎯 Usage Examples

### Creating a New Tenant (Super Admin)

```bash
POST /api/tenants
{
  "name": "City Pharmacy",
  "slug": "city-pharmacy",
  "businessType": "pharmacy",
  "email": "admin@citypharmacy.com",
  "adminEmail": "john@citypharmacy.com",
  "adminPassword": "SecurePass123!",
  "adminFirstName": "John",
  "adminLastName": "Doe"
}
```

### Adding a Product (Tenant Admin)

```bash
POST /api/products
Headers: { "X-Tenant-Slug": "city-pharmacy" }
{
  "name": "Aspirin 500mg",
  "slug": "aspirin-500mg",
  "description": "Pain relief medication",
  "price": 9.99,
  "sku": "ASP-500",
  "stockQuantity": 100,
  "categoryIds": ["cat-id-123"],
  "requiresPrescription": false,
  "isOTC": true
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for local businesses
- Powered by modern web technologies
- Designed for scalability and performance

---

## 📞 Support

For support, email support@pulss.com or open an issue on GitHub.

---

<div align="center">

**[⬆ Back to Top](#-pulss-white-label-e-commerce-platform)**

Made with 💙 by the Pulss Team

</div>

