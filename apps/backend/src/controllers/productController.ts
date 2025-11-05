import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreateProductDTO, UpdateProductDTO, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET ALL PRODUCTS (with filters & pagination)
// ============================================

export const getProducts = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      isActive,
      isFeatured,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {
      tenantId: req.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    if (inStock === 'true') {
      where.stockQuantity = { gt: 0 };
    }

    // Execute query
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.products.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: products,
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
// GET SINGLE PRODUCT (by ID or slug)
// ============================================

export const getProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Try to find by ID first, then by slug
    const product = await prisma.products.findFirst({
      where: {
        OR: [
          { id, tenantId: req.tenantId },
          { slug: id, tenantId: req.tenantId },
        ],
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product_variants: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: product,
    };

    res.json(response);
  }
);

// ============================================
// CREATE PRODUCT
// ============================================

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const data: CreateProductDTO = req.body;

    // Check if slug already exists
    const existingProduct = await prisma.products.findUnique({
      where: {
        tenantId_slug: {
          tenantId: req.tenantId,
          slug: data.slug,
        },
      },
    });

    if (existingProduct) {
      throw new AppError('Product with this slug already exists', 400);
    }

    // Create product
    const product = await prisma.products.create({
      data: {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId: req.tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        trackInventory: data.trackInventory ?? true,
        stock: data.stockQuantity ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        requiresPrescription: data.requiresPrescription ?? false,
        manufacturer: data.manufacturer,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        thumbnail: data.images?.[0],
        images: data.images || [],
        categoryId: data.categoryIds?.[0] || null,
        updatedAt: new Date(),
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product created successfully',
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE PRODUCT
// ============================================

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateProductDTO = req.body;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    // Check if product exists
    const existingProduct = await prisma.products.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.products.findUnique({
        where: {
          tenantId_slug: {
            tenantId: req.tenantId,
            slug: data.slug,
          },
        },
      });

      if (slugExists) {
        throw new AppError('Product with this slug already exists', 400);
      }
    }

    // Update product
    const product = await prisma.products.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        trackInventory: data.trackInventory,
        stock: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        requiresPrescription: data.requiresPrescription,
        manufacturer: data.manufacturer,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        thumbnail: data.images?.[0],
        images: data.images || undefined,
        categoryId: data.categoryIds?.[0] || undefined,
        updatedAt: new Date(),
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update images if provided
    // TODO: Implement product images table
    // if (data.images) {
    //   await prisma.product_images.deleteMany({
    //     where: { product_id: id },
    //   });

    //   await prisma.product_images.createMany({
    //     data: data.images.map((url, index) => ({
    //       product_id: id,
    //       url,
    //       sortOrder: index,
    //     })),
    //   });
    // }

    // Update categories if provided
    // TODO: Implement product categories junction table
    // if (data.categoryIds) {
    //   await prisma.product_categories.deleteMany({
    //     where: { product_id: id },
    //   });

    //   await prisma.product_categories.createMany({
    //     data: data.categoryIds.map((categoryId) => ({
    //       product_id: id,
    //       category_id: categoryId,
    //     })),
    //   });
    // }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };

    res.json(response);
  }
);

// ============================================
// DELETE PRODUCT
// ============================================

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }

    const product = await prisma.products.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.products.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
    };

    res.json(response);
  }
);

