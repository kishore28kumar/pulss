// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Authentication Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantSlug?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

// ============================================
// Tenant Types
// ============================================

export interface CreateTenantDTO {
  name: string;
  slug: string;
  businessType: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  returnPolicy?: string;
  heroImages?: string[];
  // Admin user
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export interface UpdateTenantDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  scheduleDrugEligible?: boolean;
  returnPolicy?: string;
  pharmacistPhoto?: string;
  heroImages?: string[];
}

// ============================================
// Product Types
// ============================================

export interface CreateProductDTO {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  weightUnit?: string;
  categoryIds: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  requiresPrescription?: boolean;
  isOTC?: boolean;
  manufacturer?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Category Types
// ============================================

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

// ============================================
// Cart Types
// ============================================

export interface AddToCartDTO {
  productId: string;
  quantity: number;
  variantOptions?: Record<string, string>;
}

export interface UpdateCartItemDTO {
  quantity: number;
}

export interface CartSummary {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  itemCount: number;
}

// ============================================
// Order Types
// ============================================

export interface CreateOrderDTO {
  items: Array<{
    productId: string;
    quantity: number;
    variantOptions?: Record<string, string>;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  billingAddress?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  paymentMethod: string;
  customerNote?: string;
  prescriptionUrl?: string;
}

export interface UpdateOrderStatusDTO {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  trackingNumber?: string;
  internalNote?: string;
}

export interface OrderFilters {
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Address Types
// ============================================

export interface CreateAddressDTO {
  type: 'SHIPPING' | 'BILLING' | 'BOTH';
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressDTO extends Partial<CreateAddressDTO> {}

// ============================================
// Dashboard Analytics Types
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  image?: string;
  totalSold: number;
  revenue: number;
}

// ============================================
// File Upload Types
// ============================================

export interface UploadedFile {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
}

// ============================================
// Stripe Types
// ============================================

export interface CreatePaymentIntentDTO {
  orderId: string;
  amount: number;
  currency?: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: any;
}

// ============================================
// Settings Types
// ============================================

export interface UpdateTenantSettingsDTO {
  storeName?: string;
  storeDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  allowGuestCheckout?: boolean;
  requirePhoneNumber?: boolean;
  minOrderAmount?: number;
  freeShippingThreshold?: number;
  shippingFee?: number;
  enableWishlist?: boolean;
  enableReviews?: boolean;
  enablePrescriptionUpload?: boolean;
}

