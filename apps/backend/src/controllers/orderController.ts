import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreateOrderDTO, UpdateOrderStatusDTO, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

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

    // Generate order number
    const orderCount = await prisma.orders.count({
      where: { tenantId: req.tenantId },
    });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Use billing address if provided, otherwise use shipping address
    const billingAddress = data.billingAddress || data.shippingAddress;

    // Create order
    const order = await prisma.orders.create({
      data: {
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

