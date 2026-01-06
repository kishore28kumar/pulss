import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../socket/socketHandler';

/**
 * Create a new broadcast (Super Admin only)
 * POST /api/broadcasts
 */
export const createBroadcast = async (req: Request, res: Response) => {
  try {
    const { title, message } = req.body;
    const senderId = req.user?.userId;
    const userRole = req.user?.role;

    if (!senderId || userRole !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admin can create broadcasts', 403);
    }

    if (!title || !message) {
      throw new AppError('Title and message are required', 400);
    }

    const broadcast = await prisma.broadcasts.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Emit broadcast event to all Admin/Staff users via WebSocket
    try {
      const io = getIO();
      const formattedBroadcast = {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        sender: broadcast.sender,
        createdAt: broadcast.createdAt.toISOString(),
        isRead: false,
        readAt: null,
      };
      
      // Emit to all connected Admin/Staff users
      io.emit('broadcast:new', formattedBroadcast);
    } catch (error) {
      console.error('Failed to emit broadcast event:', error);
      // Don't fail the request if WebSocket emit fails
    }

    res.status(201).json({
      success: true,
      data: broadcast,
      message: 'Broadcast created successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to create broadcast', 500);
  }
};

/**
 * Get all broadcasts for current user (Admin/Staff)
 * GET /api/broadcasts
 */
export const getBroadcasts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get all non-deleted broadcasts
    const broadcasts = await prisma.broadcasts.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        readBy: {
          where: {
            userId,
          },
          select: {
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response with read status
    // For Super Admin, mark their own broadcasts as read automatically
    const formattedBroadcasts = broadcasts.map((broadcast) => {
      const isOwnBroadcast = userRole === 'SUPER_ADMIN' && broadcast.senderId === userId;
      
      return {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        sender: broadcast.sender,
        createdAt: broadcast.createdAt.toISOString(),
        isRead: isOwnBroadcast || broadcast.readBy.length > 0,
        readAt: isOwnBroadcast 
          ? broadcast.createdAt.toISOString() 
          : (broadcast.readBy[0]?.readAt?.toISOString() || null),
      };
    });

    res.json({
      success: true,
      data: formattedBroadcasts,
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch broadcasts', 500);
  }
};

/**
 * Get unread broadcasts count
 * GET /api/broadcasts/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get total broadcasts (excluding own broadcasts for Super Admin)
    const whereClause: any = {
      deletedAt: null,
    };

    // Super Admin shouldn't count their own broadcasts
    if (userRole === 'SUPER_ADMIN') {
      whereClause.senderId = { not: userId };
    }

    const totalBroadcasts = await prisma.broadcasts.count({
      where: whereClause,
    });

    // Get read broadcasts count for this user (excluding own broadcasts for Super Admin)
    const readWhereClause: any = {
      userId,
      broadcast: {
        deletedAt: null,
      },
    };

    if (userRole === 'SUPER_ADMIN') {
      readWhereClause.broadcast = {
        ...readWhereClause.broadcast,
        senderId: { not: userId },
      };
    }

    const readCount = await prisma.broadcast_reads.count({
      where: readWhereClause,
    });

    const unreadCount = totalBroadcasts - readCount;

    res.json({
      success: true,
      data: { unreadCount: Math.max(0, unreadCount) },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch unread count', 500);
  }
};

/**
 * Mark broadcast as read
 * POST /api/broadcasts/:id/read
 */
export const markBroadcastAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if broadcast exists and is not deleted
    const broadcast = await prisma.broadcasts.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!broadcast) {
      throw new AppError('Broadcast not found', 404);
    }

    // Create or update read record
    await prisma.broadcast_reads.upsert({
      where: {
        broadcastId_userId: {
          broadcastId: id,
          userId,
        },
      },
      create: {
        broadcastId: id,
        userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Broadcast marked as read',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to mark broadcast as read', 500);
  }
};

/**
 * Mark all broadcasts as read
 * POST /api/broadcasts/mark-all-read
 */
export const markAllBroadcastsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get all unread broadcasts
    const unreadBroadcasts = await prisma.broadcasts.findMany({
      where: {
        deletedAt: null,
        readBy: {
          none: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Mark all as read
    if (unreadBroadcasts.length > 0) {
      await prisma.broadcast_reads.createMany({
        data: unreadBroadcasts.map((broadcast) => ({
          broadcastId: broadcast.id,
          userId,
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      message: 'All broadcasts marked as read',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to mark all broadcasts as read', 500);
  }
};

/**
 * Delete broadcast (Super Admin only)
 * DELETE /api/broadcasts/:id
 */
export const deleteBroadcast = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const senderId = req.user?.userId;
    const userRole = req.user?.role;

    if (!senderId || userRole !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admin can delete broadcasts', 403);
    }

    // Soft delete
    await prisma.broadcasts.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Broadcast deleted successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to delete broadcast', 500);
  }
};

