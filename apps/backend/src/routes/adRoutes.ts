
import { Router } from 'express';
import {
    createAdRequest,
    getAdRequests,
    updateAdRequestStatus,
    getAdRequestById,
    getActiveAds
} from '../controllers/adController';
import { authenticateUser, requireSuperAdmin } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Public: Get Active Ads for Tenant
router.get(
    '/active',
    requireTenant,
    getActiveAds
);

// Create Ad Request (Shop Admin)
router.post(
    '/',
    authenticateUser,
    requireTenant, // Ensures tenantId is attached
    createAdRequest
);

// Get Ad Requests (Shop Admin sees their own, Super Admin sees all)
router.get(
    '/',
    authenticateUser,
    getAdRequests
);

// Get Single Ad Request
router.get(
    '/:id',
    authenticateUser,
    getAdRequestById
);

// Update Status (Super Admin only)
// Status: APPROVED, REJECTED, REVOKED
router.patch(
    '/:id/status',
    authenticateUser,
    requireSuperAdmin,
    updateAdRequestStatus
);

export default router;
