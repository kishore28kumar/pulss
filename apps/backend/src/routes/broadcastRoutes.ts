import { Router } from 'express';
import {
  createBroadcast,
  getBroadcasts,
  getUnreadCount,
  markBroadcastAsRead,
  markAllBroadcastsAsRead,
  deleteBroadcast,
} from '../controllers/broadcastController';
import { authenticateUser, requireSuperAdmin } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Get broadcasts and unread count (Admin/Staff/Super Admin)
router.get('/', getBroadcasts);
router.get('/unread-count', getUnreadCount);

// Mark as read (Admin/Staff/Super Admin)
router.post('/:id/read', markBroadcastAsRead);
router.post('/mark-all-read', markAllBroadcastsAsRead);

// Create and delete (Super Admin only)
router.post('/', requireSuperAdmin, createBroadcast);
router.delete('/:id', requireSuperAdmin, deleteBroadcast);

export default router;

