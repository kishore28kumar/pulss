# Product Catalog Management - User Guide

## Overview

The enhanced Product Catalog Management system provides best-in-class tools for admins to manage products, upload images, and maintain their product catalog efficiently.

## Features

### 1. Enhanced CSV Upload

Upload products in bulk with advanced validation and preview capabilities.

#### Key Features:
- **Image URL Validation**: Automatically validates image URLs before import
- **Preview Mode**: Preview first 10 rows with validation status before importing
- **Detailed Reports**: Get comprehensive import reports with success/failure counts
- **Error Handling**: Clear error messages for each failed row
- **Warnings**: Non-critical issues are flagged as warnings

#### How to Use:
1. Navigate to Admin Dashboard → Products → CSV Import
2. Download the sample CSV template
3. Fill in your product data following the format
4. Click "Validate" to preview and check for errors
5. Review the validation results
6. Click "Import" to proceed with the upload

#### CSV Format:
```csv
name,brand,category,price,mrp,image_url,images,requires_rx,description,pack_size,manufacturer,sku,tags
Product Name,Brand,Category,100,120,https://example.com/image.jpg,https://example.com/img1.jpg|https://example.com/img2.jpg,false,Description,Pack info,Manufacturer,SKU-001,tag1;tag2
```

**Required Fields:**
- `name`: Product name
- `price`: Selling price

