# Product Catalog Management - Quick Start

## 🚀 Getting Started

This guide will help you quickly start using the new product catalog management features.

## Prerequisites

- Admin access to the platform
- Products to upload (or use sample CSV)
- Product images (optional but recommended)

## 5-Minute Quick Start

### Step 1: Access Product Management (30 seconds)

1. Log in to Admin Dashboard
2. Click on **Products** tab in the main navigation
3. You'll see 4 sub-tabs:
   - Products
   - CSV Import
   - Bulk Images  
   - Edit Product

### Step 2: Import Products via CSV (2 minutes)

1. Go to **CSV Import** tab
2. Click **Download Sample** to get a template
3. Open the CSV and add your products:
   ```csv
   name,brand,category,price,mrp,image_url
   Aspirin 500mg,Bayer,Medicines,50,60,https://example.com/aspirin.jpg
   Vitamin C,Nature's,Supplements,120,150,https://example.com/vitc.jpg
   ```
4. Click **Validate** to preview and check for errors
5. Review the validation results
6. Click **Import** to complete

**✅ Done! Your products are now in the catalog.**

### Step 3: Add Images in Bulk (1.5 minutes)

1. Go to **Bulk Images** tab
2. Prepare your image files:
   - Name them with SKU: `ASPIRIN-500.jpg`, `VITC-001.jpg`
   - Or prepare to manually map SKUs
3. Drag and drop images into the upload zone
4. Verify SKU mappings (auto-extracted from filenames)
5. Click **Upload All**

**✅ Done! All images are now linked to products.**

### Step 4: Edit a Product (1 minute)

1. Go to **Products** tab
2. Click on any product card
3. Switch to **Edit Product** tab
4. Make changes:
   - Update price/description
   - Add/reorder images
   - Enable offer badge
   - Add tags
5. Click **Save**

**✅ Done! Product is updated with your changes.**

## Common Tasks

### Task: Add an Offer Badge

**Time: 30 seconds**

1. Edit any product
2. Find "Offer Badge" section
3. Toggle "Show Badge" ON
4. Enter text like "20% OFF" or "Limited Time"
5. Save

### Task: Reorder Product Images

**Time: 15 seconds**

1. Edit a product
2. In the image gallery, drag images to reorder
3. First image becomes the main image
4. Changes save automatically

### Task: Bulk Update Product Images

**Time: 2 minutes**

1. Name images with product SKU
2. Go to Bulk Images tab
3. Drop all images at once
4. Review and upload

### Task: Search and Filter Products

**Time: 10 seconds**

1. Go to Products tab
2. Use search box for name/SKU/brand
3. Use dropdown to filter by active/inactive
4. Click any product to edit

## Best Practices

### ✅ DO:
- Validate CSV before importing
- Use high-quality images (800x800px minimum)
- Name image files with SKU for auto-matching
- Add descriptive tags for better search
- Use offer badges strategically
- Keep product information complete

### ❌ DON'T:
- Upload images larger than 5MB
- Use HTTP URLs (use HTTPS)
- Skip validation step
- Forget to add SKU to products
- Use special characters in filenames

## Tips & Tricks

### 💡 Tip 1: Fast CSV Import
Download the sample, keep the same format, just replace the data.

### 💡 Tip 2: Bulk Image Naming
Use format: `SKU-description.jpg`
Example: `ASPIRIN-500-front.jpg`, `ASPIRIN-500-label.jpg`

### 💡 Tip 3: Quick Product Edit
Click any product in the grid to jump straight to editing.

### 💡 Tip 4: Offer Badges
Make them short and impactful: "SALE", "NEW", "15% OFF"

### 💡 Tip 5: Tags for Search
Add common search terms as tags: "pain relief", "fever", "headache"

## Troubleshooting Quick Fixes

### Problem: CSV won't import
**Fix:** Check that name and price columns exist and have values

### Problem: Images not loading
**Fix:** Ensure URLs use HTTPS and are publicly accessible

### Problem: SKU not matching in bulk upload
**Fix:** Rename files to start with exact SKU, or manually map SKUs

### Problem: Changes not saving
**Fix:** Check internet connection, refresh page, try again

## Example Workflows

### Workflow 1: New Store Setup (10 minutes)

1. Download sample CSV
2. Add 20-50 products with basic info
3. Import CSV with validation
4. Bulk upload all product images
5. Edit featured products to add offer badges
6. Done! Store is ready

### Workflow 2: Seasonal Sale Setup (5 minutes)

1. Search for products to put on sale
2. Click each product to edit
3. Update price
4. Add offer badge "SUMMER SALE"
5. Set featured = true
6. Done! Sale products are highlighted

### Workflow 3: New Product Launch (3 minutes)

1. Add product via CSV (single row) OR use Create Product
2. Upload multiple high-quality images
3. Add detailed description and tags
4. Set featured = true
5. Add "NEW" offer badge
6. Done! Product is showcased

## Need Help?

- **User Guide**: See `PRODUCT_CATALOG_GUIDE.md` for detailed instructions
- **API Docs**: See `PRODUCT_CATALOG_API.md` for technical details
- **Sample Files**: Download from the CSV Import tab

## Keyboard Shortcuts

- `Ctrl/Cmd + Click` on product → Opens in edit mode
- `Esc` → Cancel current operation
- Drag images → Reorder

## What's Next?

After mastering the basics:

1. ✨ Try creating product bundles
2. 🎯 Experiment with different offer badge styles
3. 📊 Monitor which products perform best
4. 🔄 Regularly update product images and descriptions
5. 🏷️ Build a comprehensive tagging system

---

**Pro Tip**: Bookmark this page for quick reference! 

**Ready to go?** Jump to the Products tab and start managing your catalog like a pro! 🚀
