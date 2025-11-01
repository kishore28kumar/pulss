# Theming and Branding Setup Guide

This guide will help you configure and customize the Pulss platform with your own branding and theme.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Theme Configuration](#theme-configuration)
3. [Branding Customization](#branding-customization)
4. [White-Label Deployment](#white-label-deployment)
5. [Community Features](#community-features)
6. [Advanced Customization](#advanced-customization)

## Quick Start

### Step 1: Access Branding Manager

1. Log in as Super Admin
2. Navigate to `/super`
3. Click on the "Branding" tab

### Step 2: Choose a Theme

Select from 10+ pre-configured themes:
- Healthcare Professional (Medical Blue)
- Fresh Market (Vibrant Green)
- Luxury Boutique (Black & Gold)
- Tech Hub (Modern Blue/Purple)
- Wellness Center (Calming Teal)
- And more...

### Step 3: Upload Your Logo

1. Click "Logo Upload" in the Branding tab
2. Select your logo file (PNG recommended, 300x100px)
3. Preview and confirm

### Step 4: Configure Colors (Optional)

Override theme colors with your brand palette:
- Primary Color: Main brand color
- Secondary Color: Supporting color
- Accent Color: Highlights and CTAs

### Step 5: Save and Export

1. Click "Save Branding Settings"
2. Optionally export configuration as JSON for backup

## Theme Configuration

### Available Themes

#### 1. Healthcare Professional
```javascript
{
  id: 'healthcare-pro',
  colors: {
    primary: 'oklch(0.47 0.13 264)', // Medical Blue
    accent: 'oklch(0.55 0.15 142)',  // Health Green
  },
  fonts: {
    primary: "'Inter', sans-serif"
  }
}
```

**Best For:** Pharmacies, Medical Stores, Healthcare Providers

#### 2. Fresh Market
```javascript
{
  id: 'fresh-market',
  colors: {
    primary: 'oklch(0.55 0.15 142)', // Fresh Green
    accent: 'oklch(0.65 0.18 85)',   // Orange
  },
  fonts: {
    primary: "'Poppins', sans-serif"
  }
}
```

**Best For:** Grocery Stores, Organic Markets, Fresh Produce

#### 3. Luxury Boutique
```javascript
{
  id: 'luxury-boutique',
  colors: {
    primary: 'oklch(0.25 0.05 264)', // Luxury Black
    accent: 'oklch(0.72 0.15 85)',   // Premium Gold
  },
  fonts: {
    primary: "'Playfair Display', serif"
  }
}
```

**Best For:** Fashion Stores, High-End Retail, Luxury Brands

### Programmatic Theme Selection

```typescript
import { useTheme } from '@/providers/ThemeProvider'
import { THEME_PRESETS } from '@/lib/themes'

function MyComponent() {
  const { setTheme } = useTheme()
  
  const applyHealthcareTheme = () => {
    const theme = THEME_PRESETS.find(t => t.id === 'medical')
    if (theme) setTheme(theme)
  }
}
```

## Branding Customization

### Logo Management

#### Upload Requirements
- **Format:** PNG (with transparency), SVG, or JPG
- **Recommended Size:** 300x100px
- **Max File Size:** 5MB
- **Aspect Ratio:** 3:1 (width:height)

#### Best Practices
1. Use transparent background for PNG
2. Ensure logo is visible on both light and dark backgrounds
3. Provide high-resolution version (2x or 3x)
4. Test on mobile devices

### Favicon Configuration

#### Upload Requirements
- **Format:** ICO or PNG
- **Size:** 32x32px or 16x16px
- **Max File Size:** 100KB

#### Multi-Resolution Favicons
```html
<!-- Auto-generated -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
```

### Custom Color Palette

#### Using Color Picker
1. Navigate to Branding → Color Palette
2. Click on color square for each variable
3. Choose your brand color
4. Save changes

#### Manual Color Entry
You can also enter colors manually using various formats:
- **Hex:** `#FF5733`
- **RGB:** `rgb(255, 87, 51)`
- **OKLCH:** `oklch(0.55 0.15 142)` (Recommended)

#### Available Color Variables
```css
--primary          /* Main brand color */
--secondary        /* Supporting color */
--accent           /* Highlight color */
--background       /* Page background */
--foreground       /* Text color */
--card             /* Card background */
--border           /* Border color */
--muted            /* Muted elements */
```

### Typography Customization

#### Google Fonts Integration

1. Choose fonts from [Google Fonts](https://fonts.google.com)
2. Add font family names to Branding settings:
   ```
   Primary Font: 'Montserrat', sans-serif
   Secondary Font: 'Open Sans', sans-serif
   ```

#### Recommended Font Combinations

**Professional:**
- Playfair Display + Source Sans Pro
- Lora + Merriweather

**Modern:**
- Montserrat + Open Sans
- Raleway + Lato

**Technical:**
- Roboto + Roboto
- Inter + Inter

**Creative:**
- Oswald + Roboto
- Libre Baskerville + Lato

### Custom CSS

For advanced styling needs:

```css
/* Example: Custom button styling */
.btn-custom {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 9999px;
  padding: 12px 24px;
  transition: all 0.3s ease;
}

.btn-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* Example: Custom card style */
.card-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## White-Label Deployment

### Complete White-Label Configuration

#### 1. Export Your Configuration
```bash
# From Branding Manager
Click "Export Config" → Save as branding-config.json
```

#### 2. Configuration File Structure
```json
{
  "theme": "healthcare-pro",
  "branding": {
    "logo": "https://your-cdn.com/logo.png",
    "favicon": "https://your-cdn.com/favicon.ico",
    "primaryFont": "'Inter', sans-serif",
    "secondaryFont": "'Inter', sans-serif"
  },
  "colors": {
    "primary": "oklch(0.47 0.13 264)",
    "accent": "oklch(0.55 0.15 142)"
  }
}
```

#### 3. Import on New Instance
```bash
# In Branding Manager
Click "Import Config" → Select branding-config.json
```

### Environment-Specific Branding

Use environment variables for different deployments:

```env
# .env.production
VITE_BRAND_NAME=Your Store Name
VITE_LOGO_URL=https://cdn.example.com/logo.png
VITE_PRIMARY_COLOR=#2563eb
VITE_THEME_ID=healthcare-pro
```

### Multi-Tenant White-Label

Each tenant can have their own branding:

```typescript
// Tenant-specific configuration
const tenantConfig = {
  tenant_id: 'store-123',
  theme_id: 'fresh-market',
  logo_url: 'https://store123.com/logo.png',
  custom_colors: {
    primary: 'oklch(0.55 0.15 142)'
  }
}
```

## Community Features

### Public Changelog

#### Adding Entries
1. Navigate to Community → Changelog tab
2. Fill in version, type, title, description
3. Click "Add Entry"

#### Entry Types
- **Feature:** New functionality
- **Improvement:** Enhanced existing features
- **Bug Fix:** Resolved issues

#### Display to Users
The changelog is automatically displayed:
- In the Help section
- On the customer dashboard
- In update notifications

### Feedback Widget

#### Configuration
1. Navigate to Community → Feedback Widget
2. Enable the widget
3. Set feedback email
4. Configure webhook (optional)

#### Customizing Categories
Default categories:
- Bug Report
- Feature Request
- Improvement
- General Feedback

Add custom categories:
```typescript
const categories = [
  'Bug Report',
  'Feature Request',
  'Improvement',
  'General Feedback',
  'Product Question',
  'Delivery Issue'
]
```

### Discord Integration

#### Setup
1. Create a Discord webhook:
   - Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. Configure in Pulss:
   - Community → Integrations → Discord
   - Enable Discord Integration
   - Paste webhook URL
   - Save

#### Notifications Sent
- New orders
- Customer feedback
- System alerts
- Version updates

### Slack Integration

#### Setup
1. Create a Slack webhook:
   - Slack App Directory → Incoming Webhooks
   - Add to Slack
   - Copy webhook URL

2. Configure in Pulss:
   - Community → Integrations → Slack
   - Enable Slack Integration
   - Paste webhook URL
   - Save

### Documentation Site

Link your help center:
1. Community → Docs tab
2. Enable Documentation Link
3. Enter your docs URL (e.g., https://docs.yourstore.com)
4. Save

The link will appear in:
- Main navigation
- Help section
- Footer

## Advanced Customization

### CSS Variables Reference

All theme variables available for use:

```css
/* Colors */
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring

/* Border Radius */
--radius-sm
--radius-md
--radius-lg
--radius-xl
--radius-2xl
--radius-full

/* Spacing */
--size-0 through --size-96
```

### Dark Mode Customization

Override dark mode colors:

```css
.dark {
  --background: oklch(0.05 0 0);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.6 0.13 264);
  /* ... other dark mode colors ... */
}
```

### Responsive Theming

Apply different styles based on screen size:

```css
@media (max-width: 768px) {
  :root {
    --radius-md: 0.375rem; /* Smaller radius on mobile */
  }
}
```

### Animation Customization

Use built-in animations:

```css
.my-element {
  animation: slide-up 0.5s ease-out;
  /* or */
  animation: bounce-in 0.6s ease-out;
  /* or */
  animation: pulse-glow 2s infinite;
}
```

### Accessibility Considerations

The theming system automatically handles:
- ✅ WCAG 2.1 AA contrast ratios
- ✅ High contrast mode
- ✅ Reduced motion preferences
- ✅ Screen reader compatibility

Test your custom colors:
```bash
# Use browser DevTools or online tools
# Ensure contrast ratio ≥ 4.5:1 for normal text
# Ensure contrast ratio ≥ 3:1 for large text
```

## Troubleshooting

### Theme Not Applying
1. Clear browser cache
2. Check localStorage: `pulss-theme`
3. Verify theme ID exists in THEME_PRESETS
4. Check browser console for errors

### Logo Not Displaying
1. Verify image URL is accessible
2. Check file format (PNG, SVG, JPG)
3. Ensure file size is under 5MB
4. Verify CORS settings if using external CDN

### Custom Fonts Not Loading
1. Verify font name spelling
2. Check Google Fonts availability
3. Add font to HTML head if custom:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
   ```

### Colors Not Changing
1. Use correct CSS variable format
2. Clear component cache
3. Verify color format (hex, rgb, or oklch)
4. Check for !important overrides in custom CSS

## Support

For additional help:
- 📧 Email: support@pulss.app
- 💬 Discord: [Join our community]
- 📖 Documentation: [Full docs]
- 🐛 Report Issues: [GitHub Issues]
