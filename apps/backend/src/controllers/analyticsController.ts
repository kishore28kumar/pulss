import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// HELPER FUNCTION: Calculate date range from period or dates
// ============================================

const getDateRange = (period?: string, startDate?: string, endDate?: string): { start: Date; end: Date } => {
  const now = new Date();
  let start: Date;
  let end: Date = new Date();

  // If custom dates are provided, use them
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Handle "today" period
  if (period === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Calculate based on period
  switch (period) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
};

// ============================================
// GET DASHBOARD STATS
// ============================================

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get orders for date range
    const ordersWhere: any = {
      tenantId: req.tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
    };

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
            gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
            lt: start,
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

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get orders grouped by date
    const orders = await prisma.orders.findMany({
      where: {
        tenantId: req.tenantId,
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
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
        period: period || 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
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

    const { limit = 10, period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get top selling products
    const topProducts = await prisma.order_items.groupBy({
      by: ['productId'],
      where: {
        orders: {
          tenantId: req.tenantId,
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: start,
            lte: end,
          },
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

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

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
          createdAt: { 
            gte: start,
            lte: end,
          },
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

// ============================================
// GET GLOBAL TOP SEARCHES (SUPER_ADMIN ONLY)
// ============================================

export const getGlobalTopSearches = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Super admin access required', 403);
    }

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get order items with product names (using product names as proxy for searches)
    const orderItems = await prisma.order_items.findMany({
      where: {
        orders: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        orders: {
          select: {
            customerId: true,
          },
        },
        products: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group by product name and count unique customers
    const searchMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();
    
    orderItems.forEach((item) => {
      const productName = item.products?.name || 'Unknown';
      if (!searchMap.has(productName)) {
        searchMap.set(productName, { count: 0, uniqueUsers: new Set() });
      }
      const entry = searchMap.get(productName)!;
      entry.count += item.quantity;
      if (item.orders.customerId) {
        entry.uniqueUsers.add(item.orders.customerId);
      }
    });

    // Convert to array and sort
    const topSearches = Array.from(searchMap.entries())
      .map(([searchTerm, data]) => ({
        searchTerm,
        count: data.count,
        uniqueUsers: data.uniqueUsers.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const response: ApiResponse = {
      success: true,
      data: {
        period: period || 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        topSearches,
      },
    };

    res.json(response);
  }
);

// ============================================
// GET TOP SEARCH LOCATIONS (SUPER_ADMIN ONLY)
// ============================================

export const getTopSearchLocations = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Super admin access required', 403);
    }

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get orders with shipping addresses
    const orders = await prisma.orders.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        customerId: true,
        shippingAddress: true,
      },
    });

    // Group by city (filter out orders without shipping addresses)
    const locationMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();

    orders
      .filter((order) => order.shippingAddress !== null && order.shippingAddress !== undefined)
      .forEach((order) => {
        const shippingAddress = order.shippingAddress as any;
        const city = shippingAddress?.city || 'Unknown';
        
        if (!locationMap.has(city)) {
          locationMap.set(city, { count: 0, uniqueUsers: new Set() });
        }
        const entry = locationMap.get(city)!;
        entry.count += 1;
        if (order.customerId) {
          entry.uniqueUsers.add(order.customerId);
        }
      });

    // Convert to array and sort
    const topLocations = Array.from(locationMap.entries())
      .map(([city, data]) => ({
        city,
        count: data.count,
        uniqueUsers: data.uniqueUsers.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const response: ApiResponse = {
      success: true,
      data: {
        period: period || 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        topLocations,
      },
    };

    res.json(response);
  }
);

// ============================================
// GET TENANT PERFORMANCE (SUPER_ADMIN ONLY)
// ============================================

export const getTenantPerformance = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Super admin access required', 403);
    }

    const { period, startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get all tenants
    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    // Calculate previous period for comparison
    const periodDuration = end.getTime() - start.getTime();
    const previousPeriodStart = new Date(start.getTime() - periodDuration);
    const previousPeriodEnd = start;

    // Get metrics for each tenant
    const tenantPerformance = await Promise.all(
      tenants.map(async (tenant) => {
        // Current period metrics
        const [currentOrders, currentRevenue, currentCustomers, currentProducts] = await Promise.all([
          prisma.orders.count({
            where: {
              tenantId: tenant.id,
              createdAt: { 
                gte: start,
                lte: end,
              },
            },
          }),
          prisma.orders.aggregate({
            where: {
              tenantId: tenant.id,
              createdAt: { 
                gte: start,
                lte: end,
              },
              paymentStatus: 'COMPLETED',
            },
            _sum: { total: true },
          }),
          prisma.customers.count({
            where: {
              tenantId: tenant.id,
              createdAt: { 
                gte: start,
                lte: end,
              },
            },
          }),
          prisma.products.count({
            where: {
              tenantId: tenant.id,
              createdAt: { 
                gte: start,
                lte: end,
              },
            },
          }),
        ]);

        // Previous period metrics
        const [previousOrders, previousRevenue, previousCustomers, previousProducts] = await Promise.all([
          prisma.orders.count({
            where: {
              tenantId: tenant.id,
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
          }),
          prisma.orders.aggregate({
            where: {
              tenantId: tenant.id,
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
              paymentStatus: 'COMPLETED',
            },
            _sum: { total: true },
          }),
          prisma.customers.count({
            where: {
              tenantId: tenant.id,
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
          }),
          prisma.products.count({
            where: {
              tenantId: tenant.id,
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
          }),
        ]);

        // Calculate changes
        const ordersChange = previousOrders > 0
          ? ((currentOrders - previousOrders) / previousOrders) * 100
          : currentOrders > 0 ? 100 : 0;

        const revenueChange = (previousRevenue._sum.total || 0) > 0
          ? (((currentRevenue._sum.total || 0) - (previousRevenue._sum.total || 0)) / (previousRevenue._sum.total || 0)) * 100
          : (currentRevenue._sum.total || 0) > 0 ? 100 : 0;

        const customersChange = previousCustomers > 0
          ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
          : currentCustomers > 0 ? 100 : 0;

        const productsChange = previousProducts > 0
          ? ((currentProducts - previousProducts) / previousProducts) * 100
          : currentProducts > 0 ? 100 : 0;

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          status: tenant.status,
          subscriptionPlan: tenant.subscriptionPlan,
          metrics: {
            orders: {
              current: currentOrders,
              previous: previousOrders,
              change: Math.round(ordersChange * 100) / 100,
            },
            revenue: {
              current: currentRevenue._sum.total || 0,
              previous: previousRevenue._sum.total || 0,
              change: Math.round(revenueChange * 100) / 100,
            },
            customers: {
              current: currentCustomers,
              previous: previousCustomers,
              change: Math.round(customersChange * 100) / 100,
            },
            products: {
              current: currentProducts,
              previous: previousProducts,
              change: Math.round(productsChange * 100) / 100,
            },
          },
        };
      })
    );

    // Sort by revenue (descending)
    tenantPerformance.sort((a, b) => b.metrics.revenue.current - a.metrics.revenue.current);

    const response: ApiResponse = {
      success: true,
      data: {
        period: period || 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        tenantPerformance,
      },
    };

    res.json(response);
  }
);

