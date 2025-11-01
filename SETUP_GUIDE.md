# Pulss App Setup Guide

## 🚀 Quick Start Instructions

### Step 1: Set Up Your Supabase Database

1. **Go to your Supabase project dashboard:**
   - Open: https://fefwfetsmqbggcujeyug.supabase.co
   - Login to your Supabase account

2. **Run the Database Schema:**
   - Go to **SQL Editor** in the left sidebar
   - Click **New query**
   - Copy the entire content from `supabase/schema.sql` file
   - Paste it into the editor
   - Click **Run** to execute the schema

### Step 2: Start the Development Server

Open terminal in this directory and run:
```bash
npm run dev
```

The app will start on `http://localhost:5173`

### Step 3: Check Health Status

1. Visit: `http://localhost:5173/health`
2. Ensure all systems show "OK" status
3. If there are issues, check your `.env.local` file

### Step 4: Access Different Parts of the App

- **Super Admin Panel**: `http://localhost:5173/super`
  - Login with: `lbalajeesreeshan@gmail.com`
  - Create new chemist/admin accounts
  
- **Admin Panel**: `http://localhost:5173/admin`
  - For chemist/store owners to manage their shops
  
- **Customer Store**: `http://localhost:5173/`
  - The customer-facing storefront
  
- **Delivery App**: `http://localhost:5173/delivery`
  - For delivery personnel

## 🏪 Setting Up Your First Store

### As Super Admin:
1. Login at `/super` with your email
2. Click **"Create New Tenant"**
3. Fill in:
   - Tenant name (e.g., "ABC Pharmacy")
   - Admin email
   - Generate setup code
4. Share the setup code with the chemist

### As Chemist/Admin:
1. Use the setup code to login at `/signin`
2. Complete the onboarding:
   - Upload store logo
   - Add UPI details
   - Set store address
   - Upload hero carousel images

## 📁 Sample Data Files

We've included sample CSV files for different store types:
- `sample-products-pharmacy.csv` - Medicine products
- `sample-products-grocery.csv` - Grocery items
- `sample-products-fashion.csv` - Fashion items
- `sample-products.csv` - General products

Upload these in the Admin panel under **Products** → **Import CSV**.

## 🔧 Configuration

### Environment Variables (`.env.local`)
```
VITE_SUPABASE_URL=https://fefwfetsmqbggcujeyug.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DEFAULT_SUPERADMIN_EMAIL=lbalajeesreeshan@gmail.com
VITE_GOOGLE_MAPS_API_KEY=placeholder-google-maps-api-key
```

### Google Maps (Optional)
- Get API key from Google Cloud Console
- Replace `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`
- Restart the app

## 🎨 Customization

### Super Admin Controls:
- **Main App Logo**: Upload Pulss brand logo
- **Themes**: Create up to 10 custom themes
- **Feature Flags**: Enable/disable features per tenant

### Admin/Chemist Controls:
- **Store Branding**: Logo, colors, theme selection
- **Hero Images**: Homepage carousel
- **Splash Screen**: App loading screen
- **Social Media**: Links to Facebook, Instagram, etc.

## 📱 Mobile App (PWA)

The app is a Progressive Web App (PWA):
1. Open on mobile browser
2. Tap "Add to Home Screen"
3. Use like a native app

## 🔔 Notifications & Integrations

### WhatsApp Integration:
1. Get WhatsApp Business API credentials
2. Add in Admin → Settings → Integrations
3. Enable WhatsApp notifications

### Payment Integration:
- UPI: Built-in support
- Card/Online: Razorpay, Stripe integration available
- Cash on Delivery: Always available

## 🛠️ Troubleshooting

### Common Issues:

1. **"Supabase not configured" error**:
   - Check your `.env.local` file
   - Ensure database schema is uploaded
   - Restart the dev server

2. **Images not loading**:
   - Check Supabase Storage bucket exists
   - Verify upload permissions

3. **Login issues**:
   - Ensure email exists in database
   - Check super admin email is correct

### Support:
- Check `/health` page for system status
- Review browser console for errors
- Ensure all environment variables are set

## 🚀 Going Live

### Deployment Options:
1. **Netlify** (Recommended)
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

2. **Vercel**
   - Import from GitHub
   - Configure environment variables

3. **AWS/Google Cloud**
   - Build: `npm run build`
   - Deploy `dist` folder

### Production Setup:
1. Set production Supabase URL/keys
2. Configure custom domain
3. Enable SSL certificate
4. Set up monitoring

## 📞 Features Overview

### Core Features:
- ✅ Multi-tenant white-label platform
- ✅ Product catalog with categories
- ✅ Order management system
- ✅ Customer accounts & loyalty
- ✅ Admin dashboard
- ✅ Mobile-first responsive design
- ✅ PWA support

### Optional Features (Enable via Admin):
- 🔄 WhatsApp notifications
- 🔄 GPS delivery tracking
- 🔄 Wallet & loyalty points
- 🔄 Prescription upload
- 🔄 Coupons & discounts
- 🔄 Multi-warehouse inventory

## 🎯 Next Steps

1. **Set up database** (Step 1 above)
2. **Start dev server** (`npm run dev`)
3. **Access super admin** (`/super`)
4. **Create first tenant/store**
5. **Upload sample products**
6. **Test customer ordering flow**
7. **Customize themes & branding**
8. **Configure integrations**

Your Pulss app is ready to become the next big thing in white-label e-commerce! 🚀