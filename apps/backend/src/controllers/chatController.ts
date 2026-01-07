import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Get chat history for a customer or admin
 * GET /api/chat/history
 */
export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const { limit = 50, before, customerId, tenantId: queryTenantId } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPER_ADMIN') {
      throw new AppError('Tenant ID is required', 400);
    }

    // Build where clause
    const where: any = {};

    // Super Admins can see all messages, but if tenantId is provided in query, filter by it
    // Admins/Staff can only see their tenant's messages
    if (userRole === 'SUPER_ADMIN') {
      // If tenantId is provided in query (from conversation selection), filter by it
      if (queryTenantId) {
        // Resolve tenant slug to tenant ID if needed
        const tenant = await prisma.tenants.findUnique({
          where: { slug: queryTenantId as string, status: 'ACTIVE' },
          select: { id: true },
        });
        if (tenant) {
          where.tenantId = tenant.id;
        }
      }
      // Otherwise, Super Admin sees all messages (no tenant filter)
    } else {
      where.tenantId = tenantId;
    }

    // If before is provided, get messages before that message ID
    if (before) {
      where.id = { lt: before };
    }

    // For customers: only see their own messages
    // Note: For customers, userId in JWT is the customer ID
    if (userRole === 'CUSTOMER') {
      where.customerId = userId; // userId is customer ID for customers
    } else if (customerId) {
      // For admins: filter by customer if specified
      where.customerId = customerId;
    }

    // Fetch messages - handle case where table doesn't exist yet
    type MessageWithSender = {
      id: string;
      text: string;
      senderId: string;
      senderType: string;
      customerId: string | null;
      createdAt: Date;
      readAt: Date | null;
      sender: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar: string | null;
      };
    };
    
    let messages: MessageWithSender[] = [];
    try {
      messages = await prisma.messages.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Chat] Messages table does not exist yet. Please run migrations.');
        messages = [];
      } else {
        throw dbError;
      }
    }

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    // Check if there are more messages
    const hasMore = messages.length === parseInt(limit as string);

    res.json({
      success: true,
      data: {
        messages: reversedMessages,
        hasMore,
      },
    });
  } catch (error: any) {
    // Log the error for debugging
    console.error('[Chat] Error fetching chat history:', error);
    throw new AppError(error.message || 'Failed to fetch chat history', 500);
  }
});

