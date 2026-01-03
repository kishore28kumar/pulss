import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET ALL CUSTOMERS
// ============================================

export const getCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const {
      search,
      segment,
      page = 1,
      limit = 20,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      tenantId: req.tenantId,
    };

    if (segment) where.segment = segment;

    if (search) {
      where.users = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              emailVerified: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customers.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: customers,
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
// GET SINGLE CUSTOMER
// ============================================

export const getCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const customer = await prisma.customers.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            emailVerified: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        addresses: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: customer,
    };

    res.json(response);
  }
);

// ============================================
// UPDATE CUSTOMER
// ============================================

export const updateCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { segment, metadata } = req.body;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const customer = await prisma.customers.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const updateData: any = {};

    if (segment !== undefined) updateData.segment = segment;
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.updatedAt = new Date();

    const updatedCustomer = await prisma.customers.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            emailVerified: true,
            isActive: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// BLOCK/UNBLOCK CUSTOMER
// ============================================

export const toggleCustomerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const customer = await prisma.customers.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        users: true,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Update user's isActive status
    await prisma.users.update({
      where: { id: customer.userId },
      data: { 
        isActive: isActive !== undefined ? isActive : !customer.users.isActive,
        updatedAt: new Date(),
      },
    });

    const updatedCustomer = await prisma.customers.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedCustomer,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
    };

    res.json(response);
  }
);

// ============================================
// GET CUSTOMER STATS
// ============================================

export const getCustomerStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const [
      totalCustomers,
      activeCustomers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.customers.count({
        where: { tenantId: req.tenantId },
      }),
      prisma.customers.count({
        where: {
          tenantId: req.tenantId,
          users: { isActive: true },
        },
      }),
      prisma.orders.count({
        where: { tenantId: req.tenantId },
      }),
      prisma.orders.aggregate({
        where: {
          tenantId: req.tenantId,
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0,
      },
    };

    res.json(response);
  }
);

// ============================================
// EXPORT CUSTOMERS AS CSV (SUPER_ADMIN ONLY)
// ============================================

export const exportCustomersCSV = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Only SUPER_ADMIN can export customer data
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Only super admin can export customer data', 403);
    }

    const { tenantId } = req.params;

    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }

    // Verify tenant exists
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // Fetch all customers for the tenant
    const customers = await prisma.customers.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            emailVerified: true,
            isActive: true,
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
        createdAt: 'desc',
      },
    });

    // CSV Headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Joined Date',
      'Last Login',
      'Segment',
      'Lifetime Value',
      'Total Orders',
      'Status',
      'Email Verified',
    ];

    // Convert customers to CSV rows
    const csvRows = customers.map((customer) => {
      const name = `${customer.users.firstName || ''} ${customer.users.lastName || ''}`.trim() || 'N/A';
      const email = customer.users.email || 'N/A';
      const phone = customer.users.phone || customer.phone || 'N/A';
      const joinedDate = customer.users.createdAt ? new Date(customer.users.createdAt).toISOString().split('T')[0] : 'N/A';
      const lastLogin = customer.users.lastLoginAt ? new Date(customer.users.lastLoginAt).toISOString().split('T')[0] : 'Never';
      const segment = customer.segment || 'N/A';
      const lifetimeValue = customer.lifetimeValue?.toFixed(2) || '0.00';
      const totalOrders = customer._count?.orders || 0;
      const status = customer.users.isActive ? 'Active' : 'Inactive';
      const emailVerified = customer.users.emailVerified ? 'Yes' : 'No';

      // Escape CSV values (handle commas and quotes)
      const escapeCSV = (value: string | number) => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCSV(name),
        escapeCSV(email),
        escapeCSV(phone),
        escapeCSV(joinedDate),
        escapeCSV(lastLogin),
        escapeCSV(segment),
        escapeCSV(lifetimeValue),
        escapeCSV(totalOrders),
        escapeCSV(status),
        escapeCSV(emailVerified),
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Set response headers for CSV download
    const filename = `customers_${tenant.slug}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV content
    res.send('\ufeff' + csvContent); // BOM for Excel UTF-8 support
  }
);

