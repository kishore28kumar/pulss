import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { ApiResponse, AddToCartDTO, UpdateCartItemDTO, CartSummary } from '@pulss/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// ============================================
// GET CART
// ============================================

export const getCart = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const cartItems = await prisma.cart_items.findMany({
      where: {
        customerId: req.customerId,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            thumbnail: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    // Calculate summary
    let subtotal = 0;
    let itemCount = 0;

    const items = cartItems.map((item: any) => {
      const total = Number(item.products.price) * item.quantity;
      subtotal += total;
      itemCount += item.quantity;

      // Access drugSchedule using type assertion until Prisma client regenerates
      const drugSchedule = (item.products as any).drugSchedule || null;

      return {
        id: item.id,
        productId: item.products.id,
        productName: item.products.name,
        productImage: item.products.thumbnail,
        productSlug: item.products.slug,
        price: Number(item.products.price),
        quantity: item.quantity,
        total,
        stockQuantity: item.products.stock,
        isActive: item.products.isActive,
        drugSchedule,
      };
    });

    const cartSummary: CartSummary = {
      items,
      subtotal,
      itemCount,
    };

    const response: ApiResponse = {
      success: true,
      data: cartSummary,
    };

    res.json(response);
  }
);

// ============================================
// ADD TO CART
// ============================================

export const addToCart = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const data: AddToCartDTO = req.body;

    if (!data.productId || !data.quantity) {
      throw new AppError('Product ID and quantity are required', 400);
    }

    if (data.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // Check if product exists and is active
    const product = await prisma.products.findFirst({
      where: {
        id: data.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check stock
    if (product.trackInventory && product.stock < data.quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Check if item already in cart
    const existingCartItem = await prisma.cart_items.findUnique({
      where: {
        customerId_productId: {
          customerId: req.customerId,
          productId: data.productId,
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + data.quantity;

      if (product.trackInventory && product.stock < newQuantity) {
        throw new AppError('Insufficient stock', 400);
      }

      cartItem = await prisma.cart_items.update({
        where: { id: existingCartItem.id },
        data: { 
          quantity: newQuantity,
          updatedAt: new Date(),
        },
        include: {
          products: true,
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cart_items.create({
        data: {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerId: req.customerId,
          productId: data.productId,
          quantity: data.quantity,
          variantOptions: data.variantOptions,
          updatedAt: new Date(),
        },
        include: {
          products: true,
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: cartItem,
      message: 'Product added to cart',
    };

    res.status(201).json(response);
  }
);

// ============================================
// UPDATE CART ITEM
// ============================================

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateCartItemDTO = req.body;

    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    if (data.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    const cartItem = await prisma.cart_items.findFirst({
      where: {
        id,
        customerId: req.customerId,
      },
      include: {
        products: true,
      },
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    // Check stock
    if (cartItem.products.trackInventory && cartItem.products.stock < data.quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const updatedCartItem = await prisma.cart_items.update({
      where: { id },
      data: { 
        quantity: data.quantity,
        updatedAt: new Date(),
      },
      include: {
        products: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedCartItem,
      message: 'Cart updated',
    };

    res.json(response);
  }
);

// ============================================
// REMOVE FROM CART
// ============================================

export const removeFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    const cartItem = await prisma.cart_items.findFirst({
      where: {
        id,
        customerId: req.customerId,
      },
    });

    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cart_items.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Item removed from cart',
    };

    res.json(response);
  }
);

// ============================================
// CLEAR CART
// ============================================

export const clearCart = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      throw new AppError('Not authenticated', 401);
    }

    await prisma.cart_items.deleteMany({
      where: {
        customerId: req.customerId,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Cart cleared',
    };

    res.json(response);
  }
);

