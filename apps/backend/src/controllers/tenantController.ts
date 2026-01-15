import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { TenantStatus } from '@prisma/client';
import { ApiResponse, CreateTenantDTO, UpdateTenantDTO } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { hashPassword } from '../utils/password';
import { randomUUID } from 'crypto';

// ============================================
// GET ALL TENANTS (Super Admin Only)
// ============================================

export const getTenants = asyncHandler(
  async (_req: Request, res: Response) => {
    const tenants = await prisma.tenants.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: tenants,
    };

    res.json(response);
  }
);

// ============================================
// GET SINGLE TENANT
// ============================================

export const getTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: tenant,
    };

    res.json(response);
  }
);

// ============================================
// CREATE TENANT (Super Admin Only)
// ============================================

export const createTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const data: CreateTenantDTO = req.body;

    // Check if slug already exists
    const existingTenant = await prisma.tenants.findUnique({
      where: { slug: data.slug },
    });

    if (existingTenant) {
      throw new AppError('Tenant with this slug already exists', 400);
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.users.findFirst({
      where: { email: data.adminEmail },
    });

    if (existingAdmin) {
      throw new AppError('Admin email already in use', 400);
    }

    // Hash admin password
    const hashedPassword = await hashPassword(data.adminPassword);

    // Create tenant with admin user
    const tenant = await prisma.tenants.create({
      data: {
        id: randomUUID(),
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        status: 'ACTIVE',
        subscriptionPlan: 'FREE',
        updatedAt: new Date(),
        users: {
          create: {
            id: randomUUID(),
            email: data.adminEmail,
            password: hashedPassword,
            firstName: data.adminFirstName,
            lastName: data.adminLastName,
            role: 'ADMIN',
            isActive: true,
            emailVerified: true,
            updatedAt: new Date(),
          },
        },
      },
      include: {
        users: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE TENANT
// ============================================

export const updateTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateTenantDTO = req.body;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // ADMIN can only update their own tenant
    if (req.user && req.user.role === 'ADMIN' && req.user.tenantId !== id) {
      throw new AppError('You can only update your own tenant', 403);
    }

    // Prevent ADMIN from updating sensitive fields
    const updateData: any = {};
    if (req.user?.role === 'ADMIN') {
      // ADMIN can only update these fields
      updateData.name = data.name;
      updateData.email = data.email;
      updateData.phone = data.phone;
      updateData.address = data.address;
      updateData.city = data.city;
      updateData.state = data.state;
      updateData.country = data.country;
      updateData.pincode = data.zipCode;
      updateData.logoUrl = data.logo;
      updateData.primaryColor = data.primaryColor;
      updateData.secondaryColor = data.secondaryColor;
    } else {
      // SUPER_ADMIN can update all fields including scheduleDrugEligible
      updateData.name = data.name;
      updateData.email = data.email;
      updateData.phone = data.phone;
      updateData.address = data.address;
      updateData.city = data.city;
      updateData.state = data.state;
      updateData.country = data.country;
      updateData.pincode = data.zipCode;
      updateData.logoUrl = data.logo;
      updateData.primaryColor = data.primaryColor;
      updateData.secondaryColor = data.secondaryColor;
      // Only SUPER_ADMIN can update scheduleDrugEligible
      if (data.scheduleDrugEligible !== undefined) {
        updateData.scheduleDrugEligible = data.scheduleDrugEligible;
      }
    }

    const updatedTenant = await prisma.tenants.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// UPDATE TENANT STATUS
// ============================================

export const updateTenantStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(TenantStatus);
    if (!validStatuses.includes(status as TenantStatus)) {
      throw new AppError('Invalid status', 400);
    }

    const tenant = await prisma.tenants.update({
      where: { id },
      data: { status },
    });

    const response: ApiResponse = {
      success: true,
      data: tenant,
      message: 'Tenant status updated',
    };

    res.json(response);
  }
);

// ============================================
// FREEZE/UNFREEZE TENANT
// ============================================

export const freezeTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    if (tenant.status === TenantStatus.FROZEN) {
      throw new AppError('Tenant is already frozen', 400);
    }

    const updatedTenant = await prisma.tenants.update({
      where: { id },
      data: { status: TenantStatus.FROZEN },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedTenant,
      message: 'Tenant frozen successfully',
    };

    res.json(response);
  }
);

export const unfreezeTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    if (tenant.status !== TenantStatus.FROZEN) {
      throw new AppError('Tenant is not frozen', 400);
    }

    // Unfreeze to ACTIVE status
    const updatedTenant = await prisma.tenants.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedTenant,
      message: 'Tenant unfrozen successfully',
    };

    res.json(response);
  }
);

// ============================================
// DELETE TENANT
// ============================================

export const deleteTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    await prisma.tenants.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tenant deleted successfully',
    };

    res.json(response);
  }
);

// ============================================
// GET CURRENT TENANT INFO (Public)
// ============================================

export const getTenantInfo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Fetch tenant - using findUnique without select to get all fields including scheduleDrugEligible
    // This works even before Prisma client is regenerated
    const tenant = await prisma.tenants.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // Manually construct response with only needed fields
    // Using type assertion for scheduleDrugEligible until Prisma client regenerates
    const tenantData = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      country: tenant.country,
      pincode: tenant.pincode,
      gstNumber: tenant.gstNumber,
      drugLicNumber: tenant.drugLicNumber,
      pharmacistName: tenant.pharmacistName,
      pharmacistRegNumber: tenant.pharmacistRegNumber,
      scheduleDrugEligible: (tenant as any).scheduleDrugEligible ?? false,
      features: tenant.features,
      metadata: tenant.metadata,
    };

    // Check if admin is frozen (if tenant has any active admin)
    const activeAdmins = await prisma.users.findMany({
      where: {
        tenantId: req.tenantId,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // If no active admins exist, the storefront should be blocked
    const adminFrozen = activeAdmins.length === 0;

    const response: ApiResponse = {
      success: true,
      data: {
        ...tenantData,
        adminFrozen, // Add flag to indicate if admin is frozen
      },
    };

    res.json(response);
  }
);

