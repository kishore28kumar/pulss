/**
 * Accessibility Improvements Documentation
 * 
 * This document outlines the accessibility improvements made to the Pulss application
 * to achieve WCAG 2.1 Level AA compliance.
 */

# Accessibility Improvements

## 1. Internationalization (i18n)

### Implementation
- Integrated `i18next` for multi-language support
- Created comprehensive translation files for English and Hindi
- Added `LanguageSwitcher` component for easy language selection
- Configured automatic language detection based on browser preferences

### Translation Files
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/hi.json` - Hindi translations

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <button>{t('common.save')}</button>
  )
}
```

### Adding New Languages
1. Create a new JSON file in `src/i18n/locales/` (e.g., `es.json` for Spanish)
2. Copy the structure from `en.json` and translate all strings
3. Update `src/i18n/config.ts` to import and register the new language:
   ```typescript
   import esTranslations from './locales/es.json'
   
   const resources = {
     // ... existing languages
     es: {
       translation: esTranslations,
     },
   }
   ```
4. Add the language to the `LanguageSwitcher` component:
   ```typescript
   const languages = [
     // ... existing languages
     { code: 'es', name: 'Spanish', nativeName: 'Español' },
   ]
   ```

## 2. Semantic HTML and ARIA Labels

### Skip Navigation
- Added skip navigation link for keyboard users
- Appears on focus at the top of the page
- Allows users to skip directly to main content

### ARIA Labels and Roles
The following improvements should be applied to components:

#### Buttons
```tsx
// Before
<Button onClick={handleClick}>
  <Icon />
</Button>

// After
<Button onClick={handleClick} aria-label="Descriptive action">
  <Icon aria-hidden="true" />
</Button>
```

#### Images
```tsx
// Before
<img src={product.image_url} />

// After
<img src={product.image_url} alt={t('accessibility.productImage') + ': ' + product.name} />
```

#### Form Inputs
```tsx
// Before
<Input placeholder="Search..." />

// After
<Input 
  placeholder={t('header.searchPlaceholder')}
  aria-label={t('common.search')}
/>
```

#### Dialogs
```tsx
// Modal/Dialog components should have:
<Dialog>
  <DialogContent role="dialog" aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">{t('cart.title')}</DialogTitle>
    ...
  </DialogContent>
</Dialog>
```

## 3. Keyboard Navigation

### Focus Management
- All interactive elements must be keyboard accessible
- Focus indicators are visible (using focus-visible CSS)
- Tab order follows logical flow

### Keyboard Shortcuts
Recommended shortcuts to implement:
- `Esc` - Close modals/dialogs
- `/` - Focus search input
- `?` - Show keyboard shortcuts help

### Implementation Example
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '/' && !isInputFocused) {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    if (e.key === 'Escape') {
      closeAllModals()
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

## 4. Color Contrast

### WCAG Requirements
- Normal text: Contrast ratio of at least 4.5:1
- Large text (18pt+): Contrast ratio of at least 3:1
- UI components: Contrast ratio of at least 3:1

### Current Status
The application uses Tailwind CSS with default colors that generally meet WCAG AA standards.

### Testing
Use browser DevTools or online tools like:
- WebAIM Contrast Checker
- Chrome DevTools Lighthouse
- axe DevTools

## 5. Screen Reader Support

### Best Practices Applied
1. **Descriptive Text**: All interactive elements have descriptive labels
2. **ARIA Live Regions**: For dynamic content updates
3. **Semantic HTML**: Using appropriate HTML elements (nav, main, aside, etc.)
4. **Hidden Elements**: Using `aria-hidden` for decorative icons

### Implementation Example
```tsx
// Cart badge with screen reader support
<Badge 
  className="absolute -top-2 -right-2"
  aria-label={t('header.cart_items', { count: cartItemCount })}
>
  {cartItemCount}
</Badge>

// Announce cart updates
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {cartMessage}
</div>
```

## 6. Testing Tools

### Automated Testing
```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react

# Add to main.tsx (development only)
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

### Manual Testing Checklist
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all important content
- [ ] Color contrast meets WCAG AA standards
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Modals trap focus correctly
- [ ] Skip navigation link works
- [ ] Language switcher changes content appropriately

### Lighthouse Audit
Run Lighthouse audit in Chrome DevTools:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Run audit
5. Address any issues found

## 7. Responsive Design

### Mobile Accessibility
- Touch targets are at least 44x44 pixels
- Text is readable without zooming
- Content reflows properly on small screens

### Implementation
```tsx
// Ensure adequate touch target size
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>
```

## 8. Error Handling

### Accessible Error Messages
```tsx
// Form error example
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? 'error-message' : undefined}
/>
{hasError && (
  <p id="error-message" role="alert" className="text-destructive">
    {t('errors.validation')}
  </p>
)}
```

## 9. Documentation

### For Developers
- Always use `t()` function for user-facing strings
- Add ARIA labels to interactive elements
- Test with keyboard only
- Test with screen reader

### For Content Creators
- Provide alt text for all images
- Write clear, concise labels
- Use proper heading hierarchy

## 10. Continuous Improvement

### Regular Audits
- Run Lighthouse audits monthly
- Test with screen readers quarterly
- Review WCAG updates annually

### User Feedback
- Provide accessibility feedback mechanism
- Monitor and respond to accessibility issues
- Update based on real user experiences

---

## Quick Reference: Common Patterns

### Button with Icon
```tsx
<Button aria-label={t('cart.removeItem')}>
  <X aria-hidden="true" />
</Button>
```

### Search Input
```tsx
<Input
  type="search"
  role="searchbox"
  aria-label={t('common.search')}
  placeholder={t('header.searchPlaceholder')}
/>
```

### Modal Dialog
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent role="dialog" aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">{title}</DialogTitle>
    <DialogDescription>{description}</DialogDescription>
    <DialogFooter>
      <Button onClick={onClose}>{t('common.close')}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Image with Alt Text
```tsx
<img 
  src={product.image_url} 
  alt={`${product.name} - ${product.brand || ''}`}
  loading="lazy"
/>
```

### Language Switcher
```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

<LanguageSwitcher />
```
