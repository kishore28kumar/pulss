# Product Catalog Management API

## Overview
This API provides comprehensive product catalog management capabilities including CSV import, bulk image upload, and product editing.

## Authentication
All endpoints require authentication via JWT token:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. CSV Import

#### Validate and Import CSV
```http
POST /api/products/tenants/:tenant_id/import-csv
```

**Query Parameters:**
- `validate_only` (optional): Set to `true` to validate without importing (default: `false`)
- `validate_images` (optional): Set to `true` to validate image URLs (default: `true`)

**Request:**
- Content-Type: `multipart/form-data`
- Body: CSV file with field name `csv`

**Response:**
```json
{
  "message": "CSV import completed",
  "results": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {
        "row": 12,
        "data": {...},
        "error": "Missing required fields: price"
      }
    ],
    "warnings": [
      {
        "row": 5,
        "data": {...},
        "warnings": ["Image URL validation failed: timeout"]
      }
    ],
    "preview": [
      {
        "row": 1,
        "data": {...},
        "imageValidation": {
          "valid": true
        },
        "errors": [],
        "warnings": []
      }
    ]
  }
}
```

**CSV Format:**
```csv
name,brand,category,price,mrp,image_url,images,requires_rx,description,pack_size,manufacturer,sku,tags
```

### 2. Bulk Image Upload

#### Upload Multiple Images
```http
POST /api/products/tenants/:tenant_id/bulk-upload-images
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `images`: Array of image files (max 100)
  - `mappings`: JSON string of array `[{sku, imageIndex}]`

**Mappings Example:**
```json
[
  { "sku": "PROD-001", "imageIndex": 0 },
  { "sku": "PROD-002", "imageIndex": 1 }
]
```

**Response:**
```json
{
  "message": "Bulk image upload completed",
  "results": {
    "total": 50,
    "success": 48,
    "failed": 2,
    "errors": [
      {
        "sku": "INVALID-SKU",
        "error": "Product not found"
      }
    ],
    "updated_products": [
      {
        "product_id": "uuid",
        "name": "Product Name",
        "sku": "PROD-001",
        "images": ["/uploads/products/image1.jpg"]
      }
    ]
  }
}
```

### 3. Product Image Management

#### Upload Images to Product
```http
POST /api/products/tenants/:tenant_id/:product_id/images
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Up to 10 image files with field name `images`

**Response:**
```json
{
  "message": "Images uploaded successfully",
  "images": [
    "/uploads/products/image1.jpg",
    "/uploads/products/image2.jpg"
  ],
  "product": {
    "product_id": "uuid",
    "name": "Product Name",
    "images": ["/uploads/products/image1.jpg", "/uploads/products/image2.jpg"],
    "image_url": "/uploads/products/image1.jpg"
  }
}
```

#### Delete Product Image
```http
DELETE /api/products/:product_id/images
```

**Request:**
```json
{
  "image_url": "/uploads/products/image1.jpg"
}
```

**Response:**
```json
{
  "message": "Image deleted successfully",
  "product": {
    "product_id": "uuid",
    "images": ["/uploads/products/image2.jpg"],
    "image_url": "/uploads/products/image2.jpg"
  }
}
```

#### Reorder Product Images
```http
PUT /api/products/:product_id/images/reorder
```

**Request:**
```json
{
  "images": [
    "/uploads/products/image3.jpg",
    "/uploads/products/image1.jpg",
    "/uploads/products/image2.jpg"
  ]
}
```

**Response:**
```json
{
  "message": "Images reordered successfully",
  "product": {
    "product_id": "uuid",
    "images": [
      "/uploads/products/image3.jpg",
      "/uploads/products/image1.jpg",
      "/uploads/products/image2.jpg"
    ],
    "image_url": "/uploads/products/image3.jpg"
  }
}
```

### 4. Product Management

#### List Products
```http
GET /api/products/tenants/:tenant_id
```

