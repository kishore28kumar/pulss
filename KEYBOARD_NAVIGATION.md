# Keyboard Navigation Guide

This guide documents keyboard shortcuts and navigation patterns for the Pulss application.

## Overview

The Pulss application is designed to be fully accessible via keyboard, ensuring users can navigate and interact with all features without a mouse.

## Global Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Move to next interactive element | Global |
| `Shift + Tab` | Move to previous interactive element | Global |
| `Enter` | Activate button or link | Buttons, Links |
| `Space` | Activate button or toggle checkbox | Buttons, Checkboxes |
| `Escape` | Close modal or dialog | Modals, Dialogs |
| `/` | Focus search input | Main page |
| `?` | Show keyboard shortcuts help | Global |

## Navigation Shortcuts

### Skip Navigation
- **Tab** from page load: Focus skip navigation link
- **Enter** on skip link: Jump directly to main content

### Header Navigation
1. **Tab** to logo (focusable for keyboard users)
2. **Tab** to language switcher
3. **Tab** to theme toggle
4. **Tab** to shopping cart
5. **Tab** to profile menu

### Search
- **/** (forward slash): Focus search input from anywhere
- **Escape**: Clear search input
- **Enter**: Execute search

## Component-Specific Navigation

### Product Cards

| Action | Keyboard Shortcut |
|--------|------------------|
| Navigate between products | `Tab` / `Shift + Tab` |
| Add to cart | `Enter` or `Space` on "Add to Cart" button |
| View details | `Enter` on product card or title |
| Add to wishlist | `Enter` on heart icon |

### Shopping Cart

| Action | Keyboard Shortcut |
|--------|------------------|
| Open cart | `Tab` to cart icon, then `Enter` |
| Increase quantity | `Tab` to + button, then `Enter` |
| Decrease quantity | `Tab` to - button, then `Enter` |
| Remove item | `Tab` to remove button, then `Enter` |
| Proceed to checkout | `Tab` to checkout button, then `Enter` |
| Close cart | `Escape` |

### Modals and Dialogs

| Action | Keyboard Shortcut |
|--------|------------------|
| Close modal | `Escape` |
| Navigate within modal | `Tab` / `Shift + Tab` |
| Confirm action | `Enter` on primary button |
| Cancel action | `Escape` or `Tab` to cancel button and `Enter` |

**Focus Trapping**: When a modal is open, keyboard focus is trapped within the modal. Pressing `Tab` cycles through interactive elements within the modal only.

### Forms

| Action | Keyboard Shortcut |
|--------|------------------|
| Move to next field | `Tab` |
| Move to previous field | `Shift + Tab` |
| Submit form | `Enter` (when focused on submit button) |
| Clear form | `Tab` to clear/cancel button, then `Enter` |
| Select checkbox | `Space` |
| Select radio button | `Arrow keys` when focused on radio group |

### Dropdown Menus

| Action | Keyboard Shortcut |
|--------|------------------|
| Open dropdown | `Enter` or `Space` on trigger |
| Navigate options | `Arrow Down` / `Arrow Up` |
| Select option | `Enter` |
| Close dropdown | `Escape` |

### Language Switcher

| Action | Keyboard Shortcut |
|--------|------------------|
| Open language menu | `Tab` to switcher, then `Enter` |
| Navigate languages | `Arrow Down` / `Arrow Up` |
| Select language | `Enter` |
| Close menu | `Escape` |

## Accessibility Features

### Focus Indicators

All interactive elements have visible focus indicators:
- **Default**: Blue outline ring (`focus-visible:ring-2`)
- **Buttons**: Blue ring with offset (`focus-visible:ring-ring`)
- **Inputs**: Blue ring with glow effect (`focus-visible:ring-[3px]`)

### Visual Feedback

- **Hover states**: Visible on mouse hover
- **Active states**: Visual feedback when element is activated
- **Disabled states**: Reduced opacity and no pointer events

### Screen Reader Support

- **ARIA labels**: All interactive elements have descriptive labels
- **ARIA roles**: Proper roles assigned (searchbox, navigation, dialog)
- **Live regions**: Dynamic content updates announced to screen readers
- **Hidden elements**: Decorative icons marked with `aria-hidden="true"`

## Implementation Examples

### Skip Navigation Link

```tsx
import { SkipNavigation } from '@/components/SkipNavigation'

function App() {
  return (
    <>
      <SkipNavigation />
      {/* Rest of app */}
    </>
  )
}
```

### Accessible Button

```tsx
<Button
  onClick={handleClick}
  aria-label="Add product to cart"
