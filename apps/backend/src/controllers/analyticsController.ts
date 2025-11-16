import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET DASHBOARD STATS
// ============================================

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { startDate, endDate } = req.query as any;

    // Date range for stats
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get orders for date range
    const ordersWhere: any = {
      tenantId: req.tenantId,
    };
    if (startDate || endDate) {
      ordersWhere.createdAt = dateFilter;
    }

    // Calculate stats
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      previousPeriodOrders,
    ] = await Promise.all([
      // Total revenue (completed payments only)
      prisma.orders.aggregate({
        where: {
          ...ordersWhere,
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          total: true,
        },
      }),

      // Total orders
      prisma.orders.count({
        where: ordersWhere,
      }),

      // Total customers
      prisma.customers.count({
        where: {
          tenantId: req.tenantId,
        },
      }),

      // Total products
      prisma.products.count({
        where: {
          tenantId: req.tenantId,
        },
      }),

      // Orders for previous period (for comparison)
      prisma.orders.findMany({
        where: {
          tenantId: req.tenantId,
          createdAt: {
            gte: startDate
              ? new Date(new Date(startDate).getTime() - (new Date(endDate || Date.now()).getTime() - new Date(startDate).getTime()))
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          total: true,
        },
      }),
    ]);

    const revenue = totalRevenue._sum.total || 0;
    const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const revenueChange = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

    const ordersChange = previousPeriodOrders.length > 0
      ? ((totalOrders - previousPeriodOrders.length) / previousPeriodOrders.length) * 100
      : 0;

    const response: ApiResponse = {
      success: true,
      data: {
        totalRevenue: revenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueChange: Math.round(revenueChange * 100) / 100,
        ordersChange: Math.round(ordersChange * 100) / 100,
        customersChange: 0, // TODO: Calculate based on date range
        productsChange: 0, // TODO: Calculate based on date range
      },
    };

    res.json(response);
  }
);

// ============================================
// GET REVENUE ANALYTICS
// ============================================

export const getRevenueAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { period = '30d' } = req.query as any;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get orders grouped by date
    const orders = await prisma.orders.findMany({
      where: {
        tenantId: req.tenantId,
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.total);
    });

    const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        period,
        revenueData,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      },
    };

    res.json(response);
  }
);

// ============================================
// GET PRODUCT ANALYTICS
// ============================================

export const getProductAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { limit = 10 } = req.query as any;

    // Get top selling products
    const topProducts = await prisma.order_items.groupBy({
      by: ['productId'],
      where: {
        orders: {
          tenantId: req.tenantId,
          paymentStatus: 'COMPLETED',
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: parseInt(limit),
    });

    // Get product details
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
        tenantId: req.tenantId,
      },
      select: {
        id: true,
        name: true,
        thumbnail: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const topProductsData = topProducts.map((item) => ({
      id: item.productId,
      name: productMap.get(item.productId)?.name || 'Unknown',
      image: productMap.get(item.productId)?.thumbnail,
      totalSold: item._sum.quantity || 0,
      revenue: item._sum.total || 0,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        topProducts: topProductsData,
      },
    };

    res.json(response);
  }
);

// ============================================
// GET CUSTOMER ANALYTICS
// ============================================

export const getCustomerAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { period = '30d' } = req.query as any;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get customer stats
    const [
      totalCustomers,
      newCustomers,
      activeCustomers,
      topCustomers,
    ] = await Promise.all([
      prisma.customers.count({
        where: { tenantId: req.tenantId },
      }),
      prisma.customers.count({
        where: {
          tenantId: req.tenantId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.customers.count({
        where: {
          tenantId: req.tenantId,
          users: {
            isActive: true,
          },
        },
      }),
      prisma.customers.findMany({
        where: {
          tenantId: req.tenantId,
        },
        orderBy: {
          lifetimeValue: 'desc',
        },
        take: 10,
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        topCustomers: topCustomers.map((c) => ({
          id: c.id,
          name: `${c.users.firstName} ${c.users.lastName}`,
          email: c.users.email,
          lifetimeValue: c.lifetimeValue,
          totalOrders: c.totalOrders,
        })),
      },
    };

    res.json(response);
  }
);

