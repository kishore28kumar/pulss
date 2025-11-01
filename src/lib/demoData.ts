// Demo data for testing the application
import { useKV } from '@github/spark/hooks'

// Analytics data interfaces
export interface SalesMetric {
  date: string
  sales: number
  orders: number
  customers: number
}

export interface CategorySales {
  category: string
  sales: number
  percentage: number
}

export interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
}

// Notification interfaces
export interface DemoNotification {
  id: string
  type: 'order' | 'stock' | 'customer' | 'system'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
}

export interface DemoProduct {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  mrp: number
  description: string
  image_url?: string
  stock: number
  requires_rx?: boolean
  composition?: string
  uses?: string
  side_effects?: string
  pack_size?: string
}

export interface DemoStore {
  id: string
  name: string
  type: 'pharmacy' | 'grocery' | 'fashion' | 'electronics'
  owner: string
  phone: string
  email: string
  address: string
  description: string
  logo?: string
  banner?: string
  isActive: boolean
  products: DemoProduct[]
}

export interface DemoOrder {
  id: string
  storeId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
  }[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: Date
  estimatedDelivery?: Date
}

export interface DemoCarouselSlide {
  id: string
  title: string
  description: string
  image_url: string
  video_url?: string
  action_text?: string
  action_url?: string
  display_order: number
  is_active: boolean
}

