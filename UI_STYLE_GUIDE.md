# UI/UX Style Guide - Pulss Platform

This document provides comprehensive guidelines for maintaining visual consistency across the Pulss platform.

## 🎨 Design Principles

### 1. **Modern & Clean**
- Use ample white space
- Clear visual hierarchy
- Rounded corners (8px-16px)
- Subtle shadows and gradients

### 2. **Responsive First**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly tap targets (minimum 44x44px)

### 3. **Performance**
- Skeleton loaders for perceived speed
- Lazy loading for images
- Optimized animations (60fps)
- Progressive enhancement

### 4. **Accessibility**
- High contrast ratios (WCAG AA compliant)
- Focus states for all interactive elements
- Keyboard navigation support
- Screen reader friendly

---

## 🎭 Animation Guidelines

### Animation Duration
```typescript
DURATION = {
  instant: 0.1s,  // Micro-interactions
  fast: 0.2s,     // Button hovers, toggles
  normal: 0.3s,   // Card transitions, modals
  slow: 0.5s,     // Page transitions
}
```

### When to Use Animations

**DO:**
- Page transitions and route changes
- Card hovers and interactions
- Button state changes
- Loading states
- Success/error feedback
- Modal appearances

**DON'T:**
- Overuse animations (can be distracting)
- Animate during critical tasks
- Use slow animations for frequent actions
- Animate text content (readability)

### Common Animation Patterns

```typescript
// Card Hover
whileHover={{ y: -8, boxShadow: '...' }}

// Button Press
whileTap={{ scale: 0.95 }}

// Stagger Children
variants={staggerContainer}
```

---

## 🎨 Color System

### Primary Colors
- **Blue**: `#2563EB` (blue-600) - Primary actions, links
- **Purple**: `#9333EA` (purple-600) - Secondary actions, accents
- **Gradient**: `from-blue-600 to-purple-600` - Premium features

### Semantic Colors
- **Success**: `#16A34A` (green-600)
- **Warning**: `#EA580C` (orange-600)
- **Error**: `#DC2626` (red-600)
- **Info**: `#0891B2` (cyan-600)

### Neutral Colors
- **Gray Scale**: gray-50 to gray-900
- **Background**: white / gray-900 (dark)
- **Text**: gray-900 / white (dark)
- **Muted**: gray-600 / gray-400 (dark)

### Product Badges
- **NEW**: Blue gradient with sparkle
- **SALE**: Red/pink gradient with tag
- **BESTSELLER**: Green with star
- **TRENDING**: Orange/yellow with trend icon

---

## 📐 Spacing System

### Base Unit: 4px

```css
0.5 = 2px   (0.125rem)
1   = 4px   (0.25rem)
2   = 8px   (0.5rem)
3   = 12px  (0.75rem)
4   = 16px  (1rem)
6   = 24px  (1.5rem)
8   = 32px  (2rem)
12  = 48px  (3rem)
16  = 64px  (4rem)
```

### Common Patterns
- **Component Padding**: 4-6 (16-24px)
- **Card Padding**: 6 (24px)
- **Section Spacing**: 8-12 (32-48px)
- **Element Gaps**: 2-4 (8-16px)

---

## 📝 Typography

### Font Family
- **Primary**: System font stack (Inter, SF Pro, Segoe UI)
- **Mono**: Monospace for code

### Font Sizes
```css
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px)
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
```

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Text Hierarchy
```jsx
// Page Title
<h1 className="text-3xl md:text-4xl font-bold">

// Section Title
<h2 className="text-2xl md:text-3xl font-bold">

// Card Title
<h3 className="text-xl font-semibold">

// Body Text
<p className="text-base text-gray-700 dark:text-gray-300">

// Helper Text
<p className="text-sm text-gray-600 dark:text-gray-400">
```

---

## 🃏 Component Patterns

### Card Design
```jsx
<Card className="rounded-xl shadow-md hover:shadow-xl transition-shadow">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Guidelines:**
- Use `rounded-xl` for cards
- `shadow-md` default, `shadow-xl` on hover
- Padding: 6 (24px)
- Border: None or `border border-gray-200`

### Buttons

**Primary Button:**
```jsx
<Button className="bg-gradient-to-r from-blue-600 to-purple-600">
  Action
</Button>
```

**Secondary Button:**
```jsx
<Button variant="outline">
  Action
