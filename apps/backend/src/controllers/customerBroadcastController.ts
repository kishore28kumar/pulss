import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Get broadcasts for the current customer's tenant
 * GET /api/storefront/broadcasts
 */
export const getStorefrontNotifications = asyncHandler(async (req: Request, res: Response) => {
    try {
        const customerId = req.user?.userId; // From storefront auth middleware
        // Tenant context is usually available from middleware or headers in storefront API
        // Assuming storefront request attaches tenantId to req or we get it from customer -> tenant relation
        // But typically Storefront API middleware resolves tenant from subdomain/header

        // For now, let's assume we get tenantId from the user's context or a header
        // In this codebase, let's verify how storefront identifies tenant. 
        // Usually via header 'x-tenant-id' or mapped in middleware.

        // Check if we have tenantId in req (custom property)
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'];

        if (!customerId) {
            throw new AppError('Unauthorized', 401);
        }

        if (!tenantId) {
            // Fallback: fetch tenant from customer record if not in headers
            const customer = await prisma.customers.findUnique({
                where: { id: customerId },
                select: { tenantId: true }
            });
            if (!customer) throw new AppError('Customer not found', 404);
            // tenantId = customer.tenantId; // Assign if needed, but let's assume we need it for query
        }

        // Since we need tenantId for the query:
        let targetTenantId = typeof tenantId === 'string' ? tenantId : undefined;

        if (!targetTenantId) {
            const customer = await prisma.customers.findUnique({
                where: { id: customerId },
                select: { tenantId: true }
            });
            targetTenantId = customer?.tenantId;
        }

        if (!targetTenantId) {
            throw new AppError('Tenant context missing', 400);
        }

        // Get the actual users.id linked to this customer
        const customer = await prisma.customers.findUnique({
            where: { id: customerId },
            select: { userId: true }
        });
        const linkedUserId = customer?.userId;

        // Get broadcasts for this tenant targeting CUSTOMER
        const broadcasts = await prisma.broadcasts.findMany({
            where: {
                tenantId: targetTenantId,
                targetAudience: 'CUSTOMER',
                deletedAt: null,
            },
            include: {
                // Check if read by this customer (via their linked user ID)
                readBy: {
                    where: {
                        userId: linkedUserId, // Use the linked user ID
                    },
                    select: {
                        readAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50, // Limit history
        });

        const formattedBroadcasts = broadcasts.map((broadcast: any) => ({
            id: broadcast.id,
            title: broadcast.title,
            message: broadcast.message,
            imageUrl: broadcast.imageUrl,
            link: broadcast.link,
            createdAt: broadcast.createdAt.toISOString(),
            isRead: broadcast.readBy.length > 0,
            readAt: broadcast.readBy[0]?.readAt?.toISOString() || null,
        }));

        res.json({
            success: true,
            data: formattedBroadcasts,
        });
    } catch (error: any) {
        throw new AppError(error.message || 'Failed to fetch notifications', 500);
    }
});

/**
 * Mark broadcast as read for customer
 * POST /api/storefront/broadcasts/:id/read
 */
export const markBroadcastAsRead = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.userId;

        if (!customerId) {
            throw new AppError('Unauthorized', 401);
        }

        // Get the linked user ID
        const customer = await prisma.customers.findUnique({
            where: { id: customerId },
            select: { userId: true }
        });
        const linkedUserId = customer?.userId;

        if (!linkedUserId) {
            throw new AppError('Linked user account not found', 404);
        }

        // Check if broadcast exists
        const broadcast = await prisma.broadcasts.findUnique({
            where: { id },
        });

        if (!broadcast) {
            throw new AppError('Notification not found', 404);
        }

        // Upsert read record using linked userId
        await prisma.broadcast_reads.upsert({
            where: {
                broadcastId_userId: {
                    broadcastId: id,
                    userId: linkedUserId,
                },
            },
            create: {
                broadcastId: id,
                userId: linkedUserId,
                readAt: new Date(),
            },
            update: {
                readAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'Marked as read',
        });
    } catch (error: any) {
        throw new AppError(error.message || 'Failed to mark as read', 500);
    }
});

/**
 * Mark all broadcasts as read for customer
 * POST /api/storefront/broadcasts/mark-all-read
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    try {
        const customerId = req.user?.userId;

        if (!customerId) {
            throw new AppError('Unauthorized', 401);
        }

        // 1. Get tenantId and linked userId for the customer
        const customer = await prisma.customers.findUnique({
            where: { id: customerId },
            select: { tenantId: true, userId: true }
        });

        if (!customer?.tenantId) {
            throw new AppError('Tenant not found', 404);
        }
        if (!customer?.userId) {
            throw new AppError('Linked user account not found', 404);
        }

        const linkedUserId = customer.userId;

        // 2. Find all unread broadcasts
        // We want broadcasts for this tenant, targeting CUSTOMER, that are NOT in broadcast_reads for this user
        const unreadBroadcasts = await prisma.broadcasts.findMany({
            where: {
                tenantId: customer.tenantId,
                targetAudience: 'CUSTOMER',
                deletedAt: null,
                readBy: {
                    none: {
                        userId: linkedUserId
                    }
                }
            },
            select: { id: true }
        });

        // 3. Insert read records
        if (unreadBroadcasts.length > 0) {
            await prisma.broadcast_reads.createMany({
                data: unreadBroadcasts.map(b => ({
                    broadcastId: b.id,
                    userId: linkedUserId,
                    readAt: new Date()
                })),
                skipDuplicates: true
            });
        }

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        throw new AppError(error.message || 'Failed to mark all as read', 500);
    }
});