export const DEMO_STORES: DemoStore[] = [
  {
    id: 'store-1',
    name: 'HealthPlus Pharmacy',
    type: 'pharmacy',
    owner: 'Dr. Rajesh Kumar',
    phone: '+91-9876543210',
    email: 'info@healthplus.com',
    address: 'Shop No. 15, Medical Complex, MG Road, Bangalore - 560001',
    description: 'Your trusted neighborhood pharmacy with 24/7 service and home delivery.',
    isActive: true,
    products: [
      {
        id: 'p1',
        name: 'Paracetamol 500mg',
        category: 'Prescription Medicines',
        brand: 'Cipla',
        price: 25,
        mrp: 30,
        description: 'Pain relief and fever reducer tablets',
        stock: 150,
        requires_rx: true,
        pack_size: '10 tablets',
        composition: 'Paracetamol 500mg',
        uses: 'Fever and mild to moderate pain relief',
        side_effects: 'Nausea, skin rash'
      },
      {
        id: 'p2',
        name: 'Vitamin D3 Tablets',
        category: 'Health Supplements',
        brand: 'HealthKart',
        price: 180,
        mrp: 200,
        description: 'Essential vitamin for bone health and immunity',
        stock: 80,
        requires_rx: false,
        pack_size: '60 tablets',
        composition: 'Cholecalciferol 1000 IU',
        uses: 'Bone health and immunity support',
        side_effects: 'Hypercalcemia with high doses'
      },
      {
        id: 'p3',
        name: 'Hand Sanitizer',
        category: 'Personal Care',
        brand: 'Dettol',
        price: 120,
        mrp: 150,
        description: '70% alcohol-based hand sanitizer for effective germ protection',
        stock: 200,
        requires_rx: false,
        pack_size: '500ml bottle',
        composition: 'Ethyl Alcohol 70%',
        uses: 'Hand disinfection and germ protection',
        side_effects: 'May cause skin dryness'
      },
      {
        id: 'p4',
        name: 'Digital Thermometer',
        category: 'Medical Devices',
        brand: 'Omron',
        price: 450,
        mrp: 500,
        description: 'Accurate digital thermometer for body temperature measurement',
        stock: 45,
        requires_rx: false,
        pack_size: '1 piece',
        composition: 'Digital sensor technology',
        uses: 'Body temperature monitoring',
        side_effects: 'None reported'
      },
      {
        id: 'p5',
        name: 'Protein Powder',
        category: 'Health Supplements',
        brand: 'Optimum Nutrition',
        price: 3200,
        mrp: 3500,
        description: 'Premium whey protein powder for muscle building',
        stock: 25,
        requires_rx: false,
        pack_size: '2.27kg container',
        composition: 'Whey Protein Isolate - Chocolate flavor',
        uses: 'Muscle building and post-workout recovery',
        side_effects: 'May cause digestive discomfort in lactose intolerant individuals'
      }
    ]
  },
  {
    id: 'store-2',
    name: 'Fresh Mart Grocery',
    type: 'grocery',
    owner: 'Priya Sharma',
    phone: '+91-9876543211',
    email: 'orders@freshmart.com',
    address: '123 Market Street, Indiranagar, Bangalore - 560038',
    description: 'Fresh groceries, fruits, and vegetables delivered to your doorstep.',
    isActive: true,
    products: [
      {
        id: 'g1',
        name: 'Basmati Rice',
        category: 'Grains & Cereals',
        brand: 'India Gate',
        price: 450,
        mrp: 480,
        description: 'Premium long grain basmati rice with authentic aroma',
        stock: 100,
        pack_size: '5kg bag'
      },
      {
        id: 'g2',
        name: 'Fresh Bananas',
        category: 'Fruits',
        price: 60,
        mrp: 70,
        description: 'Fresh ripe bananas, rich in potassium and natural sugars',
        stock: 50,
        pack_size: '1 dozen'
      },
      {
        id: 'g3',
        name: 'Whole Wheat Bread',
        category: 'Bakery',
        brand: 'Britannia',
        price: 45,
        mrp: 50,
        description: 'Nutritious whole wheat bread, perfect for healthy breakfast',
        stock: 30,
        pack_size: '400g loaf'
      },
      {
        id: 'g4',
        name: 'Fresh Milk',
        category: 'Dairy',
        brand: 'Amul',
        price: 28,
        mrp: 30,
        description: 'Fresh full cream milk, rich in calcium and vitamins',
        stock: 75,
        pack_size: '500ml packet'
      },
      {
        id: 'g5',
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        price: 80,
        mrp: 90,
        description: 'Fresh organic tomatoes, perfect for cooking and salads',
        stock: 40,
        pack_size: '1kg'
      }
    ]
  },
  {
    id: 'store-3',
    name: 'TechWorld Electronics',
    type: 'electronics',
    owner: 'Amit Patel',
    phone: '+91-9876543212',
    email: 'sales@techworld.com',
    address: '456 Electronics Plaza, Commercial Street, Bangalore - 560001',
    description: 'Latest gadgets and electronics with warranty and support.',
    isActive: true,
    products: [
      {
        id: 'e1',
        name: 'Wireless Bluetooth Headphones',
        category: 'Audio',
        brand: 'Sony',
        price: 2500,
        mrp: 2800,
        description: 'High-quality wireless headphones with noise cancellation',
        stock: 20,
        pack_size: '1 piece'
      },
      {
        id: 'e2',
        name: 'Power Bank 10000mAh',
        category: 'Mobile Accessories',
        brand: 'Mi',
        price: 1200,
        mrp: 1400,
        description: 'Fast charging power bank with dual USB output',
        stock: 35,
        pack_size: '1 piece'
      },
      {
        id: 'e3',
        name: 'USB-C Charging Cable',
        category: 'Mobile Accessories',
        brand: 'OnePlus',
        price: 350,
        mrp: 400,
        description: 'Fast charging USB-C cable with data sync support',
        stock: 60,
        pack_size: '1 piece'
      }
    ]
  }
]

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'order-1',
    storeId: 'store-1',
    customerName: 'John Doe',
    customerPhone: '+91-9999888877',
    customerAddress: '789 Residency Road, Bangalore - 560025',
    items: [
      { productId: 'p1', productName: 'Paracetamol 500mg', quantity: 2, price: 25 },
      { productId: 'p3', productName: 'Hand Sanitizer', quantity: 1, price: 120 }
    ],
    total: 170,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  },
  {
    id: 'order-2',
    storeId: 'store-2',
    customerName: 'Jane Smith',
    customerPhone: '+91-9999888876',
    customerAddress: '321 Brigade Road, Bangalore - 560001',
    items: [
      { productId: 'g1', productName: 'Basmati Rice', quantity: 1, price: 450 },
      { productId: 'g2', productName: 'Fresh Bananas', quantity: 2, price: 60 },
      { productId: 'g4', productName: 'Fresh Milk', quantity: 3, price: 28 }
    ],
    total: 654,
    status: 'preparing',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
  },
  {
    id: 'order-3',
    storeId: 'store-1',
    customerName: 'Ravi Kumar',
    customerPhone: '+91-9999888875',
    customerAddress: '654 Whitefield, Bangalore - 560066',
    items: [
      { productId: 'p2', productName: 'Vitamin D3 Tablets', quantity: 1, price: 180 },
      { productId: 'p5', productName: 'Protein Powder', quantity: 1, price: 3200 }
    ],
    total: 3380,
    status: 'delivered',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    estimatedDelivery: new Date(Date.now() - 20 * 60 * 60 * 1000) // delivered 20 hours ago
  }
]