>
  <ShoppingCart aria-hidden="true" />
  Add to Cart
</Button>
```

### Accessible Search Input

```tsx
<Input
  type="search"
  role="searchbox"
  aria-label="Search for products"
  placeholder="Search..."
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
    }
  }}
/>
```

### Focus Trap in Modal

```tsx
import { Dialog } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* Focus is automatically trapped within this content */}
    <DialogTitle>Modal Title</DialogTitle>
    {/* Interactive elements */}
  </DialogContent>
</Dialog>
```

### Keyboard Event Handler

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (e.target instanceof HTMLInputElement) return
    
    switch(e.key) {
      case '/':
        e.preventDefault()
        searchInputRef.current?.focus()
        break
      case '?':
        e.preventDefault()
        setShowKeyboardHelp(true)
        break
      case 'Escape':
        closeAllModals()
        break
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

## Testing Keyboard Navigation

### Manual Testing Checklist

- [ ] **Tab Navigation**: Can tab through all interactive elements
- [ ] **Tab Order**: Logical tab order (left to right, top to bottom)
- [ ] **Focus Indicators**: All focused elements have visible indicators
- [ ] **Skip Navigation**: Skip link appears on first tab and works
- [ ] **Modals**: Focus trapped in open modals
- [ ] **Forms**: Can complete forms using only keyboard
- [ ] **Dropdowns**: Can navigate and select using arrow keys
- [ ] **Escape Key**: Closes modals and dialogs
- [ ] **Enter Key**: Activates buttons and links
- [ ] **Space Key**: Activates buttons and toggles checkboxes

### Browser Testing

Test keyboard navigation in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

### Screen Reader Testing

Test with popular screen readers:
- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

## Common Patterns

### Card with Multiple Actions

```tsx
<Card tabIndex={0} onKeyDown={(e) => {
  if (e.key === 'Enter') {
    viewProductDetails()
  }
}}>
  <CardContent>
    <h3>{product.name}</h3>
    <Button
      onClick={addToCart}
      aria-label={`Add ${product.name} to cart`}
    >
      Add to Cart
    </Button>
    <Button
      onClick={addToWishlist}
      aria-label={`Add ${product.name} to wishlist`}
    >
      <Heart aria-hidden="true" />
    </Button>
  </CardContent>
</Card>
```

### Accessible Icon Button

```tsx
<Button
  variant="ghost"
  size="icon"
  aria-label="Close dialog"
  onClick={onClose}
>
  <X aria-hidden="true" />
</Button>
```

### Search with Keyboard Shortcut

```tsx
function Search() {
  const searchRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
  
  return (
    <Input
      ref={searchRef}
      type="search"
      role="searchbox"
      aria-label="Search products"
      placeholder="Press / to search"
    />
  )
}
```

## Tips for Developers

### 1. Always Provide Focus Styles

```css
/* Don't remove default focus styles */
button:focus {
  outline: none; /* ❌ Bad */
}

/* Use focus-visible for better UX */
button:focus-visible {
  ring: 2px solid blue; /* ✅ Good */
}
```

### 2. Maintain Logical Tab Order

Use `tabIndex` sparingly:
- `tabIndex="0"`: Include in natural tab order
- `tabIndex="-1"`: Exclude from tab order (but can receive focus programmatically)
- `tabIndex="1+"`: Avoid (disrupts natural order)

### 3. Trap Focus in Modals

```tsx
import { Dialog } from '@radix-ui/react-dialog'

// Radix UI components handle focus trapping automatically
<Dialog>
  <DialogContent>
    {/* Focus is trapped here */}
  </DialogContent>
</Dialog>
```

### 4. Announce Dynamic Changes

```tsx
// Use live regions for dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {itemsAddedMessage}
</div>
```

### 5. Test Without a Mouse

Regularly test your application using only the keyboard to identify issues.

## Resources

- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
- [Radix UI Documentation](https://www.radix-ui.com/) - Pre-built accessible components

## Support

For keyboard navigation issues:
1. Check this guide
2. Test in the latest browser version
3. Verify focus indicators are visible
4. Check console for accessibility warnings (axe-core)
5. Contact the development team

---

Last updated: 2025-10-16