</Button>
```

**Sizes:**
- Small: `h-8 px-3 text-sm`
- Default: `h-10 px-4`
- Large: `h-12 px-6 text-lg`

### Input Fields
```jsx
<Input 
  className="h-11 rounded-lg border-2 focus:border-blue-500"
  placeholder="Enter text..."
/>
```

**States:**
- Default: `border-gray-200`
- Focus: `border-blue-500 ring-4 ring-blue-100`
- Error: `border-red-500 ring-4 ring-red-100`
- Disabled: `opacity-50 cursor-not-allowed`

---

## 🖼️ Image Guidelines

### Aspect Ratios
- **Product Images**: 1:1 (square)
- **Banners**: 16:9 or 21:9
- **Thumbnails**: 1:1 or 4:3
- **Avatars**: 1:1 (circular)

### Loading States
```jsx
{!imageLoaded && <Skeleton className="aspect-square" />}
```

### Optimization
- Use WebP format when possible
- Lazy load images below fold
- Provide `alt` text for accessibility
- Use responsive images with `srcset`

---

## 🎯 Interactive Elements

### Hover States
```jsx
// Cards
hover:shadow-lg hover:-translate-y-1

// Buttons
hover:scale-105 hover:bg-opacity-90

// Links
hover:text-blue-700 hover:underline
```

### Focus States
```jsx
focus:outline-none focus:ring-4 focus:ring-blue-100
```

### Active States
```jsx
active:scale-95 active:bg-opacity-80
```

### Disabled States
```jsx
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## 📱 Mobile Optimization

### Touch Targets
- Minimum size: 44x44px
- Adequate spacing between elements
- Large tap areas for critical actions

### Mobile Menu
- Slide-in animation from left
- Full-height overlay
- Close button top-right
- Clear visual hierarchy

### Mobile Cards
```jsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

---

## 🌓 Dark Mode

### Color Adjustments
```jsx
// Text
text-gray-900 dark:text-white
text-gray-600 dark:text-gray-400

// Backgrounds
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-800

// Borders
border-gray-200 dark:border-gray-700
```

### Opacity Adjustments
- Reduce opacity of shadows in dark mode
- Increase contrast for text
- Use darker backgrounds for cards

---

## 🎪 Special Effects

### Gradients
```jsx
// Primary gradient
bg-gradient-to-r from-blue-600 to-purple-600

// Success gradient
bg-gradient-to-r from-green-500 to-emerald-500

// Warning gradient
bg-gradient-to-r from-orange-500 to-red-500
```

### Glassmorphism
```jsx
bg-white/95 backdrop-blur-md
```

### Shadows
```jsx
// Card default
shadow-md

// Card hover
shadow-xl

// Elevated
shadow-2xl

// Colored shadow
shadow-lg shadow-blue-500/25
```

---

## 🚀 Performance Best Practices

### Animations
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Prefer CSS animations for simple effects

### Images
- Lazy load with `loading="lazy"`
- Use appropriate image sizes
- Implement blur-up placeholder
- Progressive JPEG/WebP

### Code Splitting
- Lazy load routes
- Dynamic imports for heavy components
- Code split by route

---

## ✅ Checklist for New Components

- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Loading states (skeleton loaders)
- [ ] Empty states with illustrations
- [ ] Error states with retry
- [ ] Hover/focus/active states
- [ ] Smooth animations
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] TypeScript types
- [ ] Documentation

---

## 📚 Component Library

### Layout Components
- `StickyNav` - Navigation bar
- `FloatingActionButtons` - FAB group
- `Footer` - Footer component

### Product Components
- `ProductCard` - Product display card
- `ProductImageGallery` - Image viewer
- `ProductRatings` - Reviews UI
- `ProductSection` - Discovery sections

### UI Components
- `Skeleton` - Loading states
- `EmptyState` - Empty states
- `EnhancedBadge` - Badge system
- `CheckoutProgress` - Checkout flow
- `OrderTimeline` - Order tracking

### Utility Components
- `ThemeSwitcher` - Theme controls
- `DashboardStats` - Statistics cards
- `WelcomeBanner` - Welcome message

---

## 🔗 Resources

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Radix UI Docs](https://www.radix-ui.com)
- [Phosphor Icons](https://phosphoricons.com)

---

**Remember**: Consistency is key. When in doubt, refer to existing components for patterns and styling.
