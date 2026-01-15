import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, LoginCredentials, RegisterData, AuthUser } from '@pulss/types';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';

// ============================================
// ADMIN/STAFF LOGIN
// ============================================

export const loginUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginCredentials;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // First, find the user by email (email is globally unique)
    // We'll verify tenant after finding the user
    const user = await prisma.users.findUnique({
      where: {
        email,
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

    // Check if user exists and is not a customer
    if (!user || user.role === 'CUSTOMER') {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user account is frozen
    if (!user.isActive) {
      throw new AppError('Your account has been frozen. Please contact Super Admin for assistance.', 403);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // If tenant slug was provided in header, verify it matches the user's tenant
    // This allows login to work even if wrong/no tenant slug is sent
    if (req.tenantId && user.tenantId && req.tenantId !== user.tenantId) {
      // Tenant mismatch - but we'll still allow login if password is correct
      // The user's actual tenant will be returned in the response
      console.warn(`Tenant mismatch for user ${email}: provided ${req.tenantId}, user has ${user.tenantId}`);
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

    // Check if user account is frozen
    if (!user.isActive) {
      throw new AppError('Your account has been frozen. Please contact Super Admin for assistance.', 403);
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

// ============================================
// UPDATE USER PROFILE (Admin/Staff)
// ============================================

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { firstName, lastName, phone } = req.body;

    // Validate phone number format if provided
    if (phone !== undefined && phone !== null && phone !== '') {
      // Basic phone validation: allows digits, spaces, hyphens, parentheses, and + for international
      // Minimum 10 digits, maximum 20 characters
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15 || !phoneRegex.test(phone)) {
        throw new AppError('Invalid phone number format. Please provide a valid phone number (10-15 digits).', 400);
      }
    }

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone: phone || null }),
        updatedAt: new Date(),
      },
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

    const response: ApiResponse = {
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        phone: updatedUser.phone || '',
        avatar: updatedUser.avatar || '',
        role: updatedUser.role,
        tenant: updatedUser.tenants || undefined,
      },
      message: 'Profile updated successfully',
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

// ============================================
// GENERATE TEMPORARY LOGIN TOKEN (SUPER_ADMIN ONLY)
// ============================================

export const generateLoginToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Only SUPER_ADMIN can generate login tokens
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Unauthorized. Only SUPER_ADMIN can generate login tokens.', 403);
    }

    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Only allow for ADMIN or STAFF roles (not CUSTOMER)
    if (user.role === 'CUSTOMER') {
      throw new AppError('Cannot generate login token for customer accounts', 400);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Cannot generate login token for inactive user', 400);
    }

    // Generate a temporary login token (expires in 5 minutes)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const loginToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || '',
        type: 'login-token',
      },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Generate the login URL
    const adminDashboardUrl = process.env.ADMIN_URL || 'http://localhost:3001';
    const loginUrl = `${adminDashboardUrl}/login?token=${loginToken}`;

    const response: ApiResponse = {
      success: true,
      data: {
        loginUrl,
        token: loginToken,
        expiresIn: 300, // 5 minutes in seconds
      },
      message: 'Login token generated successfully',
    };

    res.json(response);
  }
);

// ============================================
// VERIFY LOGIN TOKEN AND LOGIN
// ============================================

export const verifyLoginToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    try {
      // Verify the token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Check if it's a login token
      if (decoded.type !== 'login-token') {
        throw new AppError('Invalid token type', 401);
      }

      // Find the user
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
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

      if (!user || user.role === 'CUSTOMER') {
        throw new AppError('Invalid or expired token', 401);
      }

      // Check if user account is frozen
      if (!user.isActive) {
        throw new AppError('Your account has been frozen. Please contact Super Admin for assistance.', 403);
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
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Login token has expired', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid login token', 401);
      }
      throw error;
    }
  }
);
