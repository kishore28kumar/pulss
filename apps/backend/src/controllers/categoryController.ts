import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreateCategoryDTO, UpdateCategoryDTO } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET ALL CATEGORIES
// ============================================

export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const categories = await prisma.categories.findMany({
      where: {
        tenantId: req.tenantId,
      },
      include: {
        categories: true,
        other_categories: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    const response: ApiResponse = {
      success: true,
      data: categories,
    };

    res.json(response);
  }
);

// ============================================
// GET SINGLE CATEGORY
// ============================================

export const getCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const category = await prisma.categories.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        categories: true,
        other_categories: true,
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            thumbnail: true,
            images: true,
            isActive: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: category,
    };

    res.json(response);
  }
);

// ============================================
// CREATE CATEGORY
// ============================================

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const data: CreateCategoryDTO = req.body;

    // Check if slug exists
    const existingCategory = await prisma.categories.findUnique({
      where: {
        tenantId_slug: {
          tenantId: req.tenantId,
          slug: data.slug,
        },
      },
    });

    if (existingCategory) {
      throw new AppError('Category with this slug already exists', 400);
    }

    const category = await prisma.categories.create({
      data: {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId: req.tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        icon: data.icon,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        displayOrder: data.sortOrder ?? 0,
        updatedAt: new Date(),
      },
      include: {
        categories: true,
        other_categories: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category created successfully',
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE CATEGORY
// ============================================

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateCategoryDTO = req.body;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const existingCategory = await prisma.categories.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }

    const category = await prisma.categories.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        icon: data.icon,
        parentId: data.parentId,
        isActive: data.isActive,
        displayOrder: data.sortOrder,
        updatedAt: new Date(),
      },
      include: {
        categories: true,
        other_categories: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// DELETE CATEGORY
// ============================================

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const category = await prisma.categories.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        other_categories: true,
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category.other_categories.length > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    await prisma.categories.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    };

    res.json(response);
  }
);

