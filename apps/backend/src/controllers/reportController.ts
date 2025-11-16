import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET ORDER REPORT
// ============================================

export const getOrderReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { startDate, endDate, status, paymentStatus } = req.query as any;

    const where: any = {
      tenantId: req.tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reportData = orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.customers
        ? `${order.customers.users.firstName} ${order.customers.users.lastName}`
        : order.guestName || 'Guest',
      email: order.customers?.users.email || order.guestEmail || '',
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.order_items.length,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        report: reportData,
        summary: {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
          totalItems: orders.reduce((sum, o) => sum + o.order_items.length, 0),
        },
      },
    };

    res.json(response);
  }
);

// ============================================
// GET PRODUCT REPORT
// ============================================

export const getProductReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { startDate, endDate, categoryId } = req.query as any;

    const where: any = {
      tenantId: req.tenantId,
    };

    if (categoryId) where.categoryId = categoryId;

    // Get products
    const products = await prisma.products.findMany({
      where,
      include: {
        categories: {
          select: {
            name: true,
          },
        },
        order_items: {
          where: {
            orders: {
              ...(startDate || endDate
                ? {
                    createdAt: {
                      ...(startDate ? { gte: new Date(startDate) } : {}),
                      ...(endDate ? { lte: new Date(endDate) } : {}),
                    },
                  }
                : {}),
              paymentStatus: 'COMPLETED',
            },
          },
        },
      },
    });

    const reportData = products.map((product) => {
      const totalSold = product.order_items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalRevenue = product.order_items.reduce(
        (sum, item) => sum + Number(item.total),
        0
      );

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.categories?.name || 'Uncategorized',
        price: product.price,
        stock: product.stock,
        totalSold,
        totalRevenue,
        isActive: product.isActive,
      };
    });

    const response: ApiResponse = {
      success: true,
      data: {
        report: reportData,
        summary: {
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.isActive).length,
          totalSold: reportData.reduce((sum, p) => sum + p.totalSold, 0),
          totalRevenue: reportData.reduce((sum, p) => sum + p.totalRevenue, 0),
        },
      },
    };

    res.json(response);
  }
);

// ============================================
// GET CUSTOMER REPORT
// ============================================

export const getCustomerReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { startDate, endDate, segment } = req.query as any;

    const where: any = {
      tenantId: req.tenantId,
    };

    if (segment) where.segment = segment;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const customers = await prisma.customers.findMany({
      where,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        lifetimeValue: 'desc',
      },
    });

    const reportData = customers.map((customer) => ({
      id: customer.id,
      name: `${customer.users.firstName} ${customer.users.lastName}`,
      email: customer.users.email,
      phone: customer.users.phone,
      segment: customer.segment,
      lifetimeValue: customer.lifetimeValue,
      totalOrders: customer._count.orders,
      isActive: customer.users.isActive,
      emailVerified: customer.users.emailVerified,
      joinedDate: customer.users.createdAt,
      lastLogin: customer.users.lastLoginAt,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        report: reportData,
        summary: {
          totalCustomers: customers.length,
          activeCustomers: customers.filter((c) => c.users.isActive).length,
          verifiedCustomers: customers.filter((c) => c.users.emailVerified).length,
          totalRevenue: customers.reduce((sum, c) => sum + c.lifetimeValue, 0),
        },
      },
    };

    res.json(response);
  }
);

