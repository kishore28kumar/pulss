# Product Variants Feature Guide

## Overview

The Pulss White-Label Platform now supports product variants, allowing you to offer the same product in different configurations (e.g., different strengths, pack sizes, colors, sizes, or flavors).

## Key Features

### 1. **Multiple Variant Types**
- Strength (e.g., 500mg, 650mg, 1000mg)
- Pack Size (e.g., 10 tablets, 30 tablets, 60 tablets)
- Color (e.g., Red, Blue, Green)
- Size (e.g., Small, Medium, Large)
- Flavor (e.g., Chocolate, Vanilla, Strawberry)

### 2. **Independent Pricing & Inventory**
- Each variant can have its own price and MRP
- Separate inventory tracking for each variant
- Real-time stock status updates

### 3. **CSV Import Support**
- Import products with variants using enhanced CSV format
- Auto-create variants during bulk upload
- Support for multiple variant types per product

### 4. **Customer-Facing Features**
- Interactive variant selectors on product cards
- Real-time price updates based on variant selection
- Stock availability per variant
- Low stock warnings

## Setting Up Product Variants

### Option 1: CSV Import

Use the enhanced CSV format to import products with variants:

```csv
name,brand,category,price,mrp,variant_strength,variant_strength_price,variant_strength_mrp,variant_pack_size,variant_pack_size_price,variant_pack_size_mrp
Paracetamol,Cipla,Medicines,50,60,500mg,50,60,10 tablets,50,60
Paracetamol,Cipla,Medicines,75,90,650mg,75,90,15 tablets,75,90
```

**CSV Column Format:**
- `variant_{type}`: The variant value (e.g., "500mg", "Blue", "Small")
- `variant_{type}_price`: Price for this variant (optional, uses product price if not specified)
- `variant_{type}_mrp`: MRP for this variant (optional, uses product MRP if not specified)
- `variant_{type}_inventory`: Inventory count for this variant (optional, uses product inventory if not specified)

**Supported Variant Types:**
- `variant_strength`
- `variant_pack_size`
- `variant_color`
- `variant_size`
- `variant_flavor`

### Option 2: API Integration

#### Create a Product Variant

```javascript
POST /api/products/tenants/:tenant_id/:product_id/variants

{
  "variant_name": "500mg",
  "variant_type": "strength",
  "price": 50,
  "mrp": 60,
  "inventory_count": 100,
  "is_default": true
}
```

#### Get Product Variants

```javascript
GET /api/products/tenants/:tenant_id/:product_id/variants

Response:
{
  "variants": [...],
  "variantsByType": {
    "strength": [
      {
        "variant_id": "...",
        "variant_name": "500mg",
        "price": 50,
        "mrp": 60,
        "inventory_count": 100,
        "is_default": true
      }
    ]
  }
}
```

#### Update a Variant

```javascript
PUT /api/products/tenants/:tenant_id/variants/:variant_id

{
  "price": 55,
  "inventory_count": 150
}
```

#### Delete a Variant

```javascript
DELETE /api/products/tenants/:tenant_id/variants/:variant_id
```

## Using Variants in Frontend

### ProductCardWithVariants Component

```tsx
import { ProductCardWithVariants } from '@/components/ProductCardWithVariants'

// Fetch product with variants
const product = {
  id: '...',
  name: 'Paracetamol',
  brand: 'Cipla',
  price: 50,
  mrp: 60,
  variants: [...], // Array of variants
  variantsByType: {
    strength: [...],
    pack_size: [...]
  }
}

// Render
<ProductCardWithVariants 
  product={product}
  onAddToCart={() => console.log('Added to cart')}
/>
```

### VariantSelector Component

```tsx
import { VariantSelector } from '@/components/VariantSelector'

<VariantSelector
  variants={product.variants}
  variantsByType={product.variantsByType}
  onVariantChange={(selectedVariants) => {
    console.log('Selected variants:', selectedVariants)
    // Update price, check stock, etc.
  }}
/>
```

## Database Schema

### product_variants Table

```sql
CREATE TABLE product_variants (
  variant_id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(product_id),
  tenant_id UUID REFERENCES tenants(tenant_id),
  variant_name TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  price DECIMAL(10,2),
  mrp DECIMAL(10,2),
  inventory_count INTEGER DEFAULT 0,
  sku TEXT,
  attributes JSONB,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Best Practices

### 1. **Naming Conventions**
- Use clear, descriptive names for variants
- Be consistent across products
- Examples: "500mg", "1kg", "Blue", "Large"

### 2. **Default Variants**
- Always mark one variant per type as default
- Default variants are pre-selected for customers
- Ensure default variants are in stock

### 3. **Inventory Management**
- Track inventory separately for each variant
- Set low stock thresholds per variant
- Update inventory in real-time

### 4. **Pricing Strategy**
- Variants can have different prices
- Consider offering discounts on larger pack sizes
- Keep MRP consistent with market pricing

### 5. **CSV Import**
- Test with a small CSV first
- Validate all variant data before import
- Use the provided sample CSV as a template

## Examples

### Pharmacy Products

**Paracetamol with Strength and Pack Size:**
```csv
name,brand,category,price,mrp,variant_strength,variant_pack_size
Paracetamol,Cipla,Medicines,50,60,500mg,10 tablets
Paracetamol,Cipla,Medicines,75,90,650mg,15 tablets
Paracetamol,Cipla,Medicines,95,110,1000mg,20 tablets
```

### Supplement Products

**Protein Powder with Flavor and Pack Size:**
```csv
name,brand,category,price,mrp,variant_flavor,variant_pack_size
Protein Powder,MuscleBlaze,Supplements,1200,1400,Chocolate,500g
Protein Powder,MuscleBlaze,Supplements,2500,2800,Chocolate,1kg
Protein Powder,MuscleBlaze,Supplements,1250,1450,Vanilla,500g
Protein Powder,MuscleBlaze,Supplements,2550,2850,Vanilla,1kg
```

### Personal Care Products

**Sanitizer with Pack Size:**
```csv
name,brand,category,price,mrp,variant_pack_size
Hand Sanitizer,Dettol,Personal Care,120,140,200ml
Hand Sanitizer,Dettol,Personal Care,200,230,500ml
Hand Sanitizer,Dettol,Personal Care,350,400,1L
```

## Troubleshooting

### Issue: Variants not showing on product card

**Solution:** Ensure the product data includes both `variants` array and `variantsByType` object.

### Issue: Price not updating when variant is selected

**Solution:** Check that the variant has a `price` field set. If not set, it will use the base product price.

### Issue: CSV import fails for variants

**Solution:** 
1. Check column names match exactly: `variant_strength`, `variant_pack_size`, etc.
2. Ensure variant values are not empty
3. Verify price/mrp values are valid numbers

### Issue: Out of stock variants still selectable

**Solution:** Set `active = false` or `inventory_count = 0` for out-of-stock variants.

## Migration from Non-Variant Products

If you have existing products without variants:

1. **Create variants via API** for each existing product
2. **Mark one as default** to maintain current behavior
3. **Optionally hide base product** if all sales should go through variants
4. **Update inventory** to match your current stock levels

## Sample CSV File

A complete sample CSV with variants is available at: `sample-products-with-variants.csv`

## Support

For questions or issues with product variants:
1. Check the API documentation
2. Review the sample CSV file
3. Test with a small subset of products first
4. Contact support if issues persist
