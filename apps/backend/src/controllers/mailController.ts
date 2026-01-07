import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getIO } from '../socket/socketHandler';

// Type definitions for internal messages
type InternalMessageWithRelations = {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
};

/**
 * Send internal message
 * POST /api/mail/send
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { recipientId, subject, body } = req.body;
    const senderId = req.user?.userId;
    const senderRole = req.user?.role;

    if (!senderId || !['SUPER_ADMIN', 'ADMIN'].includes(senderRole || '')) {
      throw new AppError('Only Super Admin and Admin can send internal messages', 403);
    }

    if (!recipientId || !subject || !body) {
      throw new AppError('Recipient ID, subject, and body are required', 400);
    }

    // Verify recipient exists and is Super Admin or Admin
    const recipient = await prisma.users.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true },
    });

    if (!recipient || !['SUPER_ADMIN', 'ADMIN'].includes(recipient.role)) {
      throw new AppError('Invalid recipient. Only Super Admin and Admin can receive internal messages', 400);
    }

    // Prevent sending to self
    if (senderId === recipientId) {
      throw new AppError('Cannot send message to yourself', 400);
    }

    // For Super Admin: can send to any Admin
    // For Admin: can only send to Super Admin
    if (senderRole === 'ADMIN' && recipient.role !== 'SUPER_ADMIN') {
      throw new AppError('Admin can only send messages to Super Admin', 403);
    }

    let message;
    try {
      message = await prisma.internal_messages.create({
        data: {
          subject: subject.trim(),
          body: body.trim(),
          senderId,
          recipientId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return error
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        throw new AppError('Mail feature is not available. Please run database migrations.', 503);
      } else {
        throw dbError;
      }
    }

    // Emit WebSocket event to recipient
    try {
      const io = getIO();
      const formattedMessage = {
        ...message,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() || null,
      };
      
      // Emit to recipient's socket
      io.to(`user:${recipientId}`).emit('mail:new', formattedMessage);
    } catch (error) {
      console.error('Failed to emit mail event:', error);
      // Don't fail the request if WebSocket emit fails
    }

    res.status(201).json({
      success: true,
      data: {
        ...message,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() || null,
      },
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to send message', 500);
  }
});

/**
 * Get conversations (list of users you've messaged or received messages from)
 * GET /api/mail/conversations
 */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get all messages where user is sender or recipient
    let messages: InternalMessageWithRelations[] = [];
    try {
      messages = await prisma.internal_messages.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000, // Limit to prevent excessive memory usage
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Mail] Internal messages table does not exist yet. Please run migrations.');
        messages = [];
      } else {
        throw dbError;
      }
    }

    // Group by conversation partner
    const conversationMap = new Map<string, any>();
    
    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.recipientId : message.senderId;
      const partner = message.senderId === userId ? message.recipient : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partner: {
            ...partner,
            role: partner.role, // Ensure role is included
          },
          lastMessage: message,
          unreadCount: 0,
        });
      }
      
      // Update unread count
      if (message.recipientId === userId && !message.isRead) {
        const conv = conversationMap.get(partnerId);
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.lastMessage.createdAt).getTime();
        const dateB = new Date(b.lastMessage.createdAt).getTime();
        return dateB - dateA; // Newest first
      });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch conversations', 500);
  }
});

/**
 * Get messages for a conversation
 * GET /api/mail/messages/:partnerId
 */
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    let messages: InternalMessageWithRelations[] = [];
    try {
      messages = await prisma.internal_messages.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: partnerId },
            { senderId: partnerId, recipientId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // Oldest first
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Mail] Internal messages table does not exist yet. Returning empty messages.');
        messages = [];
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
        readAt: msg.readAt?.toISOString() || null,
      })),
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch messages', 500);
  }
});

/**
 * Get unread count
 * GET /api/mail/unread-count
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    let unreadCount = 0;
    try {
      unreadCount = await prisma.internal_messages.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return 0 count instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Mail] Internal messages table does not exist yet. Returning 0 unread count.');
        unreadCount = 0;
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch unread count', 500);
  }
});

/**
 * Mark messages as read
 * POST /api/mail/mark-read/:partnerId
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    try {
      await prisma.internal_messages.updateMany({
        where: {
          senderId: partnerId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, just return success (no messages to update)
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Mail] Internal messages table does not exist yet. Skipping mark as read.');
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to mark messages as read', 500);
  }
});

// Cache for recipients (5 minute TTL)
const recipientsCache = new Map<string, { data: any[]; expires: number }>();
const RECIPIENTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get available recipients for mail
 * GET /api/mail/recipients
 */
export const getRecipients = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Check cache first
    const cacheKey = `${userRole}:${userId}`;
    const cached = recipientsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log('[Mail] Returning cached recipients');
      return res.json({
        success: true,
        data: cached.data,
      });
    }

    let recipients: any[];

    if (userRole === 'SUPER_ADMIN') {
      // Super Admin can message any Admin
      recipients = await prisma.users.findMany({
        where: {
          role: 'ADMIN',
          id: { not: userId }, // Exclude self
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    } else {
      // Admin can only message Super Admin
      recipients = await prisma.users.findMany({
        where: {
          role: 'SUPER_ADMIN',
          id: { not: userId }, // Exclude self
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    }

    // Cache the results
    recipientsCache.set(cacheKey, {
      data: recipients,
      expires: Date.now() + RECIPIENTS_CACHE_TTL,
    });

    return res.json({
      success: true,
      data: recipients,
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch recipients', 500);
  }
});