**Query Parameters:**
- `category_id`: Filter by category
- `search`: Search in name, description, brand, SKU
- `active`: Filter by active status (true/false)
- `featured`: Filter by featured status (true/false)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort_by`: Sort field (default: created_at)
- `sort_order`: Sort order (ASC/DESC, default: DESC)

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Create Product
```http
POST /api/products/tenants/:tenant_id
```

**Request:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "brand": "Brand Name",
  "pack_size": "100ml",
  "price": 99.99,
  "mrp": 120.00,
  "sku": "PROD-001",
  "image_url": "https://example.com/image.jpg",
  "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
  "requires_rx": false,
  "active": true,
  "featured": false,
  "inventory_count": 100,
  "tags": ["tag1", "tag2"],
  "manufacturer": "Manufacturer Name",
  "category_id": "category-uuid",
  "offer_badge_text": "10% OFF",
  "offer_badge_visible": true
}
```

**Response:**
```json
{
  "message": "Product created successfully",
  "product": {...}
}
```

#### Update Product
```http
PUT /api/products/:product_id
```

**Request:**
All fields are optional. Only include fields you want to update.
```json
{
  "name": "Updated Name",
  "price": 89.99,
  "offer_badge_text": "15% OFF",
  "offer_badge_visible": true,
  "tags": ["new-tag1", "new-tag2"],
  "active": true,
  "featured": true
}
```

**Response:**
```json
{
  "message": "Product updated successfully",
  "product": {...}
}
```

#### Delete Product
```http
DELETE /api/products/:product_id
```

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

- CSV Import: 10 requests per hour
- Bulk Image Upload: 20 requests per hour
- Other endpoints: 100 requests per minute

## File Size Limits

- CSV files: 10MB max
- Individual images: 5MB max
- Bulk upload: 100 images max per request

## Image Requirements

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**Recommendations:**
- Minimum resolution: 800x800px
- Recommended resolution: 1200x1200px
- Aspect ratio: 1:1 (square) preferred
- File size: Under 2MB per image for optimal performance

## Examples

### Example 1: Validate CSV Before Import

```bash
curl -X POST \
  'http://localhost:3001/api/products/tenants/tenant-123/import-csv?validate_only=true&validate_images=true' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'csv=@products.csv'
```

### Example 2: Bulk Upload Images

```bash
curl -X POST \
  'http://localhost:3001/api/products/tenants/tenant-123/bulk-upload-images' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'images=@PROD-001.jpg' \
  -F 'images=@PROD-002.jpg' \
  -F 'mappings=[{"sku":"PROD-001","imageIndex":0},{"sku":"PROD-002","imageIndex":1}]'
```

### Example 3: Update Product with Offer Badge

```bash
curl -X PUT \
  'http://localhost:3001/api/products/product-uuid-123' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "offer_badge_text": "Flash Sale - 20% OFF",
    "offer_badge_visible": true,
    "price": 79.99
  }'
```

### Example 4: Reorder Product Images

```bash
curl -X PUT \
  'http://localhost:3001/api/products/product-uuid-123/images/reorder' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "images": [
      "/uploads/products/main.jpg",
      "/uploads/products/side.jpg",
      "/uploads/products/back.jpg"
    ]
  }'
```

## Migration

### Database Migration

Run the migration to add offer and bundle support:

```bash
cd backend
psql $DATABASE_URL -f migrations/10_add_product_offers_and_badges.sql
```

### Schema Changes

The migration adds the following columns to the `products` table:
- `offer_badge_text` (TEXT): Custom badge text
- `offer_badge_visible` (BOOLEAN): Toggle badge visibility
- `discount_percentage` (INTEGER): Calculated discount
- `discount_amount` (DECIMAL): Fixed discount amount
- `offer_start_date` (TIMESTAMP): Offer start time
- `offer_end_date` (TIMESTAMP): Offer end time
- `is_bundle` (BOOLEAN): Bundle product flag
- `bundle_products` (JSONB): Bundle composition

It also creates a new `product_bundles` table for complex bundle management.

## Testing

See `tests/curl_tests.sh` for comprehensive endpoint testing examples.

## Support

For issues or questions, please refer to:
- User Guide: `PRODUCT_CATALOG_GUIDE.md`
- Main API Documentation: `API_DOCUMENTATION.md`