// Utility hooks for accessing demo data - using default values to initialize
export const useDemoStores = () => {
  const [stores, setStores] = useKV<DemoStore[]>('demo-stores', [])
  
  // Initialize with default data if empty
  if (!stores || stores.length === 0) {
    setStores(() => DEMO_STORES)
  }
  
  return [stores || DEMO_STORES, setStores] as const
}

export const useDemoOrders = () => {
  const [orders, setOrders] = useKV<DemoOrder[]>('demo-orders', [])
  
  // Initialize with default data if empty
  if (!orders || orders.length === 0) {
    setOrders(() => DEMO_ORDERS)
  }
  
  return [orders || DEMO_ORDERS, setOrders] as const
}

// Function to add a new demo order using the hook pattern
export const addDemoOrder = (order: Omit<DemoOrder, 'id' | 'createdAt'>) => {
  const newOrder: DemoOrder = {
    ...order,
    id: `order-${Date.now()}`,
    createdAt: new Date()
  }
  
  return newOrder
}

// Analytics demo data
export const DEMO_SALES_METRICS: SalesMetric[] = [
  { date: '2024-01-01', sales: 15000, orders: 25, customers: 18 },
  { date: '2024-01-02', sales: 22000, orders: 34, customers: 28 },
  { date: '2024-01-03', sales: 18000, orders: 28, customers: 22 },
  { date: '2024-01-04', sales: 28000, orders: 42, customers: 35 },
  { date: '2024-01-05', sales: 32000, orders: 48, customers: 38 },
  { date: '2024-01-06', sales: 25000, orders: 38, customers: 30 },
  { date: '2024-01-07', sales: 35000, orders: 52, customers: 42 }
]

export const DEMO_CATEGORY_SALES: CategorySales[] = [
  { category: 'Prescription Medicines', sales: 45000, percentage: 35 },
  { category: 'Health Supplements', sales: 32000, percentage: 25 },
  { category: 'Personal Care', sales: 25000, percentage: 20 },
  { category: 'Medical Devices', sales: 15000, percentage: 12 },
  { category: 'Other', sales: 10000, percentage: 8 }
]

export const DEMO_TOP_PRODUCTS: TopProduct[] = [
  { id: 'p1', name: 'Paracetamol 500mg', sales: 150, revenue: 3750 },
  { id: 'p5', name: 'Protein Powder', sales: 25, revenue: 80000 },
  { id: 'p2', name: 'Vitamin D3 Tablets', sales: 80, revenue: 14400 },
  { id: 'p3', name: 'Hand Sanitizer', sales: 200, revenue: 24000 },
  { id: 'p4', name: 'Digital Thermometer', sales: 45, revenue: 20250 }
]

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order #1001 from John Doe - ₹170',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    priority: 'high'
  },
  {
    id: 'n2',
    type: 'stock',
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg - Only 5 units left',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    priority: 'medium'
  },
  {
    id: 'n3',
    type: 'customer',
    title: 'New Customer Registration',
    message: 'Sarah Wilson joined your store',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
    priority: 'low'
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Payment Successful',
    message: 'Payment of ₹3380 received for Order #1003',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
    priority: 'medium'
  }
]

// Enhanced hooks for analytics data
export const useDemoSalesMetrics = () => {
  const [metrics, setMetrics] = useKV<SalesMetric[]>('demo-sales-metrics', [])
  
  if (!metrics || metrics.length === 0) {
    setMetrics(() => DEMO_SALES_METRICS)
  }
  
  return [metrics || DEMO_SALES_METRICS, setMetrics] as const
}

export const useDemoCategorySales = () => {
  const [categories, setCategories] = useKV<CategorySales[]>('demo-category-sales', [])
  
  if (!categories || categories.length === 0) {
    setCategories(() => DEMO_CATEGORY_SALES)
  }
  
  return [categories || DEMO_CATEGORY_SALES, setCategories] as const
}

export const useDemoTopProducts = () => {
  const [products, setProducts] = useKV<TopProduct[]>('demo-top-products', [])
  
  if (!products || products.length === 0) {
    setProducts(() => DEMO_TOP_PRODUCTS)
  }
  
  return [products || DEMO_TOP_PRODUCTS, setProducts] as const
}

export const useDemoNotifications = () => {
  const [notifications, setNotifications] = useKV<DemoNotification[]>('demo-notifications', [])
  
  if (!notifications || notifications.length === 0) {
    setNotifications(() => DEMO_NOTIFICATIONS)
  }
  
  return [notifications || DEMO_NOTIFICATIONS, setNotifications] as const
}

