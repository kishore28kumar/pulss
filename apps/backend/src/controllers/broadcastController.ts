import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getIO } from '../socket/socketHandler';

/**
 * Create a new broadcast (Super Admin only)
 * POST /api/broadcasts
 */
export const createBroadcast = asyncHandler(async (req: Request, res: Response) => {
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

    let broadcast;
    try {
      broadcast = await prisma.broadcasts.create({
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
    } catch (dbError: any) {
      // If table doesn't exist, return error
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        throw new AppError('Broadcasts feature is not available. Please run database migrations.', 503);
      } else {
        throw dbError;
      }
    }

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
});

/**
 * Get all broadcasts for current user (Admin/Staff)
 * GET /api/broadcasts
 */
export const getBroadcasts = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get all non-deleted broadcasts
    let broadcasts;
    try {
      broadcasts = await prisma.broadcasts.findMany({
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
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Broadcasts] Broadcasts table does not exist yet. Please run migrations.');
        broadcasts = [];
      } else {
        throw dbError;
      }
    }

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
});

/**
 * Get unread broadcasts count
 * GET /api/broadcasts/unread-count
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
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

    let totalBroadcasts = 0;
    let readCount = 0;
    
    try {
      totalBroadcasts = await prisma.broadcasts.count({
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

      readCount = await prisma.broadcast_reads.count({
        where: readWhereClause,
      });
    } catch (dbError: any) {
      // If table doesn't exist, return 0 count instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Broadcasts] Broadcasts table does not exist yet. Returning 0 unread count.');
        totalBroadcasts = 0;
        readCount = 0;
      } else {
        throw dbError;
      }
    }

    const unreadCount = totalBroadcasts - readCount;

    res.json({
      success: true,
      data: { unreadCount: Math.max(0, unreadCount) },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch unread count', 500);
  }
});

/**
 * Mark broadcast as read
 * POST /api/broadcasts/:id/read
 */
export const markBroadcastAsRead = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if broadcast exists and is not deleted
    let broadcast;
    try {
      broadcast = await prisma.broadcasts.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return 404
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        throw new AppError('Broadcast not found', 404);
      } else {
        throw dbError;
      }
    }

    if (!broadcast) {
      throw new AppError('Broadcast not found', 404);
    }

    // Create or update read record
    try {
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
    } catch (dbError: any) {
      // If table doesn't exist, just return success (no reads to update)
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Broadcasts] Broadcast reads table does not exist yet. Skipping mark as read.');
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      message: 'Broadcast marked as read',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to mark broadcast as read', 500);
  }
});

/**
 * Mark all broadcasts as read
 * POST /api/broadcasts/mark-all-read
 */
export const markAllBroadcastsAsRead = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get all unread broadcasts
    let unreadBroadcasts = [];
    try {
      unreadBroadcasts = await prisma.broadcasts.findMany({
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
        try {
          await prisma.broadcast_reads.createMany({
            data: unreadBroadcasts.map((broadcast) => ({
              broadcastId: broadcast.id,
              userId,
              readAt: new Date(),
            })),
            skipDuplicates: true,
          });
        } catch (dbError: any) {
          // If table doesn't exist, just skip (no reads to create)
          if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
            console.warn('[Broadcasts] Broadcast reads table does not exist yet. Skipping mark all as read.');
          } else {
            throw dbError;
          }
        }
      }
    } catch (dbError: any) {
      // If table doesn't exist, just return success (no broadcasts to mark)
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Broadcasts] Broadcasts table does not exist yet. Skipping mark all as read.');
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      message: 'All broadcasts marked as read',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to mark all broadcasts as read', 500);
  }
});

/**
 * Delete broadcast (Super Admin only)
 * DELETE /api/broadcasts/:id
 */
export const deleteBroadcast = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const senderId = req.user?.userId;
    const userRole = req.user?.role;

    if (!senderId || userRole !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admin can delete broadcasts', 403);
    }

    // Soft delete
    try {
      await prisma.broadcasts.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return 404
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        throw new AppError('Broadcast not found', 404);
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      message: 'Broadcast deleted successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to delete broadcast', 500);
  }
});

