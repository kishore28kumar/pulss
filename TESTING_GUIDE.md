# Accessibility Testing Quick Reference

## Quick Testing Checklist

### ⌨️ Keyboard Navigation (5 minutes)

1. **Tab through the page** - All interactive elements should be reachable
   - [ ] Header buttons (language, theme, cart, profile)
   - [ ] Search input
   - [ ] Product cards
   - [ ] Category filters
   - [ ] Footer links

2. **Check tab order** - Should follow visual layout (left-to-right, top-to-bottom)
   - [ ] Logical flow
   - [ ] No unexpected jumps

3. **Test skip navigation**
   - [ ] Press Tab on page load
   - [ ] Skip link appears
   - [ ] Press Enter - jumps to main content

4. **Test modals**
   - [ ] Open cart modal (Tab to cart, Enter)
   - [ ] Focus trapped in modal
   - [ ] Escape closes modal

5. **Test forms**
   - [ ] Can navigate with Tab
   - [ ] Can submit with Enter
   - [ ] Can activate buttons with Space

### 👁️ Visual Checks (3 minutes)

1. **Focus indicators**
   - [ ] Visible on all focused elements
   - [ ] Blue ring with good contrast
   - [ ] Clear and consistent

2. **Color contrast**
   - [ ] Text is readable
   - [ ] Buttons have good contrast
   - [ ] Icons are distinguishable

3. **Responsive design**
   - [ ] Works at 200% zoom
   - [ ] Mobile view is accessible
   - [ ] No horizontal scrolling

### 🎯 Screen Reader (10 minutes)

**Windows (NVDA)**
- Download: https://www.nvaccess.org/
- Start: Ctrl + Alt + N
- Navigate: Up/Down arrows
- Activate: Enter

**macOS (VoiceOver)**
- Start: Cmd + F5
- Navigate: Ctrl + Option + Arrow keys
- Activate: Ctrl + Option + Space

**Test these:**
- [ ] Page title is announced
- [ ] Headings are identified
- [ ] Buttons have clear labels
- [ ] Images have descriptions
- [ ] Form inputs have labels
- [ ] Live regions announce updates (toast messages)

### 🔍 Browser DevTools (5 minutes)

**Chrome/Edge Lighthouse**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Review and address issues

**Target Score**: 90+ (ideally 100)

**Firefox Accessibility Inspector**
1. Open DevTools (F12)
2. Go to Accessibility tab
3. Check the tree structure
4. Verify ARIA attributes

### 🛠️ Automated Tools

**axe DevTools (Chrome Extension)**
- Install: https://www.deque.com/axe/devtools/
- Run: F12 → axe DevTools tab → Scan
- Fix all violations

**WAVE (Web Extension)**
- Install: https://wave.webaim.org/extension/
- Run: Click WAVE icon
- Address errors and warnings

**Built-in (Development Mode)**
- Run: `npm run dev`
- Open: http://localhost:5000
- Check: Browser console for axe-core violations

## Quick Fixes

### Missing alt text
```tsx
// Before
<img src={product.image_url} />

// After
<img src={product.image_url} alt={product.name} />
```

### Button without label
```tsx
// Before
<Button><X /></Button>

// After
<Button aria-label="Close">
  <X aria-hidden="true" />
</Button>
```

### Input without label
```tsx
// Before
<Input placeholder="Search..." />

// After
<Input 
  aria-label="Search products"
  placeholder="Search..."
/>
```

### Decorative icon
```tsx
// Before
<Heart />

// After
<Heart aria-hidden="true" />
```

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| No skip link | Add `<SkipNavigation />` component |
| Poor focus visibility | Ensure `focus-visible:ring-2` is applied |
| Modal doesn't trap focus | Use Radix UI Dialog component |
| Heading hierarchy broken | Use h1, h2, h3 in order |
| Form without labels | Add `<Label>` or `aria-label` |
| Button has no name | Add text or `aria-label` |
| Link has no text | Add descriptive text or `aria-label` |
| Image without alt | Add `alt` attribute |
| Insufficient contrast | Use darker/lighter colors |

## WCAG Quick Reference

### Level A (Must Have)
- ✅ Text alternatives for images
- ✅ Keyboard accessible
- ✅ Sufficient time to read content
- ✅ No flashing content
- ✅ Navigable
- ✅ Meaningful sequence
- ✅ Identify input purpose

### Level AA (Should Have)
- ✅ Color contrast (4.5:1 for text)
- ✅ Text resizing (up to 200%)
- ✅ Multiple ways to find pages
- ✅ Headings and labels
- ✅ Focus visible
- ✅ Language of page
- ✅ Consistent navigation

## Testing Matrix

| Test | Tool | Time | Priority |
|------|------|------|----------|
| Keyboard navigation | Manual | 5 min | High |
| Screen reader | NVDA/VoiceOver | 10 min | High |
| Color contrast | Lighthouse | 2 min | High |
| ARIA labels | axe DevTools | 3 min | High |
| HTML validation | W3C Validator | 2 min | Medium |
| Mobile testing | Device/Emulator | 5 min | Medium |
| Zoom testing | Browser zoom | 2 min | Medium |

## Pass/Fail Criteria

### Must Pass ✅
- No axe-core violations (critical/serious)
- Lighthouse accessibility score > 90
- All interactive elements keyboard accessible
- All images have alt text
- All buttons have labels
- Skip navigation works
- Focus indicators visible

### Should Pass ⚠️
- Lighthouse accessibility score = 100
- No axe-core violations (any level)
- Screen reader announces all content correctly
- Works at 200% zoom
- Works on mobile devices

### Nice to Have 💡
- High contrast mode support
- Reduced motion support
- Voice control support
- Multiple language support

## Regular Testing Schedule

### During Development
- Run axe-core (automatic in dev mode)
- Check console for violations
- Test keyboard navigation for new features

### Before Each Commit
- Quick keyboard test (2 minutes)
- Run Lighthouse (2 minutes)
- Fix critical issues

### Before Each Release
- Full accessibility audit
- Screen reader testing
- Multiple browser testing
- Mobile device testing

### Monthly
- Comprehensive accessibility review
- User testing with assistive technologies
- Update documentation
- Address moderate/minor issues

## Emergency Fixes

### Page is not keyboard accessible
1. Check tab order
2. Ensure all buttons have `tabIndex={0}` or no tabIndex
3. Verify no `tabIndex > 0`

### Screen reader announces nothing
1. Check HTML lang attribute
2. Verify ARIA labels exist
3. Ensure semantic HTML is used

### Poor contrast
1. Use contrast checker tool
2. Adjust colors to meet 4.5:1 ratio
3. Test with Lighthouse

### Modal doesn't close
1. Add Escape key handler
2. Add close button with clear label
3. Ensure focus trap is correct

## Resources

### Quick Links
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Documentation
- See `ACCESSIBILITY.md` for detailed guide
- See `KEYBOARD_NAVIGATION.md` for keyboard patterns
- See `INTERNATIONALIZATION.md` for i18n guide

---

**Print this page** and keep it near your workstation for quick reference!

Last updated: 2025-10-16
