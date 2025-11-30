import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { hashPassword } from '../utils/password';

// ============================================
// GET ALL STAFF MEMBERS
// ============================================

export const getStaff = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { page = 1, limit = 20, search } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine which roles to show based on current user's role
    let allowedRoles: string[];
    if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin can see Admin users across all tenants
      allowedRoles = ['ADMIN'];
    } else if (req.user.role === 'ADMIN') {
      // Admin can see Staff users in their own tenant
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      allowedRoles = ['STAFF'];
    } else {
      // Staff cannot view other staff
      throw new AppError('You do not have permission to view staff', 403);
    }

    const where: any = {
      role: { in: allowedRoles },
    };

    // SUPER_ADMIN can see admins from all tenants, others are filtered by tenant
    if (req.user.role !== 'SUPER_ADMIN') {
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      where.tenantId = req.tenantId;
    }
    // For SUPER_ADMIN, don't filter by tenantId - show all admins

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          tenantId: true,
          tenants: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.users.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: staff,
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
// INVITE STAFF MEMBER
// ============================================

export const inviteStaff = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { email, firstName, lastName, phone, role, password, storeName, storeRoute } = req.body;

    if (!email || !firstName || !lastName) {
      throw new AppError('Email, first name, and last name are required', 400);
    }

    // Determine allowed role based on current user's role
    let allowedRole: string;
    let targetTenantId: string | undefined;
    
    if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin can create Admin users
      allowedRole = 'ADMIN';
      if (role && role !== 'ADMIN') {
        throw new AppError('Super Admin can only create Admin users', 400);
      }
      
      // If storeName and storeRoute are provided, create a new tenant
      if (storeName && storeRoute) {
        // Validate store route length
        if (storeRoute.length > 15) {
          throw new AppError('Store route must be at most 15 characters', 400);
        }
        
        if (storeRoute.length < 2) {
          throw new AppError('Store route must be at least 2 characters', 400);
        }
        
        // Validate store route format (lowercase, alphanumeric, hyphens only)
        if (!/^[a-z0-9-]+$/.test(storeRoute)) {
          throw new AppError('Store route must contain only lowercase letters, numbers, and hyphens', 400);
        }
        
        // Check if tenant slug already exists
        const existingTenant = await prisma.tenants.findUnique({
          where: { slug: storeRoute },
        });
        
        if (existingTenant) {
          throw new AppError('Store route already exists. Please choose a different one.', 400);
        }
        
        // Create new tenant
        const tenant = await prisma.tenants.create({
          data: {
            id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: storeName,
            slug: storeRoute,
            status: 'ACTIVE',
            subscriptionPlan: 'FREE',
            updatedAt: new Date(),
          },
        });
        
        targetTenantId = tenant.id;
      } else {
        // Use current tenant if no store info provided (fallback)
        if (!req.tenantId) {
          throw new AppError('Tenant not found. Please provide store name and store route.', 400);
        }
        targetTenantId = req.tenantId;
      }
    } else if (req.user.role === 'ADMIN') {
      // Admin can only create Staff users in their own tenant
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      allowedRole = 'STAFF';
      targetTenantId = req.tenantId;
      if (role && role !== 'STAFF') {
        throw new AppError('Admin can only create Staff users', 400);
      }
    } else {
      throw new AppError('You do not have permission to invite users', 403);
    }

    // Use the determined role (or default from request if valid)
    const userRole = role || allowedRole;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.tenantId === targetTenantId) {
        throw new AppError('User already exists in this tenant', 400);
      }
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password if provided, otherwise generate temporary password
    const hashedPassword = password
      ? await hashPassword(password)
      : await hashPassword(`temp_${Date.now()}`);

    // Create user
    const user = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: userRole as any,
        tenantId: targetTenantId,
        isActive: true,
        emailVerified: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // TODO: Send invitation email

    const roleLabel = userRole === 'ADMIN' ? 'Admin' : 'Staff';
    const response: ApiResponse = {
      success: true,
      data: {
        ...user,
        storeRoute: storeRoute || undefined, // Include store route in response
      },
      message: `${roleLabel} user created successfully${storeRoute ? ` with store route: ${storeRoute}` : ''}`,
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE STAFF MEMBER
// ============================================

export const updateStaff = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Build where clause based on user role
    const whereClause: any = {
      id,
      role: { in: ['ADMIN', 'STAFF'] },
    };

    // SUPER_ADMIN can update any Admin, others can only update from their tenant
    if (req.user.role !== 'SUPER_ADMIN') {
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      whereClause.tenantId = req.tenantId;
    }

    // Check if staff member exists
    const staffMember = await prisma.users.findFirst({
      where: whereClause,
    });

    if (!staffMember) {
      throw new AppError('Staff member not found', 404);
    }

    // Prevent changing own role or status
    if (req.user?.userId === id) {
      if (role && role !== staffMember.role) {
        throw new AppError('You cannot change your own role', 400);
      }
      if (isActive !== undefined && !isActive) {
        throw new AppError('You cannot deactivate yourself', 400);
      }
    }

    // Validate role if changing
    if (role && !['ADMIN', 'STAFF'].includes(role)) {
      throw new AppError('Invalid role. Must be ADMIN or STAFF', 400);
    }

    // Enforce role hierarchy when updating role
    if (role && req.user) {
      if (req.user.role === 'SUPER_ADMIN' && role !== 'ADMIN') {
        throw new AppError('Super Admin can only assign Admin role', 400);
      }
      if (req.user.role === 'ADMIN' && role !== 'STAFF') {
        throw new AppError('Admin can only assign Staff role', 400);
      }
    }

    // Update staff member
    const updatedStaff = await prisma.users.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        role: role as any,
        isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedStaff,
      message: 'Staff member updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// DELETE STAFF MEMBER
// ============================================

export const deleteStaff = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Build where clause based on user role
    const whereClause: any = {
      id,
      role: { in: ['ADMIN', 'STAFF'] },
    };

    // SUPER_ADMIN can delete any Admin, others can only delete from their tenant
    if (req.user.role !== 'SUPER_ADMIN') {
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      whereClause.tenantId = req.tenantId;
    }

    // Check if staff member exists
    const staffMember = await prisma.users.findFirst({
      where: whereClause,
    });

    if (!staffMember) {
      throw new AppError('Staff member not found', 404);
    }

    // Prevent deleting yourself
    if (req.user.userId === id) {
      throw new AppError('You cannot delete yourself', 400);
    }

    // Prevent deleting the last admin (unless requester is SUPER_ADMIN)
    if (staffMember.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      const adminCount = await prisma.users.count({
        where: {
          tenantId: req.tenantId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new AppError('Cannot delete the last admin user', 400);
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.users.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff member deleted successfully',
    };

    res.json(response);
  }
);

