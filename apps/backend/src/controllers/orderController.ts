import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreateOrderDTO, UpdateOrderStatusDTO, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { format } from 'date-fns';

// ============================================
// ORDER ID AND ORDER NUMBER GENERATORS
// ============================================

/**
 * Generate order ID in format: YYYY-XXXX-MMDD
 * Where XXXX is timestamp-based 4-digit number (globally unique)
 */
const generateOrderId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Use timestamp-based approach: combine milliseconds and process time
  const timestamp = Date.now();
  // Extract last 4 digits from timestamp, ensuring uniqueness
  // Use modulo to get 4-digit number, add process time for variation
  const processTime = Number(process.hrtime.bigint() % 1000n);
  const combined = timestamp + processTime;
  const randomPart = String(combined % 10000).padStart(4, '0');
  
  return `${year}-${randomPart}-${month}${day}`;
};

/**
 * Generate order number in format: YYYY-MMDD-XXXX
 * Where XXXX is globally sequential 4-digit number (no reset)
 */
const generateOrderNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const mmdd = `${month}${day}`;
  
  // Get the last order globally to extract the sequential number
  const lastOrder = await prisma.orders.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });
  
  let sequentialNumber = 1;
  
  if (lastOrder && lastOrder.orderNumber) {
    // Extract sequential number from last order
    // Format: YYYY-MMDD-XXXX
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      const lastSequential = parseInt(parts[2]);
      if (!isNaN(lastSequential)) {
        sequentialNumber = lastSequential + 1;
      }
    }
  }
  
  // Ensure 4 digits
  const sequentialPart = String(sequentialNumber).padStart(4, '0');
  const orderNumber = `${year}-${mmdd}-${sequentialPart}`;
  
  // Check for collision and increment until unique
  let attempts = 0;
  let finalOrderNumber = orderNumber;
  while (attempts < 100) {
    const existing = await prisma.orders.findUnique({
      where: { orderNumber: finalOrderNumber },
    });
    
    if (!existing) {
      break;
    }
    
    sequentialNumber++;
    const sequentialPart = String(sequentialNumber).padStart(4, '0');
    finalOrderNumber = `${year}-${mmdd}-${sequentialPart}`;
    attempts++;
  }
  
  if (attempts >= 100) {
    throw new AppError('Failed to generate unique order number', 500);
  }
  
  return finalOrderNumber;
};

/**
 * Generate globally unique order ID with collision checking
 */
const generateUniqueOrderId = async (): Promise<string> => {
  let orderId = generateOrderId();
  let attempts = 0;
  
  while (attempts < 100) {
    const existing = await prisma.orders.findUnique({
      where: { id: orderId },
    });
    
    if (!existing) {
      return orderId;
    }
    
    // Regenerate with slight variation
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now() + attempts; // Add attempts to vary
    const randomPart = String(timestamp % 10000).padStart(4, '0');
    orderId = `${year}-${randomPart}-${month}${day}`;
    attempts++;
  }
  
  throw new AppError('Failed to generate unique order ID', 500);
};

// ============================================
// GET ALL ORDERS
// ============================================

export const getOrders = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const {
      customerId,
      status,
      paymentStatus,
      fulfillmentStatus,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      tenantId: req.tenantId,
    };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customers: { users: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          customers: {
            include: {
              users: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          order_items: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  thumbnail: true,
                },
              },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orders.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: orders,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    };

    res.json(response);
  }
);

// ============================================
// GET SINGLE ORDER
// ============================================

export const getOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Build where clause - customers can only see their own orders
    const where: any = {
      id,
      tenantId: req.tenantId,
    };

    // If customer is making the request, only show their orders
    if (req.customerId) {
      where.customerId = req.customerId;
    }

    const order = await prisma.orders.findFirst({
      where,
      include: {
        customers: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    };

    res.json(response);
  }
);

// ============================================
// CREATE ORDER (Customer Checkout)
// ============================================