**Optional Fields:**
- `brand`: Brand name
- `category`: Category name (will be auto-created if doesn't exist)
- `mrp`: Maximum Retail Price (defaults to price if not provided)
- `image_url`: Main product image URL
- `images`: Multiple image URLs separated by commas
- `requires_rx`: Set to "true" for prescription-required products
- `description`: Product description
- `pack_size`: Package size information
- `manufacturer`: Manufacturer name
- `sku`: Stock Keeping Unit (unique identifier)
- `tags`: Tags separated by semicolons

### 2. Bulk Image Upload

Upload multiple product images at once with automatic SKU matching.

#### Key Features:
- **Drag & Drop**: Simply drag images into the upload zone
- **Automatic SKU Extraction**: Extracts SKU from filename (e.g., `PAR-500-1.jpg` → SKU: `PAR-500`)
- **Manual SKU Mapping**: Edit SKU for each image before uploading
- **Real-time Preview**: See thumbnails of all images before upload
- **Progress Tracking**: Visual feedback during upload
- **Batch Processing**: Upload up to 100 images at once

#### How to Use:
1. Navigate to Admin Dashboard → Products → Bulk Images
2. Drag and drop images or click to browse
3. Review extracted SKUs and edit if needed
4. Click "Upload All" to process

#### Filename Convention:
For automatic SKU matching, name your files:
- `SKU-001.jpg` → Matches products with SKU "SKU-001"
- `PAR-500-image1.png` → Matches products with SKU "PAR-500"
- `PRODUCT_ID_thumbnail.jpg` → Matches products with SKU "PRODUCT_ID"

### 3. Product Image Editor

Manage images for individual products with a visual interface.

#### Key Features:
- **Add Multiple Images**: Upload several images at once
- **Drag to Reorder**: Simply drag images to change their order
- **Main Image Selection**: First image is automatically set as main
- **Delete Images**: Remove unwanted images with one click
- **Preview**: See how images will appear to customers

#### How to Use:
1. Go to Admin Dashboard → Products
2. Click on a product to edit
3. In the Product Image Editor section:
   - Click "Add Images" to upload new images
   - Drag images to reorder them
   - Click the trash icon to delete an image
4. Changes are saved automatically

### 4. Product Card Editor

Edit all product details in one place with real-time preview.

#### Editable Fields:
- **Basic Info**: Name, brand, pack size, description
- **Pricing**: Price and MRP
- **Images**: Full image management
- **Offer Badge**: Custom badge text with visibility toggle
- **Tags**: Add/remove product tags
- **Status**: Active/inactive, featured flag
- **Inventory**: Stock count

#### Offer Badge Management:
Create custom offer badges like:
- "9% off"
- "Buy 1 Get 1"
- "Limited Time Offer"
- "Flash Sale"

**Steps:**
1. Edit a product
2. Go to the "Offer Badge" section
3. Toggle "Show Badge" on
4. Enter custom badge text
5. Save changes

#### How to Use:
1. Navigate to Admin Dashboard → Products
2. Click on any product
3. Switch to the "Edit Product" tab
4. Make your changes
5. Click "Save" to update

### 5. Product Management Dashboard

Centralized dashboard for all product operations.

#### Features:
- **Search**: Find products quickly by name, SKU, or brand
- **Filter**: Show only active, inactive, or all products
- **Grid View**: Visual product cards with key information
- **Quick Edit**: Click any product to edit
- **Stats**: See total products, categories, and stock status

## API Endpoints

### CSV Import
```
POST /api/products/tenants/:tenant_id/import-csv?validate_only=true&validate_images=true
```

**Query Parameters:**
- `validate_only`: Set to `true` to validate without importing
- `validate_images`: Set to `true` to validate image URLs

**Response:**
```json
{
  "message": "CSV import completed",
  "results": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [...],
    "warnings": [...],
    "preview": [...]
  }
}
```

### Bulk Image Upload
```
POST /api/products/tenants/:tenant_id/bulk-upload-images
```

**Form Data:**
- `images`: Multiple image files
- `mappings`: JSON array of `{sku, imageIndex}` objects

**Response:**
```json
{
  "message": "Bulk image upload completed",
  "results": {
    "total": 50,
    "success": 48,
    "failed": 2,
    "errors": [...],
    "updated_products": [...]
  }
}
```

### Product Image Management

**Add Images:**
```
POST /api/products/tenants/:tenant_id/:product_id/images
```

**Delete Image:**
```
DELETE /api/products/:product_id/images
Body: { "image_url": "..." }
```

**Reorder Images:**
```
PUT /api/products/:product_id/images/reorder
Body: { "images": ["url1", "url2", "url3"] }
```

### Update Product
```
PUT /api/products/:product_id
```

**Body:**
```json
{
  "name": "Updated Name",
  "price": 150,
  "mrp": 180,
  "offer_badge_text": "10% OFF",
  "offer_badge_visible": true,
  "tags": ["tag1", "tag2"],
  "active": true,
  "featured": false
}
```

## Best Practices

### CSV Upload
1. Always validate before importing
2. Use absolute URLs for images
3. Keep file size under 10MB
4. Include SKU for tracking
5. Use consistent formatting

### Image Upload
1. Use high-quality images (at least 800x800px)
2. Compress images before upload (max 5MB per image)
3. Use descriptive filenames with SKU
4. Maintain aspect ratio (square images work best)
5. Test image URLs before bulk import

### Product Management
1. Add detailed descriptions
2. Use proper categorization
3. Keep inventory counts updated
4. Use offer badges strategically
5. Add relevant tags for search

## Troubleshooting

### CSV Upload Issues

**Problem**: Images not loading in preview
- **Solution**: Ensure image URLs are accessible and use HTTPS

**Problem**: Import fails with "Missing required fields"
- **Solution**: Check that name and price columns are present and not empty

**Problem**: Category not created
- **Solution**: Verify category name is properly formatted

### Image Upload Issues

**Problem**: Images not matching products
- **Solution**: Check SKU in filename matches product SKU exactly

**Problem**: Upload fails
- **Solution**: Verify file size is under 5MB and format is JPG/PNG/WebP/GIF

**Problem**: Image quality poor
- **Solution**: Use higher resolution images (minimum 800x800px)

### Product Editor Issues

**Problem**: Changes not saving
- **Solution**: Check internet connection and try again

**Problem**: Images not reordering
- **Solution**: Drag images more slowly and wait for save confirmation

## Database Schema

### Products Table
Enhanced with new columns:
- `offer_badge_text`: Custom text for offer badge
- `offer_badge_visible`: Toggle badge visibility
- `discount_percentage`: Calculated discount
- `is_bundle`: Flag for bundle products
- `bundle_products`: JSONB array of bundled items

### Product Bundles Table
New table for managing complex bundles:
- `bundle_id`: Unique identifier
- `name`: Bundle name
- `bundle_products`: JSONB array of products
- `total_price`: Bundle price
- `savings`: Amount saved
- `badge_text`: Custom badge text

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Test with sample data first
4. Contact support if needed

## Updates and Changelog

### Version 1.0.0 (Current)
- Initial release with enhanced CSV upload
- Bulk image upload functionality
- Product image editor
- Product card editor
- Offer badge management
- Database migrations for new features