// Utility functions
export const generateRandomOrder = (storeId: string): DemoOrder => {
  const customers = [
    { name: 'Alex Johnson', phone: '+91-9876543210', address: '123 Park Street, Bangalore' },
    { name: 'Priya Patel', phone: '+91-9876543211', address: '456 MG Road, Bangalore' },
    { name: 'Rahul Sharma', phone: '+91-9876543212', address: '789 Brigade Road, Bangalore' },
    { name: 'Sneha Reddy', phone: '+91-9876543213', address: '321 Indiranagar, Bangalore' },
    { name: 'Amit Kumar', phone: '+91-9876543214', address: '654 Koramangala, Bangalore' }
  ]
  
  const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
  const store = DEMO_STORES.find(s => s.id === storeId)
  
  if (!store) throw new Error('Store not found')
  
  const numItems = Math.floor(Math.random() * 3) + 1
  const selectedProducts = store.products
    .sort(() => 0.5 - Math.random())
    .slice(0, numItems)
  
  const items = selectedProducts.map(product => ({
    productId: product.id,
    productName: product.name,
    quantity: Math.floor(Math.random() * 3) + 1,
    price: product.price
  }))
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  return {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    storeId,
    customerName: randomCustomer.name,
    customerPhone: randomCustomer.phone,
    customerAddress: randomCustomer.address,
    items,
    total,
    status: 'pending',
    createdAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000)
  }
}

export const addRandomNotification = (type: DemoNotification['type'] = 'order'): DemoNotification => {
  const messages = {
    order: [
      'New order received from premium customer',
      'Bulk order request needs approval',
      'Express delivery order placed'
    ],
    stock: [
      'Inventory running low for popular items',
      'New stock arrival expected tomorrow',
      'Supplier delivery delayed by 2 hours'
    ],
    customer: [
      'VIP customer just registered',
      'Customer feedback received - 5 stars!',
      'Loyalty program milestone achieved'
    ],
    system: [
      'Payment gateway updated successfully',
      'Daily backup completed',
      'Performance optimization applied'
    ]
  }
  
  const titles = {
    order: 'Order Update',
    stock: 'Inventory Alert',
    customer: 'Customer Activity',
    system: 'System Notification'
  }
  
  const priorities: DemoNotification['priority'][] = ['low', 'medium', 'high']
  const randomMessage = messages[type][Math.floor(Math.random() * messages[type].length)]
  const randomPriority = priorities[Math.floor(Math.random() * priorities.length)]
  
  return {
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: titles[type],
    message: randomMessage,
    timestamp: new Date(),
    isRead: false,
    priority: randomPriority
  }
}

// Simple demo data status indicator
export const isDemoDataReady = () => {
  return DEMO_STORES.length > 0 && DEMO_ORDERS.length > 0
}

// Demo carousel slides
export const DEMO_CAROUSEL_SLIDES: DemoCarouselSlide[] = [
  {
    id: 'slide-1',
    title: 'Welcome to Pulss',
    description: 'Your trusted digital pharmacy with fast delivery and expert consultation',
    image_url: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&h=600&fit=crop&crop=center',
    action_text: 'Shop Now',
    action_url: '#categories',
    display_order: 1,
    is_active: true
  },
  {
    id: 'slide-2', 
    title: 'Expert Consultation Available',
    description: 'Chat with certified pharmacists for personalized medicine guidance',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop&crop=center',
    action_text: 'Consult Now',
    action_url: '#consultation',
    display_order: 2,
    is_active: true
  },
  {
    id: 'slide-3',
    title: 'Fast & Reliable Delivery',
    description: 'Get your medicines delivered to your doorstep within 30 minutes',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop&crop=center',
    action_text: 'Order Now',
    action_url: '#products',
    display_order: 3,
    is_active: true
  },
  {
    id: 'slide-4',
    title: 'Prescription Upload Made Easy',
    description: 'Simply upload your prescription and we\'ll prepare your order',
    image_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&h=600&fit=crop&crop=center',
    action_text: 'Upload Rx',
    action_url: '#rx-upload',
    display_order: 4,
    is_active: true
  }
]

// Hook to use demo carousel slides
export const useDemoCarouselSlides = () => {
  const [slides, setSlides] = useKV<DemoCarouselSlide[]>('demo-carousel-slides', DEMO_CAROUSEL_SLIDES)
  return [slides, setSlides] as const
}