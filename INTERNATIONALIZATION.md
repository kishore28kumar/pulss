# Internationalization (i18n) Guide

This guide explains how to use and extend the internationalization features in the Pulss application.

## Overview

The Pulss application uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for internationalization. Currently supported languages:

- **English (en)** - Default language
- **Hindi (hi)** - हिन्दी

## Quick Start

### Using translations in components

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('navigation.home')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('products.addToCart')}</p>
    </div>
  )
}
```

### Using translations with variables

```tsx
const { t } = useTranslation()

// Translation with count
<p>{t('header.cart_items', { count: 5 })}</p>
// Output: "5 items in cart"

// Translation with interpolation
<p>{t('footer.copyright', { year: 2025 })}</p>
// Output: "© 2025 Pulss. All rights reserved."
```

### Pluralization

i18next handles pluralization automatically based on the count parameter:

```json
{
  "header": {
    "cart_items": "{{count}} item in cart",
    "cart_items_plural": "{{count}} items in cart"
  }
}
```

Usage:
```tsx
{t('header.cart_items', { count: 1 })} // "1 item in cart"
{t('header.cart_items', { count: 5 })} // "5 items in cart"
```

## Translation File Structure

Translation files are located in `src/i18n/locales/`:

```
src/i18n/locales/
├── en.json       # English translations
└── hi.json       # Hindi translations
```

Each translation file is organized into logical sections:

```json
{
  "app": { /* Application-wide strings */ },
  "common": { /* Common UI elements */ },
  "navigation": { /* Navigation items */ },
  "header": { /* Header-specific strings */ },
  "products": { /* Product-related strings */ },
  "cart": { /* Shopping cart strings */ },
  "checkout": { /* Checkout process strings */ },
  "orders": { /* Order management strings */ },
  "profile": { /* User profile strings */ },
  "footer": { /* Footer strings */ },
  "accessibility": { /* Accessibility labels */ },
  "errors": { /* Error messages */ },
  "support": { /* Customer support strings */ },
  "prescription": { /* Prescription-related strings */ }
}
```

## Language Switcher

The `LanguageSwitcher` component allows users to change languages:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function Header() {
  return (
    <nav>
      {/* Other navigation items */}
      <LanguageSwitcher />
    </nav>
  )
}
```

## Adding a New Language

Follow these steps to add support for a new language:

### 1. Create Translation File

Create a new JSON file in `src/i18n/locales/` named with the language code (e.g., `es.json` for Spanish, `fr.json` for French).

Copy the structure from `en.json` and translate all strings:

```json
{
  "app": {
    "title": "Pulss - Plataforma de Comercio Inteligente",
    "description": "Plataforma white-label impulsada por IA..."
  },
  "common": {
    "search": "Buscar",
    "cart": "Carrito",
    "profile": "Perfil",
    // ... translate all other strings
  }
  // ... translate all other sections
}
```

### 2. Update i18n Configuration

Edit `src/i18n/config.ts` to import and register the new language:

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en.json'
import hiTranslations from './locales/hi.json'
import esTranslations from './locales/es.json' // Add this line

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  es: {                                          // Add this block
    translation: esTranslations,
  },
}

// ... rest of the configuration
```

### 3. Update Language Switcher

Edit `src/components/LanguageSwitcher.tsx` to add the new language option:

```typescript
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' }, // Add this line
]
```

### 4. Test the New Language

1. Start the development server: `npm run dev`
2. Open the application
3. Click the language switcher
4. Select the new language
5. Verify all strings are translated correctly

## Best Practices

### 1. Always Use Translation Keys

Never hard-code user-facing strings. Always use translation keys:

```tsx
// ❌ Bad
<button>Save</button>

// ✅ Good
<button>{t('common.save')}</button>
```

### 2. Use Descriptive Keys

Use clear, hierarchical keys that indicate context:

```tsx
// ❌ Bad - ambiguous
{t('button1')}
{t('text2')}

// ✅ Good - descriptive
{t('products.addToCart')}
{t('checkout.placeOrder')}
```

### 3. Group Related Translations

Keep related translations together:

```json
{
  "products": {
    "addToCart": "Add to Cart",
    "viewDetails": "View Details",
    "outOfStock": "Out of Stock",
    "inStock": "In Stock"
  }
}
```

### 4. Handle Pluralization

Use proper pluralization for countable items:

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

### 5. Provide Context for Translators

Add comments in translation files for context:

```json
{
  "checkout": {
    "cod": "Cash on Delivery",  // Payment method option
    "upi": "UPI Payment",       // Payment method option
    "card": "Card Payment"      // Payment method option
  }
}
```

## Advanced Features

### Namespaces

For large applications, you can split translations into namespaces:

```typescript
// config.ts
const resources = {
  en: {
    common: commonEn,
    products: productsEn,
    checkout: checkoutEn,
  },
}

// Component usage
const { t } = useTranslation('products')
```

### Language Detection

The application automatically detects the user's preferred language based on:
1. Previously selected language (stored in localStorage)
2. Browser language settings

You can customize detection in `src/i18n/config.ts`:

```typescript
detection: {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
}
```

### Formatting

Use i18next formatting for dates, numbers, and currency:

```tsx
import { useTranslation } from 'react-i18next'

function ProductPrice({ price }) {
  const { t, i18n } = useTranslation()
  
  const formattedPrice = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'INR'
  }).format(price)
  
  return <span>{formattedPrice}</span>
}
```

## Right-to-Left (RTL) Languages

For RTL languages like Arabic or Hebrew:

### 1. Add RTL Configuration

```typescript
// In i18n/config.ts
i18n.on('languageChanged', (lng) => {
  const rtlLanguages = ['ar', 'he', 'ur']
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
})
```

### 2. Add RTL Styles

Use logical properties in CSS:

```css
/* Use margin-inline-start instead of margin-left */
.element {
  margin-inline-start: 1rem;
  padding-inline-end: 1rem;
}
```

## Testing Translations

### Manual Testing

1. Switch between languages using the language switcher
2. Verify all text is translated
3. Check for layout issues (especially with longer translations)
4. Test pluralization with different counts
5. Verify date and number formatting

### Automated Testing

Create tests to ensure all translation keys exist:

```typescript
import enTranslations from '@/i18n/locales/en.json'
import hiTranslations from '@/i18n/locales/hi.json'

describe('Translations', () => {
  it('should have all keys in both languages', () => {
    const enKeys = Object.keys(enTranslations)
    const hiKeys = Object.keys(hiTranslations)
    
    expect(enKeys).toEqual(hiKeys)
  })
})
```

## Troubleshooting

### Missing Translation Keys

If a translation key is missing, i18next will display the key itself:

```tsx
{t('nonexistent.key')} // Displays: "nonexistent.key"
```

Enable debug mode to see warnings:

```typescript
// In i18n/config.ts
i18n.init({
  debug: true, // Enable in development
  // ... other options
})
```

### Language Not Switching

1. Check browser console for errors
2. Verify translation files are imported correctly
3. Clear localStorage: `localStorage.clear()`
4. Check language detector configuration

### Incorrect Pluralization

Ensure you're using the correct format:

```json
{
  "key": "singular form",
  "key_plural": "plural form"
}
```

And pass the count parameter:

```tsx
{t('key', { count: value })}
```

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Translation Management Tools](https://www.i18next.com/overview/supported-frameworks)
- [Language Codes](https://www.andiamo.co.uk/resources/iso-language-codes/)

## Support

For questions or issues related to internationalization:
- Check existing translations in `src/i18n/locales/`
- Review this guide
- Consult the i18next documentation
- Contact the development team

---

Last updated: 2025-10-16
