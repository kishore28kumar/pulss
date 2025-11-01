// Business type configurations for universal white-label platform

export interface BusinessType {
  id: string
  name: string
  icon: string
  searchPlaceholder: string
  categories: string[]
  productFields: ProductField[]
  defaultTheme: string
  welcomeMessage: string
}

export interface ProductField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
  options?: string[]
  required: boolean
  placeholder?: string
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: 'pharmacy',
    name: 'Pharmacy/Chemist',
    icon: '💊',
    searchPlaceholder: 'Search medicines, symptoms, brands...',
    categories: [
      'Prescription Medicines',
      'OTC Medicines',
      'Health Supplements',
      'Personal Care',
      'Baby Care',
      'Medical Devices',
      'Ayurvedic',
      'Homeopathic'
    ],
    productFields: [
      { key: 'requires_rx', label: 'Requires Prescription', type: 'boolean', required: true },
      { key: 'brand', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Cipla, Sun Pharma' },
      { key: 'pack_size', label: 'Pack Size', type: 'text', required: true, placeholder: 'e.g., 10 tablets, 100ml' },
      { key: 'composition', label: 'Composition', type: 'textarea', required: false, placeholder: 'Active ingredients' },
      { key: 'uses', label: 'Uses/Indications', type: 'textarea', required: false, placeholder: 'Medical uses' },
      { key: 'side_effects', label: 'Side Effects', type: 'textarea', required: false, placeholder: 'Common side effects' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'text', required: false, placeholder: 'MM/YYYY' }
    ],
    defaultTheme: 'medical',
    welcomeMessage: 'Your trusted healthcare partner'
  },
  {
    id: 'grocery',
    name: 'Grocery Store',
    icon: '🛒',
    searchPlaceholder: 'Search groceries, vegetables, daily needs...',
    categories: [
      'Fruits & Vegetables',
      'Dairy Products',
      'Packaged Food',
      'Beverages',
      'Household Items',
      'Personal Care',
      'Snacks',
      'Frozen Food'
    ],
    productFields: [
      { key: 'brand', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Amul, Britannia' },
      { key: 'weight', label: 'Weight/Quantity', type: 'text', required: true, placeholder: 'e.g., 1kg, 500ml, 1 piece' },
      { key: 'organic', label: 'Organic Product', type: 'boolean', required: false },
      { key: 'shelf_life', label: 'Shelf Life', type: 'text', required: false, placeholder: 'e.g., 6 months, 1 year' },
      { key: 'storage', label: 'Storage Instructions', type: 'text', required: false, placeholder: 'Store in cool, dry place' },
      { key: 'origin', label: 'Origin/Source', type: 'text', required: false, placeholder: 'Local/Imported' }
    ],
    defaultTheme: 'grocery',
    welcomeMessage: 'Fresh groceries delivered to your doorstep'
  },
  {
    id: 'fashion',
    name: 'Fashion/Garments',
    icon: '👕',
    searchPlaceholder: 'Search clothing, accessories, brands...',
    categories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Kids Clothing',
      'Footwear',
      'Accessories',
      'Ethnic Wear',
      'Sportswear',
      'Innerwear'
    ],
    productFields: [
      { key: 'brand', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Nike, Zara' },
      { key: 'sizes', label: 'Available Sizes', type: 'text', required: true, placeholder: 'S,M,L,XL or 28,30,32' },
      { key: 'colors', label: 'Available Colors', type: 'text', required: true, placeholder: 'Red,Blue,Black' },
      { key: 'material', label: 'Material/Fabric', type: 'text', required: false, placeholder: 'Cotton, Polyester, etc.' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Kids', 'Unisex'], required: true },
      { key: 'season', label: 'Season', type: 'select', options: ['Summer', 'Winter', 'Monsoon', 'All Season'], required: false },
      { key: 'care_instructions', label: 'Care Instructions', type: 'text', required: false, placeholder: 'Machine wash, Hand wash' }
    ],
    defaultTheme: 'fashion',
    welcomeMessage: 'Style meets comfort at unbeatable prices'
  },
  {
    id: 'electronics',
    name: 'Electronics Store',
    icon: '📱',
    searchPlaceholder: 'Search mobiles, laptops, accessories...',
    categories: [
      'Mobile Phones',
      'Laptops & Computers',
      'Audio & Video',
      'Home Appliances',
      'Accessories',
      'Gaming',
      'Cameras',
      'Smart Home'
    ],
    productFields: [
      { key: 'brand', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g., Apple, Samsung' },
      { key: 'model', label: 'Model Number', type: 'text', required: true, placeholder: 'Product model' },
      { key: 'specifications', label: 'Key Specifications', type: 'textarea', required: false, placeholder: 'Technical specifications' },
      { key: 'warranty', label: 'Warranty Period', type: 'text', required: false, placeholder: '1 year, 2 years' },
      { key: 'color', label: 'Color Options', type: 'text', required: false, placeholder: 'Black,White,Blue' },
      { key: 'power_consumption', label: 'Power Consumption', type: 'text', required: false, placeholder: 'Watts or energy rating' }
    ],
    defaultTheme: 'tech',
    welcomeMessage: 'Latest technology at your fingertips'
  },
  {
    id: 'general',
    name: 'General Store',
    icon: '🏪',
    searchPlaceholder: 'Search products, brands, categories...',
    categories: [
      'Daily Essentials',
      'Food Items',
      'Personal Care',
      'Household Items',
      'Stationery',
      'Toys & Games',
      'Health & Wellness',
      'Miscellaneous'
    ],
    productFields: [
      { key: 'brand', label: 'Brand Name', type: 'text', required: true, placeholder: 'Brand name' },
      { key: 'quantity', label: 'Quantity/Size', type: 'text', required: true, placeholder: 'e.g., 1 piece, 500g' },
      { key: 'type', label: 'Product Type', type: 'text', required: false, placeholder: 'Category/type' },
      { key: 'features', label: 'Key Features', type: 'textarea', required: false, placeholder: 'Product features and benefits' }
    ],
    defaultTheme: 'general',
    welcomeMessage: 'Everything you need, all in one place'
  }
]

export const getBusinessType = (typeId: string): BusinessType => {
  return BUSINESS_TYPES.find(type => type.id === typeId) || BUSINESS_TYPES[4] // Default to general
}

export const getBusinessTypeByName = (name: string): BusinessType => {
  return BUSINESS_TYPES.find(type => 
    type.name.toLowerCase().includes(name.toLowerCase())
  ) || BUSINESS_TYPES[4]
}