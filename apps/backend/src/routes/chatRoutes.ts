import { Router } from 'express';
import {
  getChatHistory,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
} from '../controllers/chatController';
import { authenticateUser, requireAdminOrStaff } from '../middleware/authMiddleware';

const router = Router();

// Get chat history (both customer and admin)
router.get('/history', authenticateUser, getChatHistory);

// Get conversations list (admin only)
router.get('/conversations', authenticateUser, requireAdminOrStaff, getConversations);

// Mark messages as read (admin only)
router.post('/mark-read', authenticateUser, requireAdminOrStaff, markMessagesAsRead);

// Get unread count (admin only)
router.get('/unread-count', authenticateUser, requireAdminOrStaff, getUnreadCount);

export default router;

