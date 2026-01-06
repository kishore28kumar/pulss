import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
  markAsRead,
  getRecipients,
} from '../controllers/mailController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Mail routes
router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:partnerId', getMessages);
router.get('/unread-count', getUnreadCount);
router.post('/mark-read/:partnerId', markAsRead);
router.get('/recipients', getRecipients);

export default router;

