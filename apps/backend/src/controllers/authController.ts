import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, LoginCredentials, RegisterData, AuthUser } from '@pulss/types';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// ADMIN/STAFF LOGIN
// ============================================

export const loginUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginCredentials;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Find user (using findFirst since email is globally unique but we still verify tenantId)
    const user = await prisma.users.findFirst({
      where: {
        email,
        tenantId: req.tenantId,
        role: { not: 'CUSTOMER' }, // Admin/Staff only
        isActive: true,
      },
      include: {
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role, user.tenantId || '');

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      tenantId: user.tenantId || '',
      tenant: user.tenants || { id: '', name: '', slug: '' },
    };

    const response: ApiResponse = {
      success: true,
      data: {
        user: authUser,
        tokens,
      },
      message: 'Login successful',
    };

    res.json(response);
  }
);

// ============================================
// CUSTOMER LOGIN
// ============================================

export const loginCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginCredentials;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Find user with CUSTOMER role (using findFirst since email is globally unique but we still verify tenantId)
    const user = await prisma.users.findFirst({
      where: {
        email,
        tenantId: req.tenantId,
        role: 'CUSTOMER',
        isActive: true,
      },
      include: {
        customers: true,
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Get customer record
    const customer = user.customers;
    if (!customer) {
      throw new AppError('Customer record not found', 404);
    }

    // Generate tokens (using custom payload for customers)
    const tokens = generateTokens(
      customer.id,
      user.email,
      'CUSTOMER',
      customer.tenantId,
      'customer'
    );

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: customer.phone || user.phone || '',
          avatar: user.avatar || '',
        },
        tokens,
      },
      message: 'Login successful',
    };

    res.json(response);
  }
);

// ============================================
// CUSTOMER REGISTER
// ============================================

export const registerCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, phone } = req.body as RegisterData;

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Email, password, first name, and last name are required', 400);
    }

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Check if user already exists (email is globally unique, so just check by email)
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and customer in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.users.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: 'CUSTOMER',
          tenantId: req.tenantId!,
          emailVerified: false,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Create customer record
      const customer = await tx.customers.create({
        data: {
          id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          tenantId: req.tenantId!,
          phone: phone || null,
          updatedAt: new Date(),
        },
        include: {
          tenants: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return { user, customer };
    });

    // Generate tokens
    const tokens = generateTokens(
      result.customer.id,
      result.user.email,
      'CUSTOMER',
      result.customer.tenantId,
      'customer'
    );

    const response: ApiResponse = {
      success: true,
      data: {
        customer: {
          id: result.customer.id,
          email: result.user.email,
          firstName: result.user.firstName || '',
          lastName: result.user.lastName || '',
          phone: result.customer.phone || result.user.phone || '',
        },
        tokens,
      },
      message: 'Registration successful',
    };

    res.status(201).json(response);
  }
);

// ============================================
// GET CURRENT USER/CUSTOMER
// ============================================

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
      include: {
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        role: user.role,
        tenant: user.tenants || undefined,
      },
    };

    res.json(response);
  }
);

export const getCurrentCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const customer = await prisma.customers.findUnique({
      where: { id: req.customerId },
      include: {
        users: true,
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: customer.id,
        email: customer.users.email,
        firstName: customer.users.firstName || '',
        lastName: customer.users.lastName || '',
        phone: customer.phone || customer.users.phone || '',
        avatar: customer.users.avatar || '',
        emailVerified: customer.users.emailVerified,
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString() : undefined,
        gender: customer.gender || undefined,
        tenant: customer.tenants,
      },
    };

    res.json(response);
  }
);

// ============================================
// UPDATE CUSTOMER PROFILE
// ============================================

export const updateCustomerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

    // Get customer with user relation
    const customer = await prisma.customers.findUnique({
      where: { id: req.customerId },
      include: {
        users: true,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Update user fields
    const updateUserData: any = {};
    if (firstName !== undefined) updateUserData.firstName = firstName;
    if (lastName !== undefined) updateUserData.lastName = lastName;
    if (phone !== undefined) updateUserData.phone = phone;
    updateUserData.updatedAt = new Date();

    // Update customer fields
    const updateCustomerData: any = {};
    if (phone !== undefined) updateCustomerData.phone = phone;
    if (dateOfBirth !== undefined) {
      updateCustomerData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (gender !== undefined) updateCustomerData.gender = gender || null;
    updateCustomerData.updatedAt = new Date();

    // Update both user and customer in a transaction
    await prisma.$transaction([
      prisma.users.update({
        where: { id: customer.userId },
        data: updateUserData,
      }),
      prisma.customers.update({
        where: { id: req.customerId },
        data: updateCustomerData,
      }),
    ]);

    // Fetch updated customer with tenant info
    const updatedCustomerWithRelations = await prisma.customers.findUnique({
      where: { id: req.customerId },
      include: {
        users: true,
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!updatedCustomerWithRelations) {
      throw new AppError('Failed to fetch updated customer', 500);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: updatedCustomerWithRelations.id,
        email: updatedCustomerWithRelations.users.email,
        firstName: updatedCustomerWithRelations.users.firstName || '',
        lastName: updatedCustomerWithRelations.users.lastName || '',
        phone: updatedCustomerWithRelations.phone || updatedCustomerWithRelations.users.phone || '',
        avatar: updatedCustomerWithRelations.users.avatar || '',
        emailVerified: updatedCustomerWithRelations.users.emailVerified,
        dateOfBirth: updatedCustomerWithRelations.dateOfBirth ? updatedCustomerWithRelations.dateOfBirth.toISOString() : undefined,
        gender: updatedCustomerWithRelations.gender || undefined,
        tenant: updatedCustomerWithRelations.tenants,
      },
      message: 'Profile updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// REFRESH TOKEN
// ============================================

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Generate new tokens
      const tokens = generateTokens(
        decoded.userId,
        decoded.email,
        decoded.role,
        decoded.tenantId
      );

      const response: ApiResponse = {
        success: true,
        data: tokens,
      };

      res.json(response);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
);