/**
 * Get list of conversations (for admin dashboard)
 * GET /api/chat/conversations
 */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPER_ADMIN') {
      throw new AppError('Tenant ID is required', 400);
    }

    // Only admins/staff can see conversations
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    // Build where clause for conversations
    const conversationsWhere: any = {
      customerId: { not: null },
    };

    // Super Admins can see all conversations (no tenant filter)
    // Admins/Staff can only see their tenant's conversations
    if (userRole !== 'SUPER_ADMIN') {
      if (!tenantId) {
        console.warn('[Chat] No tenantId found for non-Super Admin user');
        return res.json({
          success: true,
          data: [],
        });
      }
      conversationsWhere.tenantId = tenantId;
    }

    // Get all messages with customerId, ordered by createdAt desc
    // Then group by customerId (and tenantId for Super Admin) to get latest
    type ConversationMessage = {
      id: string;
      text: string;
      senderId: string;
      senderType: string;
      customerId: string | null;
      tenantId: string;
      createdAt: Date;
      readAt: Date | null;
      tenants: {
        slug: string;
      } | null;
      sender: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar: string | null;
      };
    };
    
    let allMessages: ConversationMessage[] = [];
    try {
      // Log query details for debugging
      console.log('[Chat] Fetching conversations:', {
        userRole,
        tenantId,
        conversationsWhere,
      });
      
      allMessages = await prisma.messages.findMany({
        where: conversationsWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          tenants: {
            select: {
              slug: true,
            },
          },
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        take: 1000, // Limit to prevent memory issues
      });
      
      console.log('[Chat] Found messages:', {
        count: allMessages.length,
        messagesWithCustomerId: allMessages.filter(m => m.customerId).length,
        messagesWithoutCustomerId: allMessages.filter(m => !m.customerId).length,
        sampleMessage: allMessages[0] ? {
          id: allMessages[0].id,
          customerId: allMessages[0].customerId,
          tenantId: allMessages[0].tenantId,
          senderType: allMessages[0].senderType,
          createdAt: allMessages[0].createdAt,
        } : null,
        // Log first few messages for debugging
        firstFewMessages: allMessages.slice(0, 3).map(m => ({
          id: m.id,
          customerId: m.customerId,
          tenantId: m.tenantId,
          senderType: m.senderType,
        })),
      });
      
      // Also check total messages in table (for debugging)
      try {
        const totalCount = await prisma.messages.count({});
        const withCustomerIdCount = await prisma.messages.count({
          where: { customerId: { not: null } },
        });
        console.log('[Chat] Total messages in database:', {
          total: totalCount,
          withCustomerId: withCustomerIdCount,
          withoutCustomerId: totalCount - withCustomerIdCount,
        });
      } catch (countError) {
        console.warn('[Chat] Could not count messages:', countError);
      }
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of crashing
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Chat] Messages table does not exist yet. Please run migrations.');
        console.warn('[Chat] Error details:', dbError.message);
        res.json({
          success: true,
          data: [],
        });
        return;
      } else {
        console.error('[Chat] Database error fetching conversations:', dbError);
        throw dbError;
      }
    }

    // Group by customerId (and tenantId for Super Admin) and get latest message
    const conversationMap = new Map<string, typeof allMessages[0]>();
    
    for (const message of allMessages) {
      if (!message.customerId) continue;
      
      const key = userRole === 'SUPER_ADMIN' 
        ? `${message.customerId}:${message.tenantId}`
        : message.customerId;
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, message);
      }
    }
    
    const conversations = Array.from(conversationMap.values());

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadWhere: any = {
          customerId: conv.customerId!,
          senderType: 'customer',
          readAt: null,
        };

        // Super Admins see all unread for this customer-tenant combo
        // Admins only their tenant
        if (userRole !== 'SUPER_ADMIN') {
          unreadWhere.tenantId = tenantId;
        } else {
          // For Super Admin, filter by the specific tenant of this conversation
          unreadWhere.tenantId = conv.tenantId;
        }

        let unreadCount = 0;
        try {
          unreadCount = await prisma.messages.count({
            where: unreadWhere,
          });
        } catch (dbError: any) {
          // If table doesn't exist, count is 0
          if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
            unreadCount = 0;
          } else {
            throw dbError;
          }
        }

        // Get customer info
        const customer = await prisma.customers.findUnique({
          where: { id: conv.customerId! },
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        });

        return {
          customerId: conv.customerId!,
          tenantId: conv.tenantId,
          tenantSlug: conv.tenants?.slug || null,
          customer: {
            id: customer?.id || '',
            firstName: customer?.users?.firstName || null,
            lastName: customer?.users?.lastName || null,
            email: customer?.users?.email || '',
            avatar: customer?.users?.avatar || null,
          },
          unreadCount,
          lastMessage: {
            id: conv.id,
            text: conv.text,
            senderId: conv.senderId,
            senderType: conv.senderType as any,
            customerId: conv.customerId,
            createdAt: conv.createdAt.toISOString(),
            readAt: conv.readAt?.toISOString() || null,
            sender: conv.sender,
          },
        };
      })
    );

    // Sort by last message date (newest first)
    const sortedConversations = conversationsWithUnread.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return res.json({
      success: true,
      data: sortedConversations,
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch conversations', 500);
  }
});

/**
 * Mark messages as read
 * POST /api/chat/mark-read
 */
export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const { customerId, messageIds, tenantId: bodyTenantId } = req.body;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPER_ADMIN') {
      throw new AppError('Tenant ID is required', 400);
    }

    // Only admins/staff can mark messages as read
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    const where: any = {
      senderType: 'customer',
      readAt: null,
    };

    // Super Admins: if tenantId is provided in body (from conversation), filter by it
    // Otherwise, mark all messages as read (for backward compatibility)
    if (userRole === 'SUPER_ADMIN') {
      if (bodyTenantId) {
        // Resolve tenant slug to tenant ID if needed
        const tenant = await prisma.tenants.findUnique({
          where: { slug: bodyTenantId as string, status: 'ACTIVE' },
          select: { id: true },
        });
        if (tenant) {
          where.tenantId = tenant.id;
        }
      }
      // If no tenantId provided, Super Admin can mark all messages as read (no tenant filter)
    } else {
      where.tenantId = tenantId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (messageIds && Array.isArray(messageIds)) {
      where.id = { in: messageIds };
    }

    try {
      await prisma.messages.updateMany({
        where,
        data: {
          readAt: new Date(),
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, just return success (no messages to update)
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Chat] Messages table does not exist yet. Skipping mark as read.');
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

/**
 * Get unread message count (for notifications)
 * GET /api/chat/unread-count
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPER_ADMIN') {
      throw new AppError('Tenant ID is required', 400);
    }

    // Only admins/staff can see unread count
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '')) {
      throw new AppError('Unauthorized', 403);
    }

    const where: any = {
      tenantId: userRole === 'SUPER_ADMIN' ? undefined : tenantId,
      senderType: 'customer',
      readAt: null,
    };

    let unreadCount = 0;
    try {
      unreadCount = await prisma.messages.count({
        where,
      });
    } catch (dbError: any) {
      // If table doesn't exist, count is 0
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.warn('[Chat] Messages table does not exist yet. Returning 0 unread count.');
        unreadCount = 0;
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { count: unreadCount },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to get unread count', 500);
  }
});

