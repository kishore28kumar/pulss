import { Router } from 'express';
import {
  createBroadcast,
  getBroadcasts,
  getUnreadCount,
  markBroadcastAsRead,
  markAllBroadcastsAsRead,
  deleteBroadcast,
} from '../controllers/broadcastController';
import {
  getStorefrontNotifications,
  markBroadcastAsRead as markCustomerBroadcastAsRead,
  markAllAsRead as markAllCustomerBroadcastsAsRead
} from '../controllers/customerBroadcastController';
import { authenticateUser, authenticateCustomer, authorize, requireSuperAdmin } from '../middleware/authMiddleware';

const router = Router();

// ==========================================
// CUSTOMER ROUTES
// ==========================================
router.get('/storefront', authenticateCustomer, getStorefrontNotifications);
router.post('/storefront/:id/read', authenticateCustomer, markCustomerBroadcastAsRead);
router.post('/storefront/mark-all-read', authenticateCustomer, markAllCustomerBroadcastsAsRead);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create (Super Admin, Admin, Staff permissions handled in controller)
// The user asked to reuse Super Admin logic, we updated controller to handle roles.
// We need to allow ADMIN/STAFF to call createBroadcast.
// requireSuperAdmin middleware would block them. We should remove it and let controller/authorize handle it.
router.post('/', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), createBroadcast);

// Read
router.get('/', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), getBroadcasts);
router.get('/unread-count', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), getUnreadCount);

// Update/Action
router.post('/:id/read', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), markBroadcastAsRead);
router.post('/mark-all-read', authenticateUser, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), markAllBroadcastsAsRead);

// Delete (Super Admin only)
router.delete('/:id', authenticateUser, requireSuperAdmin, deleteBroadcast);

export default router;
