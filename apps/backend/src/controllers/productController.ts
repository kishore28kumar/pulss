import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, CreateProductDTO, UpdateProductDTO, PaginatedResponse } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET ALL PRODUCTS (with filters & pagination)
// ============================================

export const getProducts = asyncHandler(
  async (req: Request, res: Response) => {
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
      tenantId, // Optional tenant filter for SUPER_ADMIN
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {};

    // SUPER_ADMIN can see all products or filter by tenantId
    // Other roles can only see their tenant's products
    if (req.user?.role === 'SUPER_ADMIN') {
      if (tenantId) {
        where.tenantId = tenantId;
      }
      // If no tenantId specified, SUPER_ADMIN sees all products
    } else {
      // Non-SUPER_ADMIN users must have a tenantId
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      where.tenantId = req.tenantId;
    }

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
      where.stock = { gt: 0 };
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

    // Build where clause based on user role
    let whereClause: any;

    if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any product
      whereClause = {
        OR: [
          { id },
          { slug: id },
        ],
      };
    } else {
      // Other roles can only access their tenant's products
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
    }
      whereClause = {
        OR: [
          { id, tenantId: req.tenantId },
          { slug: id, tenantId: req.tenantId },
        ],
      };
    }

    // Try to find by ID first, then by slug
    const product = await prisma.products.findFirst({
      where: whereClause,
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
    // SUPER_ADMIN can create products for any tenant (must specify tenantId in body)
    // Other roles can only create products for their own tenant
    let targetTenantId: string;
    
    if (req.user?.role === 'SUPER_ADMIN') {
      targetTenantId = req.body.tenantId || req.tenantId;
      if (!targetTenantId) {
        throw new AppError('Tenant ID is required', 400);
      }
    } else {
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
      }
      targetTenantId = req.tenantId;
    }

    const data: CreateProductDTO = req.body;

    // Check if slug already exists
    const existingProduct = await prisma.products.findUnique({
      where: {
        tenantId_slug: {
          tenantId: targetTenantId,
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
        tenantId: targetTenantId,
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

    // Build where clause based on user role
    let whereClause: any;

    if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can update any product
      whereClause = { id };
    } else {
      // Other roles can only update their tenant's products
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
      }
      whereClause = { id, tenantId: req.tenantId };
    }

    // Check if product exists
    const existingProduct = await prisma.products.findFirst({
      where: whereClause,
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.products.findUnique({
        where: {
          tenantId_slug: {
            tenantId: existingProduct.tenantId,
            slug: data.slug,
          },
        },
      });

      if (slugExists) {
        throw new AppError('Product with this slug already exists', 400);
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.compareAtPrice !== undefined) updateData.comparePrice = data.compareAtPrice;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.trackInventory !== undefined) updateData.trackInventory = data.trackInventory;
    if (data.stockQuantity !== undefined) updateData.stock = data.stockQuantity;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.requiresPrescription !== undefined) updateData.requiresPrescription = data.requiresPrescription;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.images !== undefined) {
      updateData.images = data.images;
      updateData.thumbnail = data.images[0] || null;
    }
    if (data.categoryIds !== undefined) {
      updateData.categoryId = data.categoryIds[0] || null;
    }

    // Update product
    const product = await prisma.products.update({
      where: { id },
      data: updateData,
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

// ============================================
// BULK CREATE PRODUCTS
// ============================================

export const bulkCreateProducts = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { products, tenantId: bodyTenantId } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new AppError('Products array is required', 400);
    }

    if (products.length > 1000) {
      throw new AppError('Maximum 1000 products allowed per upload', 400);
    }

    // Determine target tenant
    let targetTenantId: string;
    
    if (req.user.role === 'SUPER_ADMIN') {
      targetTenantId = bodyTenantId || req.tenantId;
      if (!targetTenantId) {
        throw new AppError('Tenant ID is required', 400);
      }
    } else {
      if (!req.tenantId) {
        throw new AppError('Tenant not found', 400);
      }
      targetTenantId = req.tenantId;
    }

    const results = {
      success: [] as any[],
      failed: [] as Array<{ name: string; slug: string; error: string }>,
    };

    // Process products in batches
    for (const productData of products) {
      try {
        // Validate required fields
        if (!productData.name || !productData.slug || productData.price === undefined) {
          results.failed.push({
            name: productData.name || 'Unknown',
            slug: productData.slug || 'unknown',
            error: 'Missing required fields (name, slug, price)',
          });
          continue;
        }

        // Check if slug already exists
        const existingProduct = await prisma.products.findUnique({
          where: {
            tenantId_slug: {
              tenantId: targetTenantId,
              slug: productData.slug,
            },
          },
        });

        if (existingProduct) {
          results.failed.push({
            name: productData.name,
            slug: productData.slug,
            error: 'Product with this slug already exists',
          });
          continue;
        }

        // Create product
        const product = await prisma.products.create({
          data: {
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tenantId: targetTenantId,
            name: productData.name,
            slug: productData.slug,
            description: productData.description || null,
            price: productData.price,
            comparePrice: productData.compareAtPrice || null,
            costPrice: productData.costPrice || null,
            sku: productData.sku || null,
            barcode: productData.barcode || null,
            trackInventory: productData.trackInventory ?? true,
            stock: productData.stockQuantity ?? 0,
            lowStockThreshold: productData.lowStockThreshold ?? 10,
            isActive: productData.isActive ?? true,
            isFeatured: productData.isFeatured ?? false,
            requiresPrescription: productData.requiresPrescription ?? false,
            manufacturer: productData.manufacturer || null,
            metaTitle: productData.metaTitle || null,
            metaDescription: productData.metaDescription || null,
            thumbnail: productData.images?.[0] || null,
            images: productData.images || [],
            categoryId: productData.categoryIds?.[0] || null,
            updatedAt: new Date(),
          },
        });

        results.success.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
        });
      } catch (error: any) {
        results.failed.push({
          name: productData.name || 'Unknown',
          slug: productData.slug || 'unknown',
          error: error.message || 'Failed to create product',
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        totalCount: products.length,
        successfulProducts: results.success,
        failedProducts: results.failed,
      },
      message: `Successfully created ${results.success.length} out of ${products.length} products`,
    };

    res.status(201).json(response);
  }
);

// ============================================
// DELETE PRODUCT
// ============================================

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Build where clause based on user role
    let whereClause: any;

    if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can delete any product
      whereClause = { id };
    } else {
      // Other roles can only delete their tenant's products
    if (!req.tenantId) {
      throw new AppError('Tenant not found', 400);
      }
      whereClause = { id, tenantId: req.tenantId };
    }

    const product = await prisma.products.findFirst({
      where: whereClause,
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

