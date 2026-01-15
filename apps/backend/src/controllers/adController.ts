
import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Create Ad Request
export const createAdRequest = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, images, links, startDate, endDate, requestType } = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
        throw new AppError('Tenant ID is required', 400);
    }

    // Validate requestType
    const validRequestTypes = ['AD_PLACEMENT', 'HERO_IMAGES_CHANGE', 'HERO_IMAGES_REMOVE', 'HERO_IMAGES_REORDER', 'HERO_IMAGES_ADD'];
    const finalRequestType = requestType || 'AD_PLACEMENT';
    
    if (!validRequestTypes.includes(finalRequestType)) {
        throw new AppError('Invalid request type', 400);
    }

    // For hero image requests, images are required (except for REMOVE)
    if (finalRequestType.startsWith('HERO_IMAGES') && finalRequestType !== 'HERO_IMAGES_REMOVE') {
        if (!images || !Array.isArray(images) || images.length === 0) {
            throw new AppError('At least one image is required', 400);
        }
        if (images.length > 10) {
            throw new AppError('Maximum 10 hero images allowed', 400);
        }
    } else if (finalRequestType === 'AD_PLACEMENT') {
        if (!images || !Array.isArray(images) || images.length === 0) {
            throw new AppError('At least one image is required', 400);
        }
    }

    const adRequest = await prisma.ad_requests.create({
        data: {
            tenantId,
            title,
            description,
            images: images || [],
            links: links || [],
            requestType: finalRequestType as any,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: 'PENDING',
        } as any,
    });

    res.status(201).json({
        success: true,
        data: adRequest,
        message: 'Ad request created successfully',
    });
});

// Get Ad Requests
export const getAdRequests = asyncHandler(async (req: Request, res: Response) => {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // If Super Admin, show all. If Shop Admin, show only their tenant's requests.
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantId = req.tenantId;

    const where: any = {};

    if (!isSuperAdmin) {
        if (!tenantId) throw new AppError('Tenant context required', 400);
        where.tenantId = tenantId;
    }

    if (status) {
        where.status = status;
    }

    const [total, requests] = await Promise.all([
        prisma.ad_requests.count({ where }),
        prisma.ad_requests.findMany({
            where,
            include: {
                tenants: {
                    select: {
                        name: true,
                        slug: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
        }),
    ]);

    res.json({
        success: true,
        data: requests,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

// Get Active Ads (Public)
export const getActiveAds = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        throw new AppError('Tenant ID is required', 400);
    }

    // Find the most recent approved and active ad request
    // You might want multiple? Requirement said "up to 4 images".
    // A single request has array of images. So we pick the latest *Approved* request.
    const activeAd = await prisma.ad_requests.findFirst({
        where: {
            tenantId,
            status: 'APPROVED',
            isActive: true, // We set this to true on approval
        },
        orderBy: { actionDate: 'desc' }, // Latest approved one
    });

    res.json({
        success: true,
        data: activeAd,
    });
});

// Get Single Ad Request
export const getAdRequestById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantId = req.tenantId;

    const adRequest = await prisma.ad_requests.findUnique({
        where: { id },
        include: {
            tenants: {
                select: {
                    name: true,
                    slug: true,
                }
            }
        }
    });

    if (!adRequest) {
        throw new AppError('Ad request not found', 404);
    }

    // Permission check
    if (!isSuperAdmin && adRequest.tenantId !== tenantId) {
        throw new AppError('Not authorized to view this request', 403);
    }

    res.json({
        success: true,
        data: adRequest,
    });
});

// Update Ad Request Status (Super Admin Only)
export const updateAdRequestStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['APPROVED', 'REJECTED', 'REVOKED'].includes(status)) {
        throw new AppError('Invalid status', 400);
    }

    const adRequest = await prisma.ad_requests.findUnique({
        where: { id }
    });

    if (!adRequest) {
        throw new AppError('Ad request not found', 404);
    }

    const isActive = status === 'APPROVED';
    const requestType = (adRequest as any).requestType || 'AD_PLACEMENT';

    // Handle hero image requests - apply changes to tenant when approved
    if (status === 'APPROVED' && requestType.startsWith('HERO_IMAGES')) {
        const tenant = await prisma.tenants.findUnique({
            where: { id: adRequest.tenantId }
        });

        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        let updatedHeroImages: string[] = [];

        switch (requestType) {
            case 'HERO_IMAGES_CHANGE':
                // Replace all hero images with new ones
                updatedHeroImages = adRequest.images || [];
                break;
            case 'HERO_IMAGES_ADD':
                // Add new images to existing ones
                const currentHeroImages = (tenant as any).heroImages || [];
                updatedHeroImages = [...currentHeroImages, ...(adRequest.images || [])].slice(0, 10);
                break;
            case 'HERO_IMAGES_REMOVE':
                // Remove specified images (images array contains URLs to remove)
                const existingHeroImages = (tenant as any).heroImages || [];
                updatedHeroImages = existingHeroImages.filter((url: string) => !adRequest.images.includes(url));
                break;
            case 'HERO_IMAGES_REORDER':
                // Reorder images (images array contains the new order)
                updatedHeroImages = adRequest.images || [];
                break;
            default:
                updatedHeroImages = (tenant as any).heroImages || [];
        }

        // Update tenant hero images using raw SQL to avoid Prisma type issues
        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tenants SET "heroImages" = $1 WHERE id = $2`,
                JSON.stringify(updatedHeroImages),
                adRequest.tenantId
            );
        } catch (error: any) {
            console.error('Error updating heroImages:', error);
            // Try to create column if it doesn't exist
            try {
                await prisma.$executeRawUnsafe(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'tenants' 
                            AND column_name = 'heroImages'
                        ) THEN
                            ALTER TABLE tenants ADD COLUMN "heroImages" TEXT[] DEFAULT '{}';
                        END IF;
                    END $$;
                `);
                await prisma.$executeRawUnsafe(
                    `UPDATE tenants SET "heroImages" = $1 WHERE id = $2`,
                    JSON.stringify(updatedHeroImages),
                    adRequest.tenantId
                );
            } catch (retryError: any) {
                console.error('Error creating/updating heroImages column:', retryError);
                throw new AppError('Failed to update hero images. Database migration might be needed.', 500);
            }
        }
    }

    // If approving ad placement, deactivate previous active ad requests
    if (isActive && requestType === 'AD_PLACEMENT') {
        // Use raw SQL to filter by requestType since Prisma client may not have it yet
        await prisma.$executeRawUnsafe(`
            UPDATE ad_requests 
            SET "isActive" = false 
            WHERE "tenantId" = $1 
            AND "isActive" = true 
            AND id != $2
            AND ("requestType" = 'AD_PLACEMENT' OR "requestType" IS NULL)
        `, adRequest.tenantId, id);
    }

    const updatedRequest = await prisma.ad_requests.update({
        where: { id },
        data: {
            status,
            adminNote,
            isActive,
            actionDate: new Date(),
        } as any,
    });

    res.json({
        success: true,
        data: updatedRequest,
        message: `Ad request ${status.toLowerCase()} successfully`,
    });
});