export const createOrder = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const data: CreateOrderDTO = req.body;

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    // Get products and calculate totals
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
        tenantId: req.tenantId,
        isActive: true,
      },
    });

    if (products.length !== data.items.length) {
      throw new AppError('Some products are not available', 400);
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 400);
      }

      if (product.trackInventory && product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 400);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      return {
        productId: product.id,
        productName: product.name,
        productImage: product.thumbnail,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        variantOptions: item.variantOptions,
      };
    });

    // Get tenant settings for shipping
    // TODO: Implement tenant settings table
    const shippingFee = 5.99; // Default shipping fee
    const tax = subtotal * 0.1; // 10% tax (simplified)
    const total = subtotal + shippingFee + tax;

    // Generate order ID and order number with new formats
    const orderId = await generateUniqueOrderId();
    const orderNumber = await generateOrderNumber();

    // Use billing address if provided, otherwise use shipping address
    const billingAddress = data.billingAddress || data.shippingAddress;

    // Create order
    const order = await prisma.orders.create({
      data: {
        id: orderId,
        orderNumber,
        tenantId: req.tenantId,
        customerId: req.customerId,
        subtotal,
        shipping: shippingFee,
        tax,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: data.paymentMethod as any,
        shippingAddress: data.shippingAddress,
        billingAddress: billingAddress,
        customerNotes: data.customerNote,
        prescriptionUrl: data.prescriptionUrl,
        updatedAt: new Date(),
        order_items: {
          create: orderItems.map((item: any) => ({
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: item.productId,
            name: item.productName,
            sku: item.sku || '',
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            productSnapshot: item.variantOptions || null,
          })),
        },
      },
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
        customers: {
          include: {
            users: true,
          },
        },
      },
    });

    // Update product inventory
    for (const item of data.items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (product && product.trackInventory) {
        await prisma.products.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
            updatedAt: new Date(),
          },
        });
      }
    }

    // Clear cart
    await prisma.cart_items.deleteMany({
      where: { customerId: req.customerId },
    });

    const response: ApiResponse = {
      success: true,
      data: order,
      message: 'Order placed successfully',
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE ORDER STATUS
// ============================================

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateOrderStatusDTO = req.body;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const order = await prisma.orders.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updateData: any = {};

    if (data.status) updateData.status = data.status;
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
    if (data.fulfillmentStatus) updateData.fulfillmentStatus = data.fulfillmentStatus;
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.internalNote) updateData.internalNote = data.internalNote;

    if (data.status === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (data.status === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    updateData.updatedAt = new Date();

    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: updateData,
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
        customers: {
          include: {
            users: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// GET CUSTOMER ORDERS
// ============================================

export const getCustomerOrders = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const orders = await prisma.orders.findMany({
      where: {
        customerId: req.customerId,
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: orders,
    };

    res.json(response);
  }
);

// ============================================
// EXPORT ORDERS (CSV)
// ============================================

export const exportOrders = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      limit = 10000, // Maximum orders to export
    } = req.query as any;

    // Enforce maximum limit to prevent memory exhaustion
    const maxLimit = 10000;
    const exportLimit = Math.min(parseInt(limit) || maxLimit, maxLimit);

    const where: any = {
      tenantId: req.tenantId,
    };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customers: { users: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Fetch orders matching the filters with limit
    const orders = await prisma.orders.findMany({
      where,
      include: {
        customers: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        order_items: {
          include: {
            products: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: exportLimit,
    });

    // CSV Headers
    const headers = [
      'Order Number',
      'Order Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Status',
      'Payment Status',
      'Subtotal',
      'Tax',
      'Shipping',
      'Discount',
      'Total',
      'Items Count',
      'Product Names',
      'SKUs',
    ];

    // Helper to escape CSV values and prevent CSV injection
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Prevent CSV injection by prepending single quote to formula characters
      const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
      if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
        return `"${sanitized.replace(/"/g, '""')}"`;
      }
      return sanitized;
    };

    // Convert orders to CSV rows
    const csvRows = orders.map((order) => {
      const customerName = order.customers?.users
        ? `${order.customers.users.firstName || ''} ${order.customers.users.lastName || ''}`.trim() || 'N/A'
        : 'N/A';
      const customerEmail = order.customers?.users?.email || 'N/A';
      const customerPhone = order.customers?.users?.phone || order.customers?.phone || 'N/A';
      const orderDate = order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A';
      const itemsCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
      const productNames = order.order_items.map(item => item.products?.name || item.name || 'N/A').join('; ');
      const skus = order.order_items.map(item => item.products?.sku || 'N/A').filter(sku => sku !== 'N/A').join('; ') || 'N/A';

      return [
        escapeCSV(order.orderNumber),
        escapeCSV(orderDate),
        escapeCSV(customerName),
        escapeCSV(customerEmail),
        escapeCSV(customerPhone),
        escapeCSV(order.status),
        escapeCSV(order.paymentStatus),
        escapeCSV(order.subtotal?.toFixed(2) || '0.00'),
        escapeCSV(order.tax?.toFixed(2) || '0.00'),
        escapeCSV(order.shipping?.toFixed(2) || '0.00'),
        escapeCSV(order.discount?.toFixed(2) || '0.00'),
        escapeCSV(order.total?.toFixed(2) || '0.00'),
        escapeCSV(itemsCount),
        escapeCSV(productNames),
        escapeCSV(skus),
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Generate filename with date range if applicable
    let filename = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    if (startDate && endDate) {
      const start = format(new Date(startDate), 'yyyy-MM-dd');
      const end = format(new Date(endDate), 'yyyy-MM-dd');
      filename = `orders_${start}_to_${end}.csv`;
    } else if (startDate) {
      const start = format(new Date(startDate), 'yyyy-MM-dd');
      filename = `orders_from_${start}.csv`;
    } else if (endDate) {
      const end = format(new Date(endDate), 'yyyy-MM-dd');
      filename = `orders_until_${end}.csv`;
    }

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV content with BOM for Excel UTF-8 support
    res.send('\ufeff' + csvContent);
  }
);

